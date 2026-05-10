import fs from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';

const PROJECT_ID = 'ilac-stok-takip';
const RULES = fs.readFileSync('firestore.rules', 'utf8');
const FIRESTORE_EMULATOR_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT || 8080);

let testEnv;

const validMedicine = (overrides = {}) => ({
    name: 'Parol',
    quantity: '1 kutu',
    expiryDate: '2027-05',
    activeIngredient1: 'Parasetamol',
    activeIngredient2: '',
    activeIngredient3: '',
    notes: 'Tok karnina',
    tags: [],
    createdAt: '2026-05-09T10:00:00.000Z',
    ...overrides
});

const medicineRef = (db, userId = 'user-a', medicineId = 'medicine-a') => (
    doc(db, `users/${userId}/medicines/${medicineId}`)
);

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            host: '127.0.0.1',
            port: FIRESTORE_EMULATOR_PORT,
            rules: RULES
        }
    });
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

afterAll(async () => {
    await testEnv.cleanup();
});

describe('Firestore medicine rules', () => {
    it('allows a user to create and read their own medicine', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const ref = medicineRef(db);

        await assertSucceeds(setDoc(ref, validMedicine()));
        await assertSucceeds(getDoc(ref));
    });

    it('blocks access to another user medicine', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(medicineRef(context.firestore()), validMedicine());
        });

        const otherDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(getDoc(medicineRef(otherDb, 'user-a')));
    });

    it('rejects extra fields and missing required name', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();

        await assertFails(setDoc(medicineRef(db, 'user-a', 'extra'), validMedicine({ role: 'admin' })));
        await assertFails(setDoc(medicineRef(db, 'user-a', 'missing-name'), validMedicine({ name: '' })));
    });

    it('rejects overlong strings and invalid expiry date', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();

        await assertFails(setDoc(medicineRef(db, 'user-a', 'long-name'), validMedicine({ name: 'a'.repeat(121) })));
        await assertFails(setDoc(medicineRef(db, 'user-a', 'bad-date'), validMedicine({ expiryDate: '2027-99' })));
    });

    it('prevents createdAt changes after create', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const ref = medicineRef(db);

        await assertSucceeds(setDoc(ref, validMedicine()));
        await assertFails(updateDoc(ref, validMedicine({ createdAt: '2026-05-10T10:00:00.000Z' })));
        await assertSucceeds(updateDoc(ref, validMedicine({ name: 'Parol Plus' })));
    });

    it('allows owner delete and blocks anonymous writes', async () => {
        const ownerDb = testEnv.authenticatedContext('user-a').firestore();
        const anonDb = testEnv.unauthenticatedContext().firestore();
        const ref = medicineRef(ownerDb);

        await assertSucceeds(setDoc(ref, validMedicine()));
        await assertSucceeds(deleteDoc(ref));
        await assertFails(setDoc(medicineRef(anonDb), validMedicine()));
    });
});
