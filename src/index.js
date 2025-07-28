import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import PartnerApp from './PartnerApp.js';
import reportWebVitals from './reportWebVitals.js';

// Firebaseテスト（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  import('./test-firebase.js').then(() => {
    console.log('Firebase接続テスト実行中...');
  });
}

// エントリーポイントをURLパラメータまたは環境変数で切り替え
const isPartner = window.location.pathname.startsWith('/partner') || 
                  window.location.pathname.startsWith('/partner-entry') ||
                  window.location.search.includes('app=partner') ||
                  process.env.REACT_APP_ENTRY_POINT === 'partner' ||
                  window.REACT_APP_ENTRY_POINT === 'partner';

console.log('🔍 パートナー判定デバッグ:');
console.log('  pathname:', window.location.pathname);
console.log('  startsWith /partner:', window.location.pathname.startsWith('/partner'));
console.log('  process.env.REACT_APP_ENTRY_POINT:', process.env.REACT_APP_ENTRY_POINT);
console.log('  window.REACT_APP_ENTRY_POINT:', window.REACT_APP_ENTRY_POINT);
console.log('  isPartner:', isPartner);

const AppComponent = isPartner ? PartnerApp : App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
