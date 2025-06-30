import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';

// Sepoliaネットワーク上のEASコントラクトアドレス
const EAS_CONTRACT_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';
const SCHEMA_REGISTRY_ADDRESS = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

// スキーマUID（確認済みの正しいスキーマを使用）
export const SCHEMA_UIDS = {
  DAO_MAIN: '0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1', // 新しいシンプルなDAOスキーマ
  DOCUMENT: '0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152' // 新しい最小限ドキュメントスキーマ
};

interface AttestationData {
  uid: string;
  schema: string;
  data: any;
  attester: string;
  recipient: string;
  time: number;
  revoked: boolean;
}

interface EasContextType {
  eas: EAS | null;
  schemaRegistry: SchemaRegistry | null;
  signer: ethers.Signer | null;
  provider: ethers.Provider | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  // EASクエリ機能
  getAttestationsBySchema: (schemaUID: string, filter?: any) => Promise<AttestationData[]>;
  getAttestation: (uid: string) => Promise<AttestationData | null>;
  getDAODocuments: (daoId: string) => Promise<AttestationData[]>;
  getAllDAOs: () => Promise<AttestationData[]>;
}

const EasContext = createContext<EasContextType>({
  eas: null,
  schemaRegistry: null,
  signer: null,
  provider: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  getAttestationsBySchema: async () => [],
  getAttestation: async () => null,
  getDAODocuments: async () => [],
  getAllDAOs: async () => [],
});

export const useEas = () => useContext(EasContext);

interface EasProviderProps {
  children: ReactNode;
}

export const EasProvider: React.FC<EasProviderProps> = ({ children }) => {
  const [eas, setEas] = useState<EAS | null>(null);
  const [schemaRegistry, setSchemaRegistry] = useState<SchemaRegistry | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // ブラウザのイーサリアムプロバイダに接続
  const connect = async () => {
    try {
      // @ts-ignore MetaMaskは型定義されていない場合があります
      if (typeof window !== 'undefined' && window.ethereum) {
        // @ts-ignore
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // プロバイダとシグナーの設定
        // @ts-ignore
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        
        // EASインスタンスの作成
        const easInstance = new EAS(EAS_CONTRACT_ADDRESS);
        easInstance.connect(ethersSigner);
        
        // SchemaRegistryインスタンスの作成
        const schemaRegistryInstance = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
        schemaRegistryInstance.connect(ethersSigner);
        
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setEas(easInstance);
        setSchemaRegistry(schemaRegistryInstance);
        setIsConnected(true);
        
        console.log('Connected to EAS');
      } else {
        console.error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Failed to connect to EAS:', error);
    }
  };

  // 切断
  const disconnect = () => {
    setEas(null);
    setSchemaRegistry(null);
    setSigner(null);
    setProvider(null);
    setIsConnected(false);
  };

  // EASクエリ機能の実装
  const getAttestationsBySchema = async (schemaUID: string, filter?: any): Promise<AttestationData[]> => {
    try {
      // 実際のGraphQLクエリを使用してEASデータを取得
      const { getAttestationsBySchema: queryAttestations } = await import('@/utils/easQuery');
      const attestations = await queryAttestations(schemaUID);
      
      return attestations.map(att => ({
        uid: att.id,
        schema: att.schemaId,
        data: att.decodedDataJson, // decodedDataJsonを使用
        attester: att.attester,
        recipient: att.recipient,
        time: att.time,
        revoked: att.revoked
      }));
    } catch (error) {
      console.error('Error querying attestations by schema:', error);
      return [];
    }
  };

  const getAttestation = async (uid: string): Promise<AttestationData | null> => {
    if (!eas) {
      console.warn('EAS not connected');
      return null;
    }
    
    try {
      const attestation = await eas.getAttestation(uid);
      return {
        uid: attestation.uid,
        schema: attestation.schema,
        data: attestation.data,
        attester: attestation.attester,
        recipient: attestation.recipient,
        time: Number(attestation.time),
        revoked: false // EAS SDKのAttestationオブジェクトにrevokedプロパティがない場合のデフォルト値
      };
    } catch (error) {
      console.error('Error getting attestation:', error);
      return null;
    }
  };

  const getDAODocuments = async (daoId: string): Promise<AttestationData[]> => {
    try {
      const { getDAODocuments: queryDAODocuments } = await import('@/utils/easQuery');
      const attestations = await queryDAODocuments(SCHEMA_UIDS.DOCUMENT, daoId);
      
      return attestations.map(att => ({
        uid: att.id,
        schema: att.schemaId,
        data: att.data,
        attester: att.attester,
        recipient: att.recipient,
        time: att.time,
        revoked: att.revoked
      }));
    } catch (error) {
      console.error('Error querying DAO documents:', error);
      return [];
    }
  };

  const getAllDAOs = async (): Promise<AttestationData[]> => {
    try {
      console.log('Getting all DAOs with schema UID:', SCHEMA_UIDS.DAO_MAIN);
      
      // GraphQLクエリを使用（ウォレット接続不要）
      try {
        const { getAttestationsBySchema: queryAttestations } = await import('@/utils/easQuery');
        const attestations = await queryAttestations(SCHEMA_UIDS.DAO_MAIN);
        console.log('Retrieved attestations via GraphQL:', attestations);
        
        return attestations.map(att => ({
          uid: att.id,
          schema: att.schemaId,
          data: att.decodedDataJson, // decodedDataJsonを直接使用
          attester: att.attester,
          recipient: att.recipient,
          time: att.time,
          revoked: att.revoked
        }));
      } catch (graphqlError) {
        console.warn('GraphQL query failed:', graphqlError);
        // GraphQLが失敗した場合は空配列を返す（ウォレット接続を要求しない）
        // 呼び出し側で他のデータソース（API、localStorage）にフォールバックする
        return [];
      }
    } catch (error) {
      console.error('Error querying all DAOs:', error);
      return [];
    }
  };

  useEffect(() => {
    // ページ読み込み時に自動接続を試みる（オプション）
    // connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return (
    <EasContext.Provider
      value={{
        eas,
        schemaRegistry,
        signer,
        provider,
        isConnected,
        connect,
        disconnect,
        getAttestationsBySchema,
        getAttestation,
        getDAODocuments,
        getAllDAOs,
      }}
    >
      {children}
    </EasContext.Provider>
  );
}; 