import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log('🚀 React アプリケーションが開始されました');
console.log('  pathname:', window.location.pathname);
console.log('  時刻:', new Date().toLocaleString());

// パートナー判定ロジック
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

// 最小限のReactコンポーネント
function SimpleApp() {
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: isPartner ? '#e8d5ff' : '#e8f4f8',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: isPartner ? '#9f7aea' : '#4299e1', fontSize: '48px' }}>
        {isPartner ? '🤝 パートナー画面 (React)' : '👤 管理者画面 (React)'}
      </h1>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>✅ React が正常に動作しています！</h2>
        <p><strong>パス:</strong> {window.location.pathname}</p>
        <p><strong>パートナー判定:</strong> {isPartner ? 'はい' : 'いいえ'}</p>
        <p><strong>時刻:</strong> {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

const AppComponent = SimpleApp;

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
