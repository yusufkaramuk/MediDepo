const { initializeApp, cert, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const OLD_PROJECT = process.env.OLD_FIREBASE_PROJECT || 'medidepo';
const NEW_PROJECT = process.env.NEW_FIREBASE_PROJECT || 'drdepo-18481';
const OLD_KEY_PATH = process.env.OLD_FIREBASE_SERVICE_ACCOUNT || './eski-anahtar.json';
const NEW_KEY_PATH = process.env.NEW_FIREBASE_SERVICE_ACCOUNT || './yeni-anahtar.json';
const ROOT_COLLECTIONS = (process.env.FIRESTORE_ROOT_COLLECTIONS || 'users,families,invites,sharedLinks')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_LIMIT = 400;

function readServiceAccount(filePath, expectedProjectId, label) {
  const resolved = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} service account bulunamadı: ${resolved}`);
  }

  const serviceAccount = require(resolved);

  if (serviceAccount.project_id !== expectedProjectId) {
    throw new Error(
      `${label} service account yanlış projeye ait. Beklenen: ${expectedProjectId}, dosyadaki: ${serviceAccount.project_id || 'yok'}`
    );
  }

  return serviceAccount;
}

function initDb(name, serviceAccount) {
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  }, name);

  return {
    app,
    db: getFirestore(app),
  };
}

async function copyCollection(sourceDb, targetDb, collectionPath, totals) {
  const snapshot = await sourceDb.collection(collectionPath).get();
  totals.collections += 1;
  totals.read += snapshot.size;

  if (snapshot.empty) {
    console.log(`- ${collectionPath}: boş`);
    return;
  }

  let batch = targetDb.batch();
  let pending = 0;
  let written = 0;

  for (const sourceDoc of snapshot.docs) {
    const targetRef = targetDb.collection(collectionPath).doc(sourceDoc.id);

    if (!DRY_RUN) {
      batch.set(targetRef, sourceDoc.data());
    }

    pending += 1;
    written += 1;

    if (pending === BATCH_LIMIT) {
      if (!DRY_RUN) await batch.commit();
      batch = targetDb.batch();
      pending = 0;
    }

    const subCollections = await sourceDoc.ref.listCollections();
    for (const subCollection of subCollections) {
      await copyCollection(sourceDb, targetDb, `${collectionPath}/${sourceDoc.id}/${subCollection.id}`, totals);
    }
  }

  if (pending > 0 && !DRY_RUN) {
    await batch.commit();
  }

  totals.written += written;
  console.log(`- ${collectionPath}: ${written} belge${DRY_RUN ? ' yazılacaktı' : ' yazıldı'}`);
}

async function main() {
  console.log('Firebase Firestore aktarımı');
  console.log(`Eski proje : ${OLD_PROJECT}`);
  console.log(`Yeni proje : ${NEW_PROJECT}`);
  console.log(`Mod        : ${DRY_RUN ? 'dry-run (yazma yok)' : 'aktif yazma'}`);
  console.log('');
  console.log('Not: Kullanıcıların eski verilerini görebilmesi için Firebase Auth UID değerleri yeni projede korunmuş olmalıdır.');
  console.log('');

  const oldServiceAccount = readServiceAccount(OLD_KEY_PATH, OLD_PROJECT, 'Eski proje');
  const newServiceAccount = readServiceAccount(NEW_KEY_PATH, NEW_PROJECT, 'Yeni proje');
  const oldClient = initDb('oldApp', oldServiceAccount);
  const newClient = initDb('newApp', newServiceAccount);

  const totals = {
    collections: 0,
    read: 0,
    written: 0,
  };

  try {
    for (const collectionId of ROOT_COLLECTIONS) {
      await copyCollection(oldClient.db, newClient.db, collectionId, totals);
    }

    console.log('');
    console.log(`Koleksiyon yolu: ${totals.collections}`);
    console.log(`Okunan belge   : ${totals.read}`);
    console.log(`${DRY_RUN ? 'Yazılacak belge' : 'Yazılan belge'}: ${totals.written}`);
    console.log(DRY_RUN ? 'Dry-run tamamlandı.' : 'Firestore aktarımı tamamlandı.');
  } finally {
    await deleteApp(oldClient.app);
    await deleteApp(newClient.app);
  }
}

main().catch((err) => {
  console.error('Aktarım başarısız:', err.message);
  process.exit(1);
});
