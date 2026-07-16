// Service account → OAuth2 access token (Firestore REST için).
// send-notifications.js tarafından kullanılır.
// GÜVENLİK: private_key, client_email veya token asla loglanmaz.

import { createSign } from 'crypto';

/**
 * Workflow hedefi ile service account'un ayni Firebase projesine ait oldugunu
 * dogrular. Yanlis/eski proje secret'lari Firestore'da belirsiz bir 404 yerine
 * baslangicta acik bir yapilandirma hatasi uretir.
 */
export function resolveFirebaseProjectId(serviceAccount, configuredProjectId) {
  const accountProjectId = typeof serviceAccount?.project_id === 'string'
    ? serviceAccount.project_id.trim()
    : '';
  const expectedProjectId = typeof configuredProjectId === 'string'
    ? configuredProjectId.trim()
    : '';

  if (!expectedProjectId) {
    throw new Error('FIREBASE_PROJECT_ID eksik');
  }
  if (!accountProjectId) {
    throw new Error('Service account project_id alani eksik');
  }
  if (accountProjectId !== expectedProjectId) {
    throw new Error(
      `Service account proje uyusmazligi (beklenen: ${expectedProjectId}, bulunan: ${accountProjectId})`,
    );
  }
  return expectedProjectId;
}

/**
 * FIREBASE_SERVICE_ACCOUNT JSON'ından Firestore erişim token'ı üretir.
 * Hata durumunda hassas veri içermeyen mesajla fırlatır.
 */
export async function getFirestoreToken(serviceAccount) {
  const { private_key: privateKey, client_email: clientEmail } = serviceAccount || {};
  if (!privateKey || !clientEmail) {
    throw new Error('Service account eksik alan içeriyor (private_key/client_email)');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(privateKey, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    throw new Error(`Token alınamadı (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Token yanıtında access_token yok');
  }
  return data.access_token;
}

/**
 * Sınırlı retry + exponential backoff ile async işlem çalıştırır.
 * Yalnızca geçici hatalarda (5xx/429/ağ) yeniden dener.
 */
export async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.status ?? err.statusCode;
      const transient = status === undefined || status === 429 || (status >= 500 && status < 600);
      if (!transient || attempt === retries) throw err;
      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
