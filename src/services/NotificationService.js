import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './FirebaseClient';

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

      // Subscription'ı Firestore'a kaydet
      const subData = sub.toJSON();
      const subId = btoa(sub.endpoint).slice(0, 60);
      await setDoc(
        doc(db, `users/${userId}/pushSubscriptions/${subId}`),
        {
          endpoint: subData.endpoint,
          keys: subData.keys,
          createdAt: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 200),
        }
      );

      return sub;
    } catch {
      return null;
    }
  },

  async unsubscribe(userId) {
    if (!this.isSupported()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const subId = btoa(sub.endpoint).slice(0, 60);
        await sub.unsubscribe();
        await deleteDoc(doc(db, `users/${userId}/pushSubscriptions/${subId}`));
      }
    } catch { /* sessizce geç */ }
  },
};
