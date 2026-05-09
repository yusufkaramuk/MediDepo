// TITCK ilaç veritabanı — stale-while-revalidate stratejisi
// Veri kaynağı: /medicines.json (GitHub Actions tarafından haftalık güncellenir)

const DB_NAME = 'ilac-titck-db';
const STORE_NAME = 'medicines';
const META_STORE = 'meta';
const DATA_URL = '/medicines.json';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

let dbPromise = null;

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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    records.forEach(r => store.put(r));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function lookupByBarcode(db, barcode) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(Number(barcode));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
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
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // data: { medicines: [...], updatedAt: "..." } veya düz array
  const records = Array.isArray(data) ? data : (data.medicines || []);
  if (records.length === 0) throw new Error('Boş veri');

  await bulkPut(db, records);
  await setMeta(db, 'lastFetch', Date.now());
  await setMeta(db, 'count', records.length);
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
        fetchAndStore(db).catch(() => {}); // fire-and-forget
      }
    } catch {
      // IndexedDB veya fetch başarısız, sessizce geç
    }
  },

  // Barkod numarasına göre ilaç ara
  async findByBarcode(barcode) {
    try {
      const db = await openDB();
      const count = await getCount(db);

      // Veri yoksa önce fetch et
      if (count === 0) {
        await fetchAndStore(db);
      }

      return await lookupByBarcode(db, barcode);
    } catch {
      return null;
    }
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
