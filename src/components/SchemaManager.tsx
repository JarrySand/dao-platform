import React, { useState } from 'react';
import { ethers } from 'ethers';
import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';

// EASプロバイダーのインターフェース
interface EasContextType {
  eas: EAS | null;
  schemaRegistry: SchemaRegistry | null;
  signer: ethers.Signer | null;
  provider: ethers.Provider | null;
  isConnected: boolean;
}

// モック用のuseEasフック
const useEas = (): EasContextType => {
  // 実際の実装では適切なコンテキストからこれらの値を取得する
  return {
    eas: null,
    schemaRegistry: null,
    signer: null,
    provider: null,
    isConnected: false
  };
};

export const SchemaManager: React.FC = () => {
  const { eas, schemaRegistry, signer } = useEas();
  const [schemaId, setSchemaId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegisterSchema = async () => {
    if (!schemaRegistry || !signer) {
      setError('SchemaRegistry or signer is not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // スキーマの定義
      const schema = "string daoId,string documentId,string documentHash";
      
      // スキーマの登録
      const transaction = await schemaRegistry.register({
        schema,
        resolverAddress: ethers.ZeroAddress,
        revocable: true,
      });

      // トランザクション完了を待機
      // Ethers.js v6ではawait tx.wait()はTransactionReceiptではなくStringを返す
      const transactionHash = await transaction.wait();
      
      if (transactionHash) {
        // トランザクションハッシュからスキーマIDを取得する方法は
        // EAS SDKの実装に依存します
        // ここでは例として、トランザクションレシートを取得してスキーマIDを取得します
        const provider = signer.provider;
        if (provider) {
          const receipt = await provider.getTransactionReceipt(transactionHash);
          if (receipt && receipt.logs && receipt.logs.length > 0) {
            // EASコントラクトのイベントログからスキーマIDを取得
            // 実際のログ構造はEASコントラクトの実装によります
            const schemaRegisteredLog = receipt.logs.find(log => 
              log.topics && log.topics[0] === ethers.id('SchemaRegistered(bytes32,string,address,bool)')
            );
            
            if (schemaRegisteredLog && schemaRegisteredLog.topics.length > 1) {
              const newSchemaId = schemaRegisteredLog.topics[1];
              setSchemaId(newSchemaId);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register schema');
      console.error('Error registering schema:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySchema = async () => {
    if (!schemaRegistry || !signer || !schemaId) {
      setError('SchemaRegistry, signer, or schema ID is not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // EAS SDKを使用してスキーマを取得
      const schemaRecord = await schemaRegistry.getSchema({ uid: schemaId });
      console.log('Schema verified:', schemaRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify schema');
      console.error('Error verifying schema:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Schema Manager</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Schema ID: {schemaId || 'Not registered'}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleRegisterSchema}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Registering...' : 'Register Schema'}
        </button>

        <button
          onClick={handleVerifySchema}
          disabled={isLoading || !schemaId}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Verifying...' : 'Verify Schema'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 