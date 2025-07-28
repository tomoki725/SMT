import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase設定
const firebaseConfig = {
  projectId: "admn-45826",
  appId: "1:528077412400:web:8a3b2ed21ba1d076d075f5",
  storageBucket: "admn-45826.firebasestorage.app",
  apiKey: "AIzaSyBtInwRgMTvaf1XK8RJsIv3slARY4RXTGY",
  authDomain: "admn-45826.firebaseapp.com",
  messagingSenderId: "528077412400",
  measurementId: "G-0W2Y623VQX"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Firestoreインスタンスを取得
export const db = getFirestore(app);

// 認証インスタンスを取得（将来使用予定）
export const auth = getAuth(app);

export default app;