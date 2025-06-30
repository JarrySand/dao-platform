// EAS スキーマ登録スクリプト
// Sepolia testnet でDAOプラットフォーム用のスキーマを登録します

const { ethers } = require('ethers');
const { SchemaRegistry } = require('@ethereum-attestation-service/eas-sdk');

// Sepolia testnet の設定
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'; // Infura Project IDを設定
const SCHEMA_REGISTRY_ADDRESS = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

// スキーマ定義
const DAO_SCHEMA = 'string daoId,string daoName,string description,address adminAddress,uint256 foundingDate';
const DOCUMENT_SCHEMA = 'string daoId,bytes32 daoAttestationUID,string documentId,string documentTitle,string documentType,bytes32 documentHash,string ipfsCid,string ipfsGateway,uint256 timestamp,string version,bytes32 previousVersionId,address creatorAddress,string status';

async function registerSchemas() {
  try {
    // プロバイダーとウォレットの設定
    // 注意: 実際の使用時は環境変数から秘密鍵を取得してください
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider); // 秘密鍵を設定
    
    // Schema Registry インスタンスを作成
    const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
    schemaRegistry.connect(wallet);

    console.log('スキーマ登録を開始します...');
    console.log('ウォレットアドレス:', await wallet.getAddress());

    // DAO メインスキーマを登録
    console.log('\n1. DAO メインスキーマを登録中...');
    console.log('スキーマ:', DAO_SCHEMA);
    
    const daoSchemaTx = await schemaRegistry.register({
      schema: DAO_SCHEMA,
      resolverAddress: ethers.ZeroAddress, // リゾルバーなし
      revocable: true
    });

    const daoSchemaReceipt = await daoSchemaTx.wait();
    console.log('✅ DAO スキーマ登録完了');
    console.log('トランザクション:', daoSchemaReceipt.hash);
    
    // スキーマUIDを取得（ログから）
    const daoSchemaUID = daoSchemaReceipt.logs[0].topics[1];
    console.log('🔗 DAO Schema UID:', daoSchemaUID);

    // ドキュメントスキーマを登録
    console.log('\n2. ドキュメントスキーマを登録中...');
    console.log('スキーマ:', DOCUMENT_SCHEMA);
    
    const documentSchemaTx = await schemaRegistry.register({
      schema: DOCUMENT_SCHEMA,
      resolverAddress: ethers.ZeroAddress, // リゾルバーなし
      revocable: true
    });

    const documentSchemaReceipt = await documentSchemaTx.wait();
    console.log('✅ ドキュメントスキーマ登録完了');
    console.log('トランザクション:', documentSchemaReceipt.hash);
    
    // スキーマUIDを取得（ログから）
    const documentSchemaUID = documentSchemaReceipt.logs[0].topics[1];
    console.log('🔗 Document Schema UID:', documentSchemaUID);

    // 環境変数用の設定を出力
    console.log('\n📋 .env.local に追加する設定:');
    console.log('=====================================');
    console.log(`NEXT_PUBLIC_DAO_SCHEMA_UID=${daoSchemaUID}`);
    console.log(`NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=${documentSchemaUID}`);
    console.log(`NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e`);
    console.log(`NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=${SCHEMA_REGISTRY_ADDRESS}`);
    console.log('=====================================');

    console.log('\n🎉 すべてのスキーマ登録が完了しました！');

  } catch (error) {
    console.error('❌ スキーマ登録中にエラーが発生しました:', error);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 ヒント: Sepolia testnet ETHが不足している可能性があります。');
      console.log('Sepolia faucet からテストETHを取得してください:');
      console.log('- https://sepoliafaucet.com/');
      console.log('- https://sepolia-faucet.pk910.de/');
    }
    
    if (error.message.includes('network')) {
      console.log('\n💡 ヒント: RPC URLまたはネットワーク設定を確認してください。');
    }
  }
}

// 使用方法の説明
function showUsage() {
  console.log('🔧 EAS スキーマ登録スクリプト');
  console.log('============================');
  console.log('');
  console.log('このスクリプトを実行する前に:');
  console.log('1. Infura Project ID を取得してください');
  console.log('2. Sepolia testnet ETH を持つウォレットの秘密鍵を準備してください');
  console.log('3. このファイル内の YOUR_INFURA_PROJECT_ID と YOUR_PRIVATE_KEY を実際の値に置き換えてください');
  console.log('');
  console.log('実行方法:');
  console.log('node scripts/setup-schemas.js');
  console.log('');
  console.log('⚠️  注意: 秘密鍵を直接コードに記載するのは危険です。');
  console.log('   実際の本番環境では環境変数を使用してください。');
}

// メイン実行
if (require.main === module) {
  showUsage();
  console.log('\n続行しますか? (実際の値を設定した場合のみ) [y/N]');
  
  // 簡単な確認（実際のスクリプトでは readline を使用することを推奨）
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      registerSchemas().finally(() => rl.close());
    } else {
      console.log('スクリプトを終了します。');
      rl.close();
    }
  });
}

module.exports = { registerSchemas }; 