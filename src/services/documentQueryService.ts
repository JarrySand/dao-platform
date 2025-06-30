/**
 * ドキュメント検索・クエリサービス
 * 新しい最小限スキーマに対応
 */

import { GLOBAL_SCHEMA_UIDS, parseDocumentAttestation } from '@/utils/easSchema';

// EAS GraphQL Endpoint (Sepolia)
const EAS_GRAPHQL_ENDPOINT = 'https://sepolia.easscan.org/graphql';

export interface DocumentQueryOptions {
  daoAttestationUID?: string;
  documentTitle?: string;
  limit?: number;
  offset?: number;
  includeRevoked?: boolean;
}

export interface DocumentQueryResult {
  documents: any[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * DAO別ドキュメント検索
 */
export async function queryDocumentsByDAO(
  daoAttestationUID: string,
  options: Omit<DocumentQueryOptions, 'daoAttestationUID'> = {},
  daoAdminAddress?: string // DAOの管理者アドレス（オプション）
): Promise<DocumentQueryResult> {
  
  console.log(`[queryDocumentsByDAO] Starting search for DAO: ${daoAttestationUID}`);
  if (daoAdminAddress) {
    console.log(`[queryDocumentsByDAO] Admin address filter: ${daoAdminAddress}`);
  }
  
  // EAS GraphQLスキーマに合わせた正しいクエリ
  const query = `
    query GetDocumentsByDAO($schemaId: StringFilter!, $take: Int, $skip: Int) {
      attestations(
        where: {
          schemaId: $schemaId
        },
        take: $take,
        skip: $skip,
        orderBy: {
          time: desc
        }
      ) {
        id
        attester
        recipient
        time
        revoked
        decodedDataJson
        txid
      }
    }
  `;

  const variables = {
    schemaId: {
      equals: GLOBAL_SCHEMA_UIDS.document
    },
    take: options.limit || 50,
    skip: options.offset || 0
  };

  console.log(`[queryDocumentsByDAO] Query variables:`, variables);
  console.log(`[queryDocumentsByDAO] GraphQL Query:`, query);

  try {
    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    console.log(`[queryDocumentsByDAO] Response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[queryDocumentsByDAO] GraphQL Response Error:', errorText);
      throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('[queryDocumentsByDAO] GraphQL Response:', result);
    
    if (result.errors) {
      console.error('[queryDocumentsByDAO] GraphQL Errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const attestations = result.data?.attestations || [];
    
    console.log(`[queryDocumentsByDAO] Found ${attestations.length} total document attestations`);
    console.log(`[queryDocumentsByDAO] Target DAO UID: ${daoAttestationUID}`);
    
    // アテステーションを解析してドキュメント形式に変換
    const documents = attestations
      .map((attestation: any) => {
        try {
          const parsed = parseDocumentAttestation(attestation);
          console.log(`[queryDocumentsByDAO] Parsed document:`, {
            uid: parsed.uid,
            daoAttestationUID: parsed.daoAttestationUID,
            documentTitle: parsed.documentTitle
          });
          return parsed;
        } catch (error) {
          console.warn('[queryDocumentsByDAO] Failed to parse document attestation:', error);
          return null;
        }
      })
      .filter((doc: any) => doc !== null);

    console.log(`[queryDocumentsByDAO] Successfully parsed ${documents.length} documents`);

    // DAOアテステーションUIDでフィルタリング（クライアント側）
    let filteredDocuments = documents.filter((doc: any) => {
      // daoAttestationUIDが一致するかチェック
      const docDaoUID = doc.daoAttestationUID;
      const targetUID = daoAttestationUID;
      
      // 0xプレフィックスの有無を統一して比較
      const normalizeUID = (uid: string) => {
        if (!uid) return '';
        return uid.startsWith('0x') ? uid.toLowerCase() : `0x${uid}`.toLowerCase();
      };
      
      const normalizedDocUID = normalizeUID(docDaoUID);
      const normalizedTargetUID = normalizeUID(targetUID);
      
      console.log(`[queryDocumentsByDAO] Comparing DAO UIDs:`, {
        document: normalizedDocUID,
        target: normalizedTargetUID,
        match: normalizedDocUID === normalizedTargetUID
      });
      
      return normalizedDocUID === normalizedTargetUID;
    });

    console.log(`[queryDocumentsByDAO] After DAO UID filtering: ${filteredDocuments.length} documents`);

    // Admin Address検証（指定されている場合のみ）
    if (daoAdminAddress) {
      filteredDocuments = filteredDocuments.filter((doc: any) => {
        const attesterMatches = doc.attester.toLowerCase() === daoAdminAddress.toLowerCase();
        
        if (!attesterMatches) {
          console.log(`[queryDocumentsByDAO] Document ${doc.uid} rejected: Attester ${doc.attester} does not match admin ${daoAdminAddress}`);
        } else {
          console.log(`[queryDocumentsByDAO] Document ${doc.uid} authorized: Attester matches admin address`);
        }
        
        return attesterMatches;
      });
      console.log(`[queryDocumentsByDAO] After admin address filtering: ${filteredDocuments.length} documents`);
    }

    // Mock IPFS CID検証（mockデータを除外）
    filteredDocuments = filteredDocuments.filter((doc: any) => {
      const ipfsCid = doc.ipfsCid || '';
      
      if (ipfsCid.startsWith('mock-')) {
        console.log(`[queryDocumentsByDAO] Document ${doc.uid} rejected: Mock IPFS CID detected (${ipfsCid})`);
        return false;
      }
      
      console.log(`[queryDocumentsByDAO] Document ${doc.uid} has valid IPFS CID: ${ipfsCid}`);
      return true;
    });
    console.log(`[queryDocumentsByDAO] After mock CID filtering: ${filteredDocuments.length} documents`);

    // revokedフィルタリング（クライアント側）
    if (!options.includeRevoked) {
      filteredDocuments = filteredDocuments.filter((doc: any) => !doc.revoked);
      console.log(`[queryDocumentsByDAO] After revoked filtering: ${filteredDocuments.length} documents`);
    }

    // タイトルフィルタリング（オプション）
    if (options.documentTitle) {
      filteredDocuments = filteredDocuments.filter((doc: any) => 
        doc.documentTitle.toLowerCase().includes(options.documentTitle!.toLowerCase())
      );
      console.log(`[queryDocumentsByDAO] After title filtering: ${filteredDocuments.length} documents`);
    }

    console.log(`[queryDocumentsByDAO] Final result: ${filteredDocuments.length} documents`);

    return {
      documents: filteredDocuments,
      totalCount: filteredDocuments.length,
      hasMore: attestations.length === (options.limit || 50)
    };

  } catch (error) {
    console.error('[queryDocumentsByDAO] Document query failed:', error);
    return {
      documents: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

/**
 * 全ドキュメント検索
 */
export async function queryAllDocuments(
  options: DocumentQueryOptions = {}
): Promise<DocumentQueryResult> {
  
  const query = `
    query GetAllDocuments($schemaId: String!, $first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!, $revoked: Boolean) {
      attestations(
        where: {
          schemaId: $schemaId,
          revoked: $revoked
        },
        first: $first,
        skip: $skip,
        orderBy: $orderBy,
        orderDirection: $orderDirection
      ) {
        id
        attester
        recipient
        time
        revoked
        decodedDataJson
        txid
      }
    }
  `;

  const variables = {
    schemaId: GLOBAL_SCHEMA_UIDS.document,
    first: options.limit || 50,
    skip: options.offset || 0,
    orderBy: 'time',
    orderDirection: 'desc',
    revoked: options.includeRevoked ? null : false
  };

  try {
    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const attestations = result.data?.attestations || [];
    
    // アテステーションを解析してドキュメント形式に変換
    const documents = attestations
      .map((attestation: any) => {
        try {
          return parseDocumentAttestation(attestation);
        } catch (error) {
          console.warn('Failed to parse document attestation:', error);
          return null;
        }
      })
      .filter((doc: any) => doc !== null);

    // フィルタリング
    let filteredDocuments = documents;
    
    if (options.daoAttestationUID) {
      filteredDocuments = filteredDocuments.filter((doc: any) => 
        doc.daoAttestationUID === options.daoAttestationUID
      );
    }
    
    if (options.documentTitle) {
      filteredDocuments = filteredDocuments.filter((doc: any) => 
        doc.documentTitle.toLowerCase().includes(options.documentTitle!.toLowerCase())
      );
    }

    return {
      documents: filteredDocuments,
      totalCount: filteredDocuments.length,
      hasMore: attestations.length === (options.limit || 50)
    };

  } catch (error) {
    console.error('Document query failed:', error);
    return {
      documents: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

/**
 * 特定のドキュメントを取得
 */
export async function queryDocumentByUID(attestationUID: string): Promise<any | null> {
  const query = `
    query GetDocumentByUID($id: String!) {
      attestation(id: $id) {
        id
        attester
        recipient
        time
        revoked
        decodedDataJson
        txid
        schemaId
      }
    }
  `;

  const variables = {
    id: attestationUID
  };

  try {
    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const attestation = result.data?.attestation;
    
    if (!attestation) {
      return null;
    }

    // スキーマIDを確認
    if (attestation.schemaId !== GLOBAL_SCHEMA_UIDS.document) {
      throw new Error(`Invalid schema ID: expected ${GLOBAL_SCHEMA_UIDS.document}, got ${attestation.schemaId}`);
    }

    return parseDocumentAttestation(attestation);

  } catch (error) {
    console.error('Document query by UID failed:', error);
    return null;
  }
}

/**
 * ドキュメント統計情報を取得
 */
export async function getDocumentStats(): Promise<{
  totalDocuments: number;
  activeDocuments: number;
  revokedDocuments: number;
  totalDAOs: number;
}> {
  
  const query = `
    query GetDocumentStats($documentSchemaId: String!, $daoSchemaId: String!) {
      totalDocuments: attestations(where: { schemaId: $documentSchemaId }) {
        id
      }
      activeDocuments: attestations(where: { schemaId: $documentSchemaId, revoked: false }) {
        id
      }
      revokedDocuments: attestations(where: { schemaId: $documentSchemaId, revoked: true }) {
        id
      }
      totalDAOs: attestations(where: { schemaId: $daoSchemaId, revoked: false }) {
        id
      }
    }
  `;

  const variables = {
    documentSchemaId: GLOBAL_SCHEMA_UIDS.document,
    daoSchemaId: GLOBAL_SCHEMA_UIDS.daoMain
  };

  try {
    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const data = result.data;

    return {
      totalDocuments: data?.totalDocuments?.length || 0,
      activeDocuments: data?.activeDocuments?.length || 0,
      revokedDocuments: data?.revokedDocuments?.length || 0,
      totalDAOs: data?.totalDAOs?.length || 0
    };

  } catch (error) {
    console.error('Document stats query failed:', error);
    return {
      totalDocuments: 0,
      activeDocuments: 0,
      revokedDocuments: 0,
      totalDAOs: 0
    };
  }
} 