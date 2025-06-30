'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User } from '@/types';
import { watchWalletChanges } from '@/utils/walletUtils';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithWallet: (walletAddress: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // クライアントサイドでのみ初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('AuthContext: Restored user from localStorage:', parsedUser);
          setUser(parsedUser);
        } else {
          console.log('AuthContext: No stored user found');
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Initialization complete');
      }
    }
  }, []);

  // ウォレットの変更を監視
  useEffect(() => {
    if (isLoading || !user || user.authType !== 'wallet') {
      return;
    }

    const cleanup = watchWalletChanges(
      (accounts: string[]) => {
        // アカウントが変更または切断された場合
        if (accounts.length === 0) {
          console.log('Wallet disconnected, logging out...');
          logout();
        } else if (user.walletAddress && accounts[0] !== user.walletAddress) {
          console.log('Wallet account changed, logging out...');
          logout();
        }
      },
      (chainId: string) => {
        console.log('Chain changed to:', chainId);
        // チェーン変更時は特に何もしない（将来的に対応可能）
      }
    );

    return cleanup;
  }, [user, isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 簡単な認証（実際のプロジェクトではAPIを使用）
      if (email === 'admin@example.com' && password === 'password') {
        const newUser: User = {
          id: '1',
          email: email,
          name: 'Admin User',
          role: 'admin',
          authType: 'email',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(newUser));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithWallet = async (walletAddress: string): Promise<boolean> => {
    try {
      console.log('AuthContext: loginWithWallet called with address:', walletAddress);
      
      if (!walletAddress) {
        console.log('AuthContext: No wallet address provided');
        return false;
      }

      // 既存のウォレットユーザーを確認
      let users: User[] = [];
      if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          users = JSON.parse(storedUsers);
          console.log('AuthContext: Found existing users:', users);
        }
      }

      let existingUser = users.find(u => u.walletAddress === walletAddress);
      console.log('AuthContext: Existing user found:', existingUser);
      
      if (!existingUser) {
        // 新しいウォレットユーザーを作成
        existingUser = {
          id: Date.now().toString(),
          name: `Wallet User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          role: 'admin',
          walletAddress: walletAddress,
          authType: 'wallet',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };
        
        console.log('AuthContext: Created new user:', existingUser);
        
        users.push(existingUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('users', JSON.stringify(users));
          console.log('AuthContext: Saved users to localStorage');
        }
      }

      // 状態を同期的に更新
      setUser(existingUser);
      console.log('AuthContext: Set user in context:', existingUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(existingUser));
        console.log('AuthContext: Saved current user to localStorage');
      }
      
      // 状態更新が完了するまで少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('AuthContext: Login successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Wallet login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // 簡単な登録（実際のプロジェクトではAPIを使用）
      const newUser: User = {
        id: Date.now().toString(),
        email: email,
        name: name,
        role: 'member',
        authType: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithWallet,
      logout,
      signup,
      isLoading,
      isAuthenticated: !isLoading && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 