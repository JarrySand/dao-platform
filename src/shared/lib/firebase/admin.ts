// firebase-admin is not in package.json dependencies.
// This module provides a placeholder until firebase-admin is installed.
//
// To enable server-side Firebase Admin functionality:
//   npm install firebase-admin
// Then replace this file with a real initialization using
// FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
// and FIREBASE_ADMIN_PRIVATE_KEY environment variables.

const ADMIN_WARNING =
  'firebase-admin is not installed. Server-side Firebase operations are unavailable. ' +
  'Run `npm install firebase-admin` to enable them.';

export function getAdminApp(): never {
  throw new Error(ADMIN_WARNING);
}

export function getAdminFirestore(): never {
  throw new Error(ADMIN_WARNING);
}

export function getAdminAuth(): never {
  throw new Error(ADMIN_WARNING);
}
