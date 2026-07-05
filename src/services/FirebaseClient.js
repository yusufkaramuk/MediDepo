import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

console.info('[FirebaseClient] Firebase app initialized', {
  projectId: app.options.projectId,
  authDomain: app.options.authDomain,
  storageBucket: app.options.storageBucket,
  currentOrigin: window.location.origin
});

export const auth = getAuth(app);

// Offline persistence — yeni API
let db;
try {
  db = initializeFirestore(app, {
    cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  db = getFirestore(app);
}
export { db };

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
const shouldUseAppCheck = import.meta.env.VITE_ENABLE_APP_CHECK === 'true' &&
    import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true' &&
    Boolean(appCheckSiteKey);

export const appCheck = shouldUseAppCheck
    ? initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
    })
    : null;

export { app };
