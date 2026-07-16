import fs from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'drdepo-18481';
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

describe('Firestore family and invite rules', () => {
    const familyRef = (db, familyId = 'family-a') => doc(db, `families/${familyId}`);
    const inviteRef = (db, inviteId = 'invite-a') => doc(db, `invites/${inviteId}`);

    const familyData = (overrides = {}) => ({
        name: 'Karamuk Ailesi',
        createdBy: 'user-a',
        createdAt: '2026-05-09T10:00:00.000Z',
        members: {
            'user-a': {
                email: 'a@example.com',
                displayName: 'User A',
                role: 'admin',
                joinedAt: '2026-05-09T10:00:00.000Z'
            }
        },
        ...overrides
    });

    it('allows only family members to read family PII', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRef(context.firestore()), familyData());
        });

        const adminDb = testEnv.authenticatedContext('user-a').firestore();
        const strangerDb = testEnv.authenticatedContext('user-b').firestore();

        await assertSucceeds(getDoc(familyRef(adminDb)));
        await assertFails(getDoc(familyRef(strangerDb)));
    });

    it('blocks arbitrary invite reads and deletes', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRef(context.firestore()), familyData());
            await setDoc(inviteRef(context.firestore()), {
                type: 'email',
                familyId: 'family-a',
                familyName: 'Karamuk Ailesi',
                invitedEmail: 'b@example.com',
                invitedBy: 'a@example.com',
                createdBy: 'user-a',
                status: 'pending',
                createdAt: '2026-05-09T10:00:00.000Z',
                expiresAt: '2026-06-09T10:00:00.000Z'
            });
        });

        const invitedDb = testEnv.authenticatedContext('user-b', { email: 'b@example.com' }).firestore();
        const strangerDb = testEnv.authenticatedContext('user-c', { email: 'c@example.com' }).firestore();

        await assertSucceeds(getDoc(inviteRef(invitedDb)));
        await assertFails(getDoc(inviteRef(strangerDb)));
        await assertFails(deleteDoc(inviteRef(strangerDb)));
    });

    it('allows only the invited email to list pending email invites', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(inviteRef(context.firestore()), {
                type: 'email',
                familyId: 'family-a',
                familyName: 'Karamuk Ailesi',
                invitedEmail: 'b@example.com',
                invitedBy: 'a@example.com',
                createdBy: 'user-a',
                status: 'pending',
                createdAt: '2026-05-09T10:00:00.000Z',
                expiresAt: '2026-06-09T10:00:00.000Z'
            });
        });

        const invitedDb = testEnv.authenticatedContext('user-b', { email: 'b@example.com' }).firestore();
        const strangerDb = testEnv.authenticatedContext('user-c', { email: 'c@example.com' }).firestore();
        const invitesForB = query(collection(invitedDb, 'invites'), where('invitedEmail', '==', 'b@example.com'), where('status', '==', 'pending'));
        const strangerQuery = query(collection(strangerDb, 'invites'), where('invitedEmail', '==', 'b@example.com'), where('status', '==', 'pending'));

        await assertSucceeds(getDocs(invitesForB));
        await assertFails(getDocs(strangerQuery));
    });

    it('allows QR invite acceptance once and blocks replay', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRef(context.firestore()), familyData());
            await setDoc(inviteRef(context.firestore(), 'qr-a'), {
                type: 'qr',
                familyId: 'family-a',
                familyName: 'Karamuk Ailesi',
                createdBy: 'user-a',
                status: 'pending',
                encryptedFamilyKey: { alg: 'AES-GCM', iv: 'iv', ciphertext: 'cipher' },
                createdAt: '2026-05-09T10:00:00.000Z',
                expiresAt: '2026-06-09T10:00:00.000Z',
                usedBy: null,
                usedAt: null
            });
        });

        const joinerDb = testEnv.authenticatedContext('user-b', { email: 'b@example.com' }).firestore();
        const batch = writeBatch(joinerDb);
        batch.update(familyRef(joinerDb), {
            'members.user-b': {
                email: 'b@example.com',
                displayName: 'User B',
                role: 'member',
                joinedAt: '2026-05-09T10:01:00.000Z',
                inviteId: 'qr-a'
            }
        });
        batch.update(inviteRef(joinerDb, 'qr-a'), {
            status: 'accepted',
            usedBy: 'user-b',
            usedAt: '2026-05-09T10:01:00.000Z'
        });
        await assertSucceeds(batch.commit());

        const replayDb = testEnv.authenticatedContext('user-c', { email: 'c@example.com' }).firestore();
        const replay = writeBatch(replayDb);
        replay.update(familyRef(replayDb), {
            'members.user-c': {
                email: 'c@example.com',
                displayName: 'User C',
                role: 'member',
                joinedAt: '2026-05-09T10:02:00.000Z',
                inviteId: 'qr-a'
            }
        });
        replay.update(inviteRef(replayDb, 'qr-a'), {
            status: 'accepted',
            usedBy: 'user-c',
            usedAt: '2026-05-09T10:02:00.000Z'
        });
        await assertFails(replay.commit());
    });
});

describe('Firestore family rename rules', () => {
    const familyRefFor = (db, familyId = 'family-a') => doc(db, `families/${familyId}`);
    const familyWithRoles = () => ({
        name: 'Karamuk Ailesi',
        createdBy: 'user-a',
        createdAt: '2026-05-09T10:00:00.000Z',
        members: {
            'user-a': { email: 'a@example.com', displayName: 'Admin', role: 'admin', joinedAt: '2026-05-09T10:00:00.000Z' },
            'user-b': { email: 'b@example.com', displayName: 'Editor', role: 'editor', joinedAt: '2026-05-09T10:00:00.000Z' },
            'user-c': { email: 'c@example.com', displayName: 'Member', role: 'member', joinedAt: '2026-05-09T10:00:00.000Z' },
        },
    });

    it('allows admin to rename the family', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const adminDb = testEnv.authenticatedContext('user-a').firestore();
        await assertSucceeds(updateDoc(familyRefFor(adminDb), { name: 'Yeni Aile Adı' }));
    });

    it('allows editor to rename the family', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const editorDb = testEnv.authenticatedContext('user-b').firestore();
        await assertSucceeds(updateDoc(familyRefFor(editorDb), { name: 'Editörün Verdiği Ad' }));
    });

    it('blocks a plain member from renaming the family', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const memberDb = testEnv.authenticatedContext('user-c').firestore();
        await assertFails(updateDoc(familyRefFor(memberDb), { name: 'Üyenin Denemesi' }));
    });

    it('blocks a stranger (non-member) from renaming the family', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const strangerDb = testEnv.authenticatedContext('user-d').firestore();
        await assertFails(updateDoc(familyRefFor(strangerDb), { name: 'Yabancı' }));
    });

    // Not: Admin, aile dokümanı üzerinde zaten tam yönetim yetkisine sahiptir
    // (isFamilyAdmin branch'i: rol/üye/ad hepsi). validFamilyNameUpdate'in
    // "yalnız name" ve "1-60 karakter" kısıtlamaları EDITOR rolüne uygulanır;
    // aşağıdaki kısıt testleri bu yüzden editor (user-b) ile yapılır.
    it('blocks editor from touching other fields while renaming', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const editorDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(updateDoc(familyRefFor(editorDb), { name: 'Yeni Ad', createdBy: 'user-x' }));
        await assertFails(updateDoc(familyRefFor(editorDb), { name: 'Yeni Ad', 'members.user-c.role': 'editor' }));
    });

    it('blocks editor from setting an empty or oversized name; 60 chars allowed', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const editorDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(updateDoc(familyRefFor(editorDb), { name: '' }));
        await assertFails(updateDoc(familyRefFor(editorDb), { name: 'x'.repeat(61) }));
        await assertSucceeds(updateDoc(familyRefFor(editorDb), { name: 'x'.repeat(60) }));
    });
});

describe('Firestore account deletion job rules', () => {
    it('blocks client reads and writes to accountDeletionJobs', async () => {
        const db = testEnv.authenticatedContext('user-a', { email: 'a@example.com' }).firestore();
        const jobRef = doc(db, 'accountDeletionJobs/user-a');

        await assertFails(setDoc(jobRef, {
            uid: 'user-a',
            status: 'in_progress',
            startedAt: '2026-05-09T10:00:00.000Z'
        }));
        await assertFails(getDoc(jobRef));
    });
});

describe('Removed reminder and notification-center collections', () => {
    it('blocks client access to retired collections', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const paths = [
            'users/user-a/medicationSchedules/legacy-schedule',
            'users/user-a/reminderDeliveries/legacy-delivery',
            'users/user-a/notifications/legacy-notification'
        ];

        for (const path of paths) {
            const ref = doc(db, path);
            await assertFails(getDoc(ref));
            await assertFails(setDoc(ref, { retired: true }));
        }
    });
});

describe('Firestore push subscription rules (tightened)', () => {
    const validSub = (overrides = {}) => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'pk', auth: 'ak' },
        createdAt: '2026-07-12T08:00:00.000Z',
        userAgent: 'TestUA',
        ...overrides
    });

    it('accepts the existing client subscribe payload', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertSucceeds(setDoc(doc(db, 'users/user-a/pushSubscriptions/sub1'), validSub()));
    });

    it('rejects non-https endpoints, extra fields and foreign writes', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(setDoc(doc(db, 'users/user-a/pushSubscriptions/s2'), validSub({ endpoint: 'http://insecure.example' })));
        await assertFails(setDoc(doc(db, 'users/user-a/pushSubscriptions/s3'), validSub({ evil: true })));
        await assertFails(setDoc(doc(db, 'users/user-a/pushSubscriptions/s4'), validSub({ endpoint: 'https://' + 'x'.repeat(600) })));

        const otherDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(setDoc(doc(otherDb, 'users/user-a/pushSubscriptions/s5'), validSub()));
    });
});
