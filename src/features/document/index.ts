// types
export type {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentFilters,
  RegisterDocumentFormData,
  VotingDocumentFields,
  DocumentRegistrationProgress,
  DocumentRegistrationResult,
  TransactionInfo,
} from './types';
export { registerDocumentSchema } from './types';

// api
export { fetchDocuments, fetchDocument, registerDocument, revokeDocument } from './api';

// hooks
export {
  useDocuments,
  useDocument,
  useRegisterDocument,
  useRevokeDocument,
  useDocumentVersions,
  useTransactionInfo,
} from './hooks';

// utils
export {
  buildDocumentFromAttestation,
  determineSchemaVersion,
  queryDocumentsByDAO,
  queryDocumentByUID,
  mergeV1V2Documents,
} from './utils';
