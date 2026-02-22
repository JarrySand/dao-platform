const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');
require('dotenv').config();

const SCHEMA_REGISTRY_ADDRESS = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

const SCHEMAS = {
  daoMain: {
    schema: 'string daoName, string description, string adminAddress',
    resolverAddress: '0x0000000000000000000000000000000000000000',
    revocable: true,
  },
  documentV1: {
    schema:
      'bytes32 daoAttestationUID, string documentTitle, string documentType, bytes32 documentHash, string ipfsCid',
    resolverAddress: '0x0000000000000000000000000000000000000000',
    revocable: true,
    note: 'Read-only. Already deployed.',
  },
  documentV2: {
    schema:
      'bytes32 daoAttestationUID, string documentTitle, string documentType, bytes32 documentHash, string ipfsCid, string version, bytes32 previousVersionId, bytes32 votingTxHash, uint256 votingChainId',
    resolverAddress: '0x0000000000000000000000000000000000000000',
    revocable: true,
  },
};

async function deploySchema(schemaName) {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('Error: DEPLOYER_PRIVATE_KEY is not set in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  );
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
  schemaRegistry.connect(signer);

  const schema = SCHEMAS[schemaName];
  if (!schema) {
    console.error(`Unknown schema: ${schemaName}`);
    console.log(`Available schemas: ${Object.keys(SCHEMAS).join(', ')}`);
    process.exit(1);
  }

  if (schema.note) {
    console.log(`Note: ${schema.note}`);
  }

  console.log(`\nDeploying schema: ${schemaName}`);
  console.log(`Schema: ${schema.schema}`);
  console.log(`Revocable: ${schema.revocable}`);

  try {
    const tx = await schemaRegistry.register({
      schema: schema.schema,
      resolverAddress: schema.resolverAddress,
      revocable: schema.revocable,
    });

    console.log(`\nTransaction hash: ${tx}`);
    console.log(`\nSchema UID: ${tx}`);
    console.log(`\nView on EAS Explorer: https://sepolia.easscan.org/schema/view/${tx}`);
    console.log(`\nUpdate your .env with:\nNEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID=${tx}`);
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

const schemaName = process.argv[2] || 'documentV2';
deploySchema(schemaName);
