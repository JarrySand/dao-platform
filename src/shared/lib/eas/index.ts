export { EAS_CONTRACT_ADDRESS, getEASInstance, getSignerFromBrowser } from './client';
export {
  encodeDAOData,
  encodeDocumentV2Data,
  encodeDocumentV3Data,
  decodeDAOData,
  decodeDocumentData,
} from './schema';
export { executeEASQuery } from './graphql';
export {
  getDAOByUID,
  getDocumentByUID,
  getDocumentsByDAO,
  getAllDAOs,
  filterByDAOUID,
} from './queries';
export type {
  SchemaVersion,
  EASAttestation,
  EASAttestResult,
  DecodedDAOData,
  DecodedDocumentData,
} from './types';
export { resolveEASTransaction } from './types';
