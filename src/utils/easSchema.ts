/**
 * EAS スキーマ定義とエンコーディングユーティリティ
 * EAS_IMPLEMENTATION.mdの構想に基づく実装
 */

import { SchemaRegistry, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// スキーマUID保存用のglobal変数
export interface SchemaUIDs {
  daoMain: string;
  document: string;
}

// グローバルスキーマUID（プラットフォーム全体で共通使用）
export const GLOBAL_SCHEMA_UIDS = {
  daoMain: '0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1',
  document: '0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152'
} as const;

// スキーマ定義（エンコーディング用）
export const SCHEMA_DEFINITIONS = {
  daoMain: 'string daoUID,string daoName,address adminAddress',
  document: 'bytes32 daoAttestationUID,string documentTitle,bytes32 documentHash,string ipfsCid,string version,bytes32 previousVersionId'
} as const;

// ドキュメントタイプの定義
export const DOCUMENT_TYPES = {
  ARTICLES: '定款',
  MEETING: 'DAO総会規程', 
  TOKEN: 'トークン規程',
  OPERATION: '運営規程',
  OTHER: 'その他'
} as const;

/**
 * DAOメインアテステーションのデータをエンコード
 */
export function encodeDAOMainData(data: {
  daoUID: string;
  daoName: string;
  adminAddress: string;
}) {
  const encoder = new SchemaEncoder(SCHEMA_DEFINITIONS.daoMain);
  
  return encoder.encodeData([
    { name: 'daoUID', value: data.daoUID, type: 'string' },
    { name: 'daoName', value: data.daoName, type: 'string' },
    { name: 'adminAddress', value: data.adminAddress, type: 'address' }
  ]);
}

/**
 * ドキュメントアテステーションのデータをエンコード
 */
export function encodeDocumentData(data: {
  daoAttestationUID: string;
  documentTitle: string;
  documentHash: string;
  ipfsCid: string;
  version: string;
  previousVersionId: string;
}) {
  const encoder = new SchemaEncoder(SCHEMA_DEFINITIONS.document);
  
  return encoder.encodeData([
    { name: 'daoAttestationUID', value: data.daoAttestationUID, type: 'bytes32' },
    { name: 'documentTitle', value: data.documentTitle, type: 'string' },
    { name: 'documentHash', value: data.documentHash, type: 'bytes32' },
    { name: 'ipfsCid', value: data.ipfsCid, type: 'string' },
    { name: 'version', value: data.version, type: 'string' },
    { name: 'previousVersionId', value: data.previousVersionId, type: 'bytes32' }
  ]);
}

/**
 * アテステーションデータからフィールド値を抽出
 */
export function getFieldFromDecodedData(decodedData: any[], fieldName: string): string {
  if (!Array.isArray(decodedData)) {
    return '';
  }

  const field = decodedData.find(item => 
    item && typeof item === 'object' && item.name === fieldName
  );
  
  if (!field) {
    return '';
  }

  // フィールド値の抽出（ネストされた構造に対応）
  let value = field.value;
  
  // 二重ネスト構造の場合（field.value.value）
  if (value && typeof value === 'object' && 'value' in value) {
    value = value.value;
  }
  
  // 文字列に変換
  return String(value || '');
}

/**
 * ドキュメントアテステーションから構造化データを抽出
 */
export function parseDocumentAttestation(attestation: any) {
  const decodedData = attestation.decodedDataJson || [];
  
  return {
    uid: attestation.id || attestation.uid,
    daoAttestationUID: getFieldFromDecodedData(decodedData, 'daoAttestationUID'),
    documentTitle: getFieldFromDecodedData(decodedData, 'documentTitle'),
    documentHash: getFieldFromDecodedData(decodedData, 'documentHash'),
    ipfsCid: getFieldFromDecodedData(decodedData, 'ipfsCid'),
    version: getFieldFromDecodedData(decodedData, 'version'),
    previousVersionId: getFieldFromDecodedData(decodedData, 'previousVersionId'),
    // EAS標準フィールド
    attester: attestation.attester,
    recipient: attestation.recipient,
    time: attestation.time,
    revoked: attestation.revoked,
    // 派生フィールド
    createdAt: new Date(attestation.time * 1000).toISOString(),
    isActive: !attestation.revoked
  };
}

/**
 * DAOアテステーションから構造化データを抽出
 */
export function parseDAOAttestation(attestation: any) {
  const decodedData = attestation.decodedDataJson || [];
  
  return {
    uid: attestation.id || attestation.uid,
    daoUID: getFieldFromDecodedData(decodedData, 'daoUID'),
    daoName: getFieldFromDecodedData(decodedData, 'daoName'),
    adminAddress: getFieldFromDecodedData(decodedData, 'adminAddress'),
    // EAS標準フィールド
    attester: attestation.attester,
    recipient: attestation.recipient,
    time: attestation.time,
    revoked: attestation.revoked,
    // 派生フィールド
    createdAt: new Date(attestation.time * 1000).toISOString(),
    isActive: !attestation.revoked
  };
}

/**
 * ドキュメントの完全なIPFS URLを生成
 */
export function getDocumentIPFSUrl(ipfsCid: string, preferredGateway?: string): string {
  const defaultGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://w3s.link/ipfs/'
  ];
  
  const gateway = preferredGateway || defaultGateways[0];
  return `${gateway}${ipfsCid}`;
}

/**
 * 複数のIPFSゲートウェイでフォールバック取得
 */
export async function fetchFromIPFSWithFallback(ipfsCid: string): Promise<Response> {
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://w3s.link/ipfs/'
  ];
  
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}${ipfsCid}`);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`IPFS gateway ${gateway} failed:`, error);
    }
  }
  
  throw new Error(`All IPFS gateways failed for CID: ${ipfsCid}`);
}

/**
 * グローバルスキーマを登録する
 * @param schemaRegistry SchemaRegistry インスタンス
 * @param signer トランザクションに署名するSigner
 */
export const deployGlobalSchemas = async (
  schemaRegistry: SchemaRegistry,
  signer: ethers.Signer
): Promise<void> => {
  try {
    // 注意: 既にSepoliaテストネットで登録済みなので、この関数は実行する必要はありません
    console.log('スキーマは既に登録されています。UIDs:', GLOBAL_SCHEMA_UIDS);
    
    // 以下のコードは、新しいスキーマを登録する必要がある場合のみコメントを解除してください
    /*
    // DAOメインスキーマの登録
    const daoMainTx = await schemaRegistry.register({
      schema: SCHEMA_DEFINITIONS.daoMain,
      resolverAddress: ethers.ZeroAddress,
      revocable: true,
    });

    const daoMainTxHash = await daoMainTx.wait();
    const daoMainReceipt = await signer.provider?.getTransactionReceipt(daoMainTxHash);
    
    if (daoMainReceipt && daoMainReceipt.logs) {
      const schemaRegisteredLog = daoMainReceipt.logs.find(log => 
        log.topics && log.topics[0] === ethers.id('SchemaRegistered(bytes32,string,address,bool)')
      );
      
      if (schemaRegisteredLog && schemaRegisteredLog.topics.length > 1) {
        GLOBAL_SCHEMA_UIDS.daoMain = schemaRegisteredLog.topics[1];
        console.log('DAO Main Schema registered:', GLOBAL_SCHEMA_UIDS.daoMain);
      }
    }

    // ドキュメントスキーマの登録
    const documentTx = await schemaRegistry.register({
      schema: SCHEMA_DEFINITIONS.document,
      resolverAddress: ethers.ZeroAddress,
      revocable: true,
    });

    const documentTxHash = await documentTx.wait();
    const documentReceipt = await signer.provider?.getTransactionReceipt(documentTxHash);
    
    if (documentReceipt && documentReceipt.logs) {
      const schemaRegisteredLog = documentReceipt.logs.find(log => 
        log.topics && log.topics[0] === ethers.id('SchemaRegistered(bytes32,string,address,bool)')
      );
      
      if (schemaRegisteredLog && schemaRegisteredLog.topics.length > 1) {
        GLOBAL_SCHEMA_UIDS.document = schemaRegisteredLog.topics[1];
        console.log('Document Schema registered:', GLOBAL_SCHEMA_UIDS.document);
      }
    }
    */

    // ローカルストレージに保存（実際のプロダクションでは、サーバーサイドでの保存が適切）
    if (typeof window !== 'undefined') {
      localStorage.setItem('GLOBAL_SCHEMA_UIDS', JSON.stringify(GLOBAL_SCHEMA_UIDS));
    }
  } catch (error) {
    console.error('Error deploying global schemas:', error);
    throw error;
  }
};

/**
 * 保存されているスキーマUIDを読み込む
 */
export const loadSchemaUIDs = (): SchemaUIDs | null => {
  if (typeof window !== 'undefined') {
    const storedSchemaUIDs = localStorage.getItem('GLOBAL_SCHEMA_UIDS');
    if (storedSchemaUIDs) {
      try {
        return JSON.parse(storedSchemaUIDs) as SchemaUIDs;
      } catch (error) {
        console.error('Error parsing stored schema UIDs:', error);
      }
    }
  }
  // ローカルストレージにない場合は、デフォルト値を返す
  return GLOBAL_SCHEMA_UIDS;
};

/**
 * スキーマバージョンの更新時の準備とデータ移行
 * @param schemaRegistry SchemaRegistry インスタンス
 * @param signer トランザクションに署名するSigner
 */
export const upgradeToSchemaV2 = async (
  schemaRegistry: SchemaRegistry,
  signer: ethers.Signer
): Promise<void> => {
  // 将来的にスキーマの更新が必要になった場合のコード
  // 新しいスキーマを登録し、既存のデータを新しいスキーマに移行する
  console.log('Schema upgrade functionality will be implemented in the future');
}; 