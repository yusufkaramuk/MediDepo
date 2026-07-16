// Bildirim metni sanitizasyonu — GitHub Actions scriptleri tarafından paylaşılır.
// Saf ESM, sıfır bağımlılık. Amaç: kullanıcı girdisinden veya Firestore'dan gelen
// herhangi bir değerin bildirimde "[object Object]", JSON parçası, ciphertext,
// kontrol karakteri veya aşırı uzun metin olarak görünmesini engellemek.

export const LIMITS = {
  title: 80,
  body: 240,
  name: 100,
  tag: 64,
  url: 300,
};

// Kaldırılacak karakterler:
// - C0/C1 kontrol karakterleri (satır sonları boşluğa çevrilir)
// - Zero-width: U+200B..U+200D, U+2060, U+FEFF
// - Bidi yönlendirme (spoofing'de kötüye kullanılabilir): U+200E, U+200F, U+202A..U+202E, U+2066..U+2069
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const ZERO_WIDTH_BIDI_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/**
 * Bildirim metnini güvenli düz metne dönüştürür.
 * @param {*} value — herhangi bir değer; yalnızca anlamlı string'ler geçer
 * @param {number} max — maksimum uzunluk (kod noktası bazında kısaltma)
 * @returns {string|null} güvenli metin veya null (geçersiz girdi)
 */
export function sanitizeNotificationText(value, max = LIMITS.body) {
  // Nesne/dizi/null/undefined/boolean asla metne dönüşmez ([object Object] emniyeti).
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  if (typeof value !== 'string') return null;

  // Şifreli alan sızıntı emniyeti: ciphertext asla bildirime gitmez.
  if (value.startsWith('enc:')) return null;

  let s;
  try {
    s = value.normalize('NFC');
  } catch {
    s = value; // bozuk Unicode: normalize edilemezse ham hali temizlenir
  }

  // Eşlenmemiş (lone) surrogate'ları at — bozuk Unicode girdisi
  s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '').replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  s = s
    .replace(/[\r\n\t]+/g, ' ')
    .replace(CONTROL_RE, '')
    .replace(ZERO_WIDTH_BIDI_RE, '')
    .replace(/<[^>]*>/g, ' ') // HTML benzeri etiketleri güvenli boşluğa çevir
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return null;

  // Kod noktası bazında güvenli kısaltma (emoji/surrogate çifti ortadan bölünmez)
  const points = Array.from(s);
  if (points.length > max) {
    s = points.slice(0, Math.max(1, max - 1)).join('').trimEnd() + '…';
  }

  return s;
}

/**
 * Bildirim payload'ını allowlist ile kurar. Geçersiz parçalar güvenli
 * varsayılanlarla değiştirilir; asla nesne/dizi metin alanına sızmaz.
 */
export function buildNotificationPayload({ title, body, tag, url, type } = {}) {
  const safeTitle = sanitizeNotificationText(title, LIMITS.title) || 'DrDepo';
  const safeBody = sanitizeNotificationText(body, LIMITS.body) || 'Yeni bir bildiriminiz var.';

  const payload = { title: safeTitle, body: safeBody };

  const safeTag = sanitizeNotificationText(tag, LIMITS.tag);
  if (safeTag) payload.tag = safeTag.replace(/[^\w:-]/g, '-');

  const data = {};
  // Yalnızca aynı origin içi göreli yol kabul edilir; tam URL'ler reddedilir.
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && url.length <= LIMITS.url) {
    data.url = url;
  }
  const safeType = sanitizeNotificationText(type, 32);
  if (safeType && /^[a-z-]+$/.test(safeType)) data.type = safeType;
  if (Object.keys(data).length > 0) payload.data = data;

  return payload;
}
