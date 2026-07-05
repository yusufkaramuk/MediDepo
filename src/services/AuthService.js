import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    updatePassword as firebaseUpdatePassword,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    EmailAuthProvider
} from 'firebase/auth';
import { auth } from './FirebaseClient';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const logAuthError = (context, error) => {
    console.error(`[AuthService] ${context} failed`, {
        code: error?.code,
        message: error?.message,
        customData: error?.customData,
        authDomain: auth?.app?.options?.authDomain,
        projectId: auth?.app?.options?.projectId,
        currentOrigin: window.location.origin
    });
};

export const AuthService = {
    signUp: async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            await sendEmailVerification(userCredential.user);

            // Kayıt sonrası hemen oturumu kapat — doğrulama zorunlu
            await signOut(auth);

            return { needsVerification: true };
        } catch (error) {
            throw new Error(getErrorMessage(error.code));
        }
    },

    signIn: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                await signOut(auth);
                throw new Error('E-posta adresiniz henuz dogrulanmamis. Lutfen gelen kutunuzu kontrol edin.');
            }

            return userCredential.user;
        } catch (error) {
            if (error.message.includes('dogrulanmamis')) throw error;
            throw new Error(getErrorMessage(error.code, 'signin'));
        }
    },

    signInWithGoogle: async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            return userCredential.user;
        } catch (error) {
            logAuthError('Google sign-in popup', error);
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Google girisi iptal edildi');
            }
            throw new Error(getErrorMessage(error.code, 'googleSignin'));
        }
    },

    resendVerification: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
        } catch (error) {
            throw new Error(getErrorMessage(error.code, 'signin'));
        }
    },

    signOut: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error('Cikis yapilirken hata olustu');
        }
    },

    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            throw new Error(getErrorMessage(error.code, 'reset'));
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        const user = auth.currentUser;
        if (!user) throw new Error('Oturum açık değil');
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await firebaseUpdatePassword(user, newPassword);
        } catch (error) {
            throw new Error(getErrorMessage(error.code, 'updatePassword'));
        }
    },

    reauthenticate: async (email, password) => {
        const user = auth.currentUser;
        if (!user) throw new Error('Oturum açık değil');
        const credential = EmailAuthProvider.credential(email, password);
        try {
            await reauthenticateWithCredential(user, credential);
        } catch (error) {
            throw new Error(getErrorMessage(error.code, 'updatePassword'));
        }
    },

    reauthenticateWithGoogle: async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('Oturum açık değil');
        try {
            await reauthenticateWithPopup(user, googleProvider);
        } catch (error) {
            logAuthError('Google reauthentication popup', error);
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Google doğrulama penceresi kapatıldı.');
            }
            throw new Error(getErrorMessage(error.code, 'googleSignin'));
        }
    },

    sendChangeVerificationEmail: async (email) => {
        const user = auth.currentUser;
        if (!user) throw new Error('Oturum açık değil');
        try {
            await sendEmailVerification(user);
        } catch (error) {
            if (error.code === 'auth/too-many-requests') {
                throw new Error('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.');
            }
            throw new Error('Doğrulama e-postası gönderilemedi.');
        }
    },

    onAuthStateChanged: (callback) => onAuthStateChanged(auth, async (user) => {
        if (user && !isFederatedUser(user) && !user.emailVerified) {
            await signOut(auth);
            callback(null);
            return;
        }
        callback(user);
    }),

    getCurrentUser: () => auth.currentUser
};

const isFederatedUser = (user) => (
    user.providerData?.some(provider => provider.providerId !== 'password')
);

const getErrorMessage = (errorCode, action = 'default') => {
    if (errorCode === 'auth/too-many-requests') {
        return 'Cok fazla deneme. Lutfen daha sonra tekrar deneyin';
    }

    if (action === 'signin') {
        return 'E-posta veya sifre hatali';
    }

    if (action === 'googleSignin') {
        switch (errorCode) {
            case 'auth/unauthorized-domain':
                return 'Bu alan adi Firebase Authentication icin yetkilendirilmemis. Firebase Console > Authentication > Settings > Authorized domains listesinde drdepo.com.tr, drdepo-18481.firebaseapp.com ve drdepo-18481.web.app adreslerini kontrol edin.';
            case 'auth/popup-blocked':
                return 'Tarayici Google giris penceresini engelledi. Pop-up iznini acip tekrar deneyin.';
            case 'auth/popup-closed-by-user':
                return 'Google girisi iptal edildi';
            case 'auth/operation-not-allowed':
                return 'Firebase Console uzerinde Google giris saglayicisi aktif degil.';
            case 'auth/cancelled-popup-request':
                return 'Devam eden Google giris istegi iptal edildi. Lutfen tekrar deneyin.';
            case 'auth/internal-error':
                return 'Google girisi sirasinda dahili hata olustu. Console detaylarinda authDomain, projectId ve CSP hatalarini kontrol edin.';
            default:
                return `Google girisi basarisiz oldu${errorCode ? ` (${errorCode})` : ''}`;
        }
    }

    if (action === 'reset') {
        return 'Sifre sifirlama istegi islenemedi. Lutfen daha sonra tekrar deneyin';
    }

    if (action === 'updatePassword') {
        if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
            return 'Mevcut şifreniz yanlış';
        }
        return 'Şifre güncellenemedi';
    }

    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'Bu e-posta adresi zaten kullaniliyor';
        case 'auth/invalid-email':
            return 'Gecersiz e-posta adresi';
        case 'auth/operation-not-allowed':
            return 'Bu islem su an kullanilamiyor';
        case 'auth/weak-password':
            return 'Sifre cok zayif (en az 6 karakter)';
        case 'auth/user-disabled':
            return 'Bu hesap devre disi birakilmis';
        default:
            return 'Bir hata olustu';
    }
};
