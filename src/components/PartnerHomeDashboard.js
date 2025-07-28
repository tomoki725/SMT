import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiTarget, FiTrendingUp, FiBarChart, FiDollarSign, FiSave, FiCheck, FiUser, FiUsers } from 'react-icons/fi';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { STATUSES, STATUS_COLORS } from '../data/constants.js';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const CompanyBadge = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const SubGridContainer = styled.div`
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
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
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
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
  border-left: 4px solid #667eea;
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
  border-left: 4px solid #667eea;
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
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const FilterInfo = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
  margin-left: auto;
`;

const DepartmentCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const DepartmentTitle = styled.h4`
  color: #495057;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.85rem;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const StatusName = styled.span`
  color: #666;
`;

const StatusNumber = styled.span`
  font-weight: 600;
  color: ${props => props.color || '#2c3e50'};
`;

function PartnerHomeDashboard() {
  const [statusCounts, setStatusCounts] = useState({});
  const [salesTarget, setSalesTarget] = useState('');
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [monthlyImplementationStats, setMonthlyImplementationStats] = useState([]);
  const [representativeStats, setRepresentativeStats] = useState([]);
  const [companyStats, setCompanyStats] = useState([]);
  const [departmentStatusCounts, setDepartmentStatusCounts] = useState({});
  const [dateFilter, setDateFilter] = useState('3months'); // 今月、先月、全体、直近3ヶ月
  
  // パートナー会社を判定
  const getPartnerCompany = () => {
    const path = window.location.pathname;
    if (path.startsWith('/partner-entry/piala')) {
      return '株式会社ピアラ';
    }
    return null;
  };
  
  const partnerCompany = getPartnerCompany();
  
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
  
  // ステータス別件数を取得
  const fetchStatusCounts = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('📊 パートナーホーム: ステータス別件数取得開始');
      
      const progressRef = collection(db, 'progressDashboard');
      const q = query(progressRef, where('introducer', '==', partnerCompany));
      const querySnapshot = await getDocs(q);
      
      const counts = {};
      let totalExcludingEnd = 0; // 稼働終了を除いた総数
      
      STATUSES.forEach(status => {
        counts[status] = 0;
      });
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status && STATUSES.includes(data.status)) {
          counts[data.status] = (counts[data.status] || 0) + 1;
          // 稼働終了以外の案件をカウント
          if (data.status !== '稼働終了') {
            totalExcludingEnd++;
          }
        }
      });
      
      // 総数を保存
      counts._totalExcludingEnd = totalExcludingEnd;
      
      console.log('✅ パートナーホーム: ステータス別件数取得成功:', counts);
      setStatusCounts(counts);
    } catch (error) {
      console.error('💥 パートナーホーム: ステータス別件数取得エラー:', error);
    }
  }, [partnerCompany]);
  
  // 部署別ステータス件数を取得
  const fetchDepartmentStatusCounts = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('🏢 パートナーホーム: 部署別ステータス件数取得開始');
      
      // まず担当者マスターから部署情報を取得
      const representativesRef = collection(db, 'representatives');
      const repQuery = query(representativesRef, where('companyName', '==', partnerCompany));
      const repSnapshot = await getDocs(repQuery);
      
      // 担当者名と部署のマッピングを作成
      const representativeDepartmentMap = {};
      repSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        representativeDepartmentMap[data.name] = data.department || '未設定';
      });
      
      // 案件データを取得
      const progressRef = collection(db, 'progressDashboard');
      const progressQuery = query(progressRef, where('introducer', '==', partnerCompany));
      const progressSnapshot = await getDocs(progressQuery);
      
      // 部署別のステータスカウントを集計
      const departmentCounts = {};
      
      progressSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const representativeName = data.partnerRepresentative || data.representative || '未割当';
        const department = representativeDepartmentMap[representativeName] || '未設定';
        
        if (!departmentCounts[department]) {
          departmentCounts[department] = {};
          STATUSES.forEach(status => {
            departmentCounts[department][status] = 0;
          });
        }
        
        if (data.status && STATUSES.includes(data.status)) {
          departmentCounts[department][data.status] = (departmentCounts[department][data.status] || 0) + 1;
        }
      });
      
      console.log('✅ パートナーホーム: 部署別ステータス件数取得成功:', departmentCounts);
      setDepartmentStatusCounts(departmentCounts);
    } catch (error) {
      console.error('💥 パートナーホーム: 部署別ステータス件数取得エラー:', error);
    }
  }, [partnerCompany]);
  
  // 今月の売上目標を取得
  const fetchCurrentTarget = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('🎯 パートナーホーム: 売上目標取得開始');
      
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const targetsRef = collection(db, 'salesTargets');
      const q = query(targetsRef, 
        where('partnerCompany', '==', partnerCompany),
        where('month', '==', currentMonth)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const targetData = querySnapshot.docs[0].data();
        setCurrentTarget(targetData);
        console.log('✅ パートナーホーム: 売上目標取得成功:', targetData);
      } else {
        setCurrentTarget(null);
        console.log('ℹ️ パートナーホーム: 今月の売上目標未設定');
      }
    } catch (error) {
      console.error('💥 パートナーホーム: 売上目標取得エラー:', error);
    }
  }, [partnerCompany]);
  
  // 担当者別統計を取得
  const fetchRepresentativeStats = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('👤 パートナーホーム: 担当者別統計取得開始 (フィルター:', dateFilter, ')');
      
      const progressRef = collection(db, 'progressDashboard');
      const q = query(progressRef, where('introducer', '==', partnerCompany));
      const querySnapshot = await getDocs(q);
      
      // 全体データから担当者一覧を取得（フィルター無し）
      const allRepresentatives = new Set();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const representative = data.partnerRepresentative || data.representative || '未割当';
        allRepresentatives.add(representative);
      });
      
      // 全担当者を初期化
      const repStats = {};
      allRepresentatives.forEach(representative => {
        repStats[representative] = {
          name: representative,
          total: 0,
          receivedOrders: 0,
          totalAmount: 0,
          statusCounts: {}
        };
        STATUSES.forEach(status => {
          repStats[representative].statusCounts[status] = 0;
        });
      });
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // 日付フィルター適用（createdAtまたはupdatedAtを基準）
        const checkDate = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(data.updatedAt || data.createdAt);
        const checkDateString = checkDate ? checkDate.toISOString().split('T')[0] : null;
        
        if (isDateInRange(checkDateString, dateFilter)) {
          const representative = data.partnerRepresentative || data.representative || '未割当';
          
          repStats[representative].total += 1;
          if (data.status && STATUSES.includes(data.status)) {
            repStats[representative].statusCounts[data.status] += 1;
            
            // 受注の場合は金額も加算
            if (data.status === '受注') {
              // 受注の場合は確定日でもフィルター
              const confirmedDate = data.confirmedDate;
              if (!confirmedDate || isDateInRange(confirmedDate, dateFilter)) {
                repStats[representative].receivedOrders += 1;
                repStats[representative].totalAmount += data.receivedOrderAmount || 0;
              }
            }
          }
        }
      });
      
      // 全ての担当者を表示（データが0でも表示）
      const statsArray = Object.values(repStats).map(rep => ({
        ...rep,
        conversionRate: rep.total > 0 ? ((rep.receivedOrders / rep.total) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => {
        // 金額が同じ場合は担当者名でソート
        if (b.totalAmount === a.totalAmount) {
          return a.name.localeCompare(b.name);
        }
        return b.totalAmount - a.totalAmount;
      });
      
      console.log('✅ パートナーホーム: 担当者別統計取得成功:', statsArray);
      setRepresentativeStats(statsArray);
    } catch (error) {
      console.error('💥 パートナーホーム: 担当者別統計取得エラー:', error);
    }
  }, [partnerCompany, dateFilter, isDateInRange]);

  // 会社別統計を取得
  const fetchCompanyStats = useCallback(async () => {
    try {
      console.log('🏢 パートナーホーム: 会社別統計取得開始');
      
      const progressRef = collection(db, 'progressDashboard');
      const querySnapshot = await getDocs(progressRef);
      
      const companyData = {};
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // 「他社案件」を除外
        if (data.proposalMenu !== '他社案件') {
          const company = data.introducer || '直営業';
          
          if (!companyData[company]) {
            companyData[company] = {
              totalDeals: 0,
              receivedOrders: 0,
              totalAmount: 0
            };
          }
          
          companyData[company].totalDeals++;
          
          if (data.status === '受注') {
            companyData[company].receivedOrders++;
            companyData[company].totalAmount += data.receivedOrderAmount || 0;
          }
        }
      });
      
      const companyStatsArray = Object.entries(companyData).map(([company, stats]) => ({
        company,
        totalDeals: stats.totalDeals,
        receivedOrders: stats.receivedOrders,
        totalAmount: stats.totalAmount,
        conversionRate: stats.totalDeals > 0 ? ((stats.receivedOrders / stats.totalDeals) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => b.totalAmount - a.totalAmount);
      
      console.log('✅ パートナーホーム: 会社別統計取得成功:', companyStatsArray);
      setCompanyStats(companyStatsArray);
    } catch (error) {
      console.error('💥 パートナーホーム: 会社別統計取得エラー:', error);
    }
  }, []);

  // 月次統計を取得（直近3ヶ月の決定案件）
  const fetchMonthlyStats = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('📈 パートナーホーム: 月次統計取得開始');
      
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
          where('introducer', '==', partnerCompany),
          where('status', '==', '受注')
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        let totalAmount = 0;
        let dealCount = 0;
        
        progressSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // confirmedDateがその月のものをカウント
          const confirmedDate = data.confirmedDate;
          if (confirmedDate && confirmedDate.startsWith(month)) {
            totalAmount += data.receivedOrderAmount || 0;
            dealCount++;
          }
        });
        
        // その月の目標を取得
        const targetsRef = collection(db, 'salesTargets');
        const targetQuery = query(targetsRef,
          where('partnerCompany', '==', partnerCompany),
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
      
      console.log('✅ パートナーホーム: 月次統計取得成功:', stats);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('💥 パートナーホーム: 月次統計取得エラー:', error);
    }
  }, [partnerCompany]);
  
  // 月次統計を取得（実施月ベース）
  const fetchMonthlyImplementationStats = useCallback(async () => {
    if (!partnerCompany) return;
    
    try {
      console.log('📈 パートナーホーム: 月次統計取得開始（実施月ベース）');
      
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
          where('introducer', '==', partnerCompany),
          where('status', '==', '受注')
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        let totalAmount = 0;
        let dealCount = 0;
        
        progressSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // receivedOrderMonth（実施月）がその月のものをカウント
          const implementationMonth = data.receivedOrderMonth;
          if (implementationMonth && implementationMonth === month) {
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
      
      console.log('✅ パートナーホーム: 月次統計取得成功（実施月ベース）:', stats);
      setMonthlyImplementationStats(stats);
    } catch (error) {
      console.error('💥 パートナーホーム: 月次統計取得エラー（実施月ベース）:', error);
    }
  }, [partnerCompany]);
  
  // データを初期取得
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStatusCounts(),
        fetchCurrentTarget(),
        fetchMonthlyStats(),
        fetchMonthlyImplementationStats(),
        fetchRepresentativeStats(),
        fetchCompanyStats(),
        fetchDepartmentStatusCounts()
      ]);
      setIsLoading(false);
    };
    
    if (partnerCompany) {
      fetchAllData();
    }
  }, [partnerCompany, fetchStatusCounts, fetchCurrentTarget, fetchMonthlyStats, fetchMonthlyImplementationStats, fetchRepresentativeStats, fetchCompanyStats, fetchDepartmentStatusCounts]);
  
  // 売上目標を保存
  const handleSaveTarget = async () => {
    if (!salesTarget || !partnerCompany) {
      alert('売上目標を入力してください');
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('💾 パートナーホーム: 売上目標保存開始');
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const targetAmount = Number(salesTarget);
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        alert('正の数値を入力してください');
        return;
      }
      
      // 既存の目標があるかチェック
      const targetsRef = collection(db, 'salesTargets');
      const q = query(targetsRef,
        where('partnerCompany', '==', partnerCompany),
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
          partnerCompany,
          month: currentMonth,
          targetAmount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ パートナーホーム: 売上目標保存成功');
      
      // データを再取得
      await fetchCurrentTarget();
      await fetchMonthlyStats();
      
      setSalesTarget('');
      alert('売上目標が保存されました');
    } catch (error) {
      console.error('💥 パートナーホーム: 売上目標保存エラー:', error);
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
        <CompanyBadge>{partnerCompany}</CompanyBadge>
        <Title>パートナーダッシュボード</Title>
      </Header>


      <SubGridContainer>
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
            今月の売上目標
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
                placeholder="例：10000000"
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
              <div style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: '500' }}>
                プレビュー: {formatAmount(Number(salesTarget))}
              </div>
            )}
          </TargetInputSection>
        </Card>
      </SubGridContainer>

      {/* 部署別ステータス集計 */}
      {Object.keys(departmentStatusCounts).length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <CardTitle>
            <FiUsers />
            部署別ステータス集計
          </CardTitle>
          <GridContainer>
            {Object.entries(departmentStatusCounts).map(([department, counts]) => (
              <DepartmentCard key={department}>
                <DepartmentTitle>{department}</DepartmentTitle>
                {STATUSES.map(status => (
                  <StatusRow key={status}>
                    <StatusName>{status}</StatusName>
                    <StatusNumber color={STATUS_COLORS[status]}>
                      {counts[status] || 0}件
                    </StatusNumber>
                  </StatusRow>
                ))}
              </DepartmentCard>
            ))}
          </GridContainer>
        </Card>
      )}

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
                '#667eea 0%, #764ba2 100%',
                '#f093fb 0%, #f5576c 100%',
                '#4facfe 0%, #00f2fe 100%'
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
      </ChartContainer>

      {/* 担当者別案件実績 */}
      <ChartContainer>
        <Card>
          <CardTitle>
            <FiUser />
            担当者別案件実績
          </CardTitle>
          <FilterContainer>
            <FilterLabel>期間フィルター:</FilterLabel>
            <FilterSelect 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="3months">直近3ヶ月</option>
              <option value="thisMonth">今月</option>
              <option value="lastMonth">先月</option>
              <option value="all">全体</option>
            </FilterSelect>
            <FilterInfo>現在の期間: {getFilterLabel(dateFilter)}</FilterInfo>
          </FilterContainer>
          <CompanyStatsGrid>
            {representativeStats.map((rep, index) => (
              <CompanyStatCard key={rep.name}>
                <CompanyName>{rep.name}</CompanyName>
                <CompanyValue>{formatAmount(rep.totalAmount)}</CompanyValue>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                  {rep.receivedOrders}件/{rep.total}件 ({rep.conversionRate}%)
                </div>
              </CompanyStatCard>
            ))}
          </CompanyStatsGrid>
        </Card>
      </ChartContainer>
      
      {/* 月次売上実績（実施月ベース） */}
      <ChartContainer>
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

export default PartnerHomeDashboard;