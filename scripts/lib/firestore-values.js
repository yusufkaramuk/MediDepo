// Firestore REST API değer çözümleyicisi ve yardımcıları.
// GitHub Actions bildirim scripti tarafından kullanılır; sıfır bağımlılık, saf ESM.
//
// Firestore REST API her alanı tipli sarmalayıcıyla döndürür:
//   { stringValue: "x" } | { integerValue: "5" } | { arrayValue: { values: [...] } } | ...
// Bu sarmalayıcılar çözülmeden metne dönüştürülürse "[object Object]" veya
// string sayılar gibi anlamsız çıktılar üretir. decodeValue tümünü recursive çözer.

/** Tek bir Firestore REST değerini düz JS değerine çözer. Bilinmeyen tip → null. */
export function decodeValue(v) {
  if (v === null || v === undefined || typeof v !== 'object') return null;
  if ('stringValue' in v) return typeof v.stringValue === 'string' ? v.stringValue : null;
  if ('integerValue' in v) {
    const n = Number.parseInt(v.integerValue, 10);
    return Number.isNaN(n) ? null : n;
  }
  if ('doubleValue' in v) {
    const n = Number(v.doubleValue);
    return Number.isNaN(n) ? null : n;
  }
  if ('booleanValue' in v) return v.booleanValue === true;
  if ('timestampValue' in v) return typeof v.timestampValue === 'string' ? v.timestampValue : null;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) {
    const values = v.arrayValue?.values;
    return Array.isArray(values) ? values.map(decodeValue) : [];
  }
  if ('mapValue' in v) {
    const fields = v.mapValue?.fields;
    if (!fields || typeof fields !== 'object') return {};
    const out = {};
    for (const [k, val] of Object.entries(fields)) out[k] = decodeValue(val);
    return out;
  }
  return null;
}

/** Bir REST dokümanının tüm alanlarını düz objeye çözer. */
export function decodeFields(doc) {
  const fields = doc?.fields;
  if (!fields || typeof fields !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

/** Tek alan oku (çözülmüş). Alan yoksa null. */
export function getField(doc, name) {
  const f = doc?.fields?.[name];
  return f === undefined ? null : decodeValue(f);
}

/** Doküman kaynağı adından ("projects/.../documents/users/abc") son segmenti döndürür. */
export function docId(doc) {
  return typeof doc?.name === 'string' ? doc.name.split('/').pop() : null;
}

const BASE = 'https://firestore.googleapis.com/v1';

function docsRoot(projectId) {
  return `projects/${projectId}/databases/(default)/documents`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = new Error(`Firestore HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Koleksiyonun TÜM dokümanlarını sayfalayarak listeler (nextPageToken döngüsü).
 * Not: Firestore REST list varsayılanı ~300 doküman/sayfa; sayfalama olmadan
 * kalanlar sessizce düşer.
 */
export async function listAll(token, projectId, path, pageSize = 300) {
  const docs = [];
  let pageToken = '';
  do {
    const qs = new URLSearchParams({ pageSize: String(pageSize) });
    if (pageToken) qs.set('pageToken', pageToken);
    const data = await fetchJson(
      `${BASE}/${docsRoot(projectId)}/${path}?${qs}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (Array.isArray(data.documents)) docs.push(...data.documents);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return docs;
}

/** Doküman siler. 404 sessizce başarı sayılır. */
export async function deleteDoc(token, projectId, docPath) {
  const res = await fetch(`${BASE}/${docsRoot(projectId)}/${docPath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const err = new Error(`Firestore HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
}
