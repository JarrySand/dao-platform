export { app, db, auth } from './client';
export {
  loginWithEmail,
  signupWithEmail,
  resetPassword,
  logout,
  onAuthChange,
  getCurrentUser,
  getIdToken,
} from './auth';
export type { FirebaseDAOData, FirebaseDocumentData } from './types';
