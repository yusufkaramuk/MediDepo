import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './FirebaseClient';
import { normalizeMedicine, normalizeAndValidateMedicine } from './MedicineValidation';
import { EncryptionService } from './EncryptionService';

const COLLECTION_NAME = 'medicines';

const getUserCollection = (userId) => {
    if (!userId) throw new Error('User not authenticated');
    return collection(db, `users/${userId}/${COLLECTION_NAME}`);
};

export const FirebaseService = {
    getAllMedicines: async (userId) => {
        try {
            const userCollection = getUserCollection(userId);
            const querySnapshot = await getDocs(userCollection);
            const raw = [];

            querySnapshot.forEach((snapshotDoc) => {
                raw.push({
                    id: snapshotDoc.id,
                    ...normalizeMedicine(snapshotDoc.data(), { preserveCreatedAt: true })
                });
            });

            const medicines = await EncryptionService.decryptAll(raw, userId);
            console.log(`[Firebase] Loaded ${medicines.length} medicines for user ${userId}`);
            return medicines;
        } catch (error) {
            console.error('[Firebase] Error getting medicines:', error);
            throw error;
        }
    },

    addMedicine: async (userId, medicine) => {
        try {
            const userCollection = getUserCollection(userId);
            const validated = normalizeAndValidateMedicine(medicine, {
                preserveCreatedAt: Boolean(medicine?.createdAt)
            });
            const encrypted = await EncryptionService.encrypt(validated, userId);

            const docRef = await addDoc(userCollection, encrypted);
            console.log('[Firebase] Medicine added:', docRef.id);
            return { id: docRef.id, ...validated };
        } catch (error) {
            console.error('[Firebase] Error adding medicine:', error);
            throw error;
        }
    },

    updateMedicine: async (userId, id, updatedData) => {
        try {
            const validated = normalizeAndValidateMedicine(updatedData, {
                preserveCreatedAt: Boolean(updatedData?.createdAt)
            });
            const encrypted = await EncryptionService.encrypt(validated, userId);

            const medicineRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, id);
            await updateDoc(medicineRef, encrypted);
            console.log('[Firebase] Medicine updated:', id);
        } catch (error) {
            console.error('[Firebase] Error updating medicine:', error);
            throw error;
        }
    },

    deleteMedicine: async (userId, id) => {
        try {
            await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}`, id));
            console.log('[Firebase] Medicine deleted:', id);
        } catch (error) {
            console.error('[Firebase] Error deleting medicine:', error);
            throw error;
        }
    },

    subscribeMedicines: (userId, callback) => {
        const userCollection = getUserCollection(userId);
        const unsubscribe = onSnapshot(userCollection, async (snapshot) => {
            const raw = [];
            snapshot.forEach((snapshotDoc) => {
                raw.push({
                    id: snapshotDoc.id,
                    ...normalizeMedicine(snapshotDoc.data(), { preserveCreatedAt: true })
                });
            });

            const medicines = await EncryptionService.decryptAll(raw, userId);
            console.log('[Firebase] Real-time update:', medicines.length, 'medicines');
            callback(medicines);
        });

        return unsubscribe;
    }
};
