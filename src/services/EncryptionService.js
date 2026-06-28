import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

async function importInviteKey(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
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

async function encryptKeyMaterialForUser(b64Key, userKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    userKey,
    new TextEncoder().encode(b64Key)
  );
  return {
    alg: 'AES-GCM',
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(cipher)),
  };
}

async function decryptKeyMaterialForUser(envelope, userKey) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(envelope.iv) },
    userKey,
    b64ToBytes(envelope.ciphertext)
  );
  return new TextDecoder().decode(plain);
}

// ── Key storage ───────────────────────────────────────────────────────────────

// In-memory cache — anahtarı her Firestore okumada çekmemek için
const keyCache = new Map();

// ── IndexedDB güvenli anahtar deposu ─────────────────────────────────────────
// Şifreyi hiçbir yere kaydetmiyoruz. Bunun yerine şifreden türetilen CryptoKey
// nesnesini extractable:false olarak IndexedDB'ye yazıyoruz.
// extractable:false → raw key bytes JS tarafından bile okunamaz.
const IDB_NAME = 'enc-key-store';
const IDB_STORE = 'keys';

function openKeyDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function saveEncKey(storeId, b64Key) {
  // extractable: false — raw bytes hiçbir zaman dışa aktarılamaz
  const raw = Uint8Array.from(atob(b64Key), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
  const idb = await openKeyDB();
  await new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(cryptoKey, storeId);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
  idb.close();
  return cryptoKey;
}

async function loadEncKey(storeId) {
  try {
    const idb = await openKeyDB();
    const key = await new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(storeId);
      req.onsuccess = e => resolve(e.target.result ?? null);
      req.onerror = e => reject(e.target.error);
    });
    idb.close();
    return key;
  } catch {
    return null;
  }
}

async function deleteEncKey(storeId) {
  try {
    const idb = await openKeyDB();
    await new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(storeId);
      tx.oncomplete = () => resolve();
      tx.onerror = e => reject(e.target.error);
    });
    idb.close();
  } catch { /* sessizce geç */ }
}

// Parolayı prompt ile al — hiçbir yere kaydetme
function getPassphrase() {
  const passphrase = window.prompt(
    'Verileriniz uçtan uca şifrelenir. Lütfen kurtarma parolanızı girin veya yeni hesap için güçlü bir kurtarma parolası belirleyin. Bu parola unutulursa şifreli veriler kurtarılamaz.'
  );
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Kurtarma parolası en az 8 karakter olmalıdır.');
  }
  return passphrase;
}

async function deriveVaultKey(passphrase, saltB64) {
  const salt = b64ToBytes(saltB64);
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function createKeyVault(b64Key, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const vaultKey = await deriveVaultKey(passphrase, bytesToB64(salt));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    vaultKey,
    new TextEncoder().encode(b64Key)
  );
  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: 250000,
    alg: 'AES-GCM',
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(cipher)),
  };
}

async function openKeyVault(vault, passphrase) {
  const vaultKey = await deriveVaultKey(passphrase, vault.salt);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(vault.iv) },
    vaultKey,
    b64ToBytes(vault.ciphertext)
  );
  return new TextDecoder().decode(plain);
}

// Aynı anda birden fazla çağrının birden fazla prompt açmasını engeller
const pendingKeys = new Map();

async function getOrCreateUserKey(userId) {
  if (keyCache.has(userId)) return keyCache.get(userId);

  // Eş zamanlı çağrılarda tek bir promise'i paylaş
  if (pendingKeys.has(userId)) return pendingKeys.get(userId);

  const promise = (async () => {
    // 1) IndexedDB'de daha önce kaydedilmiş (extractable:false) anahtar var mı?
    const idbKey = await loadEncKey(`user:${userId}`);
    if (idbKey) {
      keyCache.set(userId, idbKey);
      return idbKey;
    }

    // 2) Yok → Firestore'dan vault'u al, parolayla aç
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? snap.data() : {};
    let b64Key = null;

    if (userData.keyVault) {
      b64Key = await openKeyVault(userData.keyVault, getPassphrase());
    } else if (userData.encKey) {
      b64Key = userData.encKey;
      const keyVault = await createKeyVault(b64Key, getPassphrase());
      await setDoc(userRef, { keyVault, encKey: deleteField() }, { merge: true });
    }

    if (!b64Key) {
      const newKey = await generateKey();
      b64Key = await exportKey(newKey);
      const keyVault = await createKeyVault(b64Key, getPassphrase());
      await setDoc(userRef, { keyVault }, { merge: true });
    }

    // 3) Türetilen CryptoKey'i extractable:false ile IndexedDB'ye kaydet
    //    → Şifre hiçbir yerde saklanmaz; raw bytes JS'ten erişilemez
    const cryptoKey = await saveEncKey(`user:${userId}`, b64Key);
    keyCache.set(userId, cryptoKey);
    return cryptoKey;
  })();

  pendingKeys.set(userId, promise);
  try {
    return await promise;
  } finally {
    pendingKeys.delete(userId);
  }
}

// Aile paylaşımı için: familyId'ye ait şifreleme anahtarını al/oluştur
async function getOrCreateFamilyKey(familyId, adminUserId) {
  const cacheId = `family:${familyId}`;
  if (keyCache.has(cacheId)) return keyCache.get(cacheId);

  const familyRef = doc(db, 'families', familyId);
  const snap = await getDoc(familyRef);
  const familyData = snap.exists() ? snap.data() : {};
  const userKey = await getOrCreateUserKey(adminUserId);
  let b64Key = null;

  if (familyData.familyKeyring?.[adminUserId]) {
    b64Key = await decryptKeyMaterialForUser(familyData.familyKeyring[adminUserId], userKey);
  } else if (familyData.encKey) {
    b64Key = familyData.encKey;
    const memberCount = Object.keys(familyData.members || {}).length;
    await updateDoc(familyRef, {
      [`familyKeyring.${adminUserId}`]: await encryptKeyMaterialForUser(b64Key, userKey),
      ...(memberCount <= 1 ? { encKey: deleteField() } : {}),
    });
  }

  if (!b64Key) {
    // Sadece admin oluştururken bu yola girer
    const newKey = await generateKey();
    b64Key = await exportKey(newKey);
    await updateDoc(familyRef, {
      [`familyKeyring.${adminUserId}`]: await encryptKeyMaterialForUser(b64Key, userKey),
    });
  }

  const cryptoKey = await importKey(b64Key);
  keyCache.set(cacheId, cryptoKey);
  return cryptoKey;
}

// Logout — sadece bellek içi cache'i temizle.
// IndexedDB anahtarı kastalı bırakılır: aynı kullanıcı tekrar
// giriş yaptiğında şifre sorulmadan anahtar kullanılır.
export function clearKeyCache() {
  keyCache.clear();
  pendingKeys.clear();
}

// ── Public API ────────────────────────────────────────────────────────────────

export const EncryptionService = {
  async getOrCreateFamilyKeyMaterial(familyId, adminUserId) {
    const key = await getOrCreateFamilyKey(familyId, adminUserId);
    return exportKey(key);
  },

  async cacheFamilyKeyMaterial(familyId, b64Key) {
    const key = await importKey(b64Key);
    keyCache.set(`family:${familyId}`, key);
    return key;
  },

  async storeFamilyKeyForUser(familyId, userId, b64Key) {
    const userKey = await getOrCreateUserKey(userId);
    const envelope = await encryptKeyMaterialForUser(b64Key, userKey);
    await updateDoc(doc(db, 'families', familyId), {
      [`familyKeyring.${userId}`]: envelope,
    });
    await this.cacheFamilyKeyMaterial(familyId, b64Key);
  },

  async createInviteEnvelope(familyKeyB64, inviteSecret) {
    const key = await importInviteKey(inviteSecret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(familyKeyB64);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    return {
      alg: 'AES-GCM',
      iv: bytesToB64(iv),
      ciphertext: bytesToB64(new Uint8Array(cipher)),
    };
  },

  async openInviteEnvelope(envelope, inviteSecret) {
    const key = await importInviteKey(inviteSecret);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(envelope.iv) },
      key,
      b64ToBytes(envelope.ciphertext)
    );
    return new TextDecoder().decode(plain);
  },

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
