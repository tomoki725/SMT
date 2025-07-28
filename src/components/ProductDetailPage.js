import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft, FiUser, FiCalendar, FiTag, FiEdit, FiFileText, FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { mockDeals, introducers } from '../data/mockData.js';
import { STATUS_COLORS, STATUSES } from '../data/constants.js';
import { db } from '../firebase.js';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const DetailContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  color: #2c3e50;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const Title = styled.h1`
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CardTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoValue = styled.span`
  color: #2c3e50;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background-color: ${props => STATUS_COLORS[props.status] || '#95a5a6'};
  display: inline-block;
`;

const TimelineContainer = styled.div`
  grid-column: 1 / -1;
`;

const TimelineCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Timeline = styled.div`
  position: relative;
  padding-left: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    left: 0.75rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e9ecef;
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    left: -0.75rem;
    top: 0.5rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3498db;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #3498db;
  }
  
  &:last-child {
    padding-bottom: 0;
  }
`;

const TimelineDate = styled.div`
  font-weight: 600;
  color: #3498db;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const TimelineContent = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3498db;
  position: relative;
`;

const TimelineTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
`;

const TimelineText = styled.p`
  margin: 0 0 1rem 0;
  color: #2c3e50;
  line-height: 1.5;
`;

const TimelineSummary = styled.div`
  background: #e8f4fd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
`;

const SummaryLabel = styled.span`
  font-weight: 600;
  color: #2980b9;
  font-size: 0.875rem;
`;

const SummaryText = styled.p`
  margin: 0.25rem 0 0 0;
  color: #2c3e50;
  font-size: 0.875rem;
`;

const NextActionSection = styled.div`
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.75rem;
`;

const NextActionLabel = styled.span`
  font-weight: 600;
  color: #856404;
  font-size: 0.875rem;
`;

const NextActionText = styled.p`
  margin: 0.25rem 0 0 0;
  color: #2c3e50;
  font-size: 0.875rem;
`;

const UrgentBadge = styled.span`
  background: #e74c3c;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
`;

const EditButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 2.5rem;
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: #f0f0f0;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: #f0f0f0;
  }
`;

const EditForm = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &.primary {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }
  
  &.success {
    background: #27ae60;
    color: white;
    
    &:hover {
      background: #219a52;
    }
  }
  
  &.secondary {
    background: #95a5a6;
    color: white;
    
    &:hover {
      background: #7f8c8d;
    }
  }
`;

const AddActionSection = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deal, setDeal] = useState(null);
  
  // パートナー向けかどうかを判定
  const isPartnerView = window.location.pathname.startsWith('/partner-entry');
  
  // パートナー会社を判定
  const getPartnerCompany = () => {
    const path = window.location.pathname;
    if (path.startsWith('/partner-entry/piala')) {
      return '株式会社ピアラ';
    }
    return null;
  };
  
  const partnerCompany = getPartnerCompany();
  
  // Firestoreから案件データを取得
  const fetchDealData = async () => {
    try {
      console.log('🔍 Firestoreから案件データ取得開始:', id);
      console.log('🏢 パートナー向けアクセス:', isPartnerView, 'パートナー会社:', partnerCompany);
      
      // progressDashboardコレクションから案件を取得
      const progressRef = collection(db, 'progressDashboard');
      const dealDoc = await getDoc(doc(progressRef, id));
      
      if (dealDoc.exists()) {
        const dealData = {
          id: dealDoc.id,
          ...dealDoc.data(),
          // 日付フィールドの処理
          lastContactDate: dealDoc.data().lastContactDate?.toDate?.()?.toLocaleDateString('ja-JP') || 
                          dealDoc.data().lastContactDate || null,
          nextActionDate: dealDoc.data().nextActionDate || null,
          createdAt: dealDoc.data().createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: dealDoc.data().updatedAt?.toDate?.()?.toISOString() || null
        };
        
        // パートナー向けアクセスの場合は権限チェック（厳格にパートナー会社のみ）
        if (isPartnerView && partnerCompany) {
          const hasAccess = dealData.introducer === partnerCompany;
          if (!hasAccess) {
            console.warn('❌ パートナーアクセス権限なし:', {
              dealIntroducer: dealData.introducer,
              dealIntroducerId: dealData.introducerId,
              partnerCompany: partnerCompany
            });
            setError('この案件にアクセスする権限がありません。');
            setDeal(null);
            return;
          }
        }
        
        console.log('✅ 案件データ取得成功:', dealData);
        setDeal(dealData);
      } else {
        console.warn('⚠️ 案件が見つかりません:', id);
        setError('指定された案件が見つかりません。');
        setDeal(null);
      }
    } catch (error) {
      console.error('💥 案件データ取得エラー:', error);
      setError('案件データの取得中にエラーが発生しました。');
      setDeal(null);
    }
  };

  // Firestoreからアクションログを取得
  const fetchActionLogs = async () => {
    if (!deal || !deal.productName) {
      setError('案件データが不正です');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Firestoreからアクションログ取得開始:', {
        dealId: deal.id,
        productName: deal.productName,
        proposalMenu: deal.proposalMenu
      });

      const actionLogsRef = collection(db, 'actionLogs');
      
      // まず全てのアクションログを取得してクライアントサイドでフィルタリング
      console.log('📋 全アクションログを取得してフィルタリング...');
      const allLogsQuery = query(actionLogsRef);
      const querySnapshot = await getDocs(allLogsQuery);
      
      let allLogs = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const log = {
          id: docSnap.id,
          ...data,
          // Timestamp型をISO文字列に変換
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          actionDate: data.actionDate || data.createdAt?.toDate?.()?.toLocaleDateString('ja-JP'),
          nextActionDate: data.nextActionDate || null
        };
        
        // フィルタリング条件
        const matchesDealId = log.dealId === deal.id;
        const matchesProductName = log.productName === deal.productName;
        const matchesProductAndMenu = log.productName === deal.productName && 
                                     log.proposalMenu === deal.proposalMenu;
        
        // パートナー画面の場合は紹介者フィルタリングを追加
        const partnerFilter = !isPartnerView || (log.introducer === partnerCompany);
        
        if ((matchesDealId || matchesProductName || matchesProductAndMenu) && partnerFilter) {
          allLogs.push(log);
          console.log('🎯 マッチしたログ:', {
            logId: log.id,
            reason: matchesDealId ? 'dealId' : matchesProductAndMenu ? 'product+menu' : 'product',
            partnerFiltered: isPartnerView ? 'パートナーフィルタ適用' : '全社表示'
          });
        }
      });
      
      // 作成日時でソート（新しい順）
      allLogs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setActionLogs(allLogs);
      console.log('🎉 アクションログ取得完了:', allLogs.length, '件');
      
    } catch (err) {
      console.error('💥 アクションログ取得エラー:', err);
      setError(`アクションログの取得に失敗しました: ${err.message}`);
      
      // フォールバック: モックデータまたは空配列
      const fallbackLogs = deal.logs || [];
      setActionLogs(fallbackLogs);
      console.log('🔄 フォールバックデータ使用:', fallbackLogs.length, '件');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchDealData();
  }, [id]);
  
  // dealが設定された後にアクションログを取得
  useEffect(() => {
    if (deal) {
      fetchActionLogs();
    }
  }, [deal]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <DetailContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <FiArrowLeft />
            戻る
          </BackButton>
          <Title>エラー</Title>
        </Header>
        <InfoCard>
          <div style={{ color: '#e74c3c', textAlign: 'center' }}>
            {error}
          </div>
        </InfoCard>
      </DetailContainer>
    );
  }

  if (!deal) {
    return (
      <DetailContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <FiArrowLeft />
            戻る
          </BackButton>
          <Title>案件詳細</Title>
        </Header>
        <InfoCard>
          <div style={{ color: '#e74c3c', textAlign: 'center' }}>
            案件が見つかりません
          </div>
        </InfoCard>
      </DetailContainer>
    );
  }

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 紹介者名を取得
  const getIntroducerName = (introducerId) => {
    const introducer = introducers.find(i => i.id === introducerId);
    return introducer ? introducer.name : '';
  };

  // 期日が1週間以内かチェック
  const isUrgent = (dateString) => {
    if (!dateString) return false;
    const nextActionDate = new Date(dateString);
    const today = new Date();
    const oneWeekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextActionDate <= oneWeekFromToday;
  };


  const handleEditLog = (log) => {
    setEditingLog(log.id);
    setEditFormData({
      title: log.title || log.action || '',
      actionDate: log.actionDate || formatDate(log.createdAt),
      actionDetails: log.actionDetails || log.description || '',
      summary: log.summary || '',
      nextAction: log.nextAction,
      nextActionDate: log.nextActionDate || '',
      status: log.status
    });
  };

  const handleSaveEdit = async () => {
    try {
      console.log('🔄 ログ更新開始:', editFormData);
      
      // actionLogsコレクションを更新
      const logRef = doc(db, 'actionLogs', editingLog);
      await updateDoc(logRef, {
        action: editFormData.title || editFormData.action,
        description: editFormData.actionDetails || editFormData.description,
        summary: editFormData.summary,
        nextAction: editFormData.nextAction,
        nextActionDate: editFormData.nextActionDate,
        status: editFormData.status,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ ログ更新成功');
      
      // ローカル状態を更新
      setActionLogs(prev => prev.map(log => 
        log.id === editingLog ? { 
          ...log, 
          action: editFormData.title || editFormData.action || log.action,
          description: editFormData.actionDetails || editFormData.description || log.description,
          summary: editFormData.summary || log.summary,
          nextAction: editFormData.nextAction || log.nextAction,
          nextActionDate: editFormData.nextActionDate || log.nextActionDate,
          status: editFormData.status || log.status
        } : log
      ));
      
      // 最新のアクションログを取得してprogressDashboardを更新
      const updatedLogs = actionLogs.map(log => 
        log.id === editingLog ? { 
          ...log, 
          action: editFormData.title || editFormData.action || log.action,
          description: editFormData.actionDetails || editFormData.description || log.description,
          summary: editFormData.summary || log.summary,
          nextAction: editFormData.nextAction || log.nextAction,
          nextActionDate: editFormData.nextActionDate || log.nextActionDate,
          status: editFormData.status || log.status,
          updatedAt: new Date()
        } : log
      );
      
      // 最新のログを特定（更新日時が最新のもの）
      const latestLog = updatedLogs.reduce((latest, log) => {
        const latestDate = latest.updatedAt || latest.createdAt || new Date(0);
        const logDate = log.updatedAt || log.createdAt || new Date(0);
        return new Date(logDate) > new Date(latestDate) ? log : latest;
      }, updatedLogs[0]);
      
      // progressDashboardを更新
      if (deal.id && latestLog) {
        console.log('🔄 progressDashboard更新開始:', deal.id);
        const progressRef = doc(db, 'progressDashboard', deal.id);
        await updateDoc(progressRef, {
          status: latestLog.status,
          nextAction: latestLog.nextAction || '',
          nextActionDate: latestLog.nextActionDate || '',
          lastContactDate: new Date().toLocaleDateString('ja-JP'),
          updatedAt: serverTimestamp()
        });
        console.log('✅ progressDashboard更新成功');
        
        // deal状態も更新
        setDeal(prev => ({
          ...prev,
          status: latestLog.status,
          nextAction: latestLog.nextAction || '',
          nextActionDate: latestLog.nextActionDate || ''
        }));
      }
      
      // 成功時のフィードバック
      const saveButton = document.querySelector(`[data-editing-log="${editingLog}"] .save-button`);
      if (saveButton) {
        saveButton.style.background = '#27ae60';
        saveButton.innerHTML = '✓ 保存完了';
        setTimeout(() => {
          setEditingLog(null);
          setEditFormData({});
        }, 1000);
      } else {
        alert('ログが更新されました！');
        setEditingLog(null);
        setEditFormData({});
      }
    } catch (error) {
      console.error('💥 ログ更新エラー:', error);
      alert('更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditFormData({});
  };

  const handleDeleteLog = async (logId, logTitle) => {
    if (!window.confirm(`「${logTitle || 'このアクションログ'}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      console.log('🗑️ アクションログ削除開始:', logId);
      
      // Firestoreからアクションログを削除
      const logRef = doc(db, 'actionLogs', logId);
      await deleteDoc(logRef);
      
      console.log('✅ アクションログ削除成功:', logId);
      
      // ローカル状態からも削除
      const updatedLogs = actionLogs.filter(log => log.id !== logId);
      setActionLogs(updatedLogs);
      
      // 残っているログから最新のものを取得してprogressDashboardを更新
      if (deal.id && updatedLogs.length > 0) {
        console.log('🔄 最新アクションログでprogressDashboard更新開始');
        
        // 最新のログを特定（更新日時が最新のもの）
        const latestLog = updatedLogs.reduce((latest, log) => {
          const latestDate = latest.updatedAt || latest.createdAt || new Date(0);
          const logDate = log.updatedAt || log.createdAt || new Date(0);
          return new Date(logDate) > new Date(latestDate) ? log : latest;
        }, updatedLogs[0]);
        
        console.log('📋 最新アクションログ:', latestLog);
        
        // progressDashboardを更新
        const progressRef = doc(db, 'progressDashboard', deal.id);
        await updateDoc(progressRef, {
          status: latestLog.status || deal.status,
          nextAction: latestLog.nextAction || '',
          nextActionDate: latestLog.nextActionDate || '',
          summary: latestLog.summary || deal.summary || '',
          lastContactDate: latestLog.actionDate || latestLog.createdAt?.split('T')[0] || deal.lastContactDate,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ progressDashboard更新成功');
        
        // deal状態も更新
        setDeal(prev => ({
          ...prev,
          status: latestLog.status || prev.status,
          nextAction: latestLog.nextAction || '',
          nextActionDate: latestLog.nextActionDate || '',
          summary: latestLog.summary || prev.summary || '',
          lastContactDate: latestLog.actionDate || latestLog.createdAt?.split('T')[0] || prev.lastContactDate
        }));
        
      } else if (deal.id && updatedLogs.length === 0) {
        // ログが全て削除された場合は次回アクションをクリア
        console.log('🔄 全ログ削除によりprogressDashboardクリア');
        
        const progressRef = doc(db, 'progressDashboard', deal.id);
        await updateDoc(progressRef, {
          nextAction: '',
          nextActionDate: '',
          summary: '',
          updatedAt: serverTimestamp()
        });
        
        setDeal(prev => ({
          ...prev,
          nextAction: '',
          nextActionDate: '',
          summary: ''
        }));
      }
      
      // 削除成功の通知
      alert('アクションログを削除しました。');
      
    } catch (error) {
      console.error('💥 アクションログ削除エラー:', error);
      alert('削除に失敗しました。もう一度お試しください。');
    }
  };

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBack = () => {
    if (isPartnerView) {
      // パートナー向けの場合は前のページ（カンバンボードまたはダッシュボード）に戻る
      const referrer = document.referrer;
      if (referrer.includes('/kanban')) {
        navigate('/partner-entry/piala/kanban');
      } else {
        navigate('/partner-entry/piala/dashboard');
      }
    } else {
      // 管理者向けの場合は通常の戻る
      navigate(-1);
    }
  };

  const handleAddAction = () => {
    // パートナー向けかどうかを判定
    const isPartnerView = window.location.pathname.startsWith('/partner-entry');
    
    // 案件情報を事前入力してアクションログ記録ページに遷移
    const params = new URLSearchParams({
      productName: deal.productName || '',
      proposalMenu: deal.proposalMenu || '',
      representative: isPartnerView 
        ? (deal.partnerRepresentative || deal.representative || '') 
        : (deal.representative || ''),
      introducerId: isPartnerView 
        ? (deal.introducerId ? deal.introducerId.toString() : '1') 
        : (deal.introducerId ? deal.introducerId.toString() : '4'),
      introducer: deal.introducer || ''
    });
    
    const logEntryPath = isPartnerView 
      ? `/partner-entry/piala/log-entry?${params.toString()}`
      : `/log-entry?${params.toString()}`;
    
    navigate(logEntryPath);
  };

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={handleBack}>
          <FiArrowLeft />
          戻る
        </BackButton>
        <Title>{deal.productName}</Title>
      </Header>

      <ContentGrid>
        <InfoCard>
          <CardTitle>
            <FiTag />
            案件情報
          </CardTitle>
          <InfoGrid>
            <InfoRow>
              <InfoLabel>
                <FiFileText />
                提案メニュー
              </InfoLabel>
              <InfoValue>{deal.proposalMenu}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>
                <FiUser />
                担当者
              </InfoLabel>
              <InfoValue>
                {/* Ver 2.2: パートナー画面では担当者のみ、管理者画面では併記表示 */}
                {isPartnerView ? (
                  // パートナー画面：パートナー担当者のみ表示
                  deal.partnerRepresentative || deal.representative || '-'
                ) : (
                  // 管理者画面：社内／パートナー併記表示
                  deal.representative && deal.partnerRepresentative ? (
                    // 両方存在する場合は併記
                    `${deal.representative}（社内）／${deal.partnerRepresentative}（${deal.introducer?.replace('株式会社', '') || 'パートナー'}）`
                  ) : deal.representative ? (
                    // 社内担当者のみ
                    `${deal.representative}（社内）`
                  ) : deal.partnerRepresentative ? (
                    // パートナー担当者のみ
                    `${deal.partnerRepresentative}（${deal.introducer?.replace('株式会社', '') || 'パートナー'}）`
                  ) : (
                    // どちらもない場合
                    '-'
                  )
                )}
              </InfoValue>
            </InfoRow>
            {/* 紹介者欄を表示（パートナー画面では非表示） */}
            {!isPartnerView && (
              <InfoRow>
                <InfoLabel>
                  <FiUser />
                  紹介者
                </InfoLabel>
                <InfoValue>{deal.introducer || '-'}</InfoValue>
              </InfoRow>
            )}
            <InfoRow>
              <InfoLabel>
                <FiTag />
                ステータス
              </InfoLabel>
              <InfoValue>
                <StatusBadge status={deal.status}>
                  {deal.status}
                </StatusBadge>
              </InfoValue>
            </InfoRow>
          </InfoGrid>
        </InfoCard>

        <InfoCard>
          <CardTitle>
            <FiCalendar />
            進捗状況
          </CardTitle>
          <InfoGrid>
            <InfoRow>
              <InfoLabel>最終接触日</InfoLabel>
              <InfoValue>{deal.lastContactDate}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>次回アクション</InfoLabel>
              <InfoValue>
                {deal.nextAction}
                {deal.nextActionDate && isUrgent(deal.nextActionDate) && (
                  <UrgentBadge>急</UrgentBadge>
                )}
              </InfoValue>
            </InfoRow>
            {deal.nextActionDate && (
              <InfoRow>
                <InfoLabel>次回アクション期日</InfoLabel>
                <InfoValue>{deal.nextActionDate}</InfoValue>
              </InfoRow>
            )}
          </InfoGrid>
        </InfoCard>

        <TimelineContainer>
          <TimelineCard>
            <CardTitle>
              <FiFileText />
              アクションログ
            </CardTitle>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                アクションログを読み込み中...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
                {error}
              </div>
            ) : (
            <Timeline>
                {actionLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    まだアクションログがありません
                  </div>
                ) : (
                  actionLogs.map(log => (
                <TimelineItem key={log.id}>
                  <TimelineDate>
                        {formatDate(log.createdAt) || log.actionDate}
                  </TimelineDate>
                  <TimelineContent>
                    <EditButton onClick={() => handleEditLog(log)}>
                      <FiEdit />
                    </EditButton>
                    <DeleteButton onClick={() => handleDeleteLog(log.id, log.action || log.title)}>
                      <FiTrash2 />
                    </DeleteButton>
                    
                    {editingLog === log.id ? (
                      <EditForm>
                        <FormGroup>
                          <Label>タイトル</Label>
                          <Input
                            type="text"
                            value={editFormData.title}
                            onChange={(e) => handleFormChange('title', e.target.value)}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label>アクション日</Label>
                          <Input
                            type="date"
                            value={editFormData.actionDate}
                            onChange={(e) => handleFormChange('actionDate', e.target.value)}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label>議事録</Label>
                          <TextArea
                            value={editFormData.actionDetails}
                            onChange={(e) => handleFormChange('actionDetails', e.target.value)}
                            placeholder="議事録の内容を編集してください"
                            rows={4}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label>要約</Label>
                          <TextArea
                            value={editFormData.summary}
                            onChange={(e) => handleFormChange('summary', e.target.value)}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label>次回アクション</Label>
                          <Input
                            type="text"
                            value={editFormData.nextAction}
                            onChange={(e) => handleFormChange('nextAction', e.target.value)}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                              <Label>次回アクション期日</Label>
                          <Input
                            type="date"
                            value={editFormData.nextActionDate}
                            onChange={(e) => handleFormChange('nextActionDate', e.target.value)}
                          />
                        </FormGroup>
                        
                        <FormGroup>
                          <Label>ステータス</Label>
                          <Select
                            value={editFormData.status}
                            onChange={(e) => handleFormChange('status', e.target.value)}
                          >
                            {STATUSES.map(status => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Select>
                        </FormGroup>
                        
                        <ButtonGroup data-editing-log={editingLog}>
                              <Button className="success save-button" onClick={handleSaveEdit}>
                                <FiSave />
                                保存
                              </Button>
                          <Button className="secondary" onClick={handleCancelEdit}>
                            <FiX />
                            キャンセル
                          </Button>
                        </ButtonGroup>
                      </EditForm>
                    ) : (
                      <>
                            <TimelineTitle>{log.action || log.title || 'アクション'}</TimelineTitle>
                        
                        {log.summary && (
                          <TimelineSummary>
                                <SummaryLabel>要約:</SummaryLabel>
                            <SummaryText>{log.summary}</SummaryText>
                          </TimelineSummary>
                        )}
                        
                        {log.nextAction && (
                          <NextActionSection>
                                <NextActionLabel>次回アクション:</NextActionLabel>
                            <NextActionText>
                              {log.nextAction}
                                  {log.nextActionDate && ` (${formatDate(log.nextActionDate)})`}
                                  {log.nextActionDate && isUrgent(log.nextActionDate) && (
                                    <UrgentBadge>急</UrgentBadge>
                              )}
                            </NextActionText>
                          </NextActionSection>
                        )}
                      </>
                    )}
                  </TimelineContent>
                </TimelineItem>
                  ))
                )}
            </Timeline>
            )}
          </TimelineCard>
        </TimelineContainer>
      </ContentGrid>

      <AddActionSection>
        <Button className="primary" onClick={handleAddAction}>
          <FiPlus />
          新しいアクションを追加
        </Button>
      </AddActionSection>
    </DetailContainer>
  );
}

export default ProductDetailPage; 