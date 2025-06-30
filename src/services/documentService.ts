/**
 * ドキュメント登録とアテステーション発行サービス
 * EAS_IMPLEMENTATION.mdの構想に基づく実装
 */

import { ethers } from 'ethers';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { calculateFileHash } from '@/utils/fileHash';
import { uploadFileToIPFS } from '@/utils/ipfsStorage';
import { 
  GLOBAL_SCHEMA_UIDS, 
  encodeDocumentData,
  DOCUMENT_TYPES 
} from '@/utils/easSchema';

// EAS Contract Address (Sepolia)
const EAS_CONTRACT_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';

export interface DocumentRegistrationData {
  daoAttestationUID: string;
  documentTitle: string;
  file: File;
  version?: string;
  previousVersionId?: string;
}

export interface DocumentRegistrationResult {
  attestationUID: string;
  documentHash: string;
  ipfsCid: string;
  transactionHash: string;
  gasUsed?: string;
}

export interface DocumentRegistrationProgress {
  step: 'hashing' | 'uploading' | 'encoding' | 'attesting' | 'confirming' | 'complete';
  message: string;
  progress: number; // 0-100
}

/**
 * ドキュメントを登録してアテステーションを発行
 */
export async function registerDocument(
  data: DocumentRegistrationData,
  onProgress?: (progress: DocumentRegistrationProgress) => void
): Promise<DocumentRegistrationResult> {
  
  const updateProgress = (step: DocumentRegistrationProgress['step'], message: string, progress: number) => {
    onProgress?.({ step, message, progress });
  };

  try {
    // Step 1: ファイルハッシュの計算
    updateProgress('hashing', 'ファイルハッシュを計算中...', 10);
    const hash = await calculateFileHash(data.file);
    const documentHash = `0x${hash}`;
    
    // Step 2: IPFSへのアップロード
    updateProgress('uploading', 'ファイルをIPFSにアップロード中...', 30);
    const { ipfsCid } = await uploadFileToIPFS(data.file);
    
    // Step 3: ウォレット接続とプロバイダー取得
    updateProgress('encoding', 'ウォレットに接続中...', 50);
    if (!window.ethereum) {
      throw new Error('MetaMaskが見つかりません。インストールしてください。');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Step 4: アテステーションデータのエンコード
    updateProgress('encoding', 'アテステーションデータをエンコード中...', 60);
    const encodedData = encodeDocumentData({
      daoAttestationUID: data.daoAttestationUID,
      documentTitle: data.documentTitle,
      documentHash: documentHash,
      ipfsCid: ipfsCid,
      version: data.version || '1.0',
      previousVersionId: data.previousVersionId || '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
    
    // Step 5: EAS接続とアテステーション作成
    updateProgress('attesting', 'アテステーションを作成中...', 70);
    const eas = new EAS(EAS_CONTRACT_ADDRESS);
    eas.connect(signer);
    
    const tx = await eas.attest({
      schema: GLOBAL_SCHEMA_UIDS.document,
      data: {
        recipient: '0x0000000000000000000000000000000000000000',
        expirationTime: BigInt(0),
        revocable: true,
        data: encodedData
      }
    });
    
    // Step 6: トランザクション確認
    updateProgress('confirming', 'トランザクション確認中...', 85);
    const receipt = await tx.wait();
    
    // アテステーションUIDの抽出
    let attestationUID = '';
    if (receipt && typeof receipt === 'object' && 'logs' in receipt) {
      const logs = (receipt as any).logs;
      if (Array.isArray(logs) && logs.length > 0) {
        const firstLog = logs[0];
        if (firstLog && typeof firstLog === 'object' && 'topics' in firstLog) {
          const topics = (firstLog as any).topics;
          if (Array.isArray(topics) && topics.length > 1) {
            attestationUID = topics[1];
          }
        }
      }
    }
    
    // Step 7: 完了
    updateProgress('complete', '登録完了', 100);
    
    return {
      attestationUID,
      documentHash,
      ipfsCid,
      transactionHash: typeof tx === 'object' && 'hash' in tx ? (tx as any).hash : '',
      gasUsed: receipt && typeof receipt === 'object' && 'gasUsed' in receipt ? 
        String((receipt as any).gasUsed) : undefined
    };
    
  } catch (error) {
    console.error('Document registration failed:', error);
    throw error;
  }
}

/**
 * ドキュメントの新しいバージョンを登録
 */
export async function registerDocumentVersion(
  data: Omit<DocumentRegistrationData, 'previousVersionId'> & {
    previousAttestationUID: string;
  },
  onProgress?: (progress: DocumentRegistrationProgress) => void
): Promise<DocumentRegistrationResult> {
  
  // バージョン番号を自動インクリメント
  const currentVersion = data.version || '1.0';
  const versionParts = currentVersion.split('.');
  const majorVersion = parseInt(versionParts[0]) || 1;
  const minorVersion = parseInt(versionParts[1]) || 0;
  const newVersion = `${majorVersion}.${minorVersion + 1}`;
  
  return registerDocument({
    ...data,
    version: newVersion,
    previousVersionId: data.previousAttestationUID
  }, onProgress);
}

/**
 * ドキュメントアテステーションを取り消し
 */
export async function revokeDocument(
  attestationUID: string,
  reason?: string
): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMaskが見つかりません。');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(signer);
  
  const tx = await eas.revoke({
    schema: GLOBAL_SCHEMA_UIDS.document,
    data: {
      uid: attestationUID,
      value: BigInt(0)
    }
  });
  
  const receipt = await tx.wait();
  return typeof tx === 'object' && 'hash' in tx ? (tx as any).hash : '';
}

/**
 * ガス代を事前見積もり
 */
export async function estimateDocumentRegistrationGas(
  data: DocumentRegistrationData
): Promise<{
  estimatedGas: string;
  estimatedCostETH: string;
  estimatedCostUSD?: string;
}> {
  if (!window.ethereum) {
    throw new Error('MetaMaskが見つかりません。');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // ダミーデータでエンコード（ガス見積もり用）
  const encodedData = encodeDocumentData({
    daoAttestationUID: data.daoAttestationUID,
    documentTitle: data.documentTitle,
    documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ipfsCid: 'QmDummyCidForGasEstimation',
    version: data.version || '1.0',
    previousVersionId: data.previousVersionId || '0x0000000000000000000000000000000000000000000000000000000000000000'
  });
  
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(signer);
  
  // 簡易ガス見積もり（実際のアテステーション処理と同等の計算量）
  // 新しいスキーマは6フィールドなので、フィールド数に基づいて見積もり
  const baseGas = 150000; // 基本的なアテステーション処理
  const fieldGas = 6 * 8000; // 6フィールド × フィールドあたりのガス
  const estimatedGas = BigInt(baseGas + fieldGas);
  const gasPrice = await provider.getFeeData();
  
  const estimatedCostWei = estimatedGas * (gasPrice.gasPrice || BigInt(0));
  const estimatedCostETH = ethers.formatEther(estimatedCostWei);
  
  return {
    estimatedGas: estimatedGas.toString(),
    estimatedCostETH,
    // ETH価格は外部APIから取得する必要があります
    estimatedCostUSD: undefined
  };
}

/**
 * 利用可能なドキュメントタイプを取得
 */
export function getDocumentTypes() {
  return Object.values(DOCUMENT_TYPES);
}

/**
 * ドキュメントタイプの検証
 */
export function isValidDocumentType(type: string): boolean {
  return Object.values(DOCUMENT_TYPES).includes(type as any);
} 