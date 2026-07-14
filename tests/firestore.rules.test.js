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

    it('rejects a rename that also touches other fields', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const adminDb = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(updateDoc(familyRefFor(adminDb), { name: 'Yeni Ad', createdBy: 'user-x' }));
        await assertFails(updateDoc(familyRefFor(adminDb), { name: 'Yeni Ad', 'members.user-c.role': 'editor' }));
    });

    it('rejects an empty or oversized name', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(familyRefFor(context.firestore()), familyWithRoles());
        });
        const adminDb = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(updateDoc(familyRefFor(adminDb), { name: '' }));
        await assertFails(updateDoc(familyRefFor(adminDb), { name: 'x'.repeat(61) }));
        await assertSucceeds(updateDoc(familyRefFor(adminDb), { name: 'x'.repeat(60) }));
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

// ── Hatırlatıcı (medicationSchedules) kuralları ──────────────────────────────

const validSchedule = (overrides = {}) => ({
    medicineId: 'medicine-a',
    enabled: true,
    timezone: 'Europe/Istanbul',
    scheduleTimes: ['08:00', '20:00'],
    daysOfWeek: [1, 2, 3, 4, 5],
    dosePerIntake: 1,
    unitLabel: 'tablet',
    unitsPerPackage: 20,
    remainingUnits: 15,
    refillLeadDays: 7,
    refillReminderEnabled: true,
    medicationReminderEnabled: true,
    snoozeMinutes: 10,
    quietHours: { start: '22:00', end: '07:00' },
    notificationPrivacyMode: 'generic',
    displayLabel: '',
    caregiverEscalationEnabled: false,
    createdAt: '2026-07-12T10:00:00.000Z',
    updatedAt: '2026-07-12T10:00:00.000Z',
    ...overrides
});

const scheduleRef = (db, userId = 'user-a', id = 'medicine-a') => (
    doc(db, `users/${userId}/medicationSchedules/${id}`)
);

describe('Firestore medication schedule rules', () => {
    it('allows the owner to create, read, update and delete their schedule', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const ref = scheduleRef(db);

        await assertSucceeds(setDoc(ref, validSchedule()));
        await assertSucceeds(getDoc(ref));
        await assertSucceeds(setDoc(ref, validSchedule({ remainingUnits: 14, enabled: false })));
        await assertSucceeds(deleteDoc(ref));
    });

    it('blocks another user (even a family member) from reading schedules', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            const admin = context.firestore();
            await setDoc(scheduleRef(admin), validSchedule());
            await setDoc(doc(admin, 'users/user-a'), { familyId: 'fam-1' });
            await setDoc(doc(admin, 'users/user-b'), { familyId: 'fam-1' });
            await setDoc(doc(admin, 'families/fam-1'), {
                name: 'Aile', createdBy: 'user-a',
                members: {
                    'user-a': { role: 'admin' },
                    'user-b': { role: 'member' }
                }
            });
        });

        const otherDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(getDoc(scheduleRef(otherDb, 'user-a')));
        await assertFails(getDocs(collection(otherDb, 'users/user-a/medicationSchedules')));
        await assertFails(setDoc(scheduleRef(otherDb, 'user-a'), validSchedule()));
    });

    it('rejects unexpected fields', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(setDoc(scheduleRef(db), validSchedule({ hacked: true })));
    });

    it('rejects wrong types and out-of-bounds numbers', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(setDoc(scheduleRef(db), validSchedule({ enabled: 'yes' })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ dosePerIntake: 100 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ dosePerIntake: 0 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ remainingUnits: -1 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ remainingUnits: 999999 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ refillLeadDays: 90 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ snoozeMinutes: 1 })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ notificationPrivacyMode: 'loud' })));
    });

    it('rejects oversized lists and strings', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const manyTimes = Array.from({ length: 13 }, (_, i) => `0${i % 10}:00`);
        await assertFails(setDoc(scheduleRef(db), validSchedule({ scheduleTimes: manyTimes })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ daysOfWeek: [0, 1, 2, 3, 4, 5, 6, 0] })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ timezone: 'x'.repeat(80) })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ displayLabel: 'x'.repeat(50) })));
    });

    it('rejects malformed quietHours', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(setDoc(scheduleRef(db), validSchedule({ quietHours: { start: '25:99', end: '07:00' } })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ quietHours: { start: '22:00' } })));
        await assertFails(setDoc(scheduleRef(db), validSchedule({ quietHours: 'gece' })));
        await assertSucceeds(setDoc(scheduleRef(db), validSchedule({ quietHours: null })));
    });
});

describe('Firestore reminder delivery rules', () => {
    it('lets the owner read but never write delivery records', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'users/user-a/reminderDeliveries/slot-1'), {
                scheduleId: 'medicine-a', status: 'sent', sentAt: '2026-07-12T08:00:00.000Z'
            });
        });

        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertSucceeds(getDoc(doc(db, 'users/user-a/reminderDeliveries/slot-1')));
        await assertFails(setDoc(doc(db, 'users/user-a/reminderDeliveries/slot-2'), { status: 'sent' }));
        await assertFails(updateDoc(doc(db, 'users/user-a/reminderDeliveries/slot-1'), { status: 'failed' }));
        await assertFails(deleteDoc(doc(db, 'users/user-a/reminderDeliveries/slot-1')));
    });

    it('blocks other users from reading delivery records', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'users/user-a/reminderDeliveries/slot-1'), { status: 'sent' });
        });
        const otherDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(getDoc(doc(otherDb, 'users/user-a/reminderDeliveries/slot-1')));
    });
});

describe('Firestore in-app notification rules', () => {
    const validNotif = (overrides = {}) => ({
        type: 'intake',
        title: 'İlaç zamanınız geldi',
        body: 'Planlanan ilacınızı almayı unutmayın.',
        read: false,
        createdAt: '2026-07-12T08:00:00.000Z',
        ...overrides
    });

    it('owner can create valid notifications and mark them read', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const ref = doc(db, 'users/user-a/notifications/n1');

        await assertSucceeds(setDoc(ref, validNotif()));
        await assertSucceeds(updateDoc(ref, { read: true }));
        await assertSucceeds(deleteDoc(ref));
    });

    it('update may only touch the read field', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        const ref = doc(db, 'users/user-a/notifications/n1');
        await assertSucceeds(setDoc(ref, validNotif()));
        await assertFails(updateDoc(ref, { title: 'Değişti' }));
        await assertFails(updateDoc(ref, { read: true, body: 'Değişti' }));
        await assertFails(updateDoc(ref, { read: 'evet' }));
    });

    it('rejects invalid type, oversized text and foreign users', async () => {
        const db = testEnv.authenticatedContext('user-a').firestore();
        await assertFails(setDoc(doc(db, 'users/user-a/notifications/n2'), validNotif({ type: 'spam' })));
        await assertFails(setDoc(doc(db, 'users/user-a/notifications/n3'), validNotif({ title: 'x'.repeat(120) })));
        await assertFails(setDoc(doc(db, 'users/user-a/notifications/n4'), validNotif({ extra: 1 })));

        const otherDb = testEnv.authenticatedContext('user-b').firestore();
        await assertFails(getDoc(doc(otherDb, 'users/user-a/notifications/n1')));
        await assertFails(setDoc(doc(otherDb, 'users/user-a/notifications/nx'), validNotif()));
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
