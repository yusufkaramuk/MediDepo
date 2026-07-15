import { useState, useEffect, useRef, useCallback } from 'react';
import { dueSlots } from '../utils/scheduleSlots';
import { NotificationService } from '../services/NotificationService';

// Uygulama AÇIKKEN çalışan hatırlatıcı motoru.
// Katmanlı yaklaşımın 1. katmanı: in-app zamanlayıcı + görünür alarm ekranı.
// (Uygulama kapalıyken 2. katman Web Push devreye girer; bkz. scripts/send-reminders.js)
//
// Aynı slotun iki kez alarm üretmemesi için işlenen slotlar localStorage'da
// tutulur (sunucu push'u ile çakışma browser 'tag' collapse ile önlenir).

const HANDLED_KEY = 'drdepo-handled-slots';
const CHECK_INTERVAL_MS = 30000;
const IN_APP_TOLERANCE_MIN = 5; // uygulama slot saatinden <=5 dk sonra açılırsa yine alarm ver

function loadHandled() {
  try {
    const raw = JSON.parse(localStorage.getItem(HANDLED_KEY) || '{}');
    // 2 günden eski kayıtları temizle
    const cutoff = Date.now() - 2 * 86400000;
    const pruned = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number' && v > cutoff) pruned[k] = v;
    }
    return pruned;
  } catch {
    return {};
  }
}

function saveHandled(map) {
  try { localStorage.setItem(HANDLED_KEY, JSON.stringify(map)); } catch { /* dolu olabilir */ }
}

/**
 * @param {Array} schedules — kullanıcının hatırlatıcı planları
 * @param {Map} medicineNameById — id → görünen ad (yerelde çözülmüş)
 * @returns {{alarm, acknowledgeAlarm}} alarm: {schedule, slotId, time, medicineName} | null
 */
export function useInAppReminders(schedules, medicineNameById) {
  const [alarm, setAlarm] = useState(null);
  const handledRef = useRef(loadHandled());
  const snoozeRef = useRef(new Map()); // slotId → yeniden alarm zamanı (ms)
  const osNotifiedRef = useRef(new Set()); // slot başına en fazla bir OS bildirimi

  // Alarmı göster. Sekme arka plandaysa (document.hidden) ek olarak bir OS
  // bildirimi de göster — in-app ekran o an görünmediği için. Gizlilik moduna
  // saygı gösterir: yalnızca 'named' modda kullanıcının onayladığı displayLabel
  // kullanılır, aksi halde genel metin (kilit ekranı sızıntısını önler).
  const triggerAlarm = useCallback((a) => {
    setAlarm(a);
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (hidden && a?.slotId && !osNotifiedRef.current.has(a.slotId)) {
      osNotifiedRef.current.add(a.slotId);
      const label = a.schedule?.notificationPrivacyMode === 'named' && a.schedule?.displayLabel
        ? String(a.schedule.displayLabel)
        : null;
      NotificationService.showLocalReminder({
        body: label
          ? `${label} alma zamanı geldi.`
          : 'İlaç alma zamanınız geldi. Uygulamayı açın.',
        tag: a.slotId,
        scheduleId: a.schedule?.id,
      });
    }
  }, []);

  const check = useCallback(() => {
    if (alarm) return; // ekranda alarm varken yenisini üstüne açma
    const now = new Date();

    // Önce süresi gelen ertelemeler
    for (const [slotId, at] of snoozeRef.current) {
      if (Date.now() >= at) {
        const [schedId] = slotId.split('_');
        const schedule = schedules.find(s => s.id === schedId);
        snoozeRef.current.delete(slotId);
        if (schedule) {
          triggerAlarm({
            schedule, slotId, time: slotId.split('T')[1] || '',
            medicineName: medicineNameById?.get(schedule.medicineId) || null,
            snoozed: true,
          });
          return;
        }
      }
    }

    for (const schedule of schedules) {
      if (!schedule.enabled || !schedule.medicationReminderEnabled) continue;
      const slots = dueSlots(schedule, now, IN_APP_TOLERANCE_MIN);
      for (const slot of slots) {
        if (handledRef.current[slot.slotId] || snoozeRef.current.has(slot.slotId)) continue;
        triggerAlarm({
          schedule, slotId: slot.slotId, time: slot.time,
          medicineName: medicineNameById?.get(schedule.medicineId) || null,
        });
        return; // tek alarm göster; diğerleri sıradaki kontrolde
      }
    }
  }, [alarm, schedules, medicineNameById, triggerAlarm]);

  useEffect(() => {
    const t = setInterval(check, CHECK_INTERVAL_MS);
    check();
    return () => clearInterval(t);
  }, [check]);

  /** Alarmı sonlandır. mode: 'taken' | 'skip' | 'dismiss' | 'snooze' */
  const acknowledgeAlarm = useCallback((mode) => {
    if (!alarm) return;
    if (mode === 'snooze') {
      const minutes = alarm.schedule.snoozeMinutes || 10;
      snoozeRef.current.set(alarm.slotId, Date.now() + minutes * 60000);
    } else {
      handledRef.current[alarm.slotId] = Date.now();
      saveHandled(handledRef.current);
    }
    setAlarm(null);
  }, [alarm]);

  return { alarm, acknowledgeAlarm };
}
