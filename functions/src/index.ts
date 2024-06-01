import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import { onCall } from 'firebase-functions/v2/https';
import { HttpsError, beforeUserCreated } from 'firebase-functions/v2/identity';

initializeApp();
const DOMAIN = '@berkeley.edu';
const COL_USERS = 'users';
const ROLE_ADMIN = 'ADMIN';
const ROLE_STUDENT = 'STUDENT';
const ADMIN = 'victor.korir';

// Check authorization & create user
export const onCreate = beforeUserCreated(async (event) => {
  const email = event.data.email;
  const uid = event.data.uid;
  const name = event.data.displayName;

  info(`creating user uid:${uid}, email:${email}`);

  if (!email) {
    error('invalid email');
    throw new HttpsError('invalid-argument', 'Invalid email argument');
  }
  if (!email.includes(DOMAIN)) {
    error('Non berkeley domain account ');
    throw new HttpsError('permission-denied', 'User your berkeley email');
  }
  const authorized = await getFirestore()
    .collection(COL_USERS)
    .doc(email)
    .get();
  if (!authorized.exists) {
    warn('user not authorized, or already registered');
    throw new HttpsError('not-found', 'User not authorized');
  }

  // clean up stale docs of same email
  info('cleaning up stale docs');
  const snapshot = await getFirestore()
    .collection(COL_USERS)
    .where('email', '==', email)
    .get();
  snapshot.forEach((snapshot) => snapshot.ref.delete());

  // create user from admin provided attributes
  const ref = getFirestore().collection(COL_USERS).doc(uid);
  await ref.set({
    name,
    email,
    createdAt: Date.now(),
    accessCount: 0,
    ...authorized.data(),
  });

  info('user created successfully');
});

// Update user claims
export const setClaims = onCall(async (request) => {
  const uid = request.auth?.uid;
  const targetUser = request.data.uid;

  info('setting custom claims for ', uid);

  try {
    if (!uid || !targetUser) throw new Error('invalid uid');

    const ref = getFirestore().collection(COL_USERS).doc(targetUser);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new Error('user does not exist.');

    let claims: object | null = null;
    const data = snapshot.data();
    if (data && data.email === `${ADMIN}@${DOMAIN}`) return;
    if (data && data.role == ROLE_ADMIN) {
      claims = { admin: true };
    } else if (data && data.role == ROLE_STUDENT) {
      claims = { student: true };
    }
    await getAuth().setCustomUserClaims(targetUser, claims);

    info('custom claims set successfully with role ', data?.role);
  } catch (e) {
    error('set claims failed', e);
  }
});

export const delUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  const targetUser = request.data.uid;
  info('deleting user of id:', targetUser);
  try {
    if (!uid) throw new Error('user not authenticated');
    if (!targetUser) throw new Error('invalid user id provided');
    const ref = getFirestore().collection(COL_USERS).doc(targetUser);
    const snapshot = await ref.get();
    const data = snapshot.data();
    if (data && data.email === `${ADMIN}@${DOMAIN}`) return;
    await ref.delete();
    await getAuth().deleteUser(targetUser);
    info('user deleted successfully');
  } catch (e) {
    error('delete user failed', e);
  }
});
