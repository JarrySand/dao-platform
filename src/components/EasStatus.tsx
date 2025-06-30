'use client';

import { useState, useEffect } from 'react';
import { useEas } from '@/contexts/EasContext';
import { ethers } from 'ethers';

interface EasStatusProps {
  className?: string;
}

interface NetworkInfo {
  name: string;
  chainId: number;
}

export default function EasStatus({ className = '' }: EasStatusProps) {
  const { isConnected, eas, schemaRegistry, provider, signer } = useEas();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Contract addresses
  const easContractAddress = process.env.NEXT_PUBLIC_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000021';
  const schemaRegistryAddress = process.env.NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000';
  
  // Schema UIDs
  const daoSchemaUID = process.env.NEXT_PUBLIC_DAO_SCHEMA_UID || '0x0000000000000000000000000000000000000000000000000000000000000000';
  const documentSchemaUID = process.env.NEXT_PUBLIC_DOCUMENT_SCHEMA_UID || '0x0000000000000000000000000000000000000000000000000000000000000000';

  // Network information
  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 10: return 'Optimism';
      case 420: return 'Optimism Goerli';
      case 42161: return 'Arbitrum One';
      case 421613: return 'Arbitrum Goerli';
      default: return `Unknown Network (${chainId})`;
    }
  };

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      if (isConnected && provider) {
        try {
          setIsLoading(true);
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);
          setNetworkInfo({
            name: getNetworkName(chainId),
            chainId
          });
        } catch (error) {
          console.error('Failed to get network info:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setNetworkInfo(null);
      }
    };

    fetchNetworkInfo();
  }, [isConnected, provider]);

  return (
    <div className={`border rounded-md p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-3">EAS接続状況</h2>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-32 text-gray-600">接続状態:</div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? '接続済み' : '未接続'}
            </span>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center">
            <div className="w-32 text-gray-600">ネットワーク:</div>
            <div className="text-blue-600 font-mono text-sm">
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                  ネットワーク情報を取得中...
                </span>
              ) : (
                networkInfo ? `${networkInfo.name} (Chain ID: ${networkInfo.chainId})` : 'ネットワーク情報が取得できません'
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center">
          <div className="w-32 text-gray-600">アドレス:</div>
          <div className="text-blue-600 font-mono text-sm">
            {signer ? (
              <AddressDisplay signer={signer} />
            ) : (
              '接続されていません'
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-32 text-gray-600">EAS契約:</div>
          <div className="text-blue-600 font-mono text-sm">
            {easContractAddress.substring(0, 8)}...{easContractAddress.substring(easContractAddress.length - 6)}
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-32 text-gray-600">スキーマレジストリ:</div>
          <div className="text-blue-600 font-mono text-sm">
            {schemaRegistryAddress.substring(0, 8)}...{schemaRegistryAddress.substring(schemaRegistryAddress.length - 6)}
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <h3 className="font-medium mb-2">スキーマ情報</h3>
          
          <div className="space-y-2">
            <div>
              <div className="text-gray-600 text-sm">DAOスキーマUID:</div>
              <div className="text-blue-600 font-mono text-xs break-all">
                {daoSchemaUID}
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 text-sm">ドキュメントスキーマUID:</div>
              <div className="text-blue-600 font-mono text-xs break-all">
                {documentSchemaUID}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to display the user's address
function AddressDisplay({ signer }: { signer: ethers.Signer }) {
  const [address, setAddress] = useState('読み込み中...');

  useEffect(() => {
    const getAddress = async () => {
      try {
        const addr = await signer.getAddress();
        setAddress(`${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`);
      } catch (error) {
        console.error('Error getting address:', error);
        setAddress('アドレスを取得できません');
      }
    };

    getAddress();
  }, [signer]);

  return <span>{address}</span>;
} 