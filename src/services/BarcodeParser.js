const GS1_PREFIXES = [']d2', ']D2', ']C1'];
const FNC1 = String.fromCharCode(29);

const FIXED_LENGTH_AI = {
  '01': 14,
  '17': 6,
};

const VARIABLE_AI = new Set(['10', '21']);
const KNOWN_AI = new Set([...Object.keys(FIXED_LENGTH_AI), ...VARIABLE_AI]);

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

const normalizeRaw = (raw) => {
  let value = String(raw || '').trim();
  for (const prefix of GS1_PREFIXES) {
    if (value.startsWith(prefix)) {
      value = value.slice(prefix.length);
      break;
    }
  }
  return value.replace(/\s+/g, '');
};

const findNextAi = (value, start) => {
  let best = -1;
  for (let i = start; i < value.length - 1; i += 1) {
    const candidate = value.slice(i, i + 2);
    if (KNOWN_AI.has(candidate)) {
      best = i;
      break;
    }
  }
  return best;
};

const parseGs1 = (value) => {
  const fields = {};
  let i = 0;
  let foundGs1Ai = false;

  while (i < value.length - 1) {
    const ai = value.slice(i, i + 2);
    if (!KNOWN_AI.has(ai)) {
      i += 1;
      continue;
    }

    foundGs1Ai = true;
    i += 2;

    if (FIXED_LENGTH_AI[ai]) {
      const len = FIXED_LENGTH_AI[ai];
      const part = value.slice(i, i + len);
      if (part.length < len || !/^\d+$/.test(part)) break;
      fields[ai] = part;
      i += len;
      continue;
    }

    const sep = value.indexOf(FNC1, i);
    const nextAi = sep === -1 ? findNextAi(value, i + 1) : -1;
    const end = sep !== -1 ? sep : nextAi !== -1 ? nextAi : value.length;
    fields[ai] = value.slice(i, end);
    i = sep !== -1 ? end + 1 : end;
  }

  if (!foundGs1Ai || !fields['01']) return null;

  const gtin14 = fields['01'];
  const ean13 = gtin14.startsWith('0') ? gtin14.slice(1) : null;
  const expiryRaw = fields['17'];
  const expiryDate = expiryRaw
    ? `20${expiryRaw.slice(0, 2)}-${expiryRaw.slice(2, 4)}`
    : '';

  return {
    type: 'gs1-datamatrix',
    gtin14,
    ean13,
    barcode: ean13 || gtin14,
    serial: fields['21'] || '',
    lot: fields['10'] || '',
    expiryDate,
    candidates: [...new Set([ean13, gtin14].filter(Boolean))],
  };
};

export const BarcodeParser = {
  parse(raw) {
    const normalized = normalizeRaw(raw);
    const gs1 = parseGs1(normalized);
    if (gs1) return { raw: String(raw || ''), normalized, ...gs1 };

    const digits = onlyDigits(normalized);
    const candidates = [];
    if (digits.length === 13 || digits.length === 8 || digits.length === 12) candidates.push(digits);
    if (digits.length === 14) {
      candidates.push(digits.startsWith('0') ? digits.slice(1) : digits);
      candidates.push(digits);
    }

    return {
      raw: String(raw || ''),
      normalized,
      type: candidates.length ? 'ean' : 'unknown',
      barcode: candidates[0] || normalized,
      ean13: candidates[0]?.length === 13 ? candidates[0] : null,
      gtin14: digits.length === 14 ? digits : null,
      serial: '',
      lot: '',
      expiryDate: '',
      candidates: [...new Set(candidates.length ? candidates : [normalized].filter(Boolean))],
    };
  },

  primary(raw) {
    return this.parse(raw).barcode;
  },
};
