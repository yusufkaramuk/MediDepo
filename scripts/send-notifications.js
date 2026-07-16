#!/usr/bin/env node
// Günlük SKT (son kullanma tarihi) bildirimi gönderme scripti.
// GitHub Actions'da çalışır; Firestore REST API ile okur, web-push ile gönderir.
//
// Kullanım: node scripts/send-notifications.js [--dry-run]
//   --dry-run / DRY_RUN=1 : hiçbir bildirim gönderilmez, yalnızca sayaçlar loglanır.
//
// GÜVENLİK NOTLARI:
// - İlaç adları Firestore'da istemci tarafında ŞİFRELİ saklanır (enc: öneki).
//   Sunucu bunları çözemez; bu yüzden bildirim gövdesi yalnızca SAYI içerir.
//   (Eski sürümün "anlamsız karakter" hatasının kök nedenlerinden biri buydu.)
// - Endpoint, p256dh, auth veya userAgent asla loglanmaz; yalnızca anonim
//   sayaçlar ve HTTP durum kodları loglanır.

import webpush from 'web-push';
import { getFirestoreToken, resolveFirebaseProjectId, withRetry } from './lib/firestore-auth.js';
import { listAll, getField, docId, deleteDoc } from './lib/firestore-values.js';
import { buildNotificationPayload } from './lib/sanitize.js';
import { logNotificationCriticalError } from './lib/safe-logging.js';

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
  FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT,
} = process.env;

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT) {
  console.error('[Bildirim] Eksik environment variables. GitHub Secrets kontrol edin.');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:noreply@drdepo.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/** expiryDate 'YYYY-MM' → bugünden ay sonuna kalan gün sayısı. */
function daysUntilExpiry(expiryDate) {
  if (typeof expiryDate !== 'string' || !/^\d{4}-\d{2}$/.test(expiryDate)) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [y, m] = expiryDate.split('-').map(Number);
  const exp = new Date(y, m, 0); exp.setHours(23, 59, 59, 999);
  return Math.ceil((exp - now) / 86400000);
}

/** Abonelik dokümanlarını endpoint bazında tekilleştirir (eski+yeni ID geçişi emniyeti). */
export function dedupeSubscriptions(subDocs) {
  const byEndpoint = new Map();
  for (const subDoc of subDocs) {
    const endpoint = getField(subDoc, 'endpoint');
    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) continue;
    const keys = getField(subDoc, 'keys');
    if (!keys || typeof keys !== 'object' || !keys.p256dh || !keys.auth) continue;
    const existing = byEndpoint.get(endpoint);
    if (existing) {
      existing.docIds.push(docId(subDoc));
    } else {
      byEndpoint.set(endpoint, {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        docIds: [docId(subDoc)],
      });
    }
  }
  return [...byEndpoint.values()];
}

/**
 * Tek aboneliğe bildirim gönderir; 404/410'da Firestore dokümanlarını temizler.
 * @returns {'sent'|'stale'|'failed'|'dry'}
 */
async function sendToSubscription(token, projectId, userId, sub, payloadJson) {
  if (DRY_RUN) return 'dry';
  try {
    await withRetry(
      () => webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payloadJson),
      { retries: 1 },
    );
    return 'sent';
  } catch (err) {
    const status = err.statusCode;
    if (status === 404 || status === 410) {
      // Süresi dolmuş abonelik: dokümanlarını (eski+yeni ID) temizle
      for (const id of sub.docIds) {
        if (!id) continue;
        try {
          await deleteDoc(token, projectId, `users/${userId}/pushSubscriptions/${id}`);
        } catch {
          // Temizlik hatası ölümcül değil; bir sonraki çalıştırmada yeniden denenir
        }
      }
      return 'stale';
    }
    console.warn(`[Bildirim] Gönderim hatası (HTTP ${status ?? 'ağ'})`);
    return 'failed';
  }
}

async function main() {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('[Bildirim] FIREBASE_SERVICE_ACCOUNT geçersiz JSON');
    process.exit(1);
  }

  const projectId = resolveFirebaseProjectId(serviceAccount, FIREBASE_PROJECT_ID);
  const token = await getFirestoreToken(serviceAccount);
  const users = await listAll(token, projectId, 'users');
  console.log(`[Bildirim] ${users.length} kullanıcı bulundu${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const counters = {
    usersNotified: 0, sent: 0, stale: 0, failed: 0, dry: 0,
  };

  for (const userDoc of users) {
    const userId = docId(userDoc);
    if (!userId) continue;

    let subs = null;
    const getSubs = async () => {
      if (subs === null) {
        const subDocs = await listAll(token, projectId, `users/${userId}/pushSubscriptions`);
        subs = dedupeSubscriptions(subDocs);
      }
      return subs;
    };

    // ── 1) SKT (son kullanma tarihi) uyarısı ─────────────────────────────────
    try {
      const medicines = await listAll(token, projectId, `users/${userId}/medicines`);
      const expiring = medicines.filter(m => {
        const d = daysUntilExpiry(getField(m, 'expiryDate'));
        return d !== null && d >= 0 && d <= 30;
      });

      if (expiring.length > 0 && (await getSubs()).length > 0) {
        // İlaç adları şifreli olduğundan bildirimde YALNIZCA sayı kullanılır.
        const payload = buildNotificationPayload({
          title: 'Son kullanma tarihi uyarısı',
          body: expiring.length === 1
            ? '1 ilacınızın son kullanma tarihi yaklaşıyor. Detay için uygulamayı açın.'
            : `${expiring.length} ilacınızın son kullanma tarihi yaklaşıyor. Detay için uygulamayı açın.`,
          tag: 'skt-uyari',
          url: '/#/ilaclar?filtre=yaklasan',
          type: 'expiry',
        });
        const payloadJson = JSON.stringify(payload);

        let notified = false;
        for (const sub of await getSubs()) {
          const result = await sendToSubscription(token, projectId, userId, sub, payloadJson);
          counters[result]++;
          if (result === 'sent' || result === 'dry') notified = true;
        }
        if (notified) counters.usersNotified++;
      }
    } catch (err) {
      // Tek kullanıcı hatası tüm işi durdurmaz
      console.warn(`[Bildirim] Kullanıcı işlenemedi (HTTP ${err.status ?? err.statusCode ?? '?'})`);
    }

  }

  console.log(
    `[Bildirim] Tamamlandı — kullanıcı: ${counters.usersNotified}, gönderilen: ${counters.sent}, ` +
    `temizlenen eski abonelik: ${counters.stale}, ` +
    `hata: ${counters.failed}` +
    (DRY_RUN ? `, dry-run atlanan: ${counters.dry}` : ''),
  );
}

main().catch(() => {
  logNotificationCriticalError();
  process.exit(1);
});
