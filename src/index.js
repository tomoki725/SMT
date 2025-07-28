import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import TestApp from './TestApp.js';
import reportWebVitals from './reportWebVitals.js';

console.log('🚀 React アプリケーションが開始されました');
console.log('  pathname:', window.location.pathname);
console.log('  時刻:', new Date().toLocaleString());

const AppComponent = TestApp;

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
