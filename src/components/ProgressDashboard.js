import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiFilter, FiSearch, FiEye, FiCalendar, FiUser, FiTag, FiPlus, FiTrash2, FiEdit3, FiChevronUp, FiChevronDown, FiMinus } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockDeals, introducers } from '../data/mockData.js';
import { STATUS_COLORS, SALES_REPRESENTATIVES, STATUSES } from '../data/constants.js';
import { db } from '../firebase.js';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import ReceivedOrderModal from './ReceivedOrderModal.js';
import { updateDealOrderInfo } from '../services/salesService.js';
import { useUndoContext } from '../contexts/UndoContext.js';

const DashboardContainer = styled.div`
  width: 100%;
  padding: 0 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0;
`;

const FilterSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 180px 180px 180px;
  gap: 1rem;
  align-items: end;
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  /* スクロールバーのスタイリング */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
    
    &:hover {
      background: #555;
    }
  }
`;

const Table = styled.table`
  min-width: 1400px; /* 最小幅を設定して横スクロールを発生させる */
  width: 100%;
  background: white;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #eee;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  user-select: none;
  position: relative;
  
  &:hover {
    background-color: ${props => props.sortable ? '#f0f0f0' : 'transparent'};
  }
  
  .sort-indicator {
    margin-left: 0.5rem;
    font-size: 0.8rem;
    color: #666;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: ${props => STATUS_COLORS[props.status] || '#95a5a6'};
`;

const ActionButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &.view {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }
  
  &.add {
    background: #27ae60;
    color: white;
    
    &:hover {
      background: #219a52;
    }
  }
  
  &.edit {
    background: #f39c12;
    color: white;
    
    &:hover {
      background: #e67e22;
    }
  }
`;

const UrgentBadge = styled.span`
  background: #e74c3c;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
`;

const DeleteButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: #e74c3c;
  color: white;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: #c0392b;
  }
`;


const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
`;

const ModalText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #555;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &.cancel {
    background: #e0e0e0;
    color: #333;
    
    &:hover {
      background: #bdbdbd;
    }
  }
  
  &.delete {
    background: #e74c3c;
    color: white;
    
    &:hover {
      background: #c0392b;
    }
  }
`;

const ActionsCell = styled.div`
  display: flex;
  align-items: center;
`;

function ProgressDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [representativeFilter, setRepresentativeFilter] = useState('');
  const [introducerFilter, setIntroducerFilter] = useState('');
  const [deals, setDeals] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, deal: null });
  const [editModal, setEditModal] = useState({ show: false, deal: null });
  const [receivedOrderModal, setReceivedOrderModal] = useState({ show: false, deal: null });
  const [introducersList, setIntroducersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const navigate = useNavigate();
  const location = useLocation();
  const { recordAction } = useUndoContext();
  
  // パートナー向けかどうかを判定
  const isPartnerView = window.location.pathname.startsWith('/partner') || 
                       window.location.pathname.startsWith('/partner-entry');
  
  // パートナー会社を判定
  const getPartnerCompany = () => {
    const path = window.location.pathname;
    if (path.startsWith('/partner-entry/piala')) {
      return '株式会社ピアラ';
    }
    return null;
  };
  
  const partnerCompany = getPartnerCompany();
  
  // Firestoreから進捗データを取得
  useEffect(() => {
    fetchProgressData();
    fetchIntroducers();
  }, []);
  
  // ページがフォーカスされた時に自動リロード
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 ProgressDashboard: ページがアクティブになったため、データを再取得');
        fetchProgressData();
      }
    };
    
    const handleFocus = () => {
      console.log('🔄 ProgressDashboard: ウィンドウがフォーカスされたため、データを再取得');
      fetchProgressData();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // ルート変更時にもデータを再取得
  useEffect(() => {
    console.log('🔄 ProgressDashboard: ルート変更検知、データ再取得');
    fetchProgressData();
  }, [location.pathname]);
  
  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Firestoreから進捗データ取得開始');
      
      const progressRef = collection(db, 'progressDashboard');
      const q = query(progressRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const progressItems = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        progressItems.push({
          id: docSnap.id,
          ...data,
          // 日付フィールドの統一処理
          lastContactDate: data.lastContactDate?.toDate?.()?.toLocaleDateString('ja-JP') || 
                          data.lastContactDate || null,
          nextActionDate: data.nextActionDate || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        });
      });
      
      console.log('✅ 進捗データ取得成功:', progressItems.length, '件');
      setDeals(progressItems);
    } catch (error) {
      console.error('💥 進捗データ取得エラー:', error);
      // エラー時はモックデータを使用
      setDeals(mockDeals);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusChange = async (dealId, newStatus) => {
    try {
      console.log('🔄 ステータス更新開始:', dealId, newStatus);
      
      // 「受注」ステータスの場合は受注情報入力モーダルを表示
      if (newStatus === '受注') {
        const targetDeal = deals.find(deal => deal.id === dealId);
        if (targetDeal) {
          setReceivedOrderModal({ show: true, deal: targetDeal });
          return; // モーダル表示して処理を一時停止
        }
      }
      
      // 通常のステータス更新処理
      const progressRef = doc(db, 'progressDashboard', dealId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      // 「受注」ステータスに変更された時は確定日を自動記録
      if (newStatus === '受注') {
        updateData.confirmedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      }
      
      await updateDoc(progressRef, updateData);
      
      console.log('✅ ステータス更新成功');
      
      // ローカル状態を更新
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, status: newStatus } : deal
      ));
      
      // 成功時のフィードバック
      const statusElement = document.querySelector(`[data-deal-id="${dealId}"] select`);
      if (statusElement) {
        statusElement.style.background = '#d4edda';
        statusElement.style.borderColor = '#c3e6cb';
        setTimeout(() => {
          statusElement.style.background = '';
          statusElement.style.borderColor = '';
        }, 1000);
      }
      
    } catch (error) {
      console.error('💥 ステータス更新エラー:', error);
      alert('ステータス更新に失敗しました。もう一度お試しください。');
      // エラー時は元の状態に戻す
      await fetchProgressData();
    }
  };
  
  // 受注情報保存処理
  const handleSaveReceivedOrder = async (orderData) => {
    try {
      setIsSavingOrder(true);
      console.log('💾 受注情報保存開始:', orderData);
      
      // salesService経由で受注情報を保存
      await updateDealOrderInfo(
        orderData.dealId,
        orderData.receivedOrderMonth,
        orderData.receivedOrderAmount
      );
      
      console.log('✅ 受注情報保存成功');
      
      // データを再取得してUI更新
      await fetchProgressData();
      
      // モーダルを閉じる
      setReceivedOrderModal({ show: false, deal: null });
      
      // 成功メッセージ
      alert('受注情報が保存されました');
      
    } catch (error) {
      console.error('💥 受注情報保存エラー:', error);
      alert('受注情報の保存に失敗しました: ' + error.message);
    } finally {
      setIsSavingOrder(false);
    }
  };
  
  // 受注モーダルのキャンセル処理
  const handleCancelReceivedOrder = () => {
    // ステータスセレクトの値を元に戻す（選択前の状態）
    const deal = receivedOrderModal.deal;
    if (deal) {
      const statusElement = document.querySelector(`[data-deal-id="${deal.id}"] select`);
      if (statusElement) {
        statusElement.value = deal.status; // 元のステータスに戻す
      }
    }
    setReceivedOrderModal({ show: false, deal: null });
  };

  // 新規/既存タイプ変更処理
  const handleDealTypeChange = async (dealId, newDealType) => {
    try {
      console.log('🔄 案件タイプ更新開始:', dealId, newDealType);
      
      const progressRef = doc(db, 'progressDashboard', dealId);
      await updateDoc(progressRef, {
        dealType: newDealType,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 案件タイプ更新成功');
      
      // ローカル状態を更新
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, dealType: newDealType } : deal
      ));
      
      // 成功時のフィードバック
      const dealTypeElement = document.querySelector(`[data-deal-id="${dealId}"] select[value="${newDealType || ''}"]`);
      if (dealTypeElement && dealTypeElement !== document.querySelector(`[data-deal-id="${dealId}"] select[value="${deals.find(d => d.id === dealId)?.status}"]`)) {
        dealTypeElement.style.background = '#d4edda';
        dealTypeElement.style.borderColor = '#c3e6cb';
        setTimeout(() => {
          dealTypeElement.style.background = getDealTypeColor(newDealType);
          dealTypeElement.style.borderColor = '#ddd';
        }, 1000);
      }
      
    } catch (error) {
      console.error('💥 案件タイプ更新エラー:', error);
      alert('案件タイプの更新に失敗しました。もう一度お試しください。');
      // エラー時は元の状態に戻す
      await fetchProgressData();
    }
  };

  // 新規/既存タイプ用カラーコード取得
  const getDealTypeColor = (dealType) => {
    const DEAL_TYPE_COLORS = {
      '新規': '#e3f2fd', // 淡い青色（新規顧客）
      '既存': '#e8f5e8', // 淡い緑色（既存顧客）
      '': '#f8f9fa'      // グレー（未設定）
    };
    return DEAL_TYPE_COLORS[dealType] || DEAL_TYPE_COLORS[''];
  };
  
  const fetchIntroducers = async () => {
    try {
      console.log('📋 紹介者データをFirestoreから取得開始');
      
      const introducersRef = collection(db, 'introducers');
      const q = query(introducersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const introducersData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        introducersData.push({
          id: docSnap.id,
          ...data
        });
      });
      
      console.log('✅ 紹介者データ取得成功:', introducersData.length, '件');
      setIntroducersList(introducersData);
    } catch (error) {
      console.error('💥 紹介者データ取得エラー:', error);
      // エラー時はモックデータを使用
      setIntroducersList(introducers);
    }
  };

  const handleDelete = async (deal) => {
    try {
      console.log('🗑 案件削除開始:', deal.id);
      
      // 削除前に案件データをバックアップ
      const dealBackup = { ...deal };
      
      // Firestoreから案件を削除
      await deleteDoc(doc(db, 'progressDashboard', deal.id));
      
      console.log('✅ 案件削除成功');
      
      // Undo操作を記録
      recordAction({
        type: 'DELETE_DEAL',
        description: `案件「${deal.productName}」を削除`,
        undoFunction: async () => {
          // 削除された案件を復元
          const docRef = doc(db, 'progressDashboard', dealBackup.id);
          
          // createdAt, updatedAtを適切に復元
          const restoreData = {
            ...dealBackup,
            updatedAt: serverTimestamp()
          };
          
          // Timestampフィールドを除去（setDocで自動生成される）
          if (restoreData.id) delete restoreData.id;
          
          await setDoc(docRef, restoreData);
          console.log('🔄 案件復元完了:', dealBackup.productName);
          
          // データを再取得して画面を更新
          await fetchProgressData();
        }
      });
      
      // 削除成功後、データを再取得
      await fetchProgressData();
      setDeleteModal({ show: false, deal: null });
      // alert('案件が削除されました'); // 通知は不要（undo通知で代替）
    } catch (error) {
      console.error('💥 削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // 期日が1週間以内かチェック
  const isUrgent = (dateString) => {
    if (!dateString) return false;
    const nextActionDate = new Date(dateString);
    const today = new Date();
    const oneWeekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextActionDate <= oneWeekFromToday;
  };

  // 紹介者名を取得（useCallbackで安定化）
  const getIntroducerName = useCallback((deal) => {
    if (!deal) return '';
    
    // 直接保存された紹介者名がある場合はそれを優先
    if (deal.introducer && deal.introducer.trim() !== '') {
      return deal.introducer;
    }
    
    // introducerIdがある場合はIDから検索
    if (deal.introducerId) {
      const introducer = introducersList.find(i => i.id === deal.introducerId);
      return introducer ? introducer.name : '';
    }
    
    return '';
  }, [introducersList]);

  // ソート機能
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = 'none';
      } else {
        direction = 'asc';
      }
    }
    setSortConfig({ key, direction });
  };

  // フィルタリング&ソートされたデータ
  const filteredDeals = useMemo(() => {
    if (!Array.isArray(deals)) return [];
    
    try {
      // フィルタリング
      let filtered = deals.filter(deal => {
        if (!deal) return false;
        
        const productName = deal.productName || '';
        const proposalMenu = deal.proposalMenu || '';
        const status = deal.status || '';
        const representative = deal.representative || '';
        
        const matchesSearch = !searchTerm || 
                             productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             proposalMenu.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesRepresentative = !representativeFilter || representative === representativeFilter;
        
        let matchesIntroducer = true;
        if (introducerFilter) {
          const introducerName = getIntroducerName(deal);
          matchesIntroducer = introducerName === introducerFilter;
        }
        
        // パートナー会社の場合は、その会社の案件のみ表示
        const matchesPartnerCompany = !isPartnerView || !partnerCompany || 
                                     (deal.introducer === partnerCompany);
        
        // 管理者画面の場合は「他社案件」を非表示
        const isValidProposalMenu = isPartnerView || (proposalMenu !== '他社案件');
        
        return matchesSearch && matchesStatus && matchesRepresentative && matchesIntroducer && matchesPartnerCompany && isValidProposalMenu;
      });

      // ソート処理
      if (sortConfig.key && sortConfig.direction !== 'none') {
        filtered.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortConfig.key) {
            case 'lastContactDate':
              // 日付フィールドのソート
              aValue = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
              bValue = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
              break;
            case 'nextActionDate':
              // 次回アクション日付のソート（日付なしは未来の日付として扱う）
              aValue = a.nextActionDate ? new Date(a.nextActionDate) : new Date(9999, 11, 31);
              bValue = b.nextActionDate ? new Date(b.nextActionDate) : new Date(9999, 11, 31);
              break;
            case 'productName':
              aValue = (a.productName || '').toLowerCase();
              bValue = (b.productName || '').toLowerCase();
              break;
            case 'proposalMenu':
              aValue = (a.proposalMenu || '').toLowerCase();
              bValue = (b.proposalMenu || '').toLowerCase();
              break;
            default:
              return 0;
          }
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      return filtered;
    } catch (error) {
      console.error('フィルタリング・ソートエラー:', error);
      return deals;
    }
  }, [deals, searchTerm, statusFilter, representativeFilter, introducerFilter, isPartnerView, partnerCompany, getIntroducerName, sortConfig]);

  const handleViewDetail = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddAction = (deal) => {
    // 案件情報を事前入力してアクションログ記録ページに遷移
    console.log('Deal data:', deal); // デバッグ用
    
    // 紹介者名から紹介者IDを取得
    const getIntroducerIdByName = (introducerName) => {
      const introducer = introducersList.find(i => i.name === introducerName) ||
                        introducers.find(i => i.name === introducerName);
      return introducer ? introducer.id.toString() : '4'; // デフォルト値は直接営業
    };
    
    // introducerIdが存在する場合はそれを使用、なければ紹介者名から検索
    let introducerId = '';
    if (deal.introducerId) {
      introducerId = deal.introducerId.toString();
    } else if (deal.introducer) {
      introducerId = getIntroducerIdByName(deal.introducer);
    } else {
      introducerId = '4'; // デフォルト値
    }
    
    const params = new URLSearchParams({
      productName: deal.productName || '',
      proposalMenu: deal.proposalMenu || '',
      representative: deal.representative || '',
      introducerId: introducerId,
      introducer: deal.introducer || ''
    });
    
    navigate(`/log-entry?${params.toString()}`);
  };

  const handleEdit = (deal) => {
    setEditModal({ show: true, deal: { ...deal } });
  };

  const handleEditSave = async () => {
    try {
      const updatedDeal = editModal.deal;
      console.log('✏️ 案件編集保存開始:', updatedDeal.id);
      
      const dealRef = doc(db, 'progressDashboard', updatedDeal.id);
      // 紹介者情報の処理
      const introducerInfo = {};
      if (updatedDeal.introducerId && updatedDeal.introducerId !== '') {
        const selectedIntroducer = introducersList.find(i => i.id === updatedDeal.introducerId);
        if (selectedIntroducer) {
          introducerInfo.introducer = selectedIntroducer.name;
          introducerInfo.introducerId = parseInt(updatedDeal.introducerId);
        }
      }
      
      await updateDoc(dealRef, {
        productName: updatedDeal.productName,
        proposalMenu: updatedDeal.proposalMenu,
        representative: updatedDeal.representative,
        partnerRepresentative: updatedDeal.partnerRepresentative || null,
        dealType: updatedDeal.dealType || '',
        ...introducerInfo,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 案件編集保存成功');
      
      // データを再取得
      await fetchProgressData();
      setEditModal({ show: false, deal: null });
      alert('案件情報が更新されました');
    } catch (error) {
      console.error('💥 編集保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>案件一覧</Title>
      </Header>

      <FilterSection>
        <FilterGrid>
          <div>
            <label>🔍 検索</label>
            <SearchInput
              type="text"
              placeholder="商材名・提案メニューで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label>📊 ステータス</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全てのステータス</option>
              <option value="アポ設定">アポ設定</option>
              <option value="提案作成中">提案作成中</option>
              <option value="検討中">検討中</option>
              <option value="成約">成約</option>
              <option value="保留">保留</option>
              <option value="見送り">見送り</option>
              <option value="案件満了">案件満了</option>
            </Select>
          </div>
          <div>
            <label>👤 担当者</label>
            <Select
              value={representativeFilter}
              onChange={(e) => setRepresentativeFilter(e.target.value)}
            >
              <option value="">全ての担当者</option>
              {SALES_REPRESENTATIVES.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </Select>
          </div>
          <div>
            <label>🏢 紹介者</label>
            <Select
              value={introducerFilter}
              onChange={(e) => setIntroducerFilter(e.target.value)}
            >
              <option value="">全ての紹介者</option>
              {/* データベースに実際に存在する紹介者をユニークに取得 */}
              {React.useMemo(() => {
                if (!Array.isArray(deals)) return [];
                try {
                  return [...new Set(deals.map(deal => getIntroducerName(deal)).filter(name => name && name.trim() !== ''))]
                    .sort()
                    .map(introducerName => (
                      <option key={introducerName} value={introducerName}>{introducerName}</option>
                    ));
                } catch (error) {
                  console.error('紹介者オプション生成エラー:', error);
                  return [];
                }
              }, [deals, getIntroducerName])}
            </Select>
          </div>
        </FilterGrid>
      </FilterSection>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          データを読み込み中...
        </div>
      ) : (
      <TableContainer>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell 
              sortable 
              onClick={() => handleSort('productName')}
              style={{ width: '120px' }}
            >
              商材名
              <span className="sort-indicator">
                {sortConfig.key === 'productName' && sortConfig.direction === 'asc' && <FiChevronUp />}
                {sortConfig.key === 'productName' && sortConfig.direction === 'desc' && <FiChevronDown />}
                {sortConfig.key === 'productName' && sortConfig.direction === 'none' && <FiMinus />}
                {sortConfig.key !== 'productName' && <FiMinus />}
              </span>
            </TableHeaderCell>
            <TableHeaderCell 
              sortable 
              onClick={() => handleSort('proposalMenu')}
              style={{ width: '120px' }}
            >
              提案メニュー
              <span className="sort-indicator">
                {sortConfig.key === 'proposalMenu' && sortConfig.direction === 'asc' && <FiChevronUp />}
                {sortConfig.key === 'proposalMenu' && sortConfig.direction === 'desc' && <FiChevronDown />}
                {sortConfig.key === 'proposalMenu' && sortConfig.direction === 'none' && <FiMinus />}
                {sortConfig.key !== 'proposalMenu' && <FiMinus />}
              </span>
            </TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '120px' }}>クライアント</TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '90px' }}>新規/既存</TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '140px' }}>担当者（社内／パートナー）</TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '80px' }}>ステータス</TableHeaderCell>
            <TableHeaderCell 
              sortable 
              onClick={() => handleSort('lastContactDate')}
              style={{ minWidth: '80px' }}
            >
              最終接触日
              <span className="sort-indicator">
                {sortConfig.key === 'lastContactDate' && sortConfig.direction === 'asc' && <FiChevronUp />}
                {sortConfig.key === 'lastContactDate' && sortConfig.direction === 'desc' && <FiChevronDown />}
                {sortConfig.key === 'lastContactDate' && sortConfig.direction === 'none' && <FiMinus />}
                {sortConfig.key !== 'lastContactDate' && <FiMinus />}
              </span>
            </TableHeaderCell>
            <TableHeaderCell 
              sortable 
              onClick={() => handleSort('nextActionDate')}
              style={{ minWidth: '150px' }}
            >
              次回アクション
              <span className="sort-indicator">
                {sortConfig.key === 'nextActionDate' && sortConfig.direction === 'asc' && <FiChevronUp />}
                {sortConfig.key === 'nextActionDate' && sortConfig.direction === 'desc' && <FiChevronDown />}
                {sortConfig.key === 'nextActionDate' && sortConfig.direction === 'none' && <FiMinus />}
                {sortConfig.key !== 'nextActionDate' && <FiMinus />}
              </span>
            </TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '50px' }}>ログ</TableHeaderCell>
            <TableHeaderCell style={{ minWidth: '140px' }}>アクション</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredDeals.map(deal => (
            <TableRow key={deal.id}>
              <TableCell style={{ minWidth: '160px' }}>
                <strong>{deal.productName}</strong>
              </TableCell>
              <TableCell style={{ minWidth: '160px' }}>
                {deal.proposalMenu}
              </TableCell>
              <TableCell style={{ minWidth: '120px' }}>
                {deal.clientName || '-'}
              </TableCell>
              <TableCell style={{ minWidth: '90px', padding: '0.5rem' }}>
                <select
                  value={deal.dealType || ''}
                  onChange={(e) => handleDealTypeChange(deal.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: getDealTypeColor(deal.dealType),
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">未設定</option>
                  <option value="新規">新規</option>
                  <option value="既存">既存</option>
                </select>
              </TableCell>
              <TableCell style={{ minWidth: '200px' }}>
                {/* Ver 2.2: 担当者の併記表示（社内／パートナー） */}
                {deal.representative && deal.partnerRepresentative ? (
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
                )}
              </TableCell>
              <TableCell data-deal-id={deal.id} style={{ minWidth: '120px', padding: '0.5rem' }}>
                <select
                  value={deal.status}
                  onChange={(e) => handleStatusChange(deal.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: STATUS_COLORS[deal.status] || '#f8f9fa',
                    color: ['見送り', '保留'].includes(deal.status) ? '#fff' : '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell style={{ minWidth: '100px' }}>{deal.lastContactDate}</TableCell>
              <TableCell style={{ minWidth: '250px' }}>
                {deal.nextAction}
                {deal.nextActionDate && isUrgent(deal.nextActionDate) && (
                  <UrgentBadge>急</UrgentBadge>
                )}
                {deal.nextActionDate && (
                  <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                    {deal.nextActionDate}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <ActionButton 
                  className="view"
                  onClick={() => handleViewDetail(deal.id)}
                >
                  <FiEye />
                  詳細
                </ActionButton>
              </TableCell>
              <TableCell>
                <ActionsCell>
                  <ActionButton 
                    className="edit"
                    onClick={() => handleEdit(deal)}
                  >
                    <FiEdit3 />
                    編集
                  </ActionButton>
                  <ActionButton 
                    className="add"
                    onClick={() => handleAddAction(deal)}
                  >
                    <FiPlus />
                    追加
                  </ActionButton>
                  <DeleteButton
                    onClick={() => setDeleteModal({ show: true, deal })}
                  >
                    <FiTrash2 />
                    削除
                  </DeleteButton>
                </ActionsCell>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      </TableContainer>
      )}

      {!isLoading && filteredDeals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          条件に合致する案件が見つかりませんでした。
        </div>
      )}
      
      {deleteModal.show && (
        <Modal onClick={() => setDeleteModal({ show: false, deal: null })}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>案件削除の確認</ModalTitle>
            <ModalText>
              本当に「{deleteModal.deal?.productName}（{deleteModal.deal?.proposalMenu}）」を削除しますか？
              <br />
              この操作は元に戻せません。
            </ModalText>
            <ModalButtons>
              <ModalButton
                className="cancel"
                onClick={() => setDeleteModal({ show: false, deal: null })}
              >
                キャンセル
              </ModalButton>
              <ModalButton
                className="delete"
                onClick={() => handleDelete(deleteModal.deal)}
              >
                削除する
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
      
      {/* 編集モーダル */}
      {editModal.show && (
        <Modal onClick={() => setEditModal({ show: false, deal: null })}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>案件情報編集</ModalTitle>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>商材名</label>
              <input
                type="text"
                value={editModal.deal?.productName || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, productName: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>提案メニュー</label>
              <select
                value={editModal.deal?.proposalMenu || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, proposalMenu: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">選択してください</option>
                <option value="第一想起取れるくん">第一想起取れるくん</option>
                <option value="獲得取れるくん">獲得取れるくん</option>
                <option value="インハウスキャンプ">インハウスキャンプ</option>
                <option value="IFキャスティング">IFキャスティング</option>
                <option value="運用コックピット">運用コックピット</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>新規/既存</label>
              <select
                value={editModal.deal?.dealType || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, dealType: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: getDealTypeColor(editModal.deal?.dealType || ''),
                  fontWeight: 'bold'
                }}
              >
                <option value="">未設定</option>
                <option value="新規">新規</option>
                <option value="既存">既存</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>社内担当者</label>
              <select
                value={editModal.deal?.representative || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, representative: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">選択してください</option>
                {SALES_REPRESENTATIVES.map(rep => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>パートナー担当者</label>
              <input
                type="text"
                value={editModal.deal?.partnerRepresentative || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, partnerRepresentative: e.target.value }
                }))}
                placeholder="パートナー担当者名（任意）"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>紹介者</label>
              <select
                value={editModal.deal?.introducerId || ''}
                onChange={(e) => setEditModal(prev => ({
                  ...prev,
                  deal: { ...prev.deal, introducerId: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">選択してください</option>
                {introducersList.filter(i => i.status === 'アクティブ').map(introducer => (
                  <option key={introducer.id} value={introducer.id}>{introducer.name}</option>
                ))}
              </select>
            </div>
            <ModalButtons>
              <ModalButton
                className="cancel"
                onClick={() => setEditModal({ show: false, deal: null })}
              >
                キャンセル
              </ModalButton>
              <ModalButton
                className="delete"
                onClick={handleEditSave}
                style={{ background: '#27ae60' }}
              >
                保存
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
      
      {/* 受注情報入力モーダル */}
      <ReceivedOrderModal
        isOpen={receivedOrderModal.show}
        onClose={handleCancelReceivedOrder}
        onSave={handleSaveReceivedOrder}
        deal={receivedOrderModal.deal}
        isLoading={isSavingOrder}
      />
    </DashboardContainer>
  );
}

export default ProgressDashboard; 