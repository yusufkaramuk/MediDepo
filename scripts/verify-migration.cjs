/**
 * Compares old and new Firebase projects after migration.
 *
 * Expected service account files:
 *   eski-anahtar.json -> old medidepo project
 *   yeni-anahtar.json -> new drdepo-18481 project
 */
const { initializeApp, cert, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
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

function readServiceAccount(filePath, expectedProjectId, label) {
  const resolved = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} service account dosyası bulunamadı veya erişilemedi.`);
  }

  const serviceAccount = require(resolved);

  if (serviceAccount.project_id !== expectedProjectId) {
    throw new Error(`${label} service account yapılandırması yanlış projeye ait.`);
  }

  return serviceAccount;
}

function initFirebase(name, serviceAccount) {
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  }, name);

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

async function countCollectionRecursive(db, collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  let total = snapshot.size;

  for (const doc of snapshot.docs) {
    const subCollections = await doc.ref.listCollections();
    for (const subCollection of subCollections) {
      total += await countCollectionRecursive(db, `${collectionPath}/${doc.id}/${subCollection.id}`);
    }
  }

  return total;
}

async function sampleUserStats(db) {
  const usersSnap = await db.collection('users').get();
  let medicineDocs = 0;
  let usersWithKeyVault = 0;
  let usersWithMedicines = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (data.keyVault || data.encKey) usersWithKeyVault += 1;

    const medSnap = await db.collection(`users/${userDoc.id}/medicines`).get();
    if (medSnap.size > 0) usersWithMedicines += 1;
    medicineDocs += medSnap.size;
  }

  return {
    userDocs: usersSnap.size,
    usersWithKeyVault,
    usersWithMedicines,
    medicineDocs,
  };
}

async function listAuthUids(auth) {
  const uids = new Set();
  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      uids.add(user.uid);
    }
    pageToken = page.pageToken;
  } while (pageToken);

  return uids;
}

function printCompareRow(label, oldValue, newValue) {
  const diff = newValue - oldValue;
  console.log(label.padEnd(24), String(oldValue).padStart(8), String(newValue).padStart(8), String(diff).padStart(8));
  return diff !== 0;
}

async function main() {
  console.log('Firebase migration verification');
  console.log(`Old project: ${OLD_PROJECT}`);
  console.log(`New project: ${NEW_PROJECT}`);
  console.log('');

  const oldServiceAccount = readServiceAccount(OLD_KEY_PATH, OLD_PROJECT, 'Eski proje');
  const newServiceAccount = readServiceAccount(NEW_KEY_PATH, NEW_PROJECT, 'Yeni proje');
  const oldClient = initFirebase('verify-old', oldServiceAccount);
  const newClient = initFirebase('verify-new', newServiceAccount);

  let hasGap = false;

  try {
    console.log('Firestore document counts');
    console.log('Collection'.padEnd(24), 'Old'.padStart(8), 'New'.padStart(8), 'Diff'.padStart(8));
    console.log('-'.repeat(52));

    for (const collectionId of ROOT_COLLECTIONS) {
      const oldCount = await countCollectionRecursive(oldClient.db, collectionId);
      const newCount = await countCollectionRecursive(newClient.db, collectionId);
      hasGap = printCompareRow(collectionId, oldCount, newCount) || hasGap;
    }

    console.log('');
    console.log('User and medicine summary');
    console.log('Metric'.padEnd(24), 'Old'.padStart(8), 'New'.padStart(8), 'Diff'.padStart(8));
    console.log('-'.repeat(52));

    const oldStats = await sampleUserStats(oldClient.db);
    const newStats = await sampleUserStats(newClient.db);
    for (const key of ['userDocs', 'usersWithKeyVault', 'usersWithMedicines', 'medicineDocs']) {
      hasGap = printCompareRow(key, oldStats[key], newStats[key]) || hasGap;
    }

    console.log('');
    console.log('Firebase Auth UID parity');
    const oldAuthUids = await listAuthUids(oldClient.auth);
    const newAuthUids = await listAuthUids(newClient.auth);
    const missingUids = [...oldAuthUids].filter((uid) => !newAuthUids.has(uid));

    console.log(`Old Auth users : ${oldAuthUids.size}`);
    console.log(`New Auth users : ${newAuthUids.size}`);
    console.log(`Missing UIDs   : ${missingUids.length}`);

    if (missingUids.length > 0) {
      hasGap = true;
      console.log(`First missing UIDs: ${missingUids.slice(0, 10).join(', ')}`);
    }

    if (hasGap) {
      console.log('');
      console.log('Migration verification found differences.');
      process.exit(2);
    }

    console.log('');
    console.log('Migration verification passed.');
  } finally {
    await deleteApp(oldClient.app);
    await deleteApp(newClient.app);
  }
}

main().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
