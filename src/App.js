import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus, FiList, FiGrid, FiBarChart, FiUsers, FiFileText, FiLogOut, FiDollarSign, FiHome, FiStar, FiTrendingUp } from 'react-icons/fi';
import { analyzeMeetingNotes, isGPTServiceAvailable } from './services/gptService.js';
import LoginPage from './components/LoginPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import LogEntryPage from './components/LogEntryPage.js';
import ProgressDashboard from './components/ProgressDashboard.js';
import KanbanBoard from './components/KanbanBoard.js';
import ProductDetailPage from './components/ProductDetailPage.js';
import IntroducerMasterPage from './components/IntroducerMasterPage.js';
import ActionLogList from './components/ActionLogList.js';
import SalesResultsList from './components/SalesResultsList.js';
import HomeDashboard from './components/HomeDashboard.js';
import Breadcrumb from './components/Breadcrumb.js';
import InfluencerRegisterPage from './components/InfluencerRegisterPage.js';
import InfluencerListPage from './components/InfluencerListPage.js';
import CastingManagePage from './components/CastingManagePage.js';
import ProposalMenuMasterPage from './components/ProposalMenuMasterPage.js';
import { UndoProvider } from './contexts/UndoContext.js';
import authService from './services/authService.js';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserText = styled.span`
  font-size: 0.9rem;
  color: #bdc3c7;
`;

const LogoutButton = styled.button`
  background: none;
  border: 1px solid #34495e;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #34495e;
    border-color: #3498db;
  }
`;

const NavContainer = styled.nav`
  background-color: #34495e;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0;
`;

const NavItem = styled.li`
  display: flex;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  color: #bdc3c7;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  
  &:hover {
    background-color: #2c3e50;
    color: white;
  }
  
  &.active {
    background-color: #2c3e50;
    border-bottom-color: #3498db;
    color: white;
  }
`;

const MainContent = styled.main`
  padding: 2rem;
`;

// 管理者アプリケーションコンポーネント
function AdminApp() {
  // GPT APIテスト関数をwindowオブジェクトに追加（開発用）
  useEffect(() => {
    window.testGPTAPI = async (testText = 'テスト用の議事録：顧客は来月のサービス導入を検討中。予算は月額30万円。技術部門との打ち合わせが必要。') => {
      console.log('=== GPT API テスト開始 ===');
      console.log('APIキー確認:', isGPTServiceAvailable() ? '✅設定済み' : '❌未設定');
      
      try {
        const result = await analyzeMeetingNotes(testText);
        console.log('✅ 分析結果:', result);
        return result;
      } catch (error) {
        console.error('💥 テスト失敗:', error);
        return { error: error.message };
      }
    };
    
    console.log('💡 ブラウザコンソールで testGPTAPI() を実行してGPT機能をテストできます');
  }, []);

  const handleLogout = () => {
    authService.logout('admin');
    window.location.reload(); // ページをリロードして認証状態をリセット
  };

  return (
    <UndoProvider>
      <AppContainer>
        <Header>
        <Title>営業進捗管理ツール</Title>
        <UserInfo>
          <UserText>管理者としてログイン中</UserText>
          <LogoutButton onClick={handleLogout}>
            <FiLogOut />
            ログアウト
          </LogoutButton>
        </UserInfo>
      </Header>
      
      <NavContainer>
        <NavList>
          <NavItem>
            <NavLink to="/">
              <FiHome />
              ホーム
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/log-entry">
              <FiPlus />
              アクションログ記録
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/action-logs">
              <FiFileText />
              ログ一覧
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/progress-dashboard">
              <FiList />
              案件一覧
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/kanban">
              <FiGrid />
              看板ボード
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/introducer-master">
              <FiUsers />
              紹介者マスター
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/proposal-menu-master">
              <FiList />
              提案メニューマスター
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/sales-results">
              <FiDollarSign />
              成約案件一覧
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/if/list">
              <FiStar />
              インフルエンサー
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/casting/manage">
              <FiTrendingUp />
              キャスティング管理
            </NavLink>
          </NavItem>
        </NavList>
      </NavContainer>

      <MainContent>
        <Breadcrumb />
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/progress-dashboard" element={<ProgressDashboard />} />
          <Route path="/log-entry" element={<LogEntryPage />} />
          <Route path="/action-logs" element={<ActionLogList />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/introducer-master" element={<IntroducerMasterPage />} />
          <Route path="/proposal-menu-master" element={<ProposalMenuMasterPage />} />
          <Route path="/sales-results" element={<SalesResultsList />} />
          <Route path="/if/register" element={<InfluencerRegisterPage />} />
          <Route path="/if/register/:id" element={<InfluencerRegisterPage />} />
          <Route path="/if/list" element={<InfluencerListPage />} />
          <Route path="/casting/manage" element={<CastingManagePage />} />
        </Routes>
      </MainContent>
      </AppContainer>
    </UndoProvider>
  );
}

// メイン App コンポーネント
function App() {
  const [forceReauth, setForceReauth] = useState(false);

  const handleLoginSuccess = () => {
    setForceReauth(false);
  };

  const handleSessionExpired = () => {
    setForceReauth(true);
  };

  return (
    <Router>
      <ProtectedRoute 
        userType="admin"
        onSessionExpired={handleSessionExpired}
        fallbackComponent={() => <LoginPage onLoginSuccess={handleLoginSuccess} />}
      >
        {forceReauth ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <AdminApp />
        )}
      </ProtectedRoute>
    </Router>
  );
}

export default App;