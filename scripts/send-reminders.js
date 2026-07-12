#!/usr/bin/env node
// İlaç kullanım hatırlatıcısı gönderme scripti (15 dakikada bir, GitHub Actions).
//
// ÖNEMLİ ZAMANLAMA NOTU: GitHub Actions cron'u garanti DEĞİLDİR; yoğun
// saatlerde 3-30+ dakika gecikebilir. Bu yüzden 40 dakikalık tolerans
// penceresi kullanılır ve "tam saat garantisi" verilmez. Uygulama açıkken
// in-app zamanlayıcı (useInAppReminders) saniye hassasiyetinde çalışır.
//
// İDEMPOTENCY: Her slot için users/{uid}/reminderDeliveries/{slotId} dokümanı
// currentDocument.exists=false önkoşuluyla oluşturulur (önce-yaz-sonra-gönder).
// Çakışan/tekrarlanan çalıştırmalarda yalnızca ilk yazan gönderir; bir çökme
// çift bildirim değil, en fazla bir kaçırılmış bildirim üretir.
//
// GİZLİLİK: İlaç adları Firestore'da şifrelidir ve burada asla çözülemez.
// 'named' modda yalnızca kullanıcının açık onayla yazdığı displayLabel
// kullanılır; sanitizer 'enc:' önekini ayrıca engeller. Endpoint/anahtar/
// kullanıcı verisi loglanmaz — yalnızca anonim sayaçlar.
//
// Kullanım: node scripts/send-reminders.js [--dry-run]

import webpush from 'web-push';
import { getFirestoreToken, withRetry } from './lib/firestore-auth.js';
import {
  runQuery, listAll, getField, decodeFields, docId, deleteDoc,
  createDocIfAbsent, updateDoc, setDoc,
} from './lib/firestore-values.js';
import { buildNotificationPayload, sanitizeNotificationText } from './lib/sanitize.js';
import { dueSlots, TIME_RE, isValidTimezone } from '../src/utils/scheduleSlots.js';

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
  FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT,
} = process.env;

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const TOLERANCE_MINUTES = 40;
const DELIVERY_TTL_DAYS = 7;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT) {
  console.error('[Hatirlatici] Eksik environment variables. GitHub Secrets kontrol edin.');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:noreply@drdepo.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/** Doküman yolundan kullanıcı kimliğini çıkarır (users/{uid}/medicationSchedules/{id}). */
function userIdOf(schedDoc) {
  const m = /\/documents\/users\/([^/]+)\/medicationSchedules\//.exec(schedDoc?.name || '');
  return m ? m[1] : null;
}

/** Script tarafı savunma amaçlı yeniden doğrulama (rules liste elemanlarını doğrulayamaz). */
function isSaneSchedule(s) {
  return s &&
    s.enabled === true &&
    s.medicationReminderEnabled === true &&
    isValidTimezone(s.timezone) &&
    Array.isArray(s.scheduleTimes) && s.scheduleTimes.length > 0 && s.scheduleTimes.length <= 12 &&
    s.scheduleTimes.every(t => typeof t === 'string' && TIME_RE.test(t)) &&
    Array.isArray(s.daysOfWeek) && s.daysOfWeek.length <= 7;
}

/** Abonelikleri endpoint bazında tekilleştirir. */
function dedupeSubscriptions(subDocs) {
  const byEndpoint = new Map();
  for (const subDoc of subDocs) {
    const endpoint = getField(subDoc, 'endpoint');
    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) continue;
    const keys = getField(subDoc, 'keys');
    if (!keys?.p256dh || !keys?.auth) continue;
    if (!byEndpoint.has(endpoint)) {
      byEndpoint.set(endpoint, { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, docIds: [docId(subDoc)] });
    } else {
      byEndpoint.get(endpoint).docIds.push(docId(subDoc));
    }
  }
  return [...byEndpoint.values()];
}

async function sendToSubscription(token, userId, sub, payloadJson, counters) {
  try {
    await withRetry(
      () => webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payloadJson),
      { retries: 1 },
    );
    counters.sent++;
    return true;
  } catch (err) {
    const status = err.statusCode;
    if (status === 404 || status === 410) {
      for (const id of sub.docIds) {
        if (!id) continue;
        try { await deleteDoc(token, FIREBASE_PROJECT_ID, `users/${userId}/pushSubscriptions/${id}`); } catch { /* sonraki koşuda */ }
      }
      counters.stale++;
    } else {
      counters.failed++;
      console.warn(`[Hatirlatici] Gönderim hatası (HTTP ${status ?? 'ağ'})`);
    }
    return false;
  }
}

async function main() {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('[Hatirlatici] FIREBASE_SERVICE_ACCOUNT geçersiz JSON');
    process.exit(1);
  }

  const token = await getFirestoreToken(serviceAccount);
  const now = new Date();

  // Collection-group sorgusu: yalnızca etkin hatırlatıcılar okunur.
  // (Spark okuma kotası kullanıcı sayısına değil aktif hatırlatıcı sayısına bağlanır.
  //  firestore.indexes.json içindeki fieldOverride bu sorgu için gereklidir.)
  const schedDocs = await runQuery(token, FIREBASE_PROJECT_ID, {
    from: [{ collectionId: 'medicationSchedules', allDescendants: true }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'enabled' },
        op: 'EQUAL',
        value: { booleanValue: true },
      },
    },
  });

  console.log(`[Hatirlatici] ${schedDocs.length} etkin hatırlatıcı bulundu${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const counters = { due: 0, delivered: 0, alreadySent: 0, sent: 0, stale: 0, failed: 0, invalid: 0 };
  const subsCache = new Map(); // uid → deduped subscriptions

  for (const schedDoc of schedDocs) {
    const userId = userIdOf(schedDoc);
    const scheduleId = docId(schedDoc);
    if (!userId || !scheduleId) continue;

    try {
      const schedule = { id: scheduleId, ...decodeFields(schedDoc) };
      if (!isSaneSchedule(schedule)) { counters.invalid++; continue; }

      const slots = dueSlots(schedule, now, TOLERANCE_MINUTES);
      if (slots.length === 0) continue;
      counters.due += slots.length;

      for (const slot of slots) {
        // İdempotency: önce delivery dokümanını yaz; zaten varsa bu slot işlenmiş demektir.
        if (DRY_RUN) { counters.delivered++; continue; }
        const created = await createDocIfAbsent(
          token, FIREBASE_PROJECT_ID,
          `users/${userId}/reminderDeliveries/${slot.slotId}`,
          {
            scheduleId,
            slot: `${slot.localDate}T${slot.time}`,
            status: 'pending',
            createdAt: now.toISOString(),
            expireAt: new Date(now.getTime() + DELIVERY_TTL_DAYS * 86400000),
          },
        );
        if (!created) { counters.alreadySent++; continue; }

        // Abonelikleri (kullanıcı başına bir kez) çek
        if (!subsCache.has(userId)) {
          const subDocs = await listAll(token, FIREBASE_PROJECT_ID, `users/${userId}/pushSubscriptions`);
          subsCache.set(userId, dedupeSubscriptions(subDocs));
        }
        const subs = subsCache.get(userId);

        // Gizlilik moduna göre metin (varsayılan: genel)
        const label = schedule.notificationPrivacyMode === 'named'
          ? sanitizeNotificationText(schedule.displayLabel, 40)
          : null;
        const payload = buildNotificationPayload({
          title: 'İlaç hatırlatması',
          body: label
            ? `${label} — planladığınız ilacı alma zamanı geldi.`
            : 'İlaç zamanınız geldi. Detay için uygulamayı açın.',
          tag: slot.slotId,
          url: '/#/bildirimler',
          type: 'intake',
          scheduleId,
          slotKey: slot.slotId,
          actions: [
            { action: 'taken', title: 'Aldım' },
            { action: 'snooze', title: 'Ertele' },
          ],
        });
        const payloadJson = JSON.stringify(payload);

        let anySent = false;
        for (const sub of subs) {
          const ok = await sendToSubscription(token, userId, sub, payloadJson, counters);
          anySent = anySent || ok;
        }

        // Uygulama içi bildirim merkezi kaydı (deterministik id → yinelenmez)
        try {
          await setDoc(token, FIREBASE_PROJECT_ID, `users/${userId}/notifications/${slot.slotId}`, {
            type: 'intake',
            title: payload.title,
            body: payload.body,
            scheduleId,
            read: false,
            createdAt: now.toISOString(),
          });
        } catch { /* inbox kaydı kritik değil */ }

        try {
          await updateDoc(token, FIREBASE_PROJECT_ID, `users/${userId}/reminderDeliveries/${slot.slotId}`, {
            status: anySent ? 'sent' : (subs.length === 0 ? 'no-subscription' : 'failed'),
            sentAt: new Date().toISOString(),
          });
        } catch { /* durum güncellenemese de idempotency korunur */ }

        counters.delivered++;
      }
    } catch (err) {
      // Tek hatırlatıcı hatası tüm işi durdurmaz
      counters.failed++;
      console.warn(`[Hatirlatici] Hatırlatıcı işlenemedi (HTTP ${err.status ?? err.statusCode ?? '?'})`);
    }
  }

  console.log(
    `[Hatirlatici] Tamamlandı — vadesi gelen slot: ${counters.due}, işlenen: ${counters.delivered}, ` +
    `zaten gönderilmiş: ${counters.alreadySent}, push: ${counters.sent}, ` +
    `temizlenen abonelik: ${counters.stale}, hata: ${counters.failed}, geçersiz plan: ${counters.invalid}`,
  );
}

main().catch(err => {
  console.error('[Hatirlatici] Kritik hata:', err.message);
  process.exit(1);
});
