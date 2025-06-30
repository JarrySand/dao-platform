const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

async function createNewDAOSchema() {
  try {
    // MetaMaskプロバイダーに接続
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Sepolia Schema Registry
      const schemaRegistryAddress = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';
      const schemaRegistry = new SchemaRegistry(schemaRegistryAddress);
      schemaRegistry.connect(signer);
      
      // 新しいスキーマを登録
      const schema = 'string daoID,string daoName,string description,address adminAddress,uint256 foundingDate';
      const resolverAddress = '0x0000000000000000000000000000000000000000'; // リゾルバーなし
      const revocable = true;
      
      console.log('Creating new DAO schema...');
      console.log('Schema definition:', schema);
      
      const transaction = await schemaRegistry.register({
        schema,
        resolverAddress,
        revocable
      });
      
      console.log('Transaction submitted:', transaction);
      const receipt = await transaction.wait();
      console.log('Schema created successfully!');
      console.log('Transaction receipt:', receipt);
      
      // 新しいスキーマUIDを取得
      // receiptからスキーマUIDを抽出する必要があります
      console.log('Please check the transaction on Sepolia EAS Scan to get the new schema UID');
      
    } else {
      console.error('MetaMask not found');
    }
  } catch (error) {
    console.error('Error creating schema:', error);
  }
}

// ブラウザコンソールで実行
console.log('Run createNewDAOSchema() in browser console');
window.createNewDAOSchema = createNewDAOSchema;