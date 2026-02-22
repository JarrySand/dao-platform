export const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io',
    eas: {
      contractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      schemaRegistryAddress: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
      graphqlEndpoint: 'https://sepolia.easscan.org/graphql',
      explorerUrl: 'https://sepolia.easscan.org',
    },
    schemas: {
      dao: {
        uid: '0xaa9dff49b3160487c02971f783f64a7e8b208ff69a58055a9562e8db2106020b',
        schema: 'string daoName, string description, string adminAddress',
      },
      documentV1: {
        uid: '0x1f8f2d7acc06f37c0f9f6ce639931f61d0eb8c5b452c459584edd905b30a239d',
        schema:
          'bytes32 daoAttestationUID, string documentTitle, string documentType, bytes32 documentHash, string ipfsCid',
        readOnly: true,
      },
      documentV2: {
        uid:
          process.env.NEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        schema:
          'bytes32 daoAttestationUID, string documentTitle, string documentType, bytes32 documentHash, string ipfsCid, string version, bytes32 previousVersionId, bytes32 votingTxHash, uint256 votingChainId',
      },
    },
  },
} as const;

export type ChainKey = keyof typeof CHAIN_CONFIG;

export const DEFAULT_CHAIN: ChainKey = 'sepolia';

export function getChainConfig(chain: ChainKey = DEFAULT_CHAIN) {
  return CHAIN_CONFIG[chain];
}

export function getSchemaConfig(chain: ChainKey = DEFAULT_CHAIN) {
  return CHAIN_CONFIG[chain].schemas;
}
