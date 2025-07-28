import React from 'react';

function TestApp() {
  console.log('🧪 TestApp が実行されました');
  console.log('🔍 現在のパス:', window.location.pathname);
  console.log('🔍 現在のホスト:', window.location.host);
  
  const isPartner = window.location.pathname.startsWith('/partner');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: isPartner ? '#e8d5ff' : '#e8f4f8', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333' }}>
        {isPartner ? '🤝 パートナー画面テスト' : '👤 管理者画面テスト'}
      </h1>
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>デバッグ情報</h2>
        <p><strong>現在のパス:</strong> {window.location.pathname}</p>
        <p><strong>現在のホスト:</strong> {window.location.host}</p>
        <p><strong>パートナー判定:</strong> {isPartner ? 'はい' : 'いいえ'}</p>
        <p><strong>現在の時刻:</strong> {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ background: isPartner ? '#9f7aea' : '#4299e1', color: 'white', padding: '15px', borderRadius: '8px' }}>
        <h3>✅ React アプリケーションは正常に動作しています</h3>
        <p>このメッセージが表示されていれば、基本的なReactの動作に問題はありません。</p>
      </div>
    </div>
  );
}

export default TestApp;