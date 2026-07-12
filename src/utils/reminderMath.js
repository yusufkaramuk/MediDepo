// Kutu bitiş (stok tükenme) tahmini — SAF fonksiyonlar, birim test edilebilir.
// Yalnızca kullanıcının açıkça girdiği verilere dayanır; hiçbir tıbbi
// yorum veya doz önerisi üretmez.

import { TIME_RE } from './scheduleSlots.js';

/** Haftalık kullanım gününe ve günlük doz sayısına göre günlük ortalama tüketim. */
export function dailyConsumption(schedule) {
  if (!schedule) return null;
  const times = Array.isArray(schedule.scheduleTimes)
    ? schedule.scheduleTimes.filter(t => TIME_RE.test(t))
    : [];
  const dose = Number(schedule.dosePerIntake);
  if (times.length === 0 || !Number.isFinite(dose) || dose <= 0) return null;
  const days = Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length > 0
    ? schedule.daysOfWeek.filter(d => Number.isInteger(d) && d >= 0 && d <= 6).length
    : 7;
  if (days === 0) return null;
  return times.length * dose * (days / 7);
}

/**
 * Tahmini bitiş tarihi: kalan birimden gün-gün yürüyerek hesaplar
 * (kullanım günlerine saygılı — düzensiz günlerde doğru sonuç verir).
 *
 * @param {number} remainingUnits — kalan toplam birim (tablet/kapsül/doz)
 * @param {object} schedule — {scheduleTimes, daysOfWeek, dosePerIntake}
 * @param {Date} from — başlangıç günü (varsayılan bugün)
 * @returns {{date: Date, daysLeft: number} | null} — yetersiz/geçersiz veri → null
 */
export function estimateRunoutDate(remainingUnits, schedule, from = new Date()) {
  const remaining = Number(remainingUnits);
  if (!Number.isFinite(remaining) || remaining < 0) return null;
  if (!schedule) return null;

  const times = Array.isArray(schedule.scheduleTimes)
    ? schedule.scheduleTimes.filter(t => TIME_RE.test(t))
    : [];
  const dose = Number(schedule.dosePerIntake);
  if (times.length === 0 || !Number.isFinite(dose) || dose <= 0) return null;

  // daysOfWeek hiç verilmemişse "her gün" varsayılır; boş dizi geçersizdir.
  const days = schedule.daysOfWeek === undefined || schedule.daysOfWeek === null
    ? [0, 1, 2, 3, 4, 5, 6]
    : Array.isArray(schedule.daysOfWeek)
      ? schedule.daysOfWeek.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];
  if (days.length === 0) return null;

  if (remaining === 0) {
    return { date: new Date(from), daysLeft: 0 };
  }

  const perDay = times.length * dose;
  let left = remaining;
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0); // DST kenarlarından uzak güvenli saat
  // Üst sınır: 5000 birim / (min 0.25 doz) ≈ 20000 gün < 60 yıl → 25000 iterasyon tavanı
  for (let i = 0; i < 25000; i++) {
    if (days.includes(cursor.getDay())) {
      left -= perDay;
      if (left <= 0) {
        const daysLeft = Math.round((cursor - from) / 86400000);
        return { date: new Date(cursor), daysLeft: Math.max(0, daysLeft) };
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null; // pratikte erişilmez
}

/**
 * Yenileme (refill) uyarısının verilmesi gereken tarih:
 * tahmini bitiş − refillLeadDays. Yetersiz veri → null.
 */
export function refillDueDate(remainingUnits, schedule, from = new Date()) {
  const runout = estimateRunoutDate(remainingUnits, schedule, from);
  if (!runout) return null;
  const lead = Number(schedule.refillLeadDays);
  if (!Number.isFinite(lead) || lead < 0) return null;
  const due = new Date(runout.date);
  due.setDate(due.getDate() - lead);
  return { date: due, runoutDate: runout.date, daysUntilRunout: runout.daysLeft };
}

/**
 * "Aldım" sonrası kalan birim: negatife düşmez.
 */
export function decrementRemaining(remainingUnits, dosePerIntake) {
  const rem = Number(remainingUnits);
  const dose = Number(dosePerIntake);
  if (!Number.isFinite(rem) || !Number.isFinite(dose) || dose <= 0) return rem;
  return Math.max(0, Math.round((rem - dose) * 100) / 100);
}

/**
 * Manuel stok ekleme (örn. yeni kutu alındı): üst sınırla sınırlar.
 */
export function addStock(remainingUnits, addedUnits, maxUnits = 5000) {
  const rem = Number(remainingUnits) || 0;
  const add = Number(addedUnits);
  if (!Number.isFinite(add) || add <= 0) return rem;
  return Math.min(maxUnits, Math.round((rem + add) * 100) / 100);
}
