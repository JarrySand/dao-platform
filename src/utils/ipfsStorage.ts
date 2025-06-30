import { NFTStorage } from 'nft.storage';

// NFT.Storage 認証情報（環境変数から取得）- サービス停止中
const NFT_STORAGE_API_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY || '';

// Pinata 認証情報（環境変数から取得）
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';

/**
 * NFT.Storageを使用してファイルをIPFSにアップロードする（サービス停止中）
 */
const uploadViaNFTStorage = async (file: File): Promise<{ ipfsCid: string; ipfsGateway: string; }> => {
  throw new Error('NFT.Storage はサービスを停止しています。代替サービスを使用してください。');
};

/**
 * Pinataを使用してファイルをIPFSにアップロードする
 */
const uploadViaPinata = async (file: File): Promise<{ ipfsCid: string; ipfsGateway: string; }> => {
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    throw new Error('Pinata認証情報が設定されていません。環境変数 NEXT_PUBLIC_PINATA_JWT または NEXT_PUBLIC_PINATA_API_KEY/NEXT_PUBLIC_PINATA_SECRET_KEY を設定してください。');
  }

  const formData = new FormData();
  formData.append('file', file);

  // ピン設定（オプション）
  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);

  // メタデータ（オプション）
  const pinataMetadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      size: file.size.toString()
    }
  });
  formData.append('pinataMetadata', pinataMetadata);

  try {
    console.log('📌 Pinataを使用してIPFSアップロード中...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': PINATA_JWT ? `Bearer ${PINATA_JWT}` : ``,
        ...(PINATA_API_KEY && PINATA_SECRET_KEY ? {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        } : {})
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata API error:', errorText);
      
      // 具体的なエラーメッセージを生成
      let errorMessage = 'Pinata IPFSアップロードに失敗しました。';
      if (response.status === 401) {
        errorMessage += ' APIキーが無効です。Pinataの認証情報を確認してください。';
      } else if (response.status === 400) {
        errorMessage += ' リクエストが無効です。ファイル形式やサイズを確認してください。';
      } else if (response.status === 403) {
        errorMessage += ' アクセスが拒否されました。Pinataのプラン制限を確認してください。';
      } else {
        errorMessage += ` サーバーエラー (${response.status}): ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Pinata upload successful:', result);

    return {
      ipfsCid: result.IpfsHash,
      ipfsGateway: 'https://gateway.pinata.cloud'
    };
  } catch (error) {
    console.error('❌ Pinata upload failed:', error);
    throw error;
  }
};

/**
 * ファイルをIPFSにアップロードする
 * @param file アップロードするファイル
 * @returns IPFS CIDとゲートウェイのURL
 * @throws {Error} IPFSアップロードに失敗した場合はエラーを投げる
 */
export const uploadFileToIPFS = async (file: File): Promise<{ 
  ipfsCid: string; 
  ipfsGateway: string; 
}> => {
  console.log('🚀 IPFS upload starting...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  // IPFSアップロードを試行（失敗時はエラーを投げる）
  try {
    // Pinataを最優先で試行
    if (PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY)) {
      return await uploadViaPinata(file);
    }
    
    // 認証情報が設定されていない場合
    throw new Error('IPFS認証情報が設定されていません。Pinata APIキーを設定してください。環境変数: NEXT_PUBLIC_PINATA_JWT または NEXT_PUBLIC_PINATA_API_KEY/NEXT_PUBLIC_PINATA_SECRET_KEY');
    
  } catch (error: any) {
    console.error('❌ IPFS upload failed:', error);
    
    // ユーザーフレンドリーなエラーメッセージを生成
    let userMessage = 'IPFSへのファイルアップロードに失敗しました。';
    
    if (error.message.includes('認証情報が設定されていません') || error.message.includes('APIキーが無効')) {
      userMessage += '\n\n【解決方法】\n1. Pinata APIキーを取得 (https://app.pinata.cloud/)\n2. 環境変数に設定\n3. 開発サーバーを再起動';
    } else if (error.message.includes('ネットワーク') || error.message.includes('fetch')) {
      userMessage += '\n\nネットワーク接続を確認してください。';
    } else if (error.message.includes('サイズ') || error.message.includes('制限')) {
      userMessage += '\n\nファイルサイズまたはPinataの利用制限を確認してください。';
    } else {
      userMessage += `\n\n詳細: ${error.message}`;
    }
    
    // プロセスを中止するためにエラーを再投げ
    throw new Error(userMessage);
  }
};

/**
 * IPFSからファイルを取得するためのURLを生成する
 * @param ipfsCid IPFS CID
 * @param ipfsGateway IPFS ゲートウェイURL
 * @returns ファイルの完全なURL
 */
export const getIPFSFileUrl = (ipfsCid: string, ipfsGateway: string): string => {
  if (!ipfsCid || ipfsCid.startsWith('mock-')) return '';
  
  // ゲートウェイが指定されていない場合はデフォルトを使用
  const gateway = ipfsGateway || 'https://gateway.pinata.cloud';
  
  // CIDからURLを構築
  return `${gateway}/ipfs/${ipfsCid}`;
};

/**
 * IPFSからファイルを取得する
 * @param ipfsCid IPFS CID
 * @param ipfsGateway IPFS ゲートウェイURL
 * @returns 取得したファイルのBlob
 */
export const fetchFromIPFS = async (ipfsCid: string, ipfsGateway: string): Promise<Blob> => {
  try {
    const url = getIPFSFileUrl(ipfsCid, ipfsGateway);
    if (!url) {
      throw new Error('有効なIPFS CIDが指定されていません');
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`IPFSからのファイル取得に失敗しました。ステータス: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw new Error('IPFSからのファイル取得に失敗しました');
  }
}; 