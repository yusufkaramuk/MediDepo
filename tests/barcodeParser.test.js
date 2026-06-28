import { describe, expect, it } from 'vitest';
import { BarcodeParser } from '../src/services/BarcodeParser';

describe('BarcodeParser', () => {
  it('extracts EAN-13 from GS1 DataMatrix payload', () => {
    const parsed = BarcodeParser.parse('010869952509123421SN123456781726050010LOT123');

    expect(parsed.type).toBe('gs1-datamatrix');
    expect(parsed.gtin14).toBe('08699525091234');
    expect(parsed.ean13).toBe('8699525091234');
    expect(parsed.barcode).toBe('8699525091234');
    expect(parsed.expiryDate).toBe('2026-05');
    expect(parsed.lot).toBe('LOT123');
  });

  it('keeps plain EAN values searchable', () => {
    const parsed = BarcodeParser.parse('8699525091234');

    expect(parsed.type).toBe('ean');
    expect(parsed.barcode).toBe('8699525091234');
    expect(parsed.candidates).toContain('8699525091234');
  });
});
