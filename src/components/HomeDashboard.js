import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiTarget, FiTrendingUp, FiBarChart, FiDollarSign, FiSave, FiCheck, FiUsers } from 'react-icons/fi';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { STATUSES, STATUS_COLORS, PROPOSAL_MENUS } from '../data/constants.js';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const CompanyBadge = styled.div`
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: ${props => props.color}15;
  border: 2px solid ${props => props.color}30;
`;

const StatusCount = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 0.25rem;
`;

const StatusLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  line-height: 1.2;
`;

const StatusRatio = styled.div`
  font-size: 0.7rem;
  color: #999;
  margin-top: 0.25rem;
`;

const TotalCountDisplay = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2c3e50;
`;

const TargetInputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
`;

const InputLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const CurrentTarget = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  font-size: 0.9rem;
  color: #555;
`;

const ChartContainer = styled.div`
  grid-column: 1 / -1;
`;

const ChartArea = styled.div`
  height: 300px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
`;

const MonthlyStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MonthlyStatCard = styled.div`
  background: linear-gradient(135deg, ${props => props.gradient});
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
`;

const MonthLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const StatSubtext = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
`;

const CompanyStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CompanyStatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CompanyName = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
`;

const CompanyValue = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const FilterInfo = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
  margin-left: auto;
`;

function HomeDashboard() {
  const [statusCounts, setStatusCounts] = useState({});
  const [salesTarget, setSalesTarget] = useState('');
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [monthlyImplementationStats, setMonthlyImplementationStats] = useState([]);
  const [companyStats, setCompanyStats] = useState([]);
  const [proposalStats, setProposalStats] = useState([]);
  const [menuDateFilter, setMenuDateFilter] = useState('3months'); // メニュー別実績用フィルター
  const [companyDateFilter, setCompanyDateFilter] = useState('3months'); // 会社別実績用フィルター
  
  // 日付フィルター用のヘルパー関数
  const getDateRange = (filter) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (filter) {
      case 'thisMonth': {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0);
        return { start, end };
      }
      case 'lastMonth': {
        const start = new Date(currentYear, currentMonth - 1, 1);
        const end = new Date(currentYear, currentMonth, 0);
        return { start, end };
      }
      case '3months': {
        const start = new Date(currentYear, currentMonth - 2, 1);
        const end = new Date(currentYear, currentMonth + 1, 0);
        return { start, end };
      }
      case 'all':
      default:
        return { start: null, end: null };
    }
  };

  // 日付がフィルター範囲内かチェック
  const isDateInRange = useCallback((dateString, filter) => {
    if (filter === 'all' || !dateString) return true;
    
    const { start, end } = getDateRange(filter);
    if (!start || !end) return true;
    
    const date = new Date(dateString);
    return date >= start && date <= end;
  }, []);

  // フィルターのラベルを取得
  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'thisMonth': return '今月';
      case 'lastMonth': return '先月'; 
      case '3months': return '直近3ヶ月';
      case 'all': return '全体';
      default: return '直近3ヶ月';
    }
  };
  
  // 全社のステータス別件数を取得
  const fetchStatusCounts = useCallback(async () => {
    try {
      console.log('📊 管理者ホーム: ステータス別件数取得開始');
      
      const progressRef = collection(db, 'progressDashboard');
      const querySnapshot = await getDocs(progressRef);
      
      const counts = {};
      let totalExcludingEnd = 0; // 稼働終了を除いた総数
      
      STATUSES.forEach(status => {
        counts[status] = 0;
      });
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // 「他社案件」を除外
        if (data.status && STATUSES.includes(data.status) && data.proposalMenu !== '他社案件') {
          counts[data.status] = (counts[data.status] || 0) + 1;
          // 稼働終了以外の案件をカウント
          if (data.status !== '稼働終了') {
            totalExcludingEnd++;
          }
        }
      });
      
      // 総数を保存
      counts._totalExcludingEnd = totalExcludingEnd;
      
      console.log('✅ 管理者ホーム: ステータス別件数取得成功:', counts);
      setStatusCounts(counts);
    } catch (error) {
      console.error('💥 管理者ホーム: ステータス別件数取得エラー:', error);
    }
  }, []);
  
  // 全社の売上目標を取得
  const fetchCurrentTarget = useCallback(async () => {
    try {
      console.log('🎯 管理者ホーム: 売上目標取得開始');
      
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const targetsRef = collection(db, 'salesTargets');
      const q = query(targetsRef, 
        where('partnerCompany', '==', '全社'),
        where('month', '==', currentMonth)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const targetData = querySnapshot.docs[0].data();
        setCurrentTarget(targetData);
        console.log('✅ 管理者ホーム: 売上目標取得成功:', targetData);
      } else {
        setCurrentTarget(null);
        console.log('ℹ️ 管理者ホーム: 今月の売上目標未設定');
      }
    } catch (error) {
      console.error('💥 管理者ホーム: 売上目標取得エラー:', error);
    }
  }, []);
  
  // 月次統計を取得（直近3ヶ月）
  const fetchMonthlyStats = useCallback(async () => {
    try {
      console.log('📈 管理者ホーム: 月次統計取得開始');
      
      // 直近3ヶ月の月リストを生成
      const months = [];
      for (let i = 2; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7));
      }
      
      const stats = [];
      
      for (const month of months) {
        // その月に決まった案件（confirmedDateがその月の案件）を取得
        const progressRef = collection(db, 'progressDashboard');
        const progressQuery = query(progressRef, 
          where('status', '==', '受注')
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        let totalAmount = 0;
        let dealCount = 0;
        
        progressSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // confirmedDateがその月のものをカウント（「他社案件」も除外）
          const confirmedDate = data.confirmedDate;
          if (confirmedDate && confirmedDate.startsWith(month) && data.proposalMenu !== '他社案件') {
            totalAmount += data.receivedOrderAmount || 0;
            dealCount++;
          }
        });
        
        // その月の目標を取得
        const targetsRef = collection(db, 'salesTargets');
        const targetQuery = query(targetsRef,
          where('partnerCompany', '==', '全社'),
          where('month', '==', month)
        );
        const targetSnapshot = await getDocs(targetQuery);
        
        let target = 0;
        if (!targetSnapshot.empty) {
          target = targetSnapshot.docs[0].data().targetAmount || 0;
        }
        
        stats.push({
          month,
          target,
          actual: totalAmount,
          dealCount,
          monthLabel: new Date(month + '-01').toLocaleDateString('ja-JP', { month: 'long' })
        });
      }
      
      console.log('✅ 管理者ホーム: 月次統計取得成功:', stats);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('💥 管理者ホーム: 月次統計取得エラー:', error);
    }
  }, []);
  
  // メニュー別統計を取得
  const fetchProposalStats = useCallback(async () => {
    try {
      console.log('📋 管理者ホーム: メニュー別統計取得開始 (フィルター:', menuDateFilter, ')');
      
      const progressRef = collection(db, 'progressDashboard');
      const querySnapshot = await getDocs(progressRef);
      
      const proposalData = {};
      
      // 全メニューを初期化
      PROPOSAL_MENUS.forEach(menu => {
        proposalData[menu] = {
          totalDeals: 0,
          receivedOrders: 0,
          totalAmount: 0
        };
      });
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // 「他社案件」を除外し、PROPOSAL_MENUSに含まれるもののみ集計
        if (data.proposalMenu && PROPOSAL_MENUS.includes(data.proposalMenu)) {
          // 日付フィルター適用（createdAtまたはupdatedAtを基準）
          const checkDate = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(data.updatedAt || data.createdAt);
          const checkDateString = checkDate ? checkDate.toISOString().split('T')[0] : null;
          
          if (isDateInRange(checkDateString, menuDateFilter)) {
            proposalData[data.proposalMenu].totalDeals++;
            
            if (data.status === '受注') {
              // 受注の場合は確定日でもフィルター
              const confirmedDate = data.confirmedDate;
              if (!confirmedDate || isDateInRange(confirmedDate, menuDateFilter)) {
                proposalData[data.proposalMenu].receivedOrders++;
                proposalData[data.proposalMenu].totalAmount += data.receivedOrderAmount || 0;
              }
            }
          }
        }
      });
      
      // 全てのメニューを表示（データが0でも表示）
      const proposalStatsArray = Object.entries(proposalData).map(([menu, stats]) => ({
        name: menu,
        totalDeals: stats.totalDeals,
        receivedOrders: stats.receivedOrders,
        totalAmount: stats.totalAmount,
        conversionRate: stats.totalDeals > 0 ? (stats.receivedOrders / stats.totalDeals * 100) : 0
      })).sort((a, b) => {
        // 金額が同じ場合はメニュー名でソート
        if (b.totalAmount === a.totalAmount) {
          return a.name.localeCompare(b.name);
        }
        return b.totalAmount - a.totalAmount;
      });
      
      console.log('✅ 管理者ホーム: メニュー別統計取得成功:', proposalStatsArray);
      setProposalStats(proposalStatsArray);
    } catch (error) {
      console.error('💥 管理者ホーム: メニュー別統計取得エラー:', error);
    }
  }, [menuDateFilter, isDateInRange]);

  // 会社別統計を取得
  const fetchCompanyStats = useCallback(async () => {
    try {
      console.log('🏢 管理者ホーム: 会社別統計取得開始 (フィルター:', companyDateFilter, ')');
      
      const progressRef = collection(db, 'progressDashboard');
      const querySnapshot = await getDocs(progressRef);
      
      // 全体データから会社一覧を取得（フィルター無し）
      const allCompanies = new Set();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.proposalMenu !== '他社案件') {
          const company = data.introducer || '社内';
          allCompanies.add(company);
        }
      });
      
      // 全会社を初期化
      const companyData = {};
      allCompanies.forEach(company => {
        companyData[company] = {
          totalDeals: 0,
          receivedOrders: 0,
          totalAmount: 0
        };
      });
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // 「他社案件」を除外
        if (data.proposalMenu !== '他社案件') {
          // 日付フィルター適用（createdAtまたはupdatedAtを基準）
          const checkDate = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(data.updatedAt || data.createdAt);
          const checkDateString = checkDate ? checkDate.toISOString().split('T')[0] : null;
          
          if (isDateInRange(checkDateString, companyDateFilter)) {
            const company = data.introducer || '社内';
            
            companyData[company].totalDeals++;
            
            if (data.status === '受注') {
              // 受注の場合は確定日でもフィルター
              const confirmedDate = data.confirmedDate;
              if (!confirmedDate || isDateInRange(confirmedDate, companyDateFilter)) {
                companyData[company].receivedOrders++;
                companyData[company].totalAmount += data.receivedOrderAmount || 0;
              }
            }
          }
        }
      });
      
      // 全ての会社を表示（データが0でも表示）
      const companyStatsArray = Object.entries(companyData).map(([company, stats]) => ({
        company,
        ...stats,
        conversionRate: stats.totalDeals > 0 ? (stats.receivedOrders / stats.totalDeals * 100).toFixed(1) : '0.0'
      })).sort((a, b) => {
        // 金額が同じ場合は会社名でソート
        if (b.totalAmount === a.totalAmount) {
          return a.company.localeCompare(b.company);
        }
        return b.totalAmount - a.totalAmount;
      });
      
      console.log('✅ 管理者ホーム: 会社別統計取得成功:', companyStatsArray);
      setCompanyStats(companyStatsArray);
    } catch (error) {
      console.error('💥 管理者ホーム: 会社別統計取得エラー:', error);
    }
  }, [companyDateFilter, isDateInRange]);
  
  // 月次統計を取得（実施月ベース）
  const fetchMonthlyImplementationStats = useCallback(async () => {
    try {
      console.log('📈 管理者ホーム: 月次統計取得開始（実施月ベース）');
      
      // 今月から3ヶ月分の月リストを生成
      const months = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        months.push(date.toISOString().slice(0, 7));
      }
      
      const stats = [];
      
      for (const month of months) {
        // その月が実施月の案件を取得
        const progressRef = collection(db, 'progressDashboard');
        const progressQuery = query(progressRef, 
          where('status', '==', '受注')
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        let totalAmount = 0;
        let dealCount = 0;
        
        progressSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // receivedOrderMonth（実施月）がその月のものをカウント
          const implementationMonth = data.receivedOrderMonth;
          if (implementationMonth && implementationMonth === month && data.proposalMenu !== '他社案件') {
            totalAmount += data.receivedOrderAmount || 0;
            dealCount++;
          }
        });
        
        stats.push({
          month,
          actual: totalAmount,
          dealCount,
          monthLabel: new Date(month + '-01').toLocaleDateString('ja-JP', { month: 'long' })
        });
      }
      
      console.log('✅ 管理者ホーム: 月次統計取得成功（実施月ベース）:', stats);
      setMonthlyImplementationStats(stats);
    } catch (error) {
      console.error('💥 管理者ホーム: 月次統計取得エラー（実施月ベース）:', error);
    }
  }, []);
  
  // データを初期取得
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStatusCounts(),
        fetchCurrentTarget(),
        fetchMonthlyStats(),
        fetchMonthlyImplementationStats(),
        fetchProposalStats(),
        fetchCompanyStats()
      ]);
      setIsLoading(false);
    };
    
    fetchAllData();
  }, [fetchStatusCounts, fetchCurrentTarget, fetchMonthlyStats, fetchMonthlyImplementationStats, fetchProposalStats, fetchCompanyStats]);
  
  // メニュー別フィルター変更時にメニュー別統計のみ更新
  useEffect(() => {
    fetchProposalStats();
  }, [menuDateFilter, fetchProposalStats]);
  
  // 会社別フィルター変更時に会社別統計のみ更新
  useEffect(() => {
    fetchCompanyStats();
  }, [companyDateFilter, fetchCompanyStats]);
  
  // 売上目標を保存
  const handleSaveTarget = async () => {
    if (!salesTarget) {
      alert('売上目標を入力してください');
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('💾 管理者ホーム: 売上目標保存開始');
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const targetAmount = Number(salesTarget);
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        alert('正の数値を入力してください');
        return;
      }
      
      // 既存の目標があるかチェック
      const targetsRef = collection(db, 'salesTargets');
      const q = query(targetsRef,
        where('partnerCompany', '==', '全社'),
        where('month', '==', currentMonth)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // 既存の目標を更新
        const docRef = doc(db, 'salesTargets', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          targetAmount,
          updatedAt: serverTimestamp()
        });
      } else {
        // 新規目標を作成
        await addDoc(targetsRef, {
          partnerCompany: '全社',
          month: currentMonth,
          targetAmount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ 管理者ホーム: 売上目標保存成功');
      
      // データを再取得
      await fetchCurrentTarget();
      await fetchMonthlyStats();
      
      setSalesTarget('');
      alert('売上目標が保存されました');
    } catch (error) {
      console.error('💥 管理者ホーム: 売上目標保存エラー:', error);
      alert('保存に失敗しました: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 金額をフォーマット
  const formatAmount = (amount) => {
    if (!amount) return '¥0';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };
  
  if (isLoading) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          データを読み込み中...
        </div>
      </DashboardContainer>
    );
  }
  
  return (
    <DashboardContainer>
      <Header>
        <CompanyBadge>管理者画面</CompanyBadge>
        <Title>ダッシュボード</Title>
      </Header>

      <GridContainer>
        {/* ステータス別件数サマリー */}
        <Card>
          <CardTitle>
            <FiBarChart />
            ステータス別案件数
          </CardTitle>
          <TotalCountDisplay>
            総案件数：{statusCounts._totalExcludingEnd || 0}件（稼働終了を除く）
          </TotalCountDisplay>
          <StatusGrid>
            {STATUSES.map(status => {
              const count = statusCounts[status] || 0;
              const total = statusCounts._totalExcludingEnd || 0;
              const ratio = total > 0 && status !== '稼働終了' ? ((count / total) * 100).toFixed(1) : '0.0';
              
              return (
                <StatusItem key={status} color={STATUS_COLORS[status]}>
                  <StatusCount color={STATUS_COLORS[status]}>
                    {count}
                  </StatusCount>
                  <StatusLabel>{status}</StatusLabel>
                  {status !== '稼働終了' && total > 0 && (
                    <StatusRatio>
                      {count} / {total} ({ratio}%)
                    </StatusRatio>
                  )}
                </StatusItem>
              );
            })}
          </StatusGrid>
        </Card>

        {/* 売上目標入力 */}
        <Card>
          <CardTitle>
            <FiTarget />
            今月の売上目標（全社）
          </CardTitle>
          
          {currentTarget && (
            <CurrentTarget>
              <strong>現在の目標: {formatAmount(currentTarget.targetAmount)}</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                設定日: {currentTarget.updatedAt?.toDate?.()?.toLocaleDateString('ja-JP') || '不明'}
              </div>
            </CurrentTarget>
          )}
          
          <TargetInputSection>
            <InputLabel>新しい目標金額</InputLabel>
            <InputGroup>
              <Input
                type="number"
                value={salesTarget}
                onChange={(e) => setSalesTarget(e.target.value)}
                placeholder="例：100000000"
                min="1"
              />
              <SaveButton
                onClick={handleSaveTarget}
                disabled={isSaving || !salesTarget}
              >
                {isSaving ? <FiCheck /> : <FiSave />}
                {isSaving ? '保存中...' : '保存'}
              </SaveButton>
            </InputGroup>
            {salesTarget && (
              <div style={{ fontSize: '0.9rem', color: '#3498db', fontWeight: '500' }}>
                プレビュー: {formatAmount(Number(salesTarget))}
              </div>
            )}
          </TargetInputSection>
        </Card>
      </GridContainer>

      {/* メニュー別実績 */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardTitle>
          <FiBarChart />
          メニュー別実績サマリー
        </CardTitle>
        <FilterContainer>
          <FilterLabel>期間フィルター:</FilterLabel>
          <FilterSelect 
            value={menuDateFilter} 
            onChange={(e) => setMenuDateFilter(e.target.value)}
          >
            <option value="3months">直近3ヶ月</option>
            <option value="thisMonth">今月</option>
            <option value="lastMonth">先月</option>
            <option value="all">全体</option>
          </FilterSelect>
          <FilterInfo>現在の期間: {getFilterLabel(menuDateFilter)}</FilterInfo>
        </FilterContainer>
        <CompanyStatsGrid>
          {proposalStats.map((proposal, index) => (
            <CompanyStatCard key={proposal.name} style={{
              borderLeft: `4px solid ${['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6'][index % 5]}`
            }}>
              <CompanyName>{proposal.name}</CompanyName>
              <CompanyValue>{formatAmount(proposal.totalAmount)}</CompanyValue>
              <div style={{ fontSize: '0.7rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                {proposal.receivedOrders}件受注/{proposal.totalDeals}件 ({proposal.conversionRate.toFixed(1)}%)
              </div>
            </CompanyStatCard>
          ))}
        </CompanyStatsGrid>
      </Card>

      {/* 会社別実績 */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardTitle>
          <FiUsers />
          会社別実績サマリー
        </CardTitle>
        <FilterContainer>
          <FilterLabel>期間フィルター:</FilterLabel>
          <FilterSelect 
            value={companyDateFilter} 
            onChange={(e) => setCompanyDateFilter(e.target.value)}
          >
            <option value="3months">直近3ヶ月</option>
            <option value="thisMonth">今月</option>
            <option value="lastMonth">先月</option>
            <option value="all">全体</option>
          </FilterSelect>
          <FilterInfo>現在の期間: {getFilterLabel(companyDateFilter)}</FilterInfo>
        </FilterContainer>
        <CompanyStatsGrid>
          {companyStats.map((company, index) => (
            <CompanyStatCard key={company.company}>
              <CompanyName>{company.company}</CompanyName>
              <CompanyValue>{formatAmount(company.totalAmount)}</CompanyValue>
              <div style={{ fontSize: '0.7rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                {company.receivedOrders}件/{company.totalDeals}件 ({company.conversionRate}%)
              </div>
            </CompanyStatCard>
          ))}
        </CompanyStatsGrid>
      </Card>

      {/* 月次実績グラフエリア */}
      <ChartContainer>
        <Card>
          <CardTitle>
            <FiTrendingUp />
            月次売上実績（直近3ヶ月：決定時期ベース）
          </CardTitle>
          
          <MonthlyStatsGrid>
            {monthlyStats.map((stat, index) => {
              const gradients = [
                '#3498db 0%, #2980b9 100%',
                '#e74c3c 0%, #c0392b 100%',
                '#f39c12 0%, #e67e22 100%'
              ];
              
              return (
                <MonthlyStatCard key={stat.month} gradient={gradients[index]}>
                  <MonthLabel>{stat.monthLabel}</MonthLabel>
                  <StatValue>{formatAmount(stat.actual)}</StatValue>
                  <StatSubtext>{stat.dealCount}件決定</StatSubtext>
                  {stat.target > 0 && (
                    <StatSubtext>
                      目標: {formatAmount(stat.target)} 
                      ({((stat.actual / stat.target) * 100).toFixed(1)}%)
                    </StatSubtext>
                  )}
                </MonthlyStatCard>
              );
            })}
          </MonthlyStatsGrid>
          
          <ChartArea>
            📊 より詳細なグラフ表示機能は今後のアップデートで実装予定です
          </ChartArea>
        </Card>
        
        <Card>
          <CardTitle>
            <FiTrendingUp style={{ color: '#e74c3c' }} />
            月次売上実績(今から3ヶ月：実施月ベース)
          </CardTitle>
          
          <MonthlyStatsGrid>
            {monthlyImplementationStats.map((stat, index) => {
              const gradients = [
                '#e74c3c 0%, #c0392b 100%',
                '#9b59b6 0%, #8e44ad 100%',
                '#f39c12 0%, #e67e22 100%'
              ];
              
              return (
                <MonthlyStatCard key={stat.month} gradient={gradients[index]}>
                  <MonthLabel>{stat.monthLabel}</MonthLabel>
                  <StatValue>{formatAmount(stat.actual)}</StatValue>
                  <StatSubtext>{stat.dealCount}件実施</StatSubtext>
                </MonthlyStatCard>
              );
            })}
          </MonthlyStatsGrid>
        </Card>
      </ChartContainer>
    </DashboardContainer>
  );
}

export default HomeDashboard;