/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions/v1');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Firebase Admin SDK初期化
admin.initializeApp();
const db = admin.firestore();

// Express アプリケーションを作成
const app = express();

// CORS を設定
app.use(cors({
  origin: true, // すべてのオリジンを許可（本番では制限すべき）
  credentials: true
}));

// JSONパースを有効化
app.use(express.json());

// Firestoreコレクション参照
const actionLogsRef = db.collection('actionLogs');
const dealsRef = db.collection('deals');

// 初期データ投入（一度だけ実行）
const initializeData = async () => {
  try {
    // 既存データをチェック
    const actionLogsSnapshot = await actionLogsRef.limit(1).get();
    if (!actionLogsSnapshot.empty) {
      console.log('データは既に存在します');
      return;
    }

    console.log('初期データを投入中...');

    // サンプル案件データ
    const sampleDeals = [
      { id: '1', name: 'サンプル案件1', status: 'progress' },
      { id: '2', name: 'サンプル案件2', status: 'negotiation' },
      { id: '3', name: 'サンプル案件3', status: 'proposal' }
    ];

    // 案件データ投入
    for (const deal of sampleDeals) {
      await dealsRef.doc(deal.id).set(deal);
    }

    console.log('初期データ投入完了');
  } catch (error) {
    console.error('初期データ投入エラー:', error);
  }
};

// 初期化実行
initializeData();

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Firebase Functions API with Firestore is running'
  });
});

// アクションログ一覧取得
app.get('/api/action-logs', async (req, res) => {
  try {
    const { dealId, productName, page = 1, limit = 50 } = req.query;
    
    console.log('🔍 アクションログ取得リクエスト:', { dealId, productName, page, limit });
    
    let query = actionLogsRef.orderBy('createdAt', 'desc');
    let totalQuery = actionLogsRef;
    
    // 案件IDまたは商材名でフィルタリング
    if (dealId) {
      console.log('📋 dealIdでフィルタリング:', dealId);
      query = query.where('dealId', '==', dealId);
      totalQuery = totalQuery.where('dealId', '==', dealId);
    } else if (productName) {
      console.log('📝 productNameでフィルタリング:', productName);
      query = query.where('productName', '==', productName);
      totalQuery = totalQuery.where('productName', '==', productName);
    }
    
    // ページネーション
    const offset = (parseInt(page) - 1) * parseInt(limit);
    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(parseInt(limit));
    
    const snapshot = await query.get();
    const actionLogs = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      actionLogs.push({
        id: doc.id,
        ...data,
        // Timestamp型をISO文字列に変換
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        nextActionDate: data.nextActionDate || null
      });
    });
    
    // 総件数取得
    const totalSnapshot = await totalQuery.get();
    
    console.log('✅ アクションログ取得成功:', {
      取得件数: actionLogs.length,
      総件数: totalSnapshot.size,
      フィルター条件: { dealId, productName }
    });
    
    res.json({
      actionLogs,
      total: totalSnapshot.size,
      page: parseInt(page),
      limit: parseInt(limit),
      filters: { dealId, productName }
    });
  } catch (error) {
    console.error('💥 アクションログ取得エラー:', error);
    res.status(500).json({ 
      error: 'アクションログの取得に失敗しました',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// アクションログ新規作成
app.post('/api/action-logs', async (req, res) => {
  try {
    const {
      dealId,
      action,
      description,
      status,
      nextAction,
      nextActionDate,
      productName,
      proposalMenu,
      representative,
      introducer
    } = req.body;
    
    // バリデーション
    if (!dealId || !action || !description) {
      return res.status(400).json({ 
        error: '必須フィールドが不足しています (dealId, action, description)' 
      });
    }
    
    // LogEntryPageから送信されたデータの処理
    const processedProductName = productName || dealId;
    const processedProposalMenu = proposalMenu || '';
    
    // 商材名＋提案メニューをキーとして案件を検索
    const dealKey = `${processedProductName}_${processedProposalMenu}`;
    
    // 案件コレクション参照
    const progressRef = db.collection('progressDashboard');
    
    // 既存案件をチェック
    const existingDealQuery = await progressRef
      .where('productName', '==', processedProductName)
      .where('proposalMenu', '==', processedProposalMenu)
      .limit(1)
      .get();
    
    let dealDocId = null;
    
    if (existingDealQuery.empty) {
      // 新規案件として進捗一覧に追加
      console.log('新規案件を作成:', dealKey);
      
      const newDeal = {
        productName: processedProductName,
        proposalMenu: processedProposalMenu,
        representative: representative || '',
        introducer: introducer || '',
        status: status || 'アポ設定',
        lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
        nextAction: nextAction || '',
        nextActionDate: nextActionDate || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const dealDocRef = await progressRef.add(newDeal);
      dealDocId = dealDocRef.id;
    } else {
      // 既存案件を更新
      const existingDeal = existingDealQuery.docs[0];
      dealDocId = existingDeal.id;
      
      await progressRef.doc(dealDocId).update({
        status: status || existingDeal.data().status,
        lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
        nextAction: nextAction || existingDeal.data().nextAction,
        nextActionDate: nextActionDate || existingDeal.data().nextActionDate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // アクションログを作成
    const newLog = {
      dealId: dealDocId,
      dealKey: dealKey,
      productName: processedProductName,
      proposalMenu: processedProposalMenu,
      action,
      description,
      status: status || 'progress',
      nextAction: nextAction || '',
      nextActionDate: nextActionDate || null,
      representative: representative || '',
      introducer: introducer || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await actionLogsRef.add(newLog);
    
    // 作成されたドキュメントを取得
    const createdDoc = await docRef.get();
    const responseData = {
      id: docRef.id,
      ...createdDoc.data(),
      createdAt: createdDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: createdDoc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
    
    res.status(201).json({
      message: 'アクションログが作成されました',
      actionLog: responseData,
      dealId: dealDocId
    });
  } catch (error) {
    console.error('アクションログ作成エラー:', error);
    res.status(500).json({ error: 'アクションログの作成に失敗しました' });
  }
});

// アクションログ更新
app.put('/api/action-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await actionLogsRef.doc(id).update(updateData);
    
    const updatedDoc = await actionLogsRef.doc(id).get();
    const responseData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString()
    };
    
    res.json({
      message: 'アクションログが更新されました',
      actionLog: responseData
    });
  } catch (error) {
    console.error('アクションログ更新エラー:', error);
    res.status(500).json({ error: 'アクションログの更新に失敗しました' });
  }
});

// アクションログ削除
app.delete('/api/action-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await actionLogsRef.doc(id).delete();
    
    res.json({
      message: 'アクションログが削除されました',
      id
    });
  } catch (error) {
    console.error('アクションログ削除エラー:', error);
    res.status(500).json({ error: 'アクションログの削除に失敗しました' });
  }
});

// 案件一覧取得
app.get('/api/deals', async (req, res) => {
  try {
    const snapshot = await dealsRef.get();
    const deals = [];
    
    snapshot.forEach(doc => {
      deals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ deals });
  } catch (error) {
    console.error('案件取得エラー:', error);
    res.status(500).json({ error: '案件の取得に失敗しました' });
  }
});

// 進捗一覧取得
app.get('/api/progress-dashboard', async (req, res) => {
  try {
    console.log('📊 進捗一覧取得リクエスト');
    
    const progressRef = db.collection('progressDashboard');
    const snapshot = await progressRef.orderBy('updatedAt', 'desc').get();
    
    const progressItems = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      progressItems.push({
        id: doc.id,
        ...data,
        // 日付フィールドの統一処理
        lastContactDate: data.lastContactDate?.toDate?.()?.toLocaleDateString('ja-JP') || 
                        data.lastContactDate || null,
        nextActionDate: data.nextActionDate || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      });
    });
    
    console.log('✅ 進捗一覧取得成功:', {
      取得件数: progressItems.length,
      最初の案件ID: progressItems[0]?.id || 'なし'
    });
    
    res.json({ 
      progressItems,
      total: progressItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('💥 進捗一覧取得エラー:', error);
    res.status(500).json({ 
      error: '進捗一覧の取得に失敗しました',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 案件削除（進捗一覧から）
app.delete('/api/progress-dashboard/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 削除対象の案件情報を取得
    const progressRef = db.collection('progressDashboard');
    const docSnapshot = await progressRef.doc(id).get();
    
    if (!docSnapshot.exists) {
      return res.status(404).json({ error: '案件が見つかりません' });
    }
    
    const dealData = docSnapshot.data();
    const { productName, proposalMenu } = dealData;
    
    // 案件を削除
    await progressRef.doc(id).delete();
    
    // 削除ログを作成
    const deleteLog = {
      dealId: id,
      dealKey: `${productName}_${proposalMenu}`,
      productName,
      proposalMenu,
      action: '案件削除',
      description: `${productName}（${proposalMenu}）を${new Date().toLocaleDateString('ja-JP')}に削除しました`,
      status: 'deleted',
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await actionLogsRef.add(deleteLog);
    
    res.json({
      message: '案件が削除されました',
      id,
      deletedDeal: {
        productName,
        proposalMenu
      }
    });
  } catch (error) {
    console.error('案件削除エラー:', error);
    res.status(500).json({ error: '案件の削除に失敗しました' });
  }
});

// エラーハンドリング
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Firebase Functions でエクスポート
exports.api = functions.https.onRequest(app);
 