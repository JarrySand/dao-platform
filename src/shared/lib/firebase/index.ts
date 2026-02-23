export { app, db } from './client';
export type { FirebaseDAOData, FirebaseDocumentData, SyncMeta } from './types';
export { firestoreToDAO, firestoreToDocument } from './converters';
export {
  COLLECTIONS,
  daosRef,
  documentsRef,
  syncMetaRef,
  daoDocRef,
  documentDocRef,
  syncMetaDocRef,
} from './collections';
