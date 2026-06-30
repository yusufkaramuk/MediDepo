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
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Google girisi iptal edildi');
            }
            throw new Error(getErrorMessage(error.code, 'signin'));
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
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Google doğrulama penceresi kapatıldı.');
            }
            throw new Error('Google ile doğrulama başarısız oldu.');
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
