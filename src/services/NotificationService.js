import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './FirebaseClient';
import { subscriptionIdFor, legacySubscriptionIdFor } from '../utils/pushId';

// VAPID public key (private key GitHub Actions Secret olarak saklanır)
const VAPID_PUBLIC_KEY = 'BIVfxqFgFyZ6KNT6LAGNsLdeFjHO8SlrR_nvjwFSqJYzCzpSsLpL-Hk70YAX3cT2OrQgTtfML6DC4betQcJVyPE';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export const NotificationService = {
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  getPermission() {
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  /**
   * Push aboneliği oluşturur ve Firestore'a kaydeder.
   * @returns {Promise<{sub: PushSubscription}|{error: string}|null>}
   */
  async subscribe(userId) {
    if (!this.isSupported() || Notification.permission !== 'granted') return null;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subData = sub.toJSON();
      const subId = await subscriptionIdFor(sub.endpoint);
      await setDoc(
        doc(db, `users/${userId}/pushSubscriptions/${subId}`),
        {
          endpoint: subData.endpoint,
          keys: subData.keys,
          createdAt: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 200),
        }
      );

      // Eski format (btoa tabanlı) doküman varsa best-effort temizle
      const legacyId = legacySubscriptionIdFor(sub.endpoint);
      if (legacyId && legacyId !== subId && !legacyId.includes('/')) {
        deleteDoc(doc(db, `users/${userId}/pushSubscriptions/${legacyId}`)).catch(() => {});
      }

      return { sub };
    } catch (err) {
      // Endpoint/anahtar loglanmaz; yalnızca hata sınıfı
      console.warn('[NotificationService] Abonelik başarısız:', err?.name || 'bilinmeyen hata');
      return { error: 'subscribe-failed' };
    }
  },

  async unsubscribe(userId) {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const subId = await subscriptionIdFor(sub.endpoint);
        const legacyId = legacySubscriptionIdFor(sub.endpoint);
        await sub.unsubscribe();
        await deleteDoc(doc(db, `users/${userId}/pushSubscriptions/${subId}`)).catch(() => {});
        if (legacyId && legacyId !== subId && !legacyId.includes('/')) {
          await deleteDoc(doc(db, `users/${userId}/pushSubscriptions/${legacyId}`)).catch(() => {});
        }
      }
      return true;
    } catch (err) {
      console.warn('[NotificationService] Abonelik kapatma hatası:', err?.name || 'bilinmeyen hata');
      return false;
    }
  },

  /**
   * Tarayıcı aboneliği yenilediğinde (pushsubscriptionchange) yeniden kaydeder.
   */
  async resubscribe(userId) {
    if (!userId || Notification.permission !== 'granted') return null;
    return this.subscribe(userId);
  },

  /**
   * Test bildirimi: sunucu olmadan, SW üzerinden yerel bildirim gösterir.
   * Kullanıcı izni, metin ve cihaz desteğini uçtan uca doğrular.
   */
  async showTestNotification(privacyMode = 'generic') {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return { error: 'permission' };
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const body = privacyMode === 'named'
        ? 'Örnek: X ilacınızı alma zamanınız geldi.'
        : 'Örnek: İlaç zamanınız geldi.';
      await reg.showNotification('DrDepo test bildirimi', {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'drdepo-test',
        data: { url: '/#/bildirimler', type: 'test' },
        lang: 'tr',
      });
      return { ok: true };
    } catch (err) {
      console.warn('[NotificationService] Test bildirimi hatası:', err?.name || 'bilinmeyen hata');
      return { error: 'show-failed' };
    }
  },

  /**
   * Uygulama açık ama sekme arka plandayken (document.hidden) ilaç saati
   * geldiğinde işletim sistemi bildirimi gösterir — in-app alarm ekranı o
   * anda görünmediği için. İzin yoksa sessizce atlar.
   * @param {{ title?: string, body: string, tag?: string, scheduleId?: string }} opts
   */
  async showLocalReminder({ title = 'İlaç zamanı', body, tag, scheduleId } = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: tag || 'drdepo-intake',
        renotify: true,
        requireInteraction: true,
        data: { url: '/#/bildirimler', type: 'intake', scheduleId: scheduleId || undefined },
        lang: 'tr',
        ...('vibrate' in navigator ? { vibrate: [200, 100, 200] } : {}),
        actions: ('actions' in Notification.prototype)
          ? [{ action: 'taken', title: 'Aldım' }, { action: 'snooze', title: 'Ertele' }]
          : undefined,
      });
      return true;
    } catch (err) {
      console.warn('[NotificationService] Yerel hatırlatıcı hatası:', err?.name || 'bilinmeyen hata');
      return false;
    }
  },
};
