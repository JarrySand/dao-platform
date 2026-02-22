export { EAS_CONTRACT_ADDRESS, getEASInstance, getSignerFromBrowser } from './client';
export {
  encodeDAOData,
  encodeDocumentV1Data,
  encodeDocumentV2Data,
  decodeDAOData,
  decodeDocumentData,
} from './schema';
export { executeEASQuery, executeBatchQuery } from './graphql';
export {
  getDAOByUID,
  getDocumentByUID,
  getDocumentsByDAO,
  getAllDAOs,
  filterByDAOUID,
} from './queries';
export type { SchemaVersion, EASAttestation, DecodedDAOData, DecodedDocumentData } from './types';
