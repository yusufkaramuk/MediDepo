const NOTIFICATION_CRITICAL_ERROR =
  '[Bildirim] Kritik hata; ayrıntılar güvenlik nedeniyle loglanmadı.';

/** Environment veya uzak servis verisini loglamadan kritik hatayı bildirir. */
export function logNotificationCriticalError(logger = console.error) {
  logger(NOTIFICATION_CRITICAL_ERROR);
}
