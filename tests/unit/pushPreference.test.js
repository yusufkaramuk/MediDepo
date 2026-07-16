import { describe, expect, it } from 'vitest';
import {
  effectiveNotificationPermission,
  PUSH_DISABLED,
  PUSH_ENABLED,
} from '../../src/utils/pushPreference.js';

describe('effectiveNotificationPermission', () => {
  it('mevcut kullanicilarda granted iznini acik tutar', () => {
    expect(effectiveNotificationPermission('granted', null)).toBe('granted');
    expect(effectiveNotificationPermission('granted', PUSH_ENABLED)).toBe('granted');
  });

  it('uygulama icinden kapatilan bildirimi yeniden acmaz', () => {
    expect(effectiveNotificationPermission('granted', PUSH_DISABLED)).toBe('default');
  });

  it('reddedilen ve varsayilan tarayici izinlerini degistirmez', () => {
    expect(effectiveNotificationPermission('denied', PUSH_DISABLED)).toBe('denied');
    expect(effectiveNotificationPermission('default', PUSH_ENABLED)).toBe('default');
  });
});
