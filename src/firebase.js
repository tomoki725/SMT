import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase設定
const firebaseConfig = {
  projectId: "psmt-6724f",
  appId: "1:683825497775:web:0bec91982bc1b497a3365a",
  storageBucket: "psmt-6724f.firebasestorage.app",
  apiKey: "AIzaSyAgwYYikH_diGanJNLTHKyBmk-4-u6osHY",
  authDomain: "psmt-6724f.firebaseapp.com",
  messagingSenderId: "683825497775"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Firestoreインスタンスを取得
export const db = getFirestore(app);

// 認証インスタンスを取得（将来使用予定）
export const auth = getAuth(app);

export default app;