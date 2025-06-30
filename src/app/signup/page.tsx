'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEas } from '@/contexts/EasContext';
import { useAuth } from '@/contexts/AuthContext';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'operator';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  location: string;
  size: 'small' | 'medium' | 'large';
  memberCount: number;
  description: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { eas, isConnected, connect, signer, provider } = useEas();
  const { user } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: user?.email || '',
    password: '',
    passwordConfirm: '',
    location: '',
    size: 'small',
    memberCount: 0,
    description: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<'web3' | 'simple'>(
    user?.authType === 'wallet' ? 'web3' : 'web3'
  );

  // EAS証明書作成関数
  const createDAOAttestation = async (daoData: any): Promise<string> => {
    if (!eas || !signer) {
      throw new Error('EAS not connected');
    }

    // 新しいシンプルなスキーマを使用
    const schemaUID = '0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1';
    
    // 新しいスキーマ定義
    const schemaEncoder = new SchemaEncoder('string daoUID,string daoName,address adminAddress');
    const signerAddress = await signer.getAddress();
    
    // シンプルなデータ構造
    const daoUID = daoData.id; // 事前に生成されたdaoUIDを使用
    const daoName = daoData.name || 'Test DAO';
    const adminAddress = signerAddress;
    
    if (!daoUID) {
      throw new Error('daoUID is required');
    }
    
    console.log('Using new simple schema:');
    console.log('- daoUID:', daoUID);
    console.log('- daoName:', daoName);
    console.log('- adminAddress:', adminAddress);
    console.log('- Schema UID:', schemaUID);
    
    // 新しいスキーマに対応したデータ配列
    const attestationData = [
      { name: 'daoUID', value: daoUID, type: 'string' },
      { name: 'daoName', value: daoName, type: 'string' },
      { name: 'adminAddress', value: adminAddress, type: 'address' }
    ];
    
    console.log('Attestation data for new schema:', attestationData);
    
    try {
      const encodedData = schemaEncoder.encodeData(attestationData);
      console.log('Encoded data:', encodedData);
      
      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: '0x0000000000000000000000000000000000000000',
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData
        }
      });

      console.log('Transaction submitted:', tx);
      const newAttestationUID = await tx.wait();
      console.log('Transaction result:', newAttestationUID);
      
      // EAS SDKの戻り値を正しく処理
      let attestationUID: string;
      if (typeof newAttestationUID === 'string') {
        attestationUID = newAttestationUID;
      } else if (newAttestationUID && typeof newAttestationUID === 'object') {
        // TransactionReceiptの場合、プロパティを安全にアクセス
        const receipt = newAttestationUID as any;
        attestationUID = receipt.transactionHash || receipt.hash || (tx as any).hash;
      } else {
        // フォールバック: トランザクションのプロパティを使用
        attestationUID = (tx as any).transactionHash || (tx as any).hash || 'unknown';
      }
      
      console.log('Final attestation UID:', attestationUID);
      
      if (!attestationUID || attestationUID === 'unknown') {
        throw new Error('Failed to get attestation UID');
      }

      return attestationUID;
    } catch (error) {
      console.error('Detailed error information:');
      console.error('- Error message:', error instanceof Error ? error.message : error);
      console.error('- Data being encoded:', attestationData);
      console.error('- Schema UID:', schemaUID);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // フォームデータの検証
    if (!formData.name || formData.name.trim().length < 2) {
      setError('DAO名は2文字以上である必要があります。');
      setIsSubmitting(false);
      return;
    }

    if (formData.name.trim().length > 200) {
      setError('DAO名は200文字以内である必要があります。');
      setIsSubmitting(false);
      return;
    }

    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 2) {
      setError('説明を入力する場合は2文字以上である必要があります。');
      setIsSubmitting(false);
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setError('説明は500文字以内である必要があります。');
      setIsSubmitting(false);
      return;
    }

    // ウォレット認証の場合はパスワード不要
    if (user?.authType !== 'wallet') {
      // パスワードの検証
      if (formData.password.length < 8) {
        setError('パスワードは8文字以上である必要があります。');
        setIsSubmitting(false);
        return;
      }

      if (formData.password !== formData.passwordConfirm) {
        setError('パスワードが一致しません。');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // ウォレット認証の場合はメール重複チェックをスキップ
      if (user?.authType !== 'wallet') {
        // ユーザー情報の重複チェック（localStorageから）
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]') as User[];
        const existingUser = existingUsers.find((user: User) => user.email === formData.email);
        if (existingUser) {
          setError('このメールアドレスは既に登録されています。');
          setIsSubmitting(false);
          return;
        }
      }

      if (registrationMethod === 'web3') {
        // Web3（EAS）登録
        if (!isConnected) {
          setError('ウォレットが接続されていません。まずウォレットを接続してください。');
          setIsSubmitting(false);
          return;
        }

        // 現在のウォレットアドレスを取得
        const currentWalletAddress = await signer?.getAddress();
        console.log('Current wallet address:', currentWalletAddress);
        console.log('User wallet address:', user?.walletAddress);

        // daoUIDを事前に生成（EASとローカルストレージで同じIDを使用）
        const daoUID = crypto.randomUUID();
        
        // 新しいDAOデータを作成（adminAddressを適切に設定）
        const newDAO = {
          id: daoUID, // EASで使用するdaoUIDと同じIDを使用
          name: formData.name,
          description: formData.description || '',
          logoUrl: 'https://placehold.co/100x100?text=DAO',
          location: formData.location,
          size: formData.size,
          memberCount: formData.memberCount,
          trustScore: 0,
          foundingDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active' as const,
          ownerId: user?.authType === 'wallet' ? user.id : formData.email,
          adminAddress: currentWalletAddress, // ウォレットアドレスを設定
          attestationUID: '', // 後で設定
          documents: []
        };

        console.log('Generated daoUID:', daoUID);
        console.log('DAO data to be saved:', newDAO);

        // EAS証明書を作成
        console.log('Creating DAO attestation with data:', newDAO);
        console.log('Schema UID being used:', '0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1');
        const attestationUID = await createDAOAttestation(newDAO);
        console.log('DAO registered on blockchain with UID:', attestationUID);

        // attestationUIDを追加
        newDAO.attestationUID = attestationUID;

        // ファイルベースデータベースに詳細情報を保存
        try {
          const response = await fetch('/api/daos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newDAO),
          });

          if (!response.ok) {
            throw new Error('Failed to save DAO to database');
          }

          console.log('Saved DAO to database with ID:', daoUID);
        } catch (dbError) {
          console.error('Failed to save to database, falling back to localStorage:', dbError);
          // フォールバック: ローカルストレージに保存
          const existingDAOs = JSON.parse(localStorage.getItem('daos') || '[]');
          localStorage.setItem('daos', JSON.stringify([...existingDAOs, newDAO]));
          console.log('Saved DAO to localStorage with ID:', daoUID);
        }

        // ウォレット認証以外の場合のみ新しいユーザーを作成
        if (user?.authType !== 'wallet') {
          const existingUsers = JSON.parse(localStorage.getItem('users') || '[]') as User[];
          const newUser = {
            id: formData.email,
            email: formData.email,
            password: formData.password, // 注: 実際の実装では暗号化が必要
            name: formData.name,
            role: 'operator' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active' as const
          };

          // ユーザー情報のみlocalStorageに保存（認証用）
          localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));
        }

        alert(`DAOの登録が完了しました！\nブロックチェーン証明書ID: ${attestationUID}`);
        router.push('/my-dao');
      } else {
        // 簡易登録（従来のlocalStorage方式）
        const existingDAOs = JSON.parse(localStorage.getItem('daos') || '[]');
        const daoId = crypto.randomUUID();
        const newDAO = {
          id: daoId,
          name: formData.name,
          description: formData.description || '',
          logoUrl: 'https://placehold.co/100x100?text=DAO',
          location: formData.location,
          size: formData.size,
          memberCount: formData.memberCount,
          trustScore: 0,
          foundingDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active' as const,
          ownerId: formData.email,
          adminAddress: user?.walletAddress || '', // ウォレットアドレスがあれば設定
          documents: []
        };

        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]') as User[];
        const newUser = {
          id: formData.email,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'operator' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active' as const
        };

        localStorage.setItem('daos', JSON.stringify([...existingDAOs, newDAO]));
        localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));

        alert('DAOの登録が完了しました。');
        router.push('/my-dao');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(`登録中にエラーが発生しました: ${err instanceof Error ? err.message : 'もう一度お試しください。'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'memberCount' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">新規DAOの登録</h2>
          <p className="mt-2 text-gray-600">
            必要な情報を入力して、DAOを登録してください。
            管理者の承認後、プラットフォームへの参加が可能になります。
          </p>
        </div>

        {/* 登録方法選択 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">登録方法を選択</h3>
          
          {user?.authType === 'wallet' && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <div>
                  <div className="font-medium text-green-800">ウォレット認証済み</div>
                  <div className="text-sm text-green-600">
                    {user.walletAddress && `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="web3"
                name="registrationMethod"
                value="web3"
                checked={registrationMethod === 'web3'}
                onChange={(e) => setRegistrationMethod(e.target.value as 'web3' | 'simple')}
                className="mr-3"
              />
              <label htmlFor="web3" className="flex-1">
                <div className="font-medium text-blue-600">Web3登録（推奨）</div>
                <div className="text-sm text-gray-600">
                  ブロックチェーン上にDAO情報を永続的に記録します。MetaMaskなどのウォレットが必要です。
                </div>
              </label>
            </div>
            
            {user?.authType !== 'wallet' && (
              <div className="flex items-center">
                <input
                  type="radio"
                  id="simple"
                  name="registrationMethod"
                  value="simple"
                  checked={registrationMethod === 'simple'}
                  onChange={(e) => setRegistrationMethod(e.target.value as 'web3' | 'simple')}
                  className="mr-3"
                />
                <label htmlFor="simple" className="flex-1">
                  <div className="font-medium">簡易登録</div>
                  <div className="text-sm text-gray-600">
                    一時的にローカルに保存されます。テスト用途に適しています。
                  </div>
                </label>
              </div>
            )}
          </div>

          {registrationMethod === 'web3' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">ウォレット接続状態</div>
                  <div className="text-sm text-gray-600">
                    {isConnected ? '✅ 接続済み' : '❌ 未接続'}
                  </div>
                </div>
                {!isConnected && (
                  <button
                    type="button"
                    onClick={connect}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    ウォレット接続
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              DAO名 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={200}
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">2文字以上200文字以内で入力してください（ブロックチェーン保存のため英数字推奨）</p>
          </div>

          {user?.authType !== 'wallet' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                管理者メールアドレス *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {user?.authType !== 'wallet' && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">8文字以上で入力してください</p>
              </div>

              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                  パスワード（確認） *
                </label>
                <input
                  type="password"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  required
                  minLength={8}
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              所在地 *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              minLength={1}
              maxLength={100}
              value={formData.location}
              onChange={handleChange}
              placeholder="例：東京都"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="scale" className="block text-sm font-medium text-gray-700">
              規模 *
            </label>
            <select
              id="size"
              name="size"
              required
              value={formData.size}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="small">小規模</option>
              <option value="medium">中規模</option>
              <option value="large">大規模</option>
            </select>
          </div>

          <div>
            <label htmlFor="memberCount" className="block text-sm font-medium text-gray-700">
              メンバー数 *
            </label>
            <input
              type="number"
              id="memberCount"
              name="memberCount"
              required
              min="1"
              value={formData.memberCount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              minLength={2}
              maxLength={500}
              value={formData.description}
              onChange={handleChange}
              placeholder="DAOの目的や活動内容を入力してください（任意・2文字以上）"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">入力する場合は2文字以上500文字以内で入力してください（ブロックチェーン保存のため英数字推奨）</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 