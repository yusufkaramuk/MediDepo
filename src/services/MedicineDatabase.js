// TITCK ilaç veritabanı — stale-while-revalidate stratejisi
// Veri kaynağı: /medicines.json (GitHub Actions tarafından haftalık güncellenir)

const DB_NAME = 'ilac-titck-db';
const STORE_NAME = 'medicines';
const META_STORE = 'meta';
const DATA_URL = '/medicines.json';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

let dbPromise = null;
let fetchPromise = null; // devam eden fetch varsa bekle

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'Barkod' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function getMeta(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function setMeta(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function bulkPut(db, records) {
  // 2000'lik parçalar halinde yaz — mobil IndexedDB transaction timeout'unu önler
  const CHUNK = 2000;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      chunk.forEach(r => store.put(r));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
}

async function lookupOne(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function lookupByBarcode(db, barcode) {
  const raw = String(barcode || '').trim();
  if (!raw) return null;
  const candidates = [...new Set([
    raw,
    raw.replace(/\D/g, ''),
    Number(raw.replace(/\D/g, '')),
  ].filter(v => v !== '' && !Number.isNaN(v)))];

  for (const candidate of candidates) {
    const found = await lookupOne(db, candidate);
    if (found) return found;
  }
  return null;
}

async function getCount(db) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

async function fetchAndStore(db) {
  console.log('[MedicineDB] Fetching', DATA_URL);
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} — medicines.json yüklenemedi`);
  const data = await res.json();

  // data: { medicines: [...], updatedAt: "..." } veya düz array
  const records = Array.isArray(data) ? data : (data.medicines || []);
  if (records.length === 0) throw new Error('Boş veri');

  console.log('[MedicineDB] Storing', records.length, 'records');
  await bulkPut(db, records);
  await setMeta(db, 'lastFetch', Date.now());
  await setMeta(db, 'count', records.length);
  console.log('[MedicineDB] Store complete');
  return records.length;
}

export const MedicineDatabase = {
  // Arka planda güncelleme kontrolü (app açılışında çağrılır)
  async syncInBackground() {
    try {
      const db = await openDB();
      const lastFetch = await getMeta(db, 'lastFetch');
      const stale = !lastFetch || (Date.now() - lastFetch > CACHE_TTL_MS);
      const count = await getCount(db);

      if (stale || count === 0) {
        // Promise'i sakla — findByBarcode bekleyebilsin
        fetchPromise = fetchAndStore(db).catch(() => {});
      }
    } catch {
      // IndexedDB veya fetch başarısız, sessizce geç
    }
  },

  // Barkod numarasına göre ilaç ara
  async findByBarcode(barcode) {
    const db = await openDB();
    const count = await getCount(db);

    if (count === 0) {
      if (!fetchPromise) {
        fetchPromise = fetchAndStore(db);
      }
      // 30 saniye timeout — takılırsa hata fırlat
      await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Veritabanı yüklemesi zaman aşımına uğradı (30s)')), 30000)),
      ]);
    }

    return await lookupByBarcode(db, barcode);
  },

  // Veritabanı durumunu döndür
  async getStatus() {
    try {
      const db = await openDB();
      const count = await getCount(db);
      const lastFetch = await getMeta(db, 'lastFetch');
      return {
        count,
        lastFetch: lastFetch ? new Date(lastFetch) : null,
        ready: count > 0,
      };
    } catch {
      return { count: 0, lastFetch: null, ready: false };
    }
  },
};
