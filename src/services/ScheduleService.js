// İlaç kullanım hatırlatıcısı (medicationSchedules) servisi.
// Veri modeli: users/{userId}/medicationSchedules/{scheduleId}
// Opt-in özellik: mevcut ilaç kayıtlarına dokunmaz, migration gerektirmez.
//
// GİZLİLİK: İlaç adları Firestore'da şifrelidir ve sunucu bunları çözemez.
// 'named' bildirim modu yalnızca kullanıcının BİLEREK yazdığı düz metin
// displayLabel alanını kullanır (UI'da açık onay kutusu zorunludur).

import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';
import { db } from './FirebaseClient';
import { TIME_RE, isValidTimezone } from '../utils/scheduleSlots';

export const SCHEDULE_FIELDS = [
  'medicineId',
  'enabled',
  'timezone',
  'scheduleTimes',
  'daysOfWeek',
  'dosePerIntake',
  'unitLabel',
  'unitsPerPackage',
  'remainingUnits',
  'refillLeadDays',
  'refillReminderEnabled',
  'medicationReminderEnabled',
  'snoozeMinutes',
  'quietHours',
  'notificationPrivacyMode',
  'displayLabel',
  'caregiverEscalationEnabled',
  'createdAt',
  'updatedAt',
];

export const SCHEDULE_LIMITS = {
  medicineId: 64,
  timezone: 64,
  maxTimes: 12,
  dosePerIntakeMin: 0.25,
  dosePerIntakeMax: 20,
  unitLabel: 20,
  unitsPerPackageMax: 500,
  remainingUnitsMax: 5000,
  refillLeadDaysMax: 30,
  snoozeMin: 5,
  snoozeMax: 120,
  displayLabel: 40,
};

// Kontrol karakterleri (C0/C1) — string escape ile üretilir
const CONTROL_RE = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');

const textValue = (value, maxLength) => {
  const normalized = typeof value === 'string' ? value : value == null ? '' : String(value);
  return normalized
    .replace(/[<>]/g, '')
    .replace(CONTROL_RE, '')
    .trim()
    .slice(0, maxLength);
};

const clampNumber = (value, min, max, fallback = null) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Ham girdiyi geçerli bir schedule dokümanına normalleştirir.
 * Geçersiz zorunlu alanlar için Error fırlatır (anlaşılır Türkçe mesajla).
 */
export function normalizeSchedule(input = {}, { preserveCreatedAt = false } = {}) {
  const medicineId = textValue(input.medicineId, SCHEDULE_LIMITS.medicineId);
  if (!medicineId) throw new Error('Hatırlatıcı için ilaç seçilmedi.');

  const timezone = textValue(input.timezone, SCHEDULE_LIMITS.timezone)
    || Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!isValidTimezone(timezone)) throw new Error('Saat dilimi geçersiz.');

  const scheduleTimes = Array.isArray(input.scheduleTimes)
    ? [...new Set(input.scheduleTimes.filter(t => typeof t === 'string' && TIME_RE.test(t)))]
        .sort()
        .slice(0, SCHEDULE_LIMITS.maxTimes)
    : [];
  if (input.medicationReminderEnabled && scheduleTimes.length === 0) {
    throw new Error('En az bir hatırlatma saati seçin (örn. 08:00).');
  }

  const daysOfWeek = Array.isArray(input.daysOfWeek)
    ? [...new Set(input.daysOfWeek.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [0, 1, 2, 3, 4, 5, 6];
  if (daysOfWeek.length === 0) {
    throw new Error('En az bir kullanım günü seçin.');
  }

  let quietHours = null;
  if (input.quietHours && typeof input.quietHours === 'object') {
    const start = textValue(input.quietHours.start, 5);
    const end = textValue(input.quietHours.end, 5);
    if (TIME_RE.test(start) && TIME_RE.test(end) && start !== end) {
      quietHours = { start, end };
    }
  }

  const notificationPrivacyMode = input.notificationPrivacyMode === 'named' ? 'named' : 'generic';
  let displayLabel = '';
  if (notificationPrivacyMode === 'named') {
    displayLabel = textValue(input.displayLabel, SCHEDULE_LIMITS.displayLabel);
    if (!displayLabel) {
      throw new Error('İsimli bildirim için bir etiket yazın veya "Genel bildirim" seçin.');
    }
    if (displayLabel.startsWith('enc:')) {
      throw new Error('Etiket geçersiz.');
    }
  }

  const now = new Date().toISOString();
  return {
    medicineId,
    enabled: input.enabled === true,
    timezone,
    scheduleTimes,
    daysOfWeek,
    dosePerIntake: clampNumber(input.dosePerIntake, SCHEDULE_LIMITS.dosePerIntakeMin, SCHEDULE_LIMITS.dosePerIntakeMax, 1),
    unitLabel: textValue(input.unitLabel, SCHEDULE_LIMITS.unitLabel) || 'tablet',
    unitsPerPackage: Math.round(clampNumber(input.unitsPerPackage, 1, SCHEDULE_LIMITS.unitsPerPackageMax, 0) || 0),
    remainingUnits: clampNumber(input.remainingUnits, 0, SCHEDULE_LIMITS.remainingUnitsMax, 0),
    refillLeadDays: Math.round(clampNumber(input.refillLeadDays, 0, SCHEDULE_LIMITS.refillLeadDaysMax, 7)),
    refillReminderEnabled: input.refillReminderEnabled === true,
    medicationReminderEnabled: input.medicationReminderEnabled === true,
    snoozeMinutes: Math.round(clampNumber(input.snoozeMinutes, SCHEDULE_LIMITS.snoozeMin, SCHEDULE_LIMITS.snoozeMax, 10)),
    quietHours,
    notificationPrivacyMode,
    displayLabel,
    caregiverEscalationEnabled: false, // v1: yalnızca veri modeli temeli; teslimat mantığı yok
    createdAt: preserveCreatedAt && typeof input.createdAt === 'string' ? input.createdAt.slice(0, 40) : now,
    updatedAt: now,
  };
}

const colRef = (userId) => collection(db, `users/${userId}/medicationSchedules`);

export const ScheduleService = {
  /** Kullanıcının tüm hatırlatıcıları. */
  async list(userId) {
    const snap = await getDocs(colRef(userId));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /** Belirli bir ilaca bağlı hatırlatıcı (varsa). */
  async getForMedicine(userId, medicineId) {
    const q = query(colRef(userId), where('medicineId', '==', medicineId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },

  /** Oluştur veya güncelle (medicineId başına tek doküman: id = medicineId). */
  async save(userId, input, existing = null) {
    const data = normalizeSchedule(
      { ...input, createdAt: existing?.createdAt },
      { preserveCreatedAt: Boolean(existing) },
    );
    const id = existing?.id || data.medicineId;
    await setDoc(doc(db, `users/${userId}/medicationSchedules/${id}`), data);
    return { id, ...data };
  },

  /** Yalnızca kalan birim güncellemesi ("Aldım" / manuel stok). */
  async updateRemaining(userId, scheduleId, remainingUnits) {
    const value = clampNumber(remainingUnits, 0, SCHEDULE_LIMITS.remainingUnitsMax, 0);
    await updateDoc(doc(db, `users/${userId}/medicationSchedules/${scheduleId}`), {
      remainingUnits: value,
      updatedAt: new Date().toISOString(),
    });
    return value;
  },

  /** Hatırlatıcıyı tamamen kapat (enabled=false) — veri silinmez. */
  async disable(userId, scheduleId) {
    await updateDoc(doc(db, `users/${userId}/medicationSchedules/${scheduleId}`), {
      enabled: false,
      medicationReminderEnabled: false,
      refillReminderEnabled: false,
      updatedAt: new Date().toISOString(),
    });
  },

  /** Hatırlatıcıyı sil. */
  async remove(userId, scheduleId) {
    await deleteDoc(doc(db, `users/${userId}/medicationSchedules/${scheduleId}`));
  },
};
