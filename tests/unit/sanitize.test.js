import { describe, it, expect } from 'vitest';
import { sanitizeNotificationText, buildNotificationPayload, LIMITS } from '../../scripts/lib/sanitize.js';

describe('sanitizeNotificationText', () => {
  it('Türkçe karakterleri aynen korur', () => {
    const s = 'İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç';
    expect(sanitizeNotificationText(s)).toBe(s);
  });

  it('normal ilaç adını değiştirmez', () => {
    expect(sanitizeNotificationText('Parol 500 mg Tablet')).toBe('Parol 500 mg Tablet');
  });

  it('nesne, dizi, null, undefined, boolean için null döner', () => {
    expect(sanitizeNotificationText({ values: [] })).toBeNull();
    expect(sanitizeNotificationText(['a', 'b'])).toBeNull();
    expect(sanitizeNotificationText(null)).toBeNull();
    expect(sanitizeNotificationText(undefined)).toBeNull();
    expect(sanitizeNotificationText(true)).toBeNull();
  });

  it('sayı girdisi string olarak kabul edilir (salt sayıdan oluşan ad)', () => {
    expect(sanitizeNotificationText(12345)).toBe('12345');
    expect(sanitizeNotificationText('12345')).toBe('12345');
  });

  it('ciphertext (enc: öneki) asla geçmez', () => {
    expect(sanitizeNotificationText('enc:AbCdEf123==')).toBeNull();
  });

  it('HTML etiketlerini kaldırır', () => {
    expect(sanitizeNotificationText('<script>alert(1)</script>Aspirin')).toBe('alert(1) Aspirin');
    expect(sanitizeNotificationText('<b>Kalın</b> ilaç')).toBe('Kalın ilaç');
    // '< b >' HTML etiketi gibi değerlendirilip kaldırılır — güvenli taraf
    expect(sanitizeNotificationText('a < b > c')).toBe('a c');
    expect(sanitizeNotificationText('5 > 3 doz')).toBe('5 3 doz');
  });

  it('JSON metni düz metin olarak kalır ama kısaltılır', () => {
    const json = JSON.stringify({ name: 'x'.repeat(300) });
    const out = sanitizeNotificationText(json, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
  });

  it('satır sonları ve tekrarlanan boşluklar tek boşluğa iner', () => {
    expect(sanitizeNotificationText('Parol\n\n500   mg\tTablet')).toBe('Parol 500 mg Tablet');
  });

  it('kontrol karakterlerini kaldırır', () => {
    const withCtrl = 'Pa' + String.fromCharCode(0x00) + 'rol' + String.fromCharCode(0x07) + ' 500';
    expect(sanitizeNotificationText(withCtrl)).toBe('Parol 500');
  });

  it('zero-width ve bidi karakterlerini kaldırır', () => {
    const zw = 'Pa' + String.fromCharCode(0x200B) + 'rol' + String.fromCharCode(0x202E) + ' gizli' + String.fromCharCode(0xFEFF);
    expect(sanitizeNotificationText(zw)).toBe('Parol gizli');
  });

  it('boş ve yalnızca boşluk içeren girdide null döner', () => {
    expect(sanitizeNotificationText('')).toBeNull();
    expect(sanitizeNotificationText('   \n\t ')).toBeNull();
  });

  it('çok uzun ilaç adını kod noktası bazında güvenli kısaltır', () => {
    const long = 'Ç'.repeat(500);
    const out = sanitizeNotificationText(long, LIMITS.name);
    expect(Array.from(out).length).toBeLessThanOrEqual(LIMITS.name);
    expect(out.endsWith('…')).toBe(true);
  });

  it('emoji korunur ve surrogate çifti ortadan bölünmez', () => {
    expect(sanitizeNotificationText('İlaç 💊 zamanı')).toBe('İlaç 💊 zamanı');
    const manyEmoji = '💊'.repeat(100);
    const out = sanitizeNotificationText(manyEmoji, 10);
    // Bozuk (yarım) surrogate içermemeli
    expect(() => encodeURIComponent(out)).not.toThrow();
  });

  it('bozuk Unicode (eşlenmemiş surrogate) temizlenir', () => {
    const broken = 'Parol' + String.fromCharCode(0xd800) + ' 500';
    const out = sanitizeNotificationText(broken);
    expect(out).toBe('Parol 500');
    expect(() => encodeURIComponent(out)).not.toThrow();
  });

  it('Unicode NFC normalizasyonu uygular', () => {
    // 'e' + combining acute → 'é'
    expect(sanitizeNotificationText('café')).toBe('café');
  });
});

describe('buildNotificationPayload', () => {
  it('geçersiz başlık/gövde için anlaşılır fallback kullanır', () => {
    const p = buildNotificationPayload({ title: { a: 1 }, body: null });
    expect(p.title).toBe('DrDepo');
    expect(p.body).toBe('Yeni bir bildiriminiz var.');
  });

  it('başlık ve gövde sınırlarını uygular', () => {
    const p = buildNotificationPayload({ title: 'B'.repeat(300), body: 'G'.repeat(500) });
    expect(Array.from(p.title).length).toBeLessThanOrEqual(LIMITS.title);
    expect(Array.from(p.body).length).toBeLessThanOrEqual(LIMITS.body);
  });

  it('yalnızca göreli aynı-origin URL kabul eder', () => {
    expect(buildNotificationPayload({ url: '/#/ilaclar' }).data.url).toBe('/#/ilaclar');
    expect(buildNotificationPayload({ url: 'https://evil.example/x' }).data).toBeUndefined();
    expect(buildNotificationPayload({ url: '//evil.example' }).data).toBeUndefined();
    expect(buildNotificationPayload({ url: 'javascript:alert(1)' }).data).toBeUndefined();
  });

  it('tag güvenli karakterlere indirgenir', () => {
    const p = buildNotificationPayload({ tag: 'slot 2026-07-12T08:00 <x>' });
    expect(p.tag).toMatch(/^[\w:-]+$/);
  });

  it('payload asla [object Object] içermez', () => {
    const p = buildNotificationPayload({
      title: { arrayValue: { values: [] } },
      body: ['dizi'],
      tag: {},
    });
    expect(JSON.stringify(p)).not.toContain('[object Object]');
  });
});
