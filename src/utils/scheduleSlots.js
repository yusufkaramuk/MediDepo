// Hatırlatıcı slot hesaplama — SAF ESM, tarayıcı VE Node (GitHub Actions
// scripti) tarafından paylaşılır. Tarayıcıya özgü API kullanmaz.
//
// Tüm karşılaştırmalar kullanıcının kendi saat diliminde DUVAR SAATİ ile
// yapılır (Intl.DateTimeFormat). Böylece "08:00" hatırlatıcısı yaz saati
// geçişlerinden bağımsız olarak yerel 08:00'de tetiklenir.
// - İleri alınan (skipped) saatte slot o gün hiç eşleşmez (kabul edilen davranış).
// - Geri alınan (tekrarlanan) saatte idempotency anahtarı ikinci gönderimi engeller.

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** IANA saat dilimi geçerli mi? */
export function isValidTimezone(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verilen UTC anının belirtilen saat dilimindeki yerel bileşenleri.
 * @returns {{ymd: string, hm: string, weekday: number, minutesOfDay: number}}
 *   weekday: 0=Pazar … 6=Cumartesi (JS Date.getDay ile uyumlu)
 */
export function localParts(tz, date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short',
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  // 'en-CA' 24 saat biçiminde gece yarısını '24' verebilir → '00' normalizasyonu
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hm: `${hour}:${parts.minute}`,
    weekday: WEEKDAYS[parts.weekday] ?? new Date(date).getDay(),
    minutesOfDay: parseInt(hour, 10) * 60 + parseInt(parts.minute, 10),
  };
}

function toMinutes(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Sessiz saat kontrolü. quietHours = {start:'HH:mm', end:'HH:mm'} veya null.
 * Gece yarısını aşan pencereler desteklenir (örn. 22:00 → 07:00).
 */
export function isInQuietHours(quietHours, hm) {
  if (!quietHours || !TIME_RE.test(quietHours.start || '') || !TIME_RE.test(quietHours.end || '')) {
    return false;
  }
  const t = toMinutes(hm);
  const start = toMinutes(quietHours.start);
  const end = toMinutes(quietHours.end);
  if (start === end) return false; // anlamsız pencere → sessiz saat yok
  if (start < end) return t >= start && t < end;
  return t >= start || t < end; // gece yarısını aşan pencere
}

/**
 * Şu an "vadesi gelmiş" slotları döndürür.
 * Bir slot vadesi gelmiştir ⇔ yerel duvar saati slot saatinin üzerinden
 * en fazla toleranceMinutes geçmiş ve o gün schedule'ın günlerinden biriyse.
 *
 * @param {object} schedule — {id, timezone, scheduleTimes, daysOfWeek, quietHours}
 * @param {Date} nowUtc — şimdiki an (test edilebilirlik için parametre)
 * @param {number} toleranceMinutes — GitHub Actions gecikme toleransı
 * @returns {Array<{slotId: string, localDate: string, time: string}>}
 */
export function dueSlots(schedule, nowUtc = new Date(), toleranceMinutes = 40) {
  if (!schedule || !isValidTimezone(schedule.timezone)) return [];
  const times = Array.isArray(schedule.scheduleTimes)
    ? schedule.scheduleTimes.filter(t => TIME_RE.test(t))
    : [];
  if (times.length === 0) return [];

  const days = Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length > 0
    ? schedule.daysOfWeek.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
    : [0, 1, 2, 3, 4, 5, 6];

  const out = [];
  // Tolerans penceresi gece yarısını aşabilir → hem bugünü hem düne bakan
  // pencere ucunu kontrol et.
  const windowStart = new Date(nowUtc.getTime() - toleranceMinutes * 60000);
  const now = localParts(schedule.timezone, nowUtc);
  const start = localParts(schedule.timezone, windowStart);

  const candidates = new Map(); // localDate → o günkü kontrol bağlamı
  candidates.set(now.ymd, { weekday: now.weekday });
  if (start.ymd !== now.ymd) candidates.set(start.ymd, { weekday: start.weekday });

  for (const [ymd, ctx] of candidates) {
    if (!days.includes(ctx.weekday)) continue;
    for (const t of times) {
      const slotMin = toMinutes(t);
      let diff;
      if (ymd === now.ymd) {
        diff = now.minutesOfDay - slotMin;
      } else {
        // Dünün slotu: bugünkü dakika + (dünün gün sonuna kalan dakika)
        diff = now.minutesOfDay + (1440 - slotMin);
      }
      if (diff < 0 || diff > toleranceMinutes) continue;
      if (isInQuietHours(schedule.quietHours, t)) continue;
      out.push({
        slotId: `${schedule.id}_${ymd}T${t.replace(':', '')}`,
        localDate: ymd,
        time: t,
      });
    }
  }
  return out;
}
