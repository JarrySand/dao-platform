import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './client';

export const COLLECTIONS = {
  DAOS: 'daos',
  DOCUMENTS: 'documents',
  SYNC_META: '_sync_meta',
} as const;

export const daosRef = () => collection(db, COLLECTIONS.DAOS);
export const documentsRef = () => collection(db, COLLECTIONS.DOCUMENTS);
export const syncMetaRef = () => collection(db, COLLECTIONS.SYNC_META);

export const daoDocRef = (id: string) => doc(db, COLLECTIONS.DAOS, id);
export const documentDocRef = (id: string) => doc(db, COLLECTIONS.DOCUMENTS, id);
export const syncMetaDocRef = (id: string) => doc(db, COLLECTIONS.SYNC_META, id);
