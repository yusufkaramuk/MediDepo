import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, deleteField
} from 'firebase/firestore';
import { db } from './FirebaseClient';
import { EncryptionService } from './EncryptionService';

async function getUserFamilyId(userId) {
  console.log('[Family] getUserFamilyId', userId);
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    console.log('[Family] userDoc exists:', snap.exists(), snap.exists() ? snap.data() : null);
    return snap.exists() ? (snap.data().familyId || null) : null;
  } catch (e) {
    console.error('[Family] getUserFamilyId ERROR:', e.code, e.message);
    throw e;
  }
}

async function setUserFamilyId(userId, familyId) {
  console.log('[Family] setUserFamilyId', userId, '->', familyId);
  try {
    await setDoc(doc(db, 'users', userId), { familyId }, { merge: true });
  } catch (e) {
    console.error('[Family] setUserFamilyId ERROR:', e.code, e.message);
    throw e;
  }
}

export const FamilyService = {
  async getMyFamily(userId) {
    console.log('[Family] getMyFamily', userId);
    const familyId = await getUserFamilyId(userId);
    console.log('[Family] familyId =', familyId);
    if (!familyId) return null;
    try {
      const snap = await getDoc(doc(db, 'families', familyId));
      console.log('[Family] familyDoc exists:', snap.exists());
      if (!snap.exists()) { await setUserFamilyId(userId, null); return null; }
      return { id: snap.id, ...snap.data() };
    } catch (e) {
      console.error('[Family] getDoc families ERROR:', e.code, e.message);
      throw e;
    }
  },

  async createFamily(userId, userEmail, displayName, familyName) {
    console.log('[Family] createFamily', userId, familyName);
    try {
      const ref = doc(collection(db, 'families'));
      await setDoc(ref, {
        name: familyName.trim().slice(0, 60),
        createdBy: userId,
        createdAt: new Date().toISOString(),
        members: {
          [userId]: { email: userEmail, displayName: displayName || userEmail, role: 'admin', joinedAt: new Date().toISOString() }
        }
      });
      console.log('[Family] family created:', ref.id);
      await setUserFamilyId(userId, ref.id);
      return ref.id;
    } catch (e) {
      console.error('[Family] createFamily ERROR:', e.code, e.message);
      throw e;
    }
  },

  async inviteMember(familyId, familyName, inviterEmail, invitedEmail) {
    invitedEmail = invitedEmail.trim().toLowerCase();
    console.log('[Family] inviteMember', familyId, invitedEmail);
    try {
      const existing = await getDocs(
        query(collection(db, 'invites'),
          where('familyId', '==', familyId),
          where('invitedEmail', '==', invitedEmail),
          where('status', '==', 'pending'))
      );
      if (!existing.empty) throw new Error('Bu e-postaya zaten bekleyen bir davet var.');
      const ref = doc(collection(db, 'invites'));
      await setDoc(ref, {
        familyId, familyName, invitedEmail,
        invitedBy: inviterEmail,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      console.log('[Family] invite created:', ref.id);
      return ref.id;
    } catch (e) {
      console.error('[Family] inviteMember ERROR:', e.code, e.message);
      throw e;
    }
  },

  async getPendingInvites(userEmail) {
    console.log('[Family] getPendingInvites', userEmail);
    try {
      const snap = await getDocs(
        query(collection(db, 'invites'),
          where('invitedEmail', '==', userEmail.toLowerCase()),
          where('status', '==', 'pending'))
      );
      console.log('[Family] pending invites count:', snap.size);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[Family] getPendingInvites ERROR:', e.code, e.message);
      throw e;
    }
  },

  async acceptInvite(inviteId, userId, userEmail, displayName) {
    console.log('[Family] acceptInvite', inviteId, userId);
    try {
      const inviteRef = doc(db, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) throw new Error('Davet bulunamadı.');
      const invite = inviteSnap.data();
      if (invite.status !== 'pending') throw new Error('Bu davet artık geçerli değil.');
      if (new Date(invite.expiresAt) < new Date()) throw new Error('Davet süresi dolmuş.');
      await updateDoc(doc(db, 'families', invite.familyId), {
        [`members.${userId}`]: { email: userEmail, displayName: displayName || userEmail, role: 'member', joinedAt: new Date().toISOString() }
      });
      await updateDoc(inviteRef, { status: 'accepted' });
      await setUserFamilyId(userId, invite.familyId);
      console.log('[Family] invite accepted, familyId:', invite.familyId);
      return invite.familyId;
    } catch (e) {
      console.error('[Family] acceptInvite ERROR:', e.code, e.message);
      throw e;
    }
  },

  async rejectInvite(inviteId) {
    await updateDoc(doc(db, 'invites', inviteId), { status: 'rejected' });
  },

  async removeMember(familyId, targetUserId) {
    await updateDoc(doc(db, 'families', familyId), { [`members.${targetUserId}`]: deleteField() });
    await setUserFamilyId(targetUserId, null);
  },

  async leaveFamily(familyId, userId) {
    await updateDoc(doc(db, 'families', familyId), { [`members.${userId}`]: deleteField() });
    await setUserFamilyId(userId, null);
  },

  async getFamilyMedicines(family, currentUserId) {
    const memberIds = Object.keys(family.members || {});
    const results = await Promise.all(
      memberIds.map(async (uid) => {
        try {
          const snap = await getDocs(collection(db, `users/${uid}/medicines`));
          console.log(`[Family] medicines uid=${uid} count=${snap.size}`);
          const raw = snap.docs
            .filter(d => d.data().isPrivate !== true)
            .map(d => ({ id: d.id, ...d.data() }));
          const decrypted = await EncryptionService.decryptAll(raw, currentUserId);
          return decrypted.map(m => ({
            ...m,
            ownerId: uid,
            ownerName: family.members[uid]?.displayName || family.members[uid]?.email || uid,
            isOwn: uid === currentUserId,
          }));
        } catch (e) {
          console.error(`[Family] medicines uid=${uid} ERROR:`, e.code, e.message);
          return [];
        }
      })
    );
    return results.flat();
  },
};
