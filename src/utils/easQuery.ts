// EAS GraphQL クエリのためのユーティリティ
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { GLOBAL_SCHEMA_UIDS } from './easSchema';

// Sepolia testnet EAS GraphQL endpoint
const EAS_GRAPHQL_ENDPOINT = 'https://sepolia.easscan.org/graphql';
const EAS_PROXY_ENDPOINT = '/api/eas-proxy';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface AttestationGraphQL {
  id: string;
  schemaId: string;
  data: string;
  attester: string;
  recipient: string;
  time: number;
  revoked: boolean;
  decodedDataJson: string;
}

interface AttestationsResponse {
  attestations: AttestationGraphQL[];
}

// GraphQL クエリを実行する汎用関数
async function executeGraphQLQuery<T>(query: string, variables?: any): Promise<T> {
  console.log('🔍 EAS GraphQL Query:', {
    query: query.substring(0, 200) + '...',
    variables
  });

  // まず直接のエンドポイントを試す
  try {
    console.log('🔍 Trying direct EAS GraphQL endpoint...');
    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    console.log('🔍 Direct EAS GraphQL Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Direct EAS GraphQL Error Response:', errorText);
      throw new Error(`Direct GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();
    console.log('🔍 Direct EAS GraphQL Result:', result);
    
    if (result.errors) {
      console.error('🔍 Direct EAS GraphQL Errors:', result.errors);
      throw new Error(`Direct GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  } catch (directError) {
    console.warn('🔍 Direct EAS GraphQL failed, trying proxy...', directError);
    
    // 直接のエンドポイントが失敗した場合、プロキシを試す
    try {
      console.log('🔍 Trying proxy EAS GraphQL endpoint...');
      const proxyResponse = await fetch(EAS_PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      console.log('🔍 Proxy EAS GraphQL Response Status:', proxyResponse.status, proxyResponse.statusText);

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error('🔍 Proxy EAS GraphQL Error Response:', errorText);
        throw new Error(`Proxy GraphQL request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
      }

      const result: GraphQLResponse<T> = await proxyResponse.json();
      console.log('🔍 Proxy EAS GraphQL Result:', result);
      
      if (result.errors) {
        console.error('🔍 Proxy EAS GraphQL Errors:', result.errors);
        throw new Error(`Proxy GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      return result.data;
    } catch (proxyError) {
      console.error('🔍 Both direct and proxy EAS GraphQL queries failed:', { directError, proxyError });
      throw proxyError;
    }
  }
}

// スキーマIDで証明書を検索
export async function getAttestationsBySchema(
  schemaId: string, 
  limit: number = 100,
  offset: number = 0
): Promise<AttestationGraphQL[]> {
  const query = `
    query GetAttestationsBySchema($schemaId: String!, $limit: Int!, $offset: Int!) {
      attestations(
        where: { 
          schemaId: { equals: $schemaId }
          revoked: { equals: false }
        }
        orderBy: { time: desc }
        take: $limit
        skip: $offset
      ) {
        id
        schemaId
        data
        attester
        recipient
        time
        revoked
        decodedDataJson
      }
    }
  `;

  const variables = {
    schemaId,
    limit,
    offset,
  };

  const result = await executeGraphQLQuery<AttestationsResponse>(query, variables);
  return result.attestations;
}

// 特定のDAOのドキュメントを取得
export async function getDAODocuments(
  documentSchemaId: string,
  daoId: string
): Promise<AttestationGraphQL[]> {
  // まず全てのドキュメント証明書を取得
  const allDocuments = await getAttestationsBySchema(documentSchemaId);
  
  // daoIdでフィルタリング（デコードされたデータから）
  return allDocuments.filter(attestation => {
    try {
      const decodedData = JSON.parse(attestation.decodedDataJson);
      return decodedData.some((item: any) => 
        item.name === 'daoId' && item.value === daoId
      );
    } catch (error) {
      console.error('Failed to parse decoded data:', error);
      return false;
    }
  });
}

// 全てのDAOを取得
export async function getAllDAOs(daoSchemaId: string): Promise<AttestationGraphQL[]> {
  return getAttestationsBySchema(daoSchemaId);
}

// 特定の証明書を取得
export async function getAttestation(uid: string): Promise<AttestationGraphQL | null> {
  const query = `
    query GetAttestation($uid: String!) {
      attestation(where: { id: $uid }) {
        id
        schemaId
        data
        attester
        recipient
        time
        revoked
        decodedDataJson
      }
    }
  `;

  try {
    const result = await executeGraphQLQuery<{ attestation: AttestationGraphQL }>(query, { uid });
    return result.attestation;
  } catch (error) {
    console.error('Failed to get attestation:', error);
    return null;
  }
}

// デコードされたデータから特定のフィールドを取得
export function getFieldFromDecodedData(decodedDataJson: string, fieldName: string): any {
  try {
    const decodedData = JSON.parse(decodedDataJson);
    const field = decodedData.find((item: any) => item.name === fieldName);
    
    // fieldが見つかった場合
    if (field) {
      // フィールドがオブジェクトで、valueプロパティを持つ場合
      if (field && typeof field === 'object' && field.value !== undefined) {
        let value = field.value;
        
        // valueがさらにオブジェクトで、valueプロパティを持つ場合（二重ネスト対応）
        if (typeof value === 'object' && value !== null && 'value' in value) {
          return value.value;
        }
        
        return value;
      }
      // それ以外の場合はフィールドそのものを返す
      return field;
    }
    return null;
  } catch (error) {
    console.error('Failed to get field from decoded data:', error);
    return null;
  }
}

// ファイルベースデータベースからDAO詳細情報を取得
async function getDAODetailsFromDatabase(daoUID: string, daoName: string): Promise<any> {
  try {
    console.log('Searching database for:', { daoUID, daoName });
    
    // まずdaoUIDで検索
    const response = await fetch(`/api/daos/${daoUID}`);
    if (response.ok) {
      const result = await response.json();
      console.log('Found by daoUID:', result.data);
      return result.data;
    }
    
    // daoUIDで見つからない場合は全DAOを取得してDAO名で検索
    const allResponse = await fetch('/api/daos');
    if (allResponse.ok) {
      const allResult = await allResponse.json();
      const daoDetails = allResult.data.find((dao: any) => dao.name === daoName);
      console.log('Found by daoName:', daoDetails);
      return daoDetails || null;
    }
    
    console.log('DAO not found in database');
    return null;
  } catch (error) {
    console.error('Failed to get DAO details from database:', error);
    return null;
  }
}

// 同期版（フォールバック用）
function getDAODetailsFromLocalStorage(daoUID: string, daoName: string): any {
  try {
    const storedDAOs = JSON.parse(localStorage.getItem('daos') || '[]');
    console.log('Fallback: Searching localStorage for:', { daoUID, daoName });
    
    // daoUIDで検索、見つからない場合はDAO名で検索
    let daoDetails = storedDAOs.find((dao: any) => dao.id === daoUID);
    if (!daoDetails) {
      daoDetails = storedDAOs.find((dao: any) => dao.name === daoName);
    }
    
    console.log('Fallback localStorage result:', daoDetails);
    return daoDetails || null;
  } catch (error) {
    console.error('Failed to get DAO details from localStorage:', error);
    return null;
  }
}

// 証明書データをアプリケーション用のオブジェクトに変換
export async function convertAttestationToDAO(attestation: any) {
  // EasContext.tsから渡されるデータ形式に対応
  const decodedDataJson = typeof attestation.data === 'string' ? attestation.data : JSON.stringify(attestation.data);
  
  try {
    const decodedData = JSON.parse(decodedDataJson);
    
    // 新しいシンプルなスキーマ (daoUID, daoName, adminAddress) に対応
    const daoUID = getFieldFromDecodedData(decodedDataJson, 'daoUID');
    const daoName = getFieldFromDecodedData(decodedDataJson, 'daoName');
    const adminAddress = getFieldFromDecodedData(decodedDataJson, 'adminAddress');
    
    // すべてのフィールドを文字列に変換
    const daoNameStr = typeof daoName === 'string' ? daoName : String(daoName);
    const adminAddressStr = typeof adminAddress === 'string' ? adminAddress : String(adminAddress);
    
    // daoUIDが文字列でない場合の詳細処理
    let daoId: string;
    if (typeof daoUID === 'string') {
      daoId = daoUID;
    } else if (daoUID && typeof daoUID === 'object') {
      // オブジェクトの場合、様々なプロパティから値を取得を試す
      if ('value' in daoUID && daoUID.value) {
        daoId = String(daoUID.value);
      } else if ('name' in daoUID && daoUID.name === 'daoUID' && 'value' in daoUID) {
        daoId = String(daoUID.value);
      } else {
        // 最後の手段として、attestation UIDを使用
        console.warn('Could not extract daoUID, using attestation UID as fallback');
        daoId = attestation.uid || `dao-${Date.now()}`;
      }
    } else if (daoUID) {
      // その他の場合は文字列化を試す
      daoId = String(daoUID);
      // [object Object]になった場合は、attestation UIDを使用
      if (daoId === '[object Object]') {
        console.warn('String conversion resulted in [object Object], using attestation UID as fallback');
        daoId = attestation.uid || `dao-${Date.now()}`;
      }
    } else {
      console.warn('daoUID is null or undefined, using attestation UID as fallback');
      daoId = attestation.uid || `dao-${Date.now()}`;
    }
    

    
    // 必須フィールドがない場合はnullを返す
    if (!daoId || !daoNameStr || !adminAddressStr) {
      console.warn('Missing required fields in attestation:', { daoId, daoName: daoNameStr, adminAddress: adminAddressStr });
      return null;
    }
    
    // データベースから詳細情報を取得（フォールバックでローカルストレージ）
    let localDetails = await getDAODetailsFromDatabase(daoId, daoNameStr);
    if (!localDetails) {
      localDetails = getDAODetailsFromLocalStorage(daoId, daoNameStr);
    }
    
    // EASからドキュメントを取得
    let documents = [];
    try {
      console.log(`Fetching documents for DAO attestation UID: ${attestation.uid}`);
      const documentAttestations = await getDocumentsByDAOAttestationUID(
        GLOBAL_SCHEMA_UIDS.document, // ドキュメントスキーマUID
        attestation.uid,
        adminAddressStr // Admin Addressを渡して検証
      );
      console.log(`Found ${documentAttestations.length} document attestations`);
      
      // ドキュメントアテステーションを変換
      documents = documentAttestations.map(docAttestation => {
        const parsedDoc = convertAttestationToDocument(docAttestation);
        console.log('Converted document:', parsedDoc);
        return parsedDoc;
      }).filter(doc => doc !== null);
      
      console.log(`Successfully converted ${documents.length} documents`);
    } catch (error) {
      console.error('Failed to fetch documents from EAS:', error);
      // フォールバック: ローカルデータからドキュメントを取得
      documents = localDetails?.documents || [];
    }
    
    return {
      id: daoId, // 確実に文字列にする
      name: daoNameStr,
      description: localDetails?.description || 'ブロックチェーン上で管理されるDAO', // ローカルストレージから取得、なければデフォルト
      adminAddress: adminAddressStr,
      foundingDate: localDetails?.createdAt || new Date(attestation.time * 1000).toISOString(), // ローカルストレージから取得、なければアテステーション作成時刻
      attestationUID: attestation.uid,
      createdAt: localDetails?.createdAt || new Date(attestation.time * 1000).toISOString(),
      updatedAt: localDetails?.updatedAt || new Date(attestation.time * 1000).toISOString(),
      status: (localDetails?.status as 'active' | 'inactive') || 'active',
      // ローカルストレージから詳細情報を取得、なければデフォルト値
      logoUrl: localDetails?.logoUrl || 'https://placehold.co/100x100?text=DAO',
      location: localDetails?.location || 'オンライン',
      size: (localDetails?.size as 'small' | 'medium' | 'large') || 'medium',
      website: localDetails?.website || '',
      memberCount: localDetails?.memberCount || 1,
      trustScore: localDetails?.trustScore || 100,
      ownerId: localDetails?.ownerId || adminAddressStr, // ローカルストレージから取得、なければadminAddressを使用
      contactEmail: localDetails?.contactEmail || '',
      contactPerson: localDetails?.contactPerson || '',
      documents: documents // EASから取得したドキュメント、フォールバックでローカルデータ
    };
  } catch (error) {
    console.error('Failed to convert attestation to DAO:', error);
    return null;
  }
}

export function convertAttestationToDocument(attestation: AttestationGraphQL) {
  const decodedDataJson = attestation.decodedDataJson;
  
  // 新しいドキュメントスキーマに対応
  const daoAttestationUID = getFieldFromDecodedData(decodedDataJson, 'daoAttestationUID');
  const documentTitle = getFieldFromDecodedData(decodedDataJson, 'documentTitle');
  const documentHash = getFieldFromDecodedData(decodedDataJson, 'documentHash');
  const ipfsCid = getFieldFromDecodedData(decodedDataJson, 'ipfsCid');
  const version = getFieldFromDecodedData(decodedDataJson, 'version');
  const previousVersionId = getFieldFromDecodedData(decodedDataJson, 'previousVersionId');
  
  // ドキュメントタイトルからタイプを推測
  const inferDocumentType = (title: string): string => {
    console.log(`🏷️ Inferring document type for title: "${title}"`);
    const titleLower = title.toLowerCase();
    
    let inferredType = 'other'; // デフォルト
    
    if (titleLower.includes('定款') || titleLower.includes('articles') || titleLower.includes('constitution')) {
      inferredType = 'articles';
    } else if (titleLower.includes('総会') || titleLower.includes('meeting') || titleLower.includes('assembly')) {
      inferredType = 'meeting';
    } else if (titleLower.includes('トークン') || titleLower.includes('token')) {
      inferredType = 'token';
    } else if (titleLower.includes('運営') || titleLower.includes('operation') || titleLower.includes('governance')) {
      inferredType = 'operation';
    } else if (titleLower.includes('規程') || titleLower.includes('規則') || titleLower.includes('rule')) {
      inferredType = 'operation';
    } else if (titleLower.includes('bylaws') || titleLower.includes('bylaw')) {
      inferredType = 'articles';
    }
    
    console.log(`🏷️ Inferred type: "${inferredType}" for title: "${title}"`);
    return inferredType;
  };
  
  const documentType = inferDocumentType(documentTitle);
  
  const convertedDoc = {
    id: attestation.id,
    daoId: daoAttestationUID, // DAOのアテステーションUIDを使用
    name: documentTitle,
    type: documentType,
    fileUrl: `https://ipfs.io/ipfs/${ipfsCid}`, // デフォルトIPFSゲートウェイを使用
    hash: documentHash,
    version: version || '1.0',
    createdAt: new Date(attestation.time * 1000).toISOString(),
    updatedAt: new Date(attestation.time * 1000).toISOString(),
    status: attestation.revoked ? 'revoked' : 'active',
    ipfsCid: ipfsCid,
    ipfsGateway: 'https://ipfs.io/ipfs/',
    attestationUID: attestation.id,
    previousVersionId: previousVersionId
  };
  
  // Mock IPFS CIDの警告
  if (ipfsCid && ipfsCid.startsWith('mock-')) {
    console.warn(`⚠️ Document ${attestation.id} has mock IPFS CID: ${ipfsCid} (will be filtered out)`);
  }
  
  console.log(`📄 Converted document:`, convertedDoc);
  return convertedDoc;
}

// 特定のDAOに関連するドキュメントを取得（daoAttestationUIDで検索 + Admin Address検証）
export async function getDocumentsByDAOAttestationUID(
  documentSchemaId: string,
  daoAttestationUID: string,
  daoAdminAddress?: string // DAOの管理者アドレス（オプション）
): Promise<AttestationGraphQL[]> {
  console.log(`🔍 Searching documents for DAO UID: ${daoAttestationUID}`);
  if (daoAdminAddress) {
    console.log(`🔐 Admin address filter: ${daoAdminAddress}`);
  }
  
  // まず全てのドキュメント証明書を取得
  const allDocuments = await getAttestationsBySchema(documentSchemaId);
  console.log(`📄 Found ${allDocuments.length} total document attestations`);
  
  // デバッグ用：全ドキュメントの構造を確認
  allDocuments.forEach((attestation, index) => {
    console.log(`📋 Document ${index + 1}:`, {
      id: attestation.id,
      decodedDataJson: attestation.decodedDataJson
    });
    
    try {
      const decodedData = JSON.parse(attestation.decodedDataJson);
      console.log(`📊 Decoded data for document ${index + 1}:`, decodedData);
      
      // 各フィールドをチェック
      decodedData.forEach((item: any, fieldIndex: number) => {
        console.log(`  Field ${fieldIndex}:`, item);
        if (item.name === 'daoAttestationUID') {
          console.log(`  🎯 Found daoAttestationUID field:`, item.value);
          console.log(`  🔍 Looking for: ${daoAttestationUID}`);
          console.log(`  ✅ String match: ${item.value === daoAttestationUID}`);
          
          // Objectの詳細を表示
          console.log(`  📊 Field value type: ${typeof item.value}`);
          console.log(`  📊 Field value JSON:`, JSON.stringify(item.value, null, 2));
          console.log(`  📊 Field value toString:`, String(item.value));
          
          // bytes32形式での比較も試行
          const valueAsString = String(item.value || '');
          const targetAsBytes32 = daoAttestationUID.startsWith('0x') ? daoAttestationUID : `0x${daoAttestationUID}`;
          const valueAsBytes32 = valueAsString.startsWith('0x') ? valueAsString : `0x${valueAsString}`;
          
          console.log(`  🔍 Bytes32 comparison:`, {
            valueAsString,
            targetAsBytes32,
            valueAsBytes32,
            bytes32Match: valueAsBytes32 === targetAsBytes32
          });
        }
      });
    } catch (error) {
      console.error(`❌ Failed to parse decoded data for document ${index + 1}:`, error);
    }
  });
  
  // daoAttestationUIDでフィルタリング（デコードされたデータから） + Admin Address検証
  const matchingDocuments = allDocuments.filter(attestation => {
    try {
      const decodedData = JSON.parse(attestation.decodedDataJson);
      
      // 1. daoAttestationUIDのマッチを確認
      const hasDAOMatch = decodedData.some((item: any) => {
        if (item.name === 'daoAttestationUID') {
          // item.valueがObjectの場合、実際の値はitem.value.valueにある
          const actualValue = (item.value && typeof item.value === 'object' && 'value' in item.value) 
            ? item.value.value 
            : item.value;
          
          const valueAsString = String(actualValue || '');
          
          // 複数の比較パターンを試行
          const patterns = [
            // 直接比較
            actualValue === daoAttestationUID,
            valueAsString === daoAttestationUID,
            
            // bytes32形式での比較
            valueAsString === (daoAttestationUID.startsWith('0x') ? daoAttestationUID : `0x${daoAttestationUID}`),
            (valueAsString.startsWith('0x') ? valueAsString : `0x${valueAsString}`) === daoAttestationUID,
            
            // 0xプレフィックスを除去して比較
            valueAsString.replace('0x', '') === daoAttestationUID.replace('0x', ''),
            
            // 大文字小文字を無視して比較
            valueAsString.toLowerCase() === daoAttestationUID.toLowerCase(),
            valueAsString.toLowerCase().replace('0x', '') === daoAttestationUID.toLowerCase().replace('0x', '')
          ];
          
          const matchFound = patterns.some(pattern => pattern);
          
          if (matchFound) {
            console.log(`✅ Document ${attestation.id} matches DAO ${daoAttestationUID}`, {
              itemValue: item.value,
              actualValue,
              valueAsString,
              daoAttestationUID,
              matchingPatterns: patterns.map((p, i) => ({ pattern: i, match: p })).filter(p => p.match)
            });
          }
          
          return matchFound;
        }
        return false;
      });
      
      // 2. Admin Address検証（指定されている場合のみ）
      if (hasDAOMatch && daoAdminAddress) {
        const attesterMatches = attestation.attester.toLowerCase() === daoAdminAddress.toLowerCase();
        
        if (!attesterMatches) {
          console.log(`❌ Document ${attestation.id} rejected: Attester ${attestation.attester} does not match admin ${daoAdminAddress}`);
          return false;
        }
        
        console.log(`🔐 Document ${attestation.id} authorized: Attester matches admin address`);
      }
      
      // 3. Mock IPFS CID検証（mockデータを除外）
      if (hasDAOMatch) {
        try {
          const decodedData = JSON.parse(attestation.decodedDataJson);
          const ipfsCidField = decodedData.find((item: any) => item.name === 'ipfsCid');
          
          if (ipfsCidField) {
            const actualCid = (ipfsCidField.value && typeof ipfsCidField.value === 'object' && 'value' in ipfsCidField.value) 
              ? ipfsCidField.value.value 
              : ipfsCidField.value;
            
            const cidAsString = String(actualCid || '');
            
            if (cidAsString.startsWith('mock-')) {
              console.log(`🚫 Document ${attestation.id} rejected: Mock IPFS CID detected (${cidAsString})`);
              return false;
            }
            
            console.log(`✅ Document ${attestation.id} has valid IPFS CID: ${cidAsString}`);
          }
        } catch (error) {
          console.error('Failed to check IPFS CID for document:', attestation.id, error);
        }
      }
      
      return hasDAOMatch;
    } catch (error) {
      console.error('Failed to parse decoded data:', error);
      return false;
    }
  });
  
  console.log(`🎯 Found ${matchingDocuments.length} matching documents for DAO ${daoAttestationUID}`);
  return matchingDocuments;
} 