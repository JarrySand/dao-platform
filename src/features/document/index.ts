// types
export type {
  Document,
  DocumentType,
  RegulationType,
  OtherDocumentType,
  DocumentStatus,
  DocumentFilters,
  RegisterDocumentFormData,
  ProposalDocumentFields,
  DocumentRegistrationProgress,
  DocumentRegistrationResult,
  TransactionInfo,
} from './types';
export {
  registerDocumentSchema,
  REGULATION_TYPES,
  OTHER_DOCUMENT_TYPES,
  isRegulationType,
  isOtherDocumentType,
} from './types';

// api
export { fetchDocuments, fetchDocument, revokeDocument } from './api';

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
export { buildDocumentFromAttestation } from './utils';
