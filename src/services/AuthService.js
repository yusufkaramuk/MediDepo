import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { auth } from './FirebaseClient';

export const AuthService = {
    signUp: async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            console.log('[Auth] User signed up:', userCredential.user.uid);
            return userCredential.user;
        } catch (error) {
            console.error('[Auth] Sign up error:', error);
            throw new Error(getErrorMessage(error.code));
        }
    },

    signIn: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('[Auth] User signed in:', userCredential.user.uid);
            return userCredential.user;
        } catch (error) {
            console.error('[Auth] Sign in error:', error);
            throw new Error(getErrorMessage(error.code, 'signin'));
        }
    },

    signOut: async () => {
        try {
            await signOut(auth);
            console.log('[Auth] User signed out');
        } catch (error) {
            console.error('[Auth] Sign out error:', error);
            throw new Error('Cikis yapilirken hata olustu');
        }
    },

    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('[Auth] Password reset request completed');
        } catch (error) {
            console.error('[Auth] Password reset error:', error);
            throw new Error(getErrorMessage(error.code, 'reset'));
        }
    },

    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),

    getCurrentUser: () => auth.currentUser
};

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
