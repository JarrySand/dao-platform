import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// dotenvを明示的に読み込み（サーバーサイドのみ）
if (typeof window === 'undefined') {
  const dotenv = require('dotenv');
  const path = require('path');
  
  // .env.localファイルを明示的に読み込み
  const envPath = path.join(process.cwd(), '.env.local');
  const result = dotenv.config({ path: envPath });
  
  console.log('🔧 dotenv explicit load result:', {
    error: result.error?.message || 'None',
    parsed: result.parsed ? Object.keys(result.parsed).length : 0
  });
}

// デバッグ用のログ出力
console.log('🔍 Environment Variables Debug:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Raw NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');

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

console.log('🔧 Firebase Configuration Check:');
const missingFields: string[] = [];

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

// もし環境変数が読み込まれていない場合の緊急対応（開発環境のみ）
if (missingFields.length > 0 && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ Some environment variables are missing. Attempting manual configuration...');
  
  firebaseConfig.apiKey = firebaseConfig.apiKey || 'AIzaSyDA7xy9mAb5_zcjtRgPyTyv10ieW6glE-s';
  firebaseConfig.authDomain = firebaseConfig.authDomain || 'dao-platform-mvp.firebaseapp.com';
  firebaseConfig.projectId = firebaseConfig.projectId || 'dao-platform-mvp';
  firebaseConfig.storageBucket = firebaseConfig.storageBucket || 'dao-platform-mvp.firebasestorage.app';
  firebaseConfig.messagingSenderId = firebaseConfig.messagingSenderId || '1038632097886';
  firebaseConfig.appId = firebaseConfig.appId || '1:1038632097886:web:5dc65d64fa4b1ab7573ccf';
  
  console.log('🔧 Applied development fallback configuration');
  console.log('💡 To fix this permanently, check .env.local file encoding and format');
}

console.log('🔧 Using Firebase Configuration:');
console.log('- Project ID:', firebaseConfig.projectId);

let app: any;
let db: any;

try {
  // Firebase アプリの初期化
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Firestore の初期化
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
  
  // Firebase Auth は一時的に無効化
  console.log('⚠️ Firebase Auth initialization temporarily disabled for testing');
  
} catch (error) {
  console.error('💥 Firebase initialization failed:', error);
  throw error;
}

export { db };
export default app; 