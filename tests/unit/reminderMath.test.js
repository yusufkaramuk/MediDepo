import { describe, it, expect } from 'vitest';
import {
  dailyConsumption, estimateRunoutDate, refillDueDate, decrementRemaining, addStock,
} from '../../src/utils/reminderMath.js';

const daily = (times, dose = 1, days = [0, 1, 2, 3, 4, 5, 6]) => ({
  scheduleTimes: times,
  dosePerIntake: dose,
  daysOfWeek: days,
  refillLeadDays: 7,
});

// 12 Temmuz 2026 Pazar
const FROM = new Date(2026, 6, 12, 9, 0, 0);

describe('dailyConsumption', () => {
  it('günlük tek doz', () => {
    expect(dailyConsumption(daily(['08:00']))).toBe(1);
  });
  it('günlük çoklu doz × doz miktarı', () => {
    expect(dailyConsumption(daily(['08:00', '20:00'], 2))).toBe(4);
  });
  it('haftada 2 gün kullanımda orantılanır', () => {
    expect(dailyConsumption(daily(['08:00'], 1, [1, 4]))).toBeCloseTo(2 / 7);
  });
  it('eksik veri → null', () => {
    expect(dailyConsumption(null)).toBeNull();
    expect(dailyConsumption(daily([], 1))).toBeNull();
    expect(dailyConsumption(daily(['08:00'], 0))).toBeNull();
    expect(dailyConsumption(daily(['08:00'], -3))).toBeNull();
  });
});

describe('estimateRunoutDate', () => {
  it('günlük tek doz: 10 tablet → 10. gün biter', () => {
    const r = estimateRunoutDate(10, daily(['08:00']), FROM);
    expect(r.daysLeft).toBe(9); // bugün dahil 10 kullanım günü → 9 gün sonra son doz
  });

  it('günlük çift doz: 10 tablet → 5 günde biter', () => {
    const r = estimateRunoutDate(10, daily(['08:00', '20:00']), FROM);
    expect(r.daysLeft).toBe(4);
  });

  it('düzensiz günler (yalnızca Pzt ve Per): gün-gün yürüyüş doğru sayar', () => {
    // FROM = Pazar. 4 tablet, günde 1, yalnızca Pzt(1) ve Per(4).
    // Kullanımlar: Pzt 13/7, Per 16/7, Pzt 20/7, Per 23/7 → bitiş 23 Temmuz
    const r = estimateRunoutDate(4, daily(['08:00'], 1, [1, 4]), FROM);
    expect(r.date.getDate()).toBe(23);
    expect(r.date.getMonth()).toBe(6);
  });

  it('ilaç tamamen bitmişse bugün döner', () => {
    const r = estimateRunoutDate(0, daily(['08:00']), FROM);
    expect(r.daysLeft).toBe(0);
  });

  it('negatif veya geçersiz değerler → null', () => {
    expect(estimateRunoutDate(-5, daily(['08:00']), FROM)).toBeNull();
    expect(estimateRunoutDate('abc', daily(['08:00']), FROM)).toBeNull();
    expect(estimateRunoutDate(10, null, FROM)).toBeNull();
    expect(estimateRunoutDate(10, daily([]), FROM)).toBeNull();
    expect(estimateRunoutDate(10, daily(['08:00'], 0), FROM)).toBeNull();
    expect(estimateRunoutDate(10, { ...daily(['08:00']), daysOfWeek: [] }, FROM)).toBeNull();
  });
});

describe('refillDueDate', () => {
  it('bitişten refillLeadDays önce uyarı tarihi üretir', () => {
    const r = refillDueDate(10, daily(['08:00']), FROM); // bitiş: 21 Temmuz
    expect(r.runoutDate.getDate()).toBe(21);
    expect(r.date.getDate()).toBe(14); // 21 - 7
  });
  it('lead days geçersizse null', () => {
    expect(refillDueDate(10, { ...daily(['08:00']), refillLeadDays: -1 }, FROM)).toBeNull();
    expect(refillDueDate(10, { ...daily(['08:00']), refillLeadDays: 'x' }, FROM)).toBeNull();
  });
});

describe('decrementRemaining / addStock (manuel stok artırma ve azaltma)', () => {
  it('Aldım: doz kadar azalır, negatife düşmez', () => {
    expect(decrementRemaining(10, 1)).toBe(9);
    expect(decrementRemaining(0.5, 1)).toBe(0);
    expect(decrementRemaining(0, 1)).toBe(0);
  });
  it('yarım doz hassasiyeti korunur', () => {
    expect(decrementRemaining(10, 0.5)).toBe(9.5);
  });
  it('geçersiz doz değeri kalan birimi değiştirmez', () => {
    expect(decrementRemaining(10, 0)).toBe(10);
    expect(decrementRemaining(10, 'x')).toBe(10);
  });
  it('stok ekleme üst sınırı aşamaz', () => {
    expect(addStock(4990, 30)).toBe(5000);
    expect(addStock(10, 20)).toBe(30);
    expect(addStock(10, -5)).toBe(10);
    expect(addStock(10, 'x')).toBe(10);
  });
});
