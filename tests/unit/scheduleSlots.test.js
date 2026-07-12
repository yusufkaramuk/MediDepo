import { describe, it, expect } from 'vitest';
import { dueSlots, localParts, isInQuietHours, isValidTimezone } from '../../src/utils/scheduleSlots.js';

// Yardımcı: İstanbul yerel saatinden UTC an üret (TR = UTC+3, DST yok since 2016)
const istanbul = (y, mo, d, h, mi) => new Date(Date.UTC(y, mo - 1, d, h - 3, mi));

const baseSchedule = {
  id: 'sched1',
  timezone: 'Europe/Istanbul',
  scheduleTimes: ['08:00'],
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  quietHours: null,
};

describe('isValidTimezone', () => {
  it('geçerli IANA dilimlerini kabul eder', () => {
    expect(isValidTimezone('Europe/Istanbul')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });
  it('geçersizleri reddeder', () => {
    expect(isValidTimezone('Mars/Olympus')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone('x'.repeat(100))).toBe(false);
  });
});

describe('localParts', () => {
  it('İstanbul duvar saatini doğru üretir', () => {
    const p = localParts('Europe/Istanbul', istanbul(2026, 7, 12, 8, 5));
    expect(p.ymd).toBe('2026-07-12');
    expect(p.hm).toBe('08:05');
    expect(p.weekday).toBe(0); // 12 Temmuz 2026 Pazar
    expect(p.minutesOfDay).toBe(485);
  });

  it('gece yarısını 00 olarak normalleştirir', () => {
    const p = localParts('Europe/Istanbul', istanbul(2026, 7, 12, 0, 0));
    expect(p.hm).toBe('00:00');
    expect(p.ymd).toBe('2026-07-12');
  });
});

describe('dueSlots — temel', () => {
  it('slot saatinde vadesi gelir (günlük tek doz)', () => {
    const slots = dueSlots(baseSchedule, istanbul(2026, 7, 12, 8, 0), 40);
    expect(slots).toHaveLength(1);
    expect(slots[0].slotId).toBe('sched1_2026-07-12T0800');
    expect(slots[0].time).toBe('08:00');
  });

  it('tolerans penceresi içinde hâlâ vadesi gelmiştir (Actions gecikmesi)', () => {
    expect(dueSlots(baseSchedule, istanbul(2026, 7, 12, 8, 39), 40)).toHaveLength(1);
    expect(dueSlots(baseSchedule, istanbul(2026, 7, 12, 8, 41), 40)).toHaveLength(0);
  });

  it('slot saatinden ÖNCE vadesi gelmez', () => {
    expect(dueSlots(baseSchedule, istanbul(2026, 7, 12, 7, 59), 40)).toHaveLength(0);
  });

  it('günlük çoklu doz — yalnızca penceredeki slot döner', () => {
    const s = { ...baseSchedule, scheduleTimes: ['08:00', '14:00', '20:00'] };
    const slots = dueSlots(s, istanbul(2026, 7, 12, 14, 10), 40);
    expect(slots).toHaveLength(1);
    expect(slots[0].time).toBe('14:00');
  });

  it('haftanın belirli günleri — bugün seçili değilse boş', () => {
    // 12 Temmuz 2026 Pazar (0); yalnızca Pzt-Çar-Cum (1,3,5)
    const s = { ...baseSchedule, daysOfWeek: [1, 3, 5] };
    expect(dueSlots(s, istanbul(2026, 7, 12, 8, 0), 40)).toHaveLength(0);
    // 13 Temmuz Pazartesi
    expect(dueSlots(s, istanbul(2026, 7, 13, 8, 0), 40)).toHaveLength(1);
  });

  it('gün değişimi — gece yarısını aşan tolerans penceresi dünkü slotu yakalar', () => {
    const s = { ...baseSchedule, scheduleTimes: ['23:50'] };
    // 13 Temmuz 00:10'da, 12 Temmuz 23:50 slotu 20 dk önce vadesiydi
    const slots = dueSlots(s, istanbul(2026, 7, 13, 0, 10), 40);
    expect(slots).toHaveLength(1);
    expect(slots[0].slotId).toBe('sched1_2026-07-12T2350');
    expect(slots[0].localDate).toBe('2026-07-12');
  });

  it('geçersiz saat dilimi veya boş saat listesi → boş sonuç', () => {
    expect(dueSlots({ ...baseSchedule, timezone: 'Yok/Boyle' }, new Date(), 40)).toHaveLength(0);
    expect(dueSlots({ ...baseSchedule, scheduleTimes: [] }, new Date(), 40)).toHaveLength(0);
    expect(dueSlots({ ...baseSchedule, scheduleTimes: ['25:99', 'abc'] }, new Date(), 40)).toHaveLength(0);
    expect(dueSlots(null, new Date(), 40)).toHaveLength(0);
  });
});

describe('dueSlots — saat dilimi ve yaz saati (DST)', () => {
  const nySchedule = { ...baseSchedule, timezone: 'America/New_York' };

  it('New York duvar saatiyle çalışır', () => {
    // 12 Tem 2026 NY = UTC-4 (EDT) → 08:00 yerel = 12:00 UTC
    const slots = dueSlots(nySchedule, new Date(Date.UTC(2026, 6, 12, 12, 0)), 40);
    expect(slots).toHaveLength(1);
    expect(slots[0].time).toBe('08:00');
  });

  it('DST sonrası (kış) aynı duvar saatinde tetiklenir', () => {
    // 15 Ara 2026 NY = UTC-5 (EST) → 08:00 yerel = 13:00 UTC
    const slots = dueSlots(nySchedule, new Date(Date.UTC(2026, 11, 15, 13, 0)), 40);
    expect(slots).toHaveLength(1);
  });

  it('ileri alınan saatte (spring forward) atlanan slot o gün eşleşmez', () => {
    // ABD DST başlangıcı: 8 Mart 2026, 02:00 → 03:00 (02:30 hiç yaşanmaz)
    const s = { ...nySchedule, scheduleTimes: ['02:30'] };
    // 8 Mart NY sabahı boyunca hiçbir an duvar saati 02:30-03:10 aralığına düşmez
    for (let utcH = 5; utcH <= 9; utcH++) {
      const slots = dueSlots(s, new Date(Date.UTC(2026, 2, 8, utcH, 15)), 40);
      expect(slots).toHaveLength(0);
    }
    // Ertesi gün normal şekilde eşleşir (9 Mart EDT: 02:30 yerel = 06:30 UTC)
    expect(dueSlots(s, new Date(Date.UTC(2026, 2, 9, 6, 35)), 40)).toHaveLength(1);
  });
});

describe('isInQuietHours', () => {
  it('normal pencere', () => {
    const q = { start: '13:00', end: '15:00' };
    expect(isInQuietHours(q, '13:30')).toBe(true);
    expect(isInQuietHours(q, '12:59')).toBe(false);
    expect(isInQuietHours(q, '15:00')).toBe(false);
  });

  it('gece yarısını aşan pencere (22:00 → 07:00)', () => {
    const q = { start: '22:00', end: '07:00' };
    expect(isInQuietHours(q, '23:30')).toBe(true);
    expect(isInQuietHours(q, '03:00')).toBe(true);
    expect(isInQuietHours(q, '08:00')).toBe(false);
    expect(isInQuietHours(q, '21:59')).toBe(false);
  });

  it('geçersiz/boş pencere sessiz saat üretmez', () => {
    expect(isInQuietHours(null, '12:00')).toBe(false);
    expect(isInQuietHours({ start: 'xx', end: '07:00' }, '12:00')).toBe(false);
    expect(isInQuietHours({ start: '07:00', end: '07:00' }, '07:00')).toBe(false);
  });

  it('dueSlots sessiz saatteki slotu atlar', () => {
    const s = { ...baseSchedule, quietHours: { start: '07:00', end: '09:00' } };
    expect(dueSlots(s, istanbul(2026, 7, 12, 8, 0), 40)).toHaveLength(0);
  });
});
