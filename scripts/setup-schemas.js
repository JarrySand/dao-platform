const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

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
    note: 'Read-only. Already deployed as 0x1f8f2d7acc06f37c0f9f6ce639931f61d0eb8c5b452c459584edd905b30a239d',
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
    console.error('Error: DEPLOYER_PRIVATE_KEY is not set');
    console.error('Add DEPLOYER_PRIVATE_KEY=0x... to .env.local');
    process.exit(1);
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
  console.log(`RPC: ${rpcUrl}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('Error: No ETH balance. Get Sepolia ETH from a faucet.');
    process.exit(1);
  }

  const schema = SCHEMAS[schemaName];
  if (!schema) {
    console.error(`Unknown schema: ${schemaName}`);
    console.log(`Available: ${Object.keys(SCHEMAS).join(', ')}`);
    process.exit(1);
  }

  if (schema.note) {
    console.log(`Note: ${schema.note}`);
  }

  console.log(`\nDeploying schema: ${schemaName}`);
  console.log(`Schema: ${schema.schema}`);
  console.log(`Revocable: ${schema.revocable}`);

  try {
    const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
    schemaRegistry.connect(signer);

    const tx = await schemaRegistry.register({
      schema: schema.schema,
      resolverAddress: schema.resolverAddress,
      revocable: schema.revocable,
    });

    console.log('\nWaiting for transaction confirmation...');
    const schemaUID = await tx.wait();

    console.log(`\nSchema UID: ${schemaUID}`);
    console.log(`View: https://sepolia.easscan.org/schema/view/${schemaUID}`);
    console.log(`\nUpdate .env.local:\nNEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID=${schemaUID}`);
  } catch (error) {
    console.error('Deployment failed:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Not enough ETH for gas. Get more from a Sepolia faucet.');
    }
    process.exit(1);
  }
}

const schemaName = process.argv[2] || 'documentV2';
deploySchema(schemaName);
