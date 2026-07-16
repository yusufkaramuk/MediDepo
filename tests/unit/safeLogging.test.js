import { describe, expect, it, vi } from 'vitest';
import { logNotificationCriticalError } from '../../scripts/lib/safe-logging.js';

describe('logNotificationCriticalError', () => {
  it('yalnızca sabit güvenli mesajı loglar', () => {
    const logger = vi.fn();

    logNotificationCriticalError(logger);

    expect(logger).toHaveBeenCalledOnce();
    expect(logger).toHaveBeenCalledWith(
      '[Bildirim] Kritik hata; ayrıntılar güvenlik nedeniyle loglanmadı.',
    );
  });
});
