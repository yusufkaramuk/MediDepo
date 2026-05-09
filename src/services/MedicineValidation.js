export const MEDICINE_FIELDS = [
    'name',
    'quantity',
    'expiryDate',
    'activeIngredient1',
    'activeIngredient2',
    'activeIngredient3',
    'notes',
    'createdAt'
];

export const MEDICINE_LIMITS = {
    name: 120,
    quantity: 80,
    expiryDate: 7,
    activeIngredient1: 120,
    activeIngredient2: 120,
    activeIngredient3: 120,
    notes: 500,
    createdAt: 40
};

export const MAX_IMPORT_ITEMS = 1000;
export const MAX_IMPORT_FILE_BYTES = 512 * 1024;

const FIELD_LABELS = {
    name: 'Ilac adi',
    quantity: 'Miktar',
    expiryDate: 'Son kullanma tarihi',
    activeIngredient1: 'Etken madde 1',
    activeIngredient2: 'Etken madde 2',
    activeIngredient3: 'Etken madde 3',
    notes: 'Notlar',
    createdAt: 'Olusturma tarihi'
};

const textValue = (value, maxLength) => {
    const normalized = typeof value === 'string' ? value : value == null ? '' : String(value);
    return normalized
        .replace(/[<>]/g, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, maxLength);
};

export const isValidExpiryDate = (value) => (
    value === '' || /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
);

const isValidCreatedAt = (value) => (
    typeof value === 'string' &&
    value.length >= 20 &&
    value.length <= MEDICINE_LIMITS.createdAt &&
    /^\d{4}-\d{2}-\d{2}T/.test(value)
);

export const normalizeMedicine = (medicine = {}, options = {}) => {
    const createdAt = options.preserveCreatedAt && medicine.createdAt
        ? textValue(medicine.createdAt, MEDICINE_LIMITS.createdAt)
        : new Date().toISOString();

    return {
        name: textValue(medicine.name, MEDICINE_LIMITS.name),
        quantity: textValue(medicine.quantity, MEDICINE_LIMITS.quantity),
        expiryDate: textValue(medicine.expiryDate, MEDICINE_LIMITS.expiryDate),
        activeIngredient1: textValue(medicine.activeIngredient1, MEDICINE_LIMITS.activeIngredient1),
        activeIngredient2: textValue(medicine.activeIngredient2, MEDICINE_LIMITS.activeIngredient2),
        activeIngredient3: textValue(medicine.activeIngredient3, MEDICINE_LIMITS.activeIngredient3),
        notes: textValue(medicine.notes, MEDICINE_LIMITS.notes),
        createdAt
    };
};

export const validateMedicine = (medicine, options = {}) => {
    const errors = [];
    const requiredCreatedAt = options.requireCreatedAt ?? true;

    if (!medicine || typeof medicine !== 'object' || Array.isArray(medicine)) {
        return ['Ilac verisi gecersiz'];
    }

    const extraFields = Object.keys(medicine).filter((key) => key !== 'id' && !MEDICINE_FIELDS.includes(key));
    if (extraFields.length) {
        errors.push(`Desteklenmeyen alanlar: ${extraFields.join(', ')}`);
    }

    if (!medicine.name || typeof medicine.name !== 'string' || medicine.name.trim().length === 0) {
        errors.push('Ilac adi zorunludur');
    }

    MEDICINE_FIELDS.forEach((field) => {
        if (field === 'createdAt') return;

        const value = medicine[field] ?? '';
        if (typeof value !== 'string') {
            errors.push(`${FIELD_LABELS[field]} metin olmali`);
            return;
        }

        if (value.length > MEDICINE_LIMITS[field]) {
            errors.push(`${FIELD_LABELS[field]} en fazla ${MEDICINE_LIMITS[field]} karakter olabilir`);
        }
    });

    if (!isValidExpiryDate(medicine.expiryDate || '')) {
        errors.push('Son kullanma tarihi YYYY-AA formatinda olmali');
    }

    if (requiredCreatedAt && !isValidCreatedAt(medicine.createdAt)) {
        errors.push('Olusturma tarihi gecersiz');
    }

    return errors;
};

export const normalizeAndValidateMedicine = (medicine, options = {}) => {
    const normalized = normalizeMedicine(medicine, options);
    const errors = validateMedicine(normalized, { requireCreatedAt: true });

    if (errors.length) {
        throw new Error(errors[0]);
    }

    return normalized;
};

export const normalizeMedicineList = (items) => {
    if (!Array.isArray(items)) {
        throw new Error('Ice aktarilan dosya bir ilac listesi olmali');
    }

    if (items.length > MAX_IMPORT_ITEMS) {
        throw new Error(`Tek seferde en fazla ${MAX_IMPORT_ITEMS} ilac ice aktarilabilir`);
    }

    return items.map((item, index) => {
        try {
            return normalizeAndValidateMedicine(item, { preserveCreatedAt: Boolean(item?.createdAt) });
        } catch (error) {
            throw new Error(`${index + 1}. kayit gecersiz: ${error.message}`);
        }
    });
};
