import { initializeApp, getApps, getApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const REQUIRED_ENV_KEYS = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId'
];

const isMissingFirebaseValue = (value) => {
    if (!value || typeof value !== 'string') return true;
    return value.startsWith('your_') || value.includes('your_project_id');
};

const missingFirebaseKeys = REQUIRED_ENV_KEYS.filter((key) => isMissingFirebaseValue(firebaseConfig[key]));
const isFirebaseConfigured = missingFirebaseKeys.length === 0;

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
    // Singleton pattern: yalnızca bir kez başlat
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    setPersistence(auth, browserLocalPersistence).catch((error) => {
        if (import.meta.env.DEV) {
            console.error('[Firebase] Auth persistence ayarlanamadı:', error.code);
        }
    });
} else if (import.meta.env.DEV) {
    console.warn('[Firebase] Eksik veya geçersiz env değerleri:', missingFirebaseKeys);
}

const getFirebaseConfigMessage = () => {
    if (isFirebaseConfigured) return null;
    return `.env dosyasında şu Firebase değerleri eksik veya placeholder: ${missingFirebaseKeys.join(', ')}`;
};

const assertFirebaseConfigured = () => {
    if (!isFirebaseConfigured) {
        throw new Error(getFirebaseConfigMessage());
    }
};

export {
    app,
    auth,
    db,
    assertFirebaseConfigured,
    getFirebaseConfigMessage,
    isFirebaseConfigured,
    missingFirebaseKeys
};
