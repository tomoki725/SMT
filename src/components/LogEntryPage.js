import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiSave, FiRefreshCw, FiCalendar, FiUser, FiFileText, FiPlus, FiAlertCircle, FiX, FiZap } from 'react-icons/fi';
import { PROPOSAL_MENUS, PARTNER_PROPOSAL_MENUS, SALES_REPRESENTATIVES, STATUSES, DEPARTMENT_NAMES } from '../data/constants.js';
import { introducers } from '../data/mockData.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { analyzeMeetingNotes, isGPTServiceAvailable } from '../services/gptService.js';

const LogEntryContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
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

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  &:required {
    border-left: 3px solid #e74c3c;
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
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  &:required {
    border-left: 3px solid #e74c3c;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  &:required {
    border-left: 3px solid #e74c3c;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &.primary {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }
  
  &.secondary {
    background: #95a5a6;
    color: white;
    
    &:hover {
      background: #7f8c8d;
    }
  }
  
  &.success {
    background: #27ae60;
    color: white;
    
    &:hover {
      background: #219a52;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.ai-analyze {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      background: #bdc3c7;
      transform: none;
      box-shadow: none;
    }
  }
`;

const SummarySection = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  border-left: 4px solid #3498db;
`;

const SummaryTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
`;


const IntroducerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #3498db;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    color: #2980b9;
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
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #95a5a6;
  padding: 0;
  
  &:hover {
    color: #7f8c8d;
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  background: #fee;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function LogEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // パートナー向けかどうかを判定
  const isPartnerView = window.location.pathname.startsWith('/partner') || 
                       window.location.pathname.startsWith('/partner-entry') ||
                       window.location.search.includes('app=partner');
  
  // パートナー会社を判定
  const getPartnerCompany = () => {
    const path = window.location.pathname;
    if (path.startsWith('/partner-entry/piala')) {
      return '株式会社ピアラ';
    }
    return null;
  };
  
  const partnerCompany = getPartnerCompany();
  
  const [formData, setFormData] = useState({
    title: '',
    productName: '',
    proposalMenu: '',
    representative: '',
    introducerId: '',
    actionDate: new Date().toISOString().split('T')[0],
    actionDetails: '',
    nextAction: '',
    nextActionDate: '',
    status: '',
    summary: '',
    sub_department_name: '',
    sub_department_owner: ''
  });

  const [introducersList, setIntroducersList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [showIntroducerModal, setShowIntroducerModal] = useState(false);
  const [introducerFormData, setIntroducerFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    memo: '',
    status: 'アクティブ'
  });
  
  // パートナー専用担当者マスター関連のstate
  const [representativesList, setRepresentativesList] = useState([]);
  const [showRepresentativeModal, setShowRepresentativeModal] = useState(false);
  const [representativeFormData, setRepresentativeFormData] = useState({
    name: ''
  });
  
  // 提案メニューマスター関連のstate
  const [proposalMenusList, setProposalMenusList] = useState([]);
  
  const fetchIntroducers = useCallback(async () => {
    try {
      console.log('📋 LogEntryPage: 紹介者データをFirestoreから取得開始');
      
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
      
      console.log('✅ LogEntryPage: 紹介者データ取得成功:', introducersData.length, '件');
      setIntroducersList(introducersData);
    } catch (error) {
      console.error('💥 LogEntryPage: 紹介者データ取得エラー:', error);
      // エラー時はモックデータを使用
      setIntroducersList(introducers);
    }
  }, []);

  // パートナー専用担当者データを取得
  const fetchRepresentatives = useCallback(async () => {
    try {
      console.log('👤 LogEntryPage: 担当者データをFirestoreから取得開始');
      console.log('🏢 LogEntryPage: 対象会社:', partnerCompany);
      
      const representativesRef = collection(db, 'representatives');
      
      // デバッグ用：全件取得
      console.log('📋 LogEntryPage: 全担当者データ確認中...');
      const allQuery = query(representativesRef);
      const allSnapshot = await getDocs(allQuery);
      console.log('📊 LogEntryPage: 全担当者データ:', allSnapshot.size, '件');
      
      // 会社名でフィルタリング
      const q = query(representativesRef, 
        where('companyName', '==', partnerCompany)
      );
      const querySnapshot = await getDocs(q);
      
      const representativesData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('✅ LogEntryPage: マッチした担当者:', docSnap.id, data.name);
        representativesData.push({
          id: docSnap.id,
          ...data
        });
      });
      
      console.log('✅ LogEntryPage: 担当者データ取得成功:', representativesData.length, '件');
      setRepresentativesList(representativesData);
    } catch (error) {
      console.error('💥 LogEntryPage: 担当者データ取得エラー:', error);
      console.error('LogEntryPage: エラー詳細:', {
        code: error.code,
        message: error.message
      });
      setRepresentativesList([]);
    }
  }, [partnerCompany]);

  // 提案メニューデータを取得
  const fetchProposalMenus = useCallback(async () => {
    try {
      console.log('📋 LogEntryPage: 提案メニューデータをFirestoreから取得開始');
      
      const menusRef = collection(db, 'proposalMenus');
      // isActiveがtrueのもののみ取得
      const q = query(menusRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const menusData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        menusData.push({
          id: docSnap.id,
          ...data
        });
      });
      
      // クライアントサイドでdisplayOrderでソート
      menusData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      
      console.log('✅ LogEntryPage: 提案メニューデータ取得成功:', menusData.length, '件');
      setProposalMenusList(menusData);
    } catch (error) {
      console.error('💥 LogEntryPage: 提案メニューデータ取得エラー:', error);
      // エラー時は既存の定数を使用
      const fallbackMenus = isPartnerView ? PARTNER_PROPOSAL_MENUS : PROPOSAL_MENUS;
      setProposalMenusList(fallbackMenus.map((menu, index) => ({
        id: index.toString(),
        name: menu,
        isActive: true
      })));
    }
  }, [isPartnerView]);

  // Firestoreから紹介者データを取得
  useEffect(() => {
    fetchIntroducers();
    fetchProposalMenus();
    if (isPartnerView && partnerCompany) {
      fetchRepresentatives();
    }
  }, [isPartnerView, partnerCompany, fetchIntroducers, fetchRepresentatives, fetchProposalMenus]);

  // URLパラメータから事前入力データを取得（編集モード判定も含む）
  const [isEditMode, setIsEditMode] = useState(false);
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const prefillData = {};
    
    if (searchParams.get('productName')) prefillData.productName = searchParams.get('productName');
    if (searchParams.get('proposalMenu')) prefillData.proposalMenu = searchParams.get('proposalMenu');
    if (searchParams.get('representative')) prefillData.representative = searchParams.get('representative');
    if (searchParams.get('introducerId')) {
      const introducerIdStr = searchParams.get('introducerId');
      prefillData.introducerId = introducerIdStr === '0' ? '' : introducerIdStr;
    }
    if (searchParams.get('introducer')) prefillData.introducer = searchParams.get('introducer');
    
    // URLパラメータが存在する場合は編集モード（既存案件への追加）とみなす
    const hasParams = Object.keys(prefillData).length > 0;
    setIsEditMode(hasParams);
    
    if (hasParams) {
      setFormData(prev => ({ ...prev, ...prefillData }));
      
      // 既存案件の部署情報を取得（パートナー画面のみ）
      if (isPartnerView && prefillData.productName && prefillData.proposalMenu) {
        const fetchDealInfo = async () => {
          try {
            const progressRef = collection(db, 'progressDashboard');
            const q = query(
              progressRef,
              where('productName', '==', prefillData.productName),
              where('proposalMenu', '==', prefillData.proposalMenu)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const dealData = querySnapshot.docs[0].data();
              setFormData(prev => ({
                ...prev,
                sub_department_name: dealData.sub_department_name || '',
                sub_department_owner: dealData.sub_department_owner || ''
              }));
            }
          } catch (error) {
            console.error('既存案件の部署情報取得エラー:', error);
          }
        };
        fetchDealInfo();
      }
    }
  }, [location, isPartnerView]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // フォームバリデーション
  const validateForm = () => {
    const errors = {};
    
    if (!formData.productName.trim()) {
      errors.productName = '商材名は必須です';
    }
    
    if (!formData.proposalMenu) {
      errors.proposalMenu = '提案メニューを選択してください';
    }
    
    if (!formData.representative) {
      errors.representative = '対応者を選択してください';
    }
    
    if (!isPartnerView && !isEditMode && !formData.introducerId) {
      errors.introducerId = '紹介者を選択してください';
    }
    
    if (!formData.nextAction.trim()) {
      errors.nextAction = '次回アクションは必須です';
    }
    
    if (!formData.status) {
      errors.status = 'ステータスを選択してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // バリデーション実行
    if (!validateForm()) {
      setSubmitMessage({
        type: 'error',
        text: '入力内容に不備があります。必須項目を確認してください。'
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setSubmitMessage({ type: '', text: '' });
      
      console.log('💾 Firestoreにアクションログ保存開始:', formData);
      
      // エラーの詳細を確認するためのログ
      console.log('Firebase app initialized:', db);
      
      const progressRef = collection(db, 'progressDashboard');
      const actionLogsRef = collection(db, 'actionLogs');
      
      // 商材名＋提案メニューをキーとして案件を検索
      const dealKey = `${formData.productName}_${formData.proposalMenu}`;
      
      // 既存案件をチェック
      const existingDealQuery = query(
        progressRef,
        where('productName', '==', formData.productName),
        where('proposalMenu', '==', formData.proposalMenu)
      );
      const existingDealSnapshot = await getDocs(existingDealQuery);
      
      let dealDocId = null;
      
      if (existingDealSnapshot.empty) {
        // 新規案件として進捗一覧に追加
        console.log('🆕 新規案件を作成:', dealKey);
        
        const newDeal = {
          productName: formData.productName,
          proposalMenu: formData.proposalMenu,
          // パートナー案件の場合は担当者を分離
          representative: isPartnerView ? '増田 陽' : formData.representative || '',
          partnerRepresentative: isPartnerView ? formData.representative || '' : null,
          introducer: isPartnerView ? (partnerCompany || '') : getIntroducerName(formData.introducerId),
          introducerId: isPartnerView ? 0 : parseInt(formData.introducerId),
          status: formData.status, // 必須項目
          lastContactDate: formData.actionDate || new Date().toISOString().split('T')[0],
          nextAction: formData.nextAction || '',
          nextActionDate: formData.nextActionDate || null,
          summary: formData.summary || '', // AI要約
          sub_department_name: isPartnerView ? formData.sub_department_name || '' : '',
          sub_department_owner: isPartnerView ? formData.sub_department_owner || '' : '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('🆕 新規案件データ:', newDeal);
        
        const dealDocRef = await addDoc(progressRef, newDeal);
        dealDocId = dealDocRef.id;
      } else {
        // 既存案件を更新
        const existingDeal = existingDealSnapshot.docs[0];
        dealDocId = existingDeal.id;
        
        console.log('🔄 既存案件を更新:', dealDocId);
        
        // 既存案件のステータスと詳細を更新
        const updateData = {
          status: formData.status, // ステータスは必須なので常に更新
          lastContactDate: formData.actionDate || new Date().toISOString().split('T')[0],
          nextAction: formData.nextAction || existingDeal.data().nextAction,
          nextActionDate: formData.nextActionDate || existingDeal.data().nextActionDate,
          summary: formData.summary || existingDeal.data().summary || '', // AI要約
          // パートナー案件の場合は担当者を分離
          representative: isPartnerView ? '増田 陽' : formData.representative || existingDeal.data().representative,
          partnerRepresentative: isPartnerView ? formData.representative || '' : existingDeal.data().partnerRepresentative || null,
          introducer: isPartnerView ? (partnerCompany || '') : getIntroducerName(formData.introducerId),
          introducerId: isPartnerView ? 0 : parseInt(formData.introducerId),
          sub_department_name: isPartnerView ? formData.sub_department_name || '' : existingDeal.data().sub_department_name || '',
          sub_department_owner: isPartnerView ? formData.sub_department_owner || '' : existingDeal.data().sub_department_owner || '',
          updatedAt: serverTimestamp()
        };
        
        console.log('🔄 既存案件のステータス更新:', dealDocId, '→', formData.status);
        await updateDoc(doc(progressRef, dealDocId), updateData);
        console.log('✅ 既存案件のステータス更新完了');
      }
      
      // アクションログを作成
      const newLog = {
        dealId: dealDocId,
        dealKey: dealKey,
        productName: formData.productName,
        proposalMenu: formData.proposalMenu,
        action: formData.title || `${formData.productName} - アクション`,
        description: formData.actionDetails,
        status: formData.status || 'アポ設定',
        nextAction: formData.nextAction || '',
        nextActionDate: formData.nextActionDate || null,
        summary: formData.summary || '', // AI要約
        // パートナー案件の場合は担当者を分離
        representative: isPartnerView ? '増田 陽' : formData.representative || '',
        partnerRepresentative: isPartnerView ? formData.representative || '' : null,
        introducer: isPartnerView ? (partnerCompany || '') : getIntroducerName(formData.introducerId),
        sub_department_name: isPartnerView ? formData.sub_department_name || '' : '',
        sub_department_owner: isPartnerView ? formData.sub_department_owner || '' : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const logDocRef = await addDoc(actionLogsRef, newLog);
      
      console.log('✅ アクションログ保存成功:', {
        logId: logDocRef.id,
        dealId: dealDocId
      });
      
      // IFキャスティング選択時は自動でキャスティング管理に登録
      if (formData.proposalMenu === 'IFキャスティング') {
        try {
          const castingProposalData = {
            projectName: formData.productName,
            dealId: dealDocId,
            influencers: [], // 空の配列で初期化
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const castingRef = collection(db, 'castingProposals');
          await addDoc(castingRef, castingProposalData);
          console.log('✅ キャスティング管理に自動登録完了');
        } catch (castingError) {
          console.error('キャスティング管理への登録エラー:', castingError);
          // メインの処理は成功しているので、エラーは警告に留める
        }
      }
      
      setSubmitMessage({
        type: 'success',
        text: 'アクションログが正常に保存されました！'
      });
      
      // 1秒後に画面遷移
      setTimeout(() => {
        if (isPartnerView) {
          if (partnerCompany) {
            navigate('/partner-entry/piala/dashboard');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/');
        }
      }, 1000);
      
    } catch (error) {
      console.error('💥 保存エラー:', error);
      console.error('エラーの詳細:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // より詳細なエラーメッセージ
      let errorMessage = '保存に失敗しました: ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Firestoreへのアクセス権限がありません。';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Firestoreサービスが利用できません。';
      } else if (error.code === 'failed-precondition') {
        errorMessage += 'Firestoreのインデックスが必要です。';
      } else {
        errorMessage += error.message;
      }
      
      setSubmitMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      productName: '',
      proposalMenu: '',
      representative: '',
      introducerId: '',
      actionDate: new Date().toISOString().split('T')[0],
      actionDetails: '',
      nextAction: '',
      nextActionDate: '',
      status: '',
      summary: ''
    });
    setAnalysisResult(null);
    setFormErrors({});
    setSubmitMessage({ type: '', text: '' });
  };

  // AI分析機能
  const handleAIAnalysis = async () => {
    // デバッグ用アラート
    const debugMode = false; // 本番環境ではfalseに設定
    
    if (debugMode) {
      alert(`AI分析開始\n議事録文字数: ${formData.actionDetails.length}文字\n内容: ${formData.actionDetails.substring(0, 100)}...`);
    }
    
    console.log('🔘 AI分析ボタンがクリックされました');
    console.log('📝 現在の議事録内容:', formData.actionDetails);
    console.warn('📝 議事録内容（警告レベルで表示）:', formData.actionDetails);
    
    if (!formData.actionDetails || formData.actionDetails.trim().length < 10) {
      alert('議事録（アクション詳細）を入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      console.log('🤖 AI分析開始:', formData.actionDetails);
      console.log('⏰ 実行時刻:', new Date().toISOString());
      
      const result = await analyzeMeetingNotes(formData.actionDetails);
      
      console.log('✅ AI分析完了 - 受信データ:');
      console.log('- summary:', result.summary);
      console.log('- actionPlans:', result.actionPlans);
      console.log('- status:', result.status);
      console.log('- error:', result.error);
      
      if (debugMode && result) {
        alert(`AI分析完了\n要約: ${(result.summary || '').substring(0, 50)}...\nステータス: ${result.status}`);
      }
      
      setAnalysisResult(result);
      
      // AI分析結果を自動でフォームに適用
      if (result && !result.error) {
        // アクションプランを次回アクションに適用（全項目を改行区切りで）
        if (result.actionPlans && result.actionPlans.length > 0) {
          const allActionPlans = result.actionPlans.join('\n');
          setFormData(prev => ({
            ...prev,
            nextAction: allActionPlans
          }));
        }

        // ステータスを適用
        if (result.status) {
          setFormData(prev => ({
            ...prev,
            status: result.status
          }));
        }

        // AI要約を適用
        if (result.summary) {
          setFormData(prev => ({
            ...prev,
            summary: result.summary
          }));
        }
        
        console.log('✅ AI分析結果をフォームに自動適用しました');
      }
      
      if (result.error) {
        setSubmitMessage({
          type: 'error',
          text: `AI分析エラー: ${result.error}`
        });
      }
      
    } catch (error) {
      console.error('💥 AI分析エラー:', error);
      console.error('エラー詳細:', error.stack);
      
      if (debugMode) {
        alert(`エラー発生: ${error.message}`);
      }
      
      setSubmitMessage({
        type: 'error',
        text: 'AI分析中にエラーが発生しました。しばらく時間をおいてからお試しください。'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI分析結果の適用
  const handleApplyAIResult = () => {
    if (!analysisResult || analysisResult.error) {
      return;
    }

    // アクションプランを次回アクションに適用（全項目を改行区切りで）
    if (analysisResult.actionPlans && analysisResult.actionPlans.length > 0) {
      const allActionPlans = analysisResult.actionPlans.join('\n');
      setFormData(prev => ({
        ...prev,
        nextAction: allActionPlans
      }));
    }

    // ステータスを適用
    if (analysisResult.status) {
      setFormData(prev => ({
        ...prev,
        status: analysisResult.status
      }));
    }

    // 分析結果をクリア
    setAnalysisResult(null);
    
    setSubmitMessage({
      type: 'success',
      text: 'AI分析結果をフォームに適用しました！'
    });

    // 3秒後にメッセージをクリア
    setTimeout(() => {
      setSubmitMessage({ type: '', text: '' });
    }, 3000);
  };

  const handleAddIntroducer = () => {
    setShowIntroducerModal(true);
  };

  const handleIntroducerInputChange = (e) => {
    const { name, value } = e.target;
    setIntroducerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIntroducerSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('➕ 紹介者新規追加開始（モーダル）');
      const docRef = await addDoc(collection(db, 'introducers'), {
        ...introducerFormData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ 紹介者新規追加成功（モーダル）:', docRef.id);
      
      // 紹介者リストを再取得
      await fetchIntroducers();
      
      // 新規追加した紹介者を自動選択
      setFormData(prev => ({
        ...prev,
        introducerId: docRef.id
      }));
      
      // モーダルを閉じてフォームをリセット
      setShowIntroducerModal(false);
      setIntroducerFormData({
        name: '',
        contactPerson: '',
        email: '',
        memo: '',
        status: 'アクティブ'
      });
      
      alert('紹介者を新規登録し、自動選択しました！');
    } catch (error) {
      console.error('💥 紹介者追加エラー（モーダル）:', error);
      alert('紹介者の追加に失敗しました: ' + error.message);
    }
  };

  const handleCloseIntroducerModal = () => {
    setShowIntroducerModal(false);
    setIntroducerFormData({
      name: '',
      contactPerson: '',
      email: '',
      memo: '',
      status: 'アクティブ'
    });
  };

  // 担当者関連の処理
  const handleAddRepresentative = () => {
    setShowRepresentativeModal(true);
  };

  const handleRepresentativeInputChange = (e) => {
    const { name, value } = e.target;
    setRepresentativeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRepresentativeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('➕ 担当者新規追加開始（モーダル）');
      const docRef = await addDoc(collection(db, 'representatives'), {
        ...representativeFormData,
        companyName: partnerCompany,
        status: 'アクティブ',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ 担当者新規追加成功（モーダル）:', docRef.id);
      
      // 担当者リストを再取得
      await fetchRepresentatives();
      
      // 新規追加した担当者を自動選択
      setFormData(prev => ({
        ...prev,
        representative: representativeFormData.name
      }));
      
      // モーダルを閉じてフォームをリセット
      setShowRepresentativeModal(false);
      setRepresentativeFormData({
        name: ''
      });
      
      alert('担当者を新規登録し、自動選択しました！');
    } catch (error) {
      console.error('💥 担当者追加エラー（モーダル）:', error);
      alert('担当者の追加に失敗しました: ' + error.message);
    }
  };

  const handleCloseRepresentativeModal = () => {
    setShowRepresentativeModal(false);
    setRepresentativeFormData({
      name: ''
    });
  };

  const getIntroducerName = (introducerId) => {
    const introducer = introducersList.find(i => i.id === introducerId);
    return introducer ? introducer.name : '';
  };

  return (
    <LogEntryContainer>
      <Header>
        <Title>アクションログ記録</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        {isProcessing && (
          <LoadingOverlay>
            <LoadingSpinner />
          </LoadingOverlay>
        )}
        
        {submitMessage.text && (
          submitMessage.type === 'success' ? (
            <SuccessMessage>
              <FiSave />
              {submitMessage.text}
            </SuccessMessage>
          ) : (
            <ErrorMessage>
              <FiAlertCircle />
              {submitMessage.text}
            </ErrorMessage>
          )
        )}
        
        <FormGrid>
          <FormGroup className="full-width">
            <Label>
              <FiFileText />
              タイトル
            </Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="例：〇月MTG、提案送付など"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <FiFileText />
              商材名 *
            </Label>
            <Input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="例：ABCサービス"
              required
              disabled={isEditMode}
              style={{
                ...(formErrors.productName ? { borderColor: '#e74c3c' } : {}),
                ...(isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {})
              }}
            />
            {formErrors.productName && (
              <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formErrors.productName}
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label>
              <FiFileText />
              提案メニュー *
            </Label>
            <Select
              name="proposalMenu"
              value={formData.proposalMenu}
              onChange={handleInputChange}
              required
              disabled={isEditMode}
              style={{
                ...(formErrors.proposalMenu ? { borderColor: '#e74c3c' } : {}),
                ...(isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {})
              }}
            >
              <option value="">選択してください</option>
              {proposalMenusList.map(menu => (
                <option key={menu.id} value={menu.name}>
                  {menu.name}
                </option>
              ))}
            </Select>
            {formErrors.proposalMenu && (
              <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formErrors.proposalMenu}
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label>
              <FiUser />
              対応者 *
            </Label>
            <Select
              name="representative"
              value={formData.representative}
              onChange={handleInputChange}
              required
              disabled={isEditMode}
              style={{
                ...(formErrors.representative ? { borderColor: '#e74c3c' } : {}),
                ...(isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {})
              }}
            >
              <option value="">選択してください</option>
              {isPartnerView && partnerCompany ? (
                // パートナービューの場合は担当者マスターから選択
                representativesList.filter(rep => rep.status === 'アクティブ').map(rep => (
                  <option key={rep.id} value={rep.name}>
                    {rep.name}{rep.department ? ` (${rep.department})` : ''}
                  </option>
                ))
              ) : (
                // 管理者ビューの場合は従来通り定数から選択
                SALES_REPRESENTATIVES.map(rep => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))
              )}
            </Select>
            {formErrors.representative && (
              <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formErrors.representative}
              </div>
            )}
            {isPartnerView && partnerCompany && (
              <IntroducerActions>
                <LinkButton type="button" onClick={handleAddRepresentative}>
                  <FiPlus />
                  担当者を新規登録する
                </LinkButton>
              </IntroducerActions>
            )}
          </FormGroup>

          {!isPartnerView && (
            <FormGroup>
              <Label>
                <FiUser />
                紹介者 *
              </Label>
              <Select
                name="introducerId"
                value={formData.introducerId}
                onChange={handleInputChange}
                required
                disabled={isEditMode}
                style={{
                  ...(formErrors.introducerId ? { borderColor: '#e74c3c' } : {}),
                  ...(isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {})
                }}
              >
                <option value="">選択してください</option>
                {introducersList.filter(i => i.status === 'アクティブ').map(introducer => (
                  <option key={introducer.id} value={introducer.id}>
                    {introducer.name}
                  </option>
                ))}
              </Select>
              {formErrors.introducerId && (
                <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {formErrors.introducerId}
                </div>
              )}
              {!isEditMode && (
                <IntroducerActions>
                  <LinkButton type="button" onClick={handleAddIntroducer}>
                    <FiPlus />
                    紹介者を新規登録する
                  </LinkButton>
                </IntroducerActions>
              )}
            </FormGroup>
          )}

          {isPartnerView && isEditMode && formData.introducer && (
            <FormGroup>
              <Label>
                <FiUser />
                紹介者
              </Label>
              <Input
                type="text"
                value={formData.introducer}
                disabled
                style={{
                  backgroundColor: '#f8f9fa',
                  cursor: 'not-allowed',
                  color: '#666'
                }}
              />
            </FormGroup>
          )}

          {isPartnerView && (
            <>
              <FormGroup>
                <Label>
                  <FiFileText />
                  部署名
                </Label>
                <Select
                  name="sub_department_name"
                  value={formData.sub_department_name}
                  onChange={handleInputChange}
                >
                  <option value="">選択してください</option>
                  {DEPARTMENT_NAMES.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>
                  <FiUser />
                  他部署担当者名
                </Label>
                <Input
                  type="text"
                  name="sub_department_owner"
                  value={formData.sub_department_owner}
                  onChange={handleInputChange}
                  placeholder="他部署担当者名を入力"
                />
              </FormGroup>
            </>
          )}

          <FormGroup>
            <Label>
              <FiCalendar />
              アクション日 *
            </Label>
            <Input
              type="date"
              name="actionDate"
              value={formData.actionDate}
              onChange={handleInputChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <FiCalendar />
              次回アクション日
            </Label>
            <Input
              type="date"
              name="nextActionDate"
              value={formData.nextActionDate}
              onChange={handleInputChange}
            />
          </FormGroup>
        </FormGrid>

        <FormGroup>
          <Label>
            <FiFileText />
            議事録
          </Label>
          <TextArea
            name="actionDetails"
            value={formData.actionDetails}
            onChange={handleInputChange}
            placeholder="今回の議事録内容を詳しく記載してください"
            style={formErrors.actionDetails ? { borderColor: '#e74c3c' } : {}}
          />
          {formErrors.actionDetails && (
            <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {formErrors.actionDetails}
            </div>
          )}
          
          {/* AI分析ボタン（議事録が入力されている場合に表示） */}
          {formData.actionDetails && formData.actionDetails.length > 50 && isGPTServiceAvailable() && (
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <Button
                type="button"
                className="ai-analyze"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || isProcessing}
              >
                {isAnalyzing ? <FiRefreshCw /> : <FiZap />}
                {isAnalyzing ? 'AI分析中...' : 'AI要約・分析実行'}
              </Button>
            </div>
          )}
          
        </FormGroup>

        <FormGroup>
          <Label>
            <FiFileText />
            次回アクション *
          </Label>
          <TextArea
            name="nextAction"
            value={formData.nextAction}
            onChange={handleInputChange}
            placeholder="次回実施予定のアクション（複数のアクションプランが自動入力されます）"
            rows={4}
            required
            style={formErrors.nextAction ? { borderColor: '#e74c3c' } : {}}
          />
          {formErrors.nextAction && (
            <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {formErrors.nextAction}
            </div>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <FiFileText />
            ステータス
          </Label>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value="">選択してください</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>
            <FiFileText />
            要約
          </Label>
          <TextArea
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            placeholder="AI要約がここに自動入力されます。手動での編集も可能です。"
            rows={4}
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" className="secondary" onClick={handleReset}>
            リセット
          </Button>
          <Button type="submit" className="primary">
            <FiSave />
            保存
          </Button>
        </ButtonGroup>
      </Form>

      {/* 紹介者新規登録モーダル */}
      {showIntroducerModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && handleCloseIntroducerModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>紹介者新規登録</ModalTitle>
              <CloseButton onClick={handleCloseIntroducerModal}>
                <FiX />
              </CloseButton>
            </ModalHeader>
            
            <form onSubmit={handleIntroducerSubmit}>
              <FormGroup>
                <Label>
                  <FiUser />
                  紹介者名 *
                </Label>
                <Input
                  type="text"
                  name="name"
                  value={introducerFormData.name}
                  onChange={handleIntroducerInputChange}
                  required
                  placeholder="紹介者名を入力"
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <FiUser />
                  担当者名
                </Label>
                <Input
                  type="text"
                  name="contactPerson"
                  value={introducerFormData.contactPerson}
                  onChange={handleIntroducerInputChange}
                  placeholder="担当者名を入力"
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <FiUser />
                  メールアドレス
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={introducerFormData.email}
                  onChange={handleIntroducerInputChange}
                  placeholder="メールアドレスを入力"
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <FiFileText />
                  メモ
                </Label>
                <TextArea
                  name="memo"
                  value={introducerFormData.memo}
                  onChange={handleIntroducerInputChange}
                  placeholder="メモを入力"
                  rows={3}
                />
              </FormGroup>

              <ModalButtonGroup>
                <Button type="button" className="secondary" onClick={handleCloseIntroducerModal}>
                  キャンセル
                </Button>
                <Button type="submit" className="primary">
                  <FiSave />
                  登録
                </Button>
              </ModalButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* 担当者新規登録モーダル（パートナー専用） */}
      {showRepresentativeModal && (
        <Modal onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseRepresentativeModal();
          }
        }}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>担当者新規登録</ModalTitle>
              <CloseButton onClick={handleCloseRepresentativeModal}>
                <FiX />
              </CloseButton>
            </ModalHeader>
            
            <form onSubmit={handleRepresentativeSubmit}>
              <FormGroup>
                <Label>
                  <FiUser />
                  氏名 *
                </Label>
                <Input
                  type="text"
                  name="name"
                  value={representativeFormData.name}
                  onChange={handleRepresentativeInputChange}
                  required
                  placeholder="担当者名を入力"
                />
              </FormGroup>

              <ModalButtonGroup>
                <Button type="button" className="secondary" onClick={handleCloseRepresentativeModal}>
                  キャンセル
                </Button>
                <Button type="submit" className="primary">
                  <FiSave />
                  登録
                </Button>
              </ModalButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </LogEntryContainer>
  );
}

export default LogEntryPage; 