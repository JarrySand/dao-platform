import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

const isDevelopment = process.env.NODE_ENV === 'development';

// dotenvを明示的に読み込み（サーバーサイドのみ）
if (typeof window === 'undefined') {
  const dotenv = require('dotenv');
  const path = require('path');
  
  // .env.localファイルを明示的に読み込み
  const envPath = path.join(process.cwd(), '.env.local');
  const result = dotenv.config({ path: envPath });
  
  if (isDevelopment) {
    console.log('🔧 dotenv explicit load result:', {
      error: result.error?.message || 'None',
      parsed: result.parsed ? Object.keys(result.parsed).length : 0
    });
  }
}

// デバッグ用のログ出力（開発環境のみ）
if (isDevelopment) {
  console.log('🔍 Environment Variables Debug:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- Raw NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');
}

// 環境変数の直接読み込み（文字エンコーディング問題を回避）
const getEnvVar = (key: string): string | undefined => {
  // Next.jsの環境変数読み込みを試行
  const value = process.env[key];
  if (value && value !== 'undefined') {
    return value;
  }
  
  // ブラウザ環境での追加チェック
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const browserValue = window.__ENV__?.[key];
    if (browserValue) {
      return browserValue;
    }
  }
  
  return undefined;
};

// Firebase設定の読み込み
const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID')
};

// 設定の検証
const requiredFields = [
  { key: 'API_KEY', value: firebaseConfig.apiKey },
  { key: 'AUTH_DOMAIN', value: firebaseConfig.authDomain },
  { key: 'PROJECT_ID', value: firebaseConfig.projectId },
  { key: 'STORAGE_BUCKET', value: firebaseConfig.storageBucket },
  { key: 'MESSAGING_SENDER_ID', value: firebaseConfig.messagingSenderId },
  { key: 'APP_ID', value: firebaseConfig.appId }
];

const missingFields: string[] = [];

if (isDevelopment) {
  console.log('🔧 Firebase Configuration Check:');
  requiredFields.forEach(field => {
    if (field.value) {
      console.log(`- ${field.key}: ✅ Set${field.key === 'API_KEY' ? ` (${field.value.substring(0, 10)}...)` : ''}`);
    } else {
      console.log(`- ${field.key}: ❌ Missing`);
      missingFields.push(field.key);
    }
  });

  // 環境変数読み込み状況の詳細表示
  console.log('🔍 Environment Variables Status:');
  console.log('- NEXT_PUBLIC_FIREBASE_API_KEY:', getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY') ? '✅ Found' : '❌ Not Found');
  console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID:', getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ? '✅ Found' : '❌ Not Found');
} else {
  // 本番環境では静かに検証
  requiredFields.forEach(field => {
    if (!field.value) {
      missingFields.push(field.key);
    }
  });
}

// 本番環境でのエラーハンドリング
if (missingFields.length > 0) {
  const errorMessage = `Firebase configuration error: Missing required environment variables: ${missingFields.join(', ')}. Please set up your .env.local file with the required Firebase configuration values.`;
  
  if (isDevelopment) {
    console.error('❌ Firebase configuration incomplete');
    console.error('💡 Please create a .env.local file with the following variables:');
    console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
    console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID'); 
    console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
  }
  
  throw new Error(errorMessage);
}

if (isDevelopment) {
  console.log('🔧 Using Firebase Configuration:');
  console.log('- Project ID:', firebaseConfig.projectId);
}

let app: any;
let db: any;

try {
  // Firebase アプリの初期化
  app = initializeApp(firebaseConfig);
  if (isDevelopment) {
    console.log('✅ Firebase app initialized successfully');
  }
  
  // Firestore の初期化
  db = getFirestore(app);
  if (isDevelopment) {
    console.log('✅ Firestore initialized successfully');
    console.log('⚠️ Firebase Auth initialization temporarily disabled for testing');
  }
  
} catch (error) {
  if (isDevelopment) {
    console.error('💥 Firebase initialization failed:', error);
  }
  throw error;
}

export { db };
export default app; 