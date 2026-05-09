import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './FirebaseClient';
import { normalizeMedicine, normalizeAndValidateMedicine } from './MedicineValidation';

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
            const medicines = [];

            querySnapshot.forEach((snapshotDoc) => {
                medicines.push({
                    id: snapshotDoc.id,
                    ...normalizeMedicine(snapshotDoc.data(), { preserveCreatedAt: true })
                });
            });

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
            const medicineData = normalizeAndValidateMedicine(medicine, {
                preserveCreatedAt: Boolean(medicine?.createdAt)
            });

            console.log('[Firebase] Adding medicine for user:', userId);
            const docRef = await addDoc(userCollection, medicineData);
            console.log('[Firebase] Medicine added with ID:', docRef.id);
            return { id: docRef.id, ...medicineData };
        } catch (error) {
            console.error('[Firebase] Error adding medicine:', error);
            throw error;
        }
    },

    updateMedicine: async (userId, id, updatedData) => {
        try {
            const cleanData = normalizeAndValidateMedicine(updatedData, {
                preserveCreatedAt: Boolean(updatedData?.createdAt)
            });

            const medicineRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, id);
            await updateDoc(medicineRef, cleanData);
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
        const unsubscribe = onSnapshot(userCollection, (snapshot) => {
            const medicines = [];

            snapshot.forEach((snapshotDoc) => {
                medicines.push({
                    id: snapshotDoc.id,
                    ...normalizeMedicine(snapshotDoc.data(), { preserveCreatedAt: true })
                });
            });

            console.log('[Firebase] Real-time update:', medicines.length, 'medicines');
            callback(medicines);
        });

        return unsubscribe;
    }
};
