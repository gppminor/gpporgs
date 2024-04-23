import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import { onCall } from 'firebase-functions/v2/https';
import {
  HttpsError,
  beforeUserCreated,
  beforeUserSignedIn,
} from 'firebase-functions/v2/identity';

initializeApp();
const DOMAIN = '@berkeley.edu';
const COL_USERS = 'users';
const ROLE_ADMIN = 'ADMIN';
const ROLE_STUDENT = 'STUDENT';

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
  // create user from admin provided attributes
  const ref = getFirestore().collection(COL_USERS).doc(uid);
  await ref.set({
    name,
    email,
    createdAt: Date.now(),
    accessCount: 0,
    ...authorized.data(),
  });
  // clean up no-longer needed attributes
  await getFirestore().collection(COL_USERS).doc(email).delete();

  info('user created successfully');
});

// Update login data
export const onSignIn = beforeUserSignedIn(async (event) => {
  const email = event.data.email;
  const uid = event.data.uid;

  info(`signing in user uid:${uid}, email:${email}`);

  if (!email || !uid) {
    error('invalid email or uid');
    throw new HttpsError('invalid-argument', 'Invalid email or uid');
  }

  const ref = getFirestore().collection(COL_USERS).doc(uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    error('user does not exist.');
    throw new HttpsError('not-found', 'User not found');
  }

  const data = snapshot.data();
  ref.update({
    accessCount: data?.accessCount + 1,
    lastAccessAt: Date.now(),
  });

  info('user signed in successfully.');
});

// Update claims
export const setClaims = onCall(async (request) => {
  const uid = request.auth?.uid;

  info(`setting custom claims for ${uid}`);
  if (!uid) {
    error('invalid uid');
    return null;
  }

  const ref = getFirestore().collection(COL_USERS).doc(uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    error('user does not exist.');
    return null;
  }

  const data = snapshot.data();
  let claims: object | null = null;
  if (data && data.role == ROLE_ADMIN) {
    claims = { admin: true };
  } else if (data && data.role == ROLE_STUDENT) {
    claims = { student: true };
  }

  await getAuth().setCustomUserClaims(uid, claims);
  info(`custom claims set successfully with role ${data?.role}`);

  return claims;
});
