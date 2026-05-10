import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './FirebaseClient';

const ENCRYPTED_FIELDS = ['name', 'activeIngredient1', 'activeIngredient2', 'activeIngredient3', 'notes'];
const ENC_PREFIX = 'enc:';

// ── Web Crypto helpers ────────────────────────────────────────────────────────

async function generateKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function importKey(b64) {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

async function encryptField(text, key) {
  if (!text) return text;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(12 + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), 12);
  return ENC_PREFIX + btoa(String.fromCharCode(...combined));
}

async function decryptField(value, key) {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;
  try {
    const combined = Uint8Array.from(atob(value.slice(ENC_PREFIX.length)), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return value;
  }
}

// ── Key storage ───────────────────────────────────────────────────────────────

// In-memory cache — anahtarı her Firestore okumada çekmemek için
const keyCache = new Map();

async function getOrCreateUserKey(userId) {
  if (keyCache.has(userId)) return keyCache.get(userId);

  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  let b64Key = snap.exists() ? snap.data().encKey : null;

  if (!b64Key) {
    const newKey = await generateKey();
    b64Key = await exportKey(newKey);
    await setDoc(userRef, { encKey: b64Key }, { merge: true });
  }

  const cryptoKey = await importKey(b64Key);
  keyCache.set(userId, cryptoKey);
  return cryptoKey;
}

// Aile paylaşımı için: familyId'ye ait şifreleme anahtarını al/oluştur
async function getOrCreateFamilyKey(familyId, adminUserId) {
  const cacheId = `family:${familyId}`;
  if (keyCache.has(cacheId)) return keyCache.get(cacheId);

  const familyRef = doc(db, 'families', familyId);
  const snap = await getDoc(familyRef);
  let b64Key = snap.exists() ? snap.data().encKey : null;

  if (!b64Key) {
    // Sadece admin oluştururken bu yola girer
    const newKey = await generateKey();
    b64Key = await exportKey(newKey);
    await updateDoc(familyRef, { encKey: b64Key });
  }

  const cryptoKey = await importKey(b64Key);
  keyCache.set(cacheId, cryptoKey);
  return cryptoKey;
}

export function clearKeyCache() {
  keyCache.clear();
}

// ── Public API ────────────────────────────────────────────────────────────────

export const EncryptionService = {
  // İlaç nesnesini Firestore'a yazmadan önce şifrele
  async encrypt(medicine, userId) {
    const familyId = medicine.familyId || null;
    const key = familyId
      ? await getOrCreateFamilyKey(familyId, userId)
      : await getOrCreateUserKey(userId);

    const result = { ...medicine };
    for (const field of ENCRYPTED_FIELDS) {
      if (result[field]) result[field] = await encryptField(result[field], key);
    }
    return result;
  },

  // Firestore'dan okunan ilaç nesnesini çöz
  async decrypt(medicine, userId) {
    const familyId = medicine.familyId || null;

    let key;
    try {
      key = familyId
        ? await getOrCreateFamilyKey(familyId, userId)
        : await getOrCreateUserKey(userId);
    } catch {
      // Anahtar erişimi yoksa (başkasının ailesi vb.) ham veriyi dön
      return medicine;
    }

    const result = { ...medicine };
    for (const field of ENCRYPTED_FIELDS) {
      if (result[field]) result[field] = await decryptField(result[field], key);
    }
    return result;
  },

  // Toplu çözme — getAllMedicines için
  async decryptAll(medicines, userId) {
    return Promise.all(medicines.map(m => this.decrypt(m, userId)));
  },

  isEncrypted(medicine) {
    return ENCRYPTED_FIELDS.some(f => typeof medicine[f] === 'string' && medicine[f].startsWith(ENC_PREFIX));
  },
};
