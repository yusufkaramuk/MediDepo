import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'medicines';

export const FirebaseService = {
    // Get all medicines
    getAllMedicines: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const medicines = [];
            querySnapshot.forEach((doc) => {
                medicines.push({ id: doc.id, ...doc.data() });
            });
            console.log(`[Firebase] Loaded ${medicines.length} medicines from Firestore`);
            return medicines;
        } catch (error) {
            console.error('[Firebase] Error getting medicines:', error);
            throw error;
        }
    },

    // Add a medicine
    addMedicine: async (medicine) => {
        try {
            // Ensure we send plain object to Firestore
            const medicineData = {
                name: medicine.name || '',
                quantity: medicine.quantity || '',
                expiryDate: medicine.expiryDate || '',
                activeIngredient1: medicine.activeIngredient1 || '',
                activeIngredient2: medicine.activeIngredient2 || '',
                activeIngredient3: medicine.activeIngredient3 || '',
                notes: medicine.notes || '',
                createdAt: medicine.createdAt || new Date().toISOString()
            };

            console.log('[Firebase] Adding medicine:', medicineData);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), medicineData);
            console.log('[Firebase] Medicine added with ID:', docRef.id);
            return { id: docRef.id, ...medicineData };
        } catch (error) {
            console.error('[Firebase] Error adding medicine:', error);
            throw error;
        }
    },

    // Update a medicine
    updateMedicine: async (id, updatedData) => {
        try {
            // Clean the data to only include updatable fields
            const cleanData = {
                name: updatedData.name || '',
                quantity: updatedData.quantity || '',
                expiryDate: updatedData.expiryDate || '',
                activeIngredient1: updatedData.activeIngredient1 || '',
                activeIngredient2: updatedData.activeIngredient2 || '',
                activeIngredient3: updatedData.activeIngredient3 || '',
                notes: updatedData.notes || ''
            };

            const medicineRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(medicineRef, cleanData);
            console.log('[Firebase] Medicine updated:', id);
        } catch (error) {
            console.error('[Firebase] Error updating medicine:', error);
            throw error;
        }
    },

    // Delete a medicine
    deleteMedicine: async (id) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            console.log('[Firebase] Medicine deleted:', id);
        } catch (error) {
            console.error('[Firebase] Error deleting medicine:', error);
            throw error;
        }
    },

    // Real-time listener for changes
    subscribeMedicines: (callback) => {
        const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
            const medicines = [];
            snapshot.forEach((doc) => {
                medicines.push({ id: doc.id, ...doc.data() });
            });
            console.log('[Firebase] Real-time update:', medicines.length, 'medicines');
            callback(medicines);
        });
        return unsubscribe;
    }
};
