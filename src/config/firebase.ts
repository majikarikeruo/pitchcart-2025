import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase設定
// 注意: 本番・開発ともに環境変数から値を取得します
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

function assertFirebaseConfigPresent() {
  const missing: string[] = [];
  const required: Array<keyof typeof firebaseConfig> = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ];
  for (const k of required) {
    const v = (firebaseConfig as any)[k];
    if (!v || typeof v !== 'string' || v === 'your_api_key_here') missing.push(String(k));
  }
  if (missing.length > 0) {
    const msg = `Firebase config is missing/invalid: ${missing.join(', ')}. Set VITE_FIREBASE_* in your env. See docs/firebase_setup.md.`;
    // 失敗理由を明示し、Firebaseの cryptic なエラーを回避
    throw new Error(msg);
  }
}

// Firebaseアプリの初期化
assertFirebaseConfigPresent();
const app = initializeApp(firebaseConfig);

// サービスのエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics（本番環境のみ）
export const analytics = import.meta.env.PROD ? getAnalytics(app) : null;

// 開発環境用の設定
if (import.meta.env.DEV) {
  // Firestoreエミュレータに接続
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFunctionsEmulator(functions, 'localhost', 5001);
  // connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
