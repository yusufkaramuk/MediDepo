export const PUSH_PREFERENCE_KEY = 'drdepo-push-preference';
export const PUSH_ENABLED = 'enabled';
export const PUSH_DISABLED = 'disabled';

/**
 * Tarayici izni kalici olarak "granted" kalsa bile uygulama ici kapatma
 * tercihini korur. Daha once tercih kaydetmemis mevcut kullanicilar geriye
 * uyumlu olarak bildirimleri acik kullanmaya devam eder.
 */
export function effectiveNotificationPermission(browserPermission, preference) {
  if (browserPermission === 'granted' && preference === PUSH_DISABLED) return 'default';
  return browserPermission;
}
