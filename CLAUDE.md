# 営業管理ツール vol2 - 開発履歴・仕様書

## プロジェクト概要
React.js + Firebase で構築された営業進捗管理システム。アクションログ記録、案件進捗管理、カンバンボード、紹介者管理機能を提供。

## 技術スタック
- **フロントエンド**: React 19.1.0, styled-components, react-router-dom
- **バックエンド**: Firebase (Firestore, Functions, Hosting)
- **AI機能**: OpenAI GPT-4o-mini（議事録分析）
- **認証**: SHA256暗号化、セッション管理
- **デプロイ**: Firebase Hosting (https://admn-45826.web.app)
- **リポジトリ**: https://github.com/senjinshuji/----vol2.git

## 開発履歴

### Phase 1: 初期セットアップ (初期)
- Create React App でプロジェクト作成
- Firebase Functions API実装
- モックデータによる基本機能実装

### Phase 2: アクションログ取得エラー修正 (2025/6/5)
**問題**: 案件詳細ページでアクションログが「取得に失敗しました」エラー

**原因分析**:
- ProductDetailPage.js:398 でAPI呼び出し失敗
- 案件IDとdealIdの関連付けエラー
- Firebase Functions APIへの接続問題

**解決策実装**:
1. **エラーハンドリング強化** (ProductDetailPage.js:408-484)
   - 3段階の検索戦略実装
   - 詳細ログ出力とフォールバック機能
   - クライアントサイドフィルタリング

2. **Firebase Functions API改善** (functions/index.js:82-143)
   - ログ強化とエラー詳細表示
   - Timestamp変換処理統一
   - API レスポンス形式統一

### Phase 3: Firebase SDK直接実装 (2025/6/5)
**背景**: Functions API経由の問題を根本解決するため、React アプリから Firestore に直接アクセスする方式に変更

**実装内容**:

#### 1. Firebase設定 (src/firebase.js)
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "admn-45826",
  appId: "1:528077412400:web:8a3b2ed21ba1d076d075f5",
  // ... その他設定
};

export const db = getFirestore(initializeApp(firebaseConfig));
```

#### 2. 各コンポーネントの Firestore 直接アクセス化

**ProductDetailPage.js**:
- Firestoreから案件データ直接取得
- 複数クエリでアクションログ検索（dealId, productName, productName+proposalMenu）
- クライアントサイドでのタイムスタンプ変換

**ProgressDashboard.js**:
- progressDashboardコレクションから進捗一覧取得
- deleteDocで案件削除機能実装

**ActionLogList.js**:
- actionLogsコレクションから全ログ取得
- orderByでソート処理

**LogEntryPage.js**:
- 新規案件/既存案件の自動判定
- progressDashboardとactionLogsの同時更新
- serverTimestamp()でサーバー時刻統一

#### 3. Firestoreセキュリティルール (firestore.rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /actionLogs/{document} {
      allow read, write: if true;
    }
    match /progressDashboard/{document} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if true; // 開発用
    }
  }
}
```

### Phase 4: アクションログ表示問題修正 (2025/6/5)
**問題**: Firebase SDK実装後もアクションログが表示されない

**原因**: Firestoreの複合インデックス（where + orderBy）でエラー発生

**解決策**:
- 全アクションログをクライアントサイドで取得・フィルタリング
- orderByを使わない単純クエリに変更
- ProductDetailPage.js:418-449 でフィルタリング実装

### Phase 5: 営業パートナー向け独立アプリケーションの構築 (2025/6/5)
**目的**: 営業パートナー（代理店）専用の完全に独立したWebアプリケーションを提供

**実装内容**:

#### 1. 独立したパートナーアプリケーション
- **PartnerApp.js**: 管理者用とは完全に独立したアプリケーション
- **PartnerEntryPage.js**: 簡潔な案件進捗入力フォーム
- **PartnerDashboard.js**: パートナー専用の案件一覧表示
- 紹介者入力フィールドを完全非表示
- 担当者名は自動表示（編集不可）

#### 2. 独立したUI/UXデザイン
- **カラーテーマ**: 紫系グラデーション（#667eea → #764ba2）
- **ナビゲーション**: ホーム、案件進捗記入、案件一覧の3ページ構成
- **ウェルカムページ**: パートナー向けの説明とガイダンス
- 管理者画面とは完全に異なるブランディング

#### 3. デプロイメント構成
```
https://admn-45826.web.app/          # 管理者用アプリ
https://admn-45826.web.app/partner/  # パートナー用アプリ
```

#### 4. ビルド・デプロイシステム
- `build-all.sh`: 両アプリを同時ビルド
- `dist/admin/`: 管理者用ビルド出力
- `dist/partner/`: パートナー用ビルド出力
- Firebase Hostingのリライトルールで適切にルーティング

#### 5. フォーム機能仕様
```javascript
{
  productName: string,         // 商材名（手入力）
  proposalMenu: string,        // 提案メニュー（5種から選択）
  representative: string,      // 担当者（自動表示）
  status: string,             // ステータス（7種から選択）
  lastContactDate: string     // 最終接触日（日付ピッカー、初期値：今日）
}
```

#### 6. データ連携
- 同一Firestoreデータベースを使用（progressDashboard、actionLogs）
- 商材名 + 提案メニューのペアで案件を一意識別
- 既存案件の自動検索・更新機能
- 全変更をアクションログとして履歴記録

## 現在のファイル構成

```
/
├── src/
│   ├── App.js                   # 管理者用メインアプリ（認証統合）
│   ├── PartnerApp.js            # パートナー用メインアプリ（認証統合）
│   ├── index.js                 # エントリーポイント（環境変数で切り替え）
│   ├── partner-index.js         # パートナー用エントリーポイント
│   ├── firebase.js              # Firebase SDK設定
│   ├── test-firebase.js         # Firestore接続テスト（開発用）
│   ├── test-gpt.js              # GPT機能テスト用
│   ├── test-implementation-dates.js # 実施月データ調査用
│   ├── server.js                # Express サーバー（開発用）
│   ├── components/
│   │   ├── ActionLogList.js     # アクションログ一覧（管理者用・併記表示）
│   │   ├── LogEntryPage.js      # ログ記録（担当者分離対応・AI分析統合）
│   │   ├── ProductDetailPage.js # 案件詳細（条件分岐表示・削除機能）
│   │   ├── ProgressDashboard.js # 進捗一覧（管理者用・併記表示・アンドゥ機能）
│   │   ├── KanbanBoard.js       # カンバンボード（管理者用・併記表示）
│   │   ├── IntroducerMasterPage.js # 紹介者管理
│   │   ├── HomeDashboard.js     # 管理者用ホーム画面（統計・フィルター機能）
│   │   ├── SalesResultsList.js  # 成約案件一覧（確定日管理）
│   │   ├── ReceivedOrderModal.js # 受注モーダル
│   │   ├── Breadcrumb.js        # パンくずナビゲーション
│   │   ├── LoginPage.js         # 管理者用ログイン画面
│   │   ├── PartnerLoginPage.js  # パートナー用ログイン画面
│   │   ├── ProtectedRoute.js    # 認証ガード
│   │   ├── PartnerEntryPage.js  # パートナー向け案件進捗記入
│   │   ├── PartnerDashboard.js  # パートナー向け案件一覧（旧版）
│   │   ├── PartnerProgressDashboard.js # パートナー専用案件一覧（横スクロール対応）
│   │   ├── PartnerKanbanBoard.js # パートナー専用カンバンボード
│   │   ├── PartnerActionLogList.js # パートナー専用アクションログ一覧
│   │   ├── PartnerHomeDashboard.js # パートナー用ホーム画面（統計・部署別集計）
│   │   ├── PartnerSalesResultsList.js # パートナー用成約案件一覧
│   │   ├── PartnerRepresentativeMasterPage.js # パートナー専用担当者マスター（部署対応）
│   │   ├── InfluencerRegisterPage.js # インフルエンサー登録（Ver2.8新規追加）
│   │   ├── InfluencerListPage.js # インフルエンサー一覧（Ver2.8新規追加）
│   │   └── CastingManagePage.js # キャスティング進捗管理（Ver2.8新規追加）
│   ├── data/
│   │   ├── constants.js         # 定数定義（部署名追加）
│   │   └── mockData.js          # モックデータ（フォールバック用）
│   ├── services/
│   │   ├── authService.js       # 認証サービス（SHA256・セッション管理）
│   │   ├── gptService.js        # GPT API統合・議事録分析
│   │   ├── salesService.js      # 売上データ管理
│   │   ├── aiService.js         # AI関連サービス
│   │   └── slackService.js      # Slack連携（拡張機能）
│   ├── hooks/
│   │   ├── useUndo.js           # アンドゥ機能フック
│   │   └── useSalesData.js      # 売上データフック
│   ├── contexts/
│   │   └── UndoContext.js       # グローバルアンドゥ状態
│   ├── routes/
│   │   ├── actionLogs.js        # API ルーティング
│   │   ├── deals.js             # 案件API
│   │   ├── kanban.js            # カンバンAPI
│   │   └── notifications.js     # 通知API
│   └── models/
│       └── dataStore.js         # 旧データストア（未使用）
├── public/
│   ├── index.html               # 管理者用HTMLテンプレート
│   └── partner.html             # パートナー用HTMLテンプレート
├── functions/
│   └── index.js                 # Firebase Functions（旧API）
├── dist/                        # デプロイ用ディストリビューション
│   ├── admin/                   # 管理者用ビルド出力
│   └── partner/                 # パートナー用ビルド出力
├── build-all.sh                 # 両アプリ同時ビルドスクリプト
├── firestore.rules              # Firestoreセキュリティルール
├── firebase.json                # Firebase設定
├── .env                         # 環境変数（OpenAI APIキー等）
├── package.json                 # Node.js依存関係
└── CLAUDE.md                    # この開発履歴書
```

## Firestoreコレクション設計

### actionLogs コレクション
```javascript
{
  id: string,                    // ドキュメントID（自動生成）
  dealId: string,               // 案件ID（progressDashboardのドキュメントID）
  dealKey: string,              // "商材名_提案メニュー"
  productName: string,          // 商材名
  proposalMenu: string,         // 提案メニュー
  action: string,               // アクション内容
  description: string,          // 詳細説明
  status: string,              // ステータス
  nextAction: string,          // 次回アクション
  nextActionDate: string,      // 次回アクション日
  representative: string,      // 社内担当者（Ver2.2で分離）
  partnerRepresentative: string, // パートナー担当者（Ver2.2新規追加）
  introducer: string,          // 紹介者名
  createdAt: Timestamp,        // 作成日時
  updatedAt: Timestamp         // 更新日時
}
```

### progressDashboard コレクション
```javascript
{
  id: string,                   // ドキュメントID（自動生成）
  productName: string,         // 商材名
  proposalMenu: string,        // 提案メニュー
  representative: string,      // 社内担当者（Ver2.2で分離）
  partnerRepresentative: string, // パートナー担当者（Ver2.2新規追加）
  introducer: string,          // 紹介者名
  introducerId: number,        // 紹介者ID
  status: string,             // ステータス
  lastContactDate: string,    // 最終接触日
  nextAction: string,         // 次回アクション
  nextActionDate: string,     // 次回アクション日
  createdAt: Timestamp,       // 作成日時
  updatedAt: Timestamp        // 更新日時
}
```

### representatives コレクション（Ver2.2新規追加）
```javascript
{
  id: string,                   // ドキュメントID（自動生成）
  name: string,                // 担当者名
  companyName: string,         // 所属会社名（例：株式会社ピアラ）
  department: string,          // 部署名（Ver2.12追加）
  status: string,             // ステータス（アクティブ/非アクティブ）
  createdAt: Timestamp,       // 作成日時
  updatedAt: Timestamp        // 更新日時
}
```

### influencers コレクション（Ver2.8新規追加）
```javascript
{
  id: string,                    // ドキュメントID（自動生成）
  name: string,                  // 名前（必須）
  snsHandle: string,             // SNSハンドル名
  tiktokFollowerCount: number,   // TikTokフォロワー数（Ver2.8.1分離）
  instagramFollowerCount: number, // Instagramフォロワー数（Ver2.8.1分離）
  youtubeFollowerCount: number,  // YouTubeフォロワー数（Ver2.8.1分離）
  tiktokPrice: number,           // TikTok料金（円）
  instagramPrice: number,        // Instagram料金（円）
  youtubePrice: number,          // YouTube料金（円）
  secondaryUsageFee1Month: number, // 二次利用費1ヶ月（Ver2.8.1追加）
  secondaryUsageFee2Months: number, // 二次利用費2ヶ月（Ver2.8.1追加）
  secondaryUsageFee3Months: number, // 二次利用費3ヶ月（Ver2.8.1追加）
  agency: string,                // 所属事務所名
  remarks: string,               // 備考
  proposalStatus: string,        // 提案状況（Ver2.8.2追加）
  // proposalStatus値: '提案予定', '提案済', '回答待ち', 'OK（確定）', 'NG（辞退）', '未定（保留）'
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

### castingProposals コレクション（Ver2.8新規追加）
```javascript
{
  id: string,                    // ドキュメントID（自動生成）
  projectName: string,           // 案件名（既存案件から）（Ver2.8.1変更）
  dealId: string,                // 関連案件ID（progressDashboardのID）
  influencers: [                 // 提案インフルエンサー配列
    {
      influencerId: string,      // インフルエンサーID
      influencerName: string,    // インフルエンサー名（表示用）
      status: string,            // 進捗状況
      // status値: '未連絡', '連絡済み', '交渉中', 'OK', 'NG', '保留'
      updatedAt: Date            // ステータス更新日時（Ver2.8.1 Date型に変更）
    }
  ],
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

## 主要機能仕様

### 1. アクションログ記録 (/log-entry)
- フォームバリデーション
- 新規案件の自動作成
- 既存案件の更新
- Firestore への直接保存

### 2. 案件進捗一覧 (/)
- Firestore からリアルタイム取得
- フィルタリング（検索、ステータス、担当者）
- 案件削除機能
- 案件詳細への遷移

### 3. 案件詳細 (/product/:id)
- 案件情報表示
- 関連アクションログ表示（クライアントサイドフィルタリング）
- 新規アクション追加

### 4. アクションログ一覧 (/action-logs)
- 全アクションログ表示
- 詳細モーダル
- 削除機能

### 5. カンバンボード (/kanban)
- ドラッグ&ドロップでステータス変更
- react-dnd 使用

### 6. 紹介者マスター (/introducer-master)
- 紹介者情報管理
- 新規登録・編集・削除

### 7. 営業パートナー向け独立アプリケーション (/partner/)
- **完全独立設計**: 管理者画面とは完全に分離されたアプリ
- **専用ホームページ**: パートナー向けウェルカム画面
- **案件進捗記入** (/partner/entry): 簡潔なフォーム設計（紹介者入力なし）
- **案件一覧** (/partner/dashboard): パートナー担当案件の表示
- 商材名と提案メニューのペアで案件管理
- ステータス更新（プルダウン形式）
- 最終接触日記録
- 既存案件の自動検索・更新機能

### 8. インフルエンサーキャスティング管理（管理者専用）（Ver2.8新規追加）
- **インフルエンサー管理** (/if/register, /if/list)
  - インフルエンサー情報の登録・編集・削除
  - 媒体別料金管理（TikTok/Instagram/YouTube）
  - 検索・ソート機能
- **キャスティング進捗管理** (/casting/manage)
  - クライアント案件へのインフルエンサー提案
  - 進捗ステータス管理（未連絡/連絡済み/交渉中/OK/NG/保留）
  - ステータス集計表示
  - 複数インフルエンサーの一括管理

## デプロイメント

### 本番環境
- **管理者用URL**: https://admn-45826.web.app
- **パートナー用URL**: https://admn-45826.web.app/partner/
- **Firebase Project**: admn-45826

### デプロイコマンド
```bash
# 1. 両アプリ同時ビルド
./build-all.sh

# 2. Firebase Hosting デプロイ
firebase deploy --only hosting

# 3. Firestore ルールデプロイ（必要時）
firebase deploy --only firestore:rules

# 4. Functions デプロイ（旧API、現在は未使用）
firebase deploy --only functions

# 個別ビルド（開発時）
npm run build                    # 管理者用のみ
REACT_APP_ENTRY_POINT=partner npm run build  # パートナー用のみ
```

### 自動デプロイ指示
**重要**: 今後の開発では、コード変更後に必ず以下を実行すること：

1. `./build-all.sh` で両アプリを同時ビルド実行
2. `firebase deploy --only hosting` でFirebase Hostingにデプロイ
3. エラーがある場合は修正後に再度1-2を実行
4. 本番環境で動作確認
   - 管理者用: https://admn-45826.web.app
   - パートナー用: https://admn-45826.web.app/partner/

**Firestoreルール変更時は追加で**:
- `firebase deploy --only firestore:rules` も実行

## トラブルシューティング

### アクションログが表示されない場合
1. ブラウザコンソールでエラー確認
2. ProductDetailPage.js:410-449 のログ出力確認
3. Firestoreコンソールでデータ存在確認

### 保存エラーの場合
1. LogEntryPage.js:485-510 のエラーログ確認
2. Firestoreセキュリティルール確認
3. Firebase プロジェクト接続状況確認

### ビルドエラーの場合
1. package.json の依存関係確認
2. React 19.1.0 との互換性確認
3. ESLint警告の確認（ビルドには影響しないが修正推奨）

## 今後の改善予定

### セキュリティ
- Firebase Authentication 実装
- Firestoreセキュリティルールの厳格化
- 本番環境での適切な権限設定

### 機能拡張
- リアルタイム通知機能
- データエクスポート機能

### Phase 6: Ver 2.2 機能拡張実装 (2025/6/6)
**目的**: パートナー画面の機能強化と担当者フィールドの分離実装

#### A. パートナー画面機能拡張

**1. 削除機能の追加**
- 案件削除ボタンと確認ダイアログの実装
- カスケード削除（関連アクションログも削除）
- 削除履歴のアクションログ記録
- 全画面（案件一覧、カンバンボード）への即時反映

**2. インラインステータス変更**
- 静的ステータスバッジをプルダウンセレクトに変更
- 変更時の即座保存機能
- ステータス変更履歴のアクションログ記録
- ページリロード不要のリアルタイム更新

#### B. 担当者フィールド分離機能

**1. データ構造の分離**
```javascript
// 従来
{ representative: string }

// Ver 2.2後
{
  representative: string,        // 社内担当者（例：増田 陽）
  partnerRepresentative: string  // パートナー担当者（例：田中 太郎）
}
```

**2. 管理者画面での併記表示**
- 案件一覧：「増田 陽（社内）／田中 太郎（ピアラ）」
- 案件詳細：同様の併記形式
- アクションログ：詳細モーダルで併記表示
- カンバンボード：カード内で併記表示

**3. パートナー画面での単独表示**
- パートナー担当者のみ表示（社内担当者は非表示）
- フィルタリング機能もパートナー担当者基準
- 編集時もパートナー担当者のみ編集可能

**4. LogEntryPage.js の自動分離保存**
```javascript
// パートナー案件の場合
const newDeal = {
  representative: '増田 陽',                    // 固定
  partnerRepresentative: formData.representative, // ユーザー入力値
  // ...
};
```

#### C. 紹介者データ引き継ぎ問題修正

**問題**: 既存案件に対するアクション追加時に紹介者情報が空欄になる

**解決策**:
1. **URL パラメータの拡張**
   - introducerId に加えて introducer（紹介者名）も渡す
   - パートナー案件では適切な紹介者情報を設定

2. **編集モードでの制御強化**
   - 既存案件追加時は紹介者フィールドを編集不可
   - 新規登録ボタンも編集モード時は非表示
   - パートナー画面では紹介者情報を読み取り専用で表示

3. **全画面での対応**
   - ProgressDashboard.js（管理者）
   - PartnerProgressDashboard.js（パートナー）
   - ProductDetailPage.js（案件詳細）
   - すべての "追加" ボタンで紹介者情報を正確に引き継ぎ

#### 実装ファイル詳細

**新規作成ファイル**:
- PartnerProgressDashboard.js：パートナー専用案件一覧
- PartnerKanbanBoard.js：パートナー専用カンバンボード
- PartnerActionLogList.js：パートナー専用アクションログ一覧
- PartnerRepresentativeMasterPage.js：パートナー専用担当者マスター

**更新ファイル**:
- ProgressDashboard.js：併記表示機能追加
- ProductDetailPage.js：条件分岐による表示切り替え
- ActionLogList.js：管理者用併記表示
- KanbanBoard.js：管理者用併記表示
- LogEntryPage.js：担当者分離保存、紹介者データ処理強化

#### デプロイ・テスト確認

- **ビルド**: `npm run build` 成功
- **デプロイ**: `firebase deploy --only hosting` 完了
- **本番確認**: https://admn-45826.web.app で動作確認済み
- **パートナー確認**: パートナー画面での担当者表示修正済み
- 詳細な分析・レポート機能
- モバイル対応の改善

### パフォーマンス
- Firestoreクエリの最適化
- インデックス設定の見直し
- 画像最適化とCDN活用

## 開発者向けノート

### デバッグ方法
- ブラウザコンソールで詳細ログ確認
- src/test-firebase.js で接続テスト
- Firebase コンソールでデータ確認

### コーディング規約
- styled-components使用
- TypeScript移行検討中
- ESLint設定遵守
- コミットメッセージは英語推奨

### Firebase設定
- Project ID: admn-45826
- Region: us-central1
- セキュリティルール: 開発用（本番では要変更）

### Phase 6: Ver 2.3 - 認証システム実装 (2025/6/6)
**背景**: セキュリティ強化のため、管理者画面とパートナー画面にID/パスワード認証を導入

**実装内容**:

#### 1. 認証サービス (src/services/authService.js)
- SHA256パスワードハッシュ化
- セッション管理（30分タイムアウト）
- アクティビティトラッキング
- localStorage/sessionStorage対応
- "ログイン状態を保持"機能

```javascript
const AUTH_CREDENTIALS = {
  admin: {
    id: 'salessenjin',
    passwordHash: CryptoJS.SHA256('salessenjin1234').toString(),
    sessionKey: 'sales_admin_session'
  },
  partner: {
    id: 'salessenjinpiala', 
    passwordHash: CryptoJS.SHA256('salessenjinpiala1234').toString(),
    sessionKey: 'sales_partner_session'
  }
};
```

#### 2. ログイン画面
**LoginPage.js** (管理者用):
- 青系グラデーションデザイン
- バリデーション機能
- パスワード表示/非表示切り替え
- "ログイン状態を保持"チェックボックス

**PartnerLoginPage.js** (パートナー用):
- 紫系グラデーションデザイン
- 株式会社ピアラのブランディング
- 同等のセキュリティ機能

#### 3. 認証ガード (src/components/ProtectedRoute.js)
- セッション状態の監視
- 自動セッション期限切れ検知
- セッション期限切れモーダル表示
- 5秒間隔での認証状態チェック

#### 4. アプリケーション統合
**App.js** (管理者画面):
- ProtectedRouteで全画面を保護
- ヘッダーにログアウト機能追加
- セッション期限切れハンドリング

**PartnerApp.js** (パートナー画面):
- 同様の認証保護機能
- パートナー専用デザインのヘッダー
- ログアウト機能

#### 5. 認証仕様
**管理者アカウント**:
- URL: https://admn-45826.web.app
- ID: salessenjin
- Password: salessenjin1234

**パートナーアカウント**:
- URL: https://admn-45826.web.app/partner-entry/piala
- ID: salessenjinpiala
- Password: salessenjinpiala1234

**セキュリティ機能**:
- 30分間無操作でセッション自動切断
- SHA256暗号化パスワード
- ブラウザ閉じても残るセッション（Remember Me）
- マウス・キーボード・スクロール操作の自動検知
- 失敗ログイン試行制限なし（要件通り）

#### 6. 依存関係追加
```bash
npm install crypto-js
```

#### 7. トラブルシューティング修正
- ログイン成功後の遷移遅延問題修正
- import拡張子(.js)の統一
- 認証状態の即座反映

### Phase 7: Ver 2.4 - パートナー機能強化とパンくずナビゲーション実装 (2025/6/6)
**目的**: パートナー画面の機能強化とユーザビリティ向上

**実装内容**:

#### A. パートナー専用提案メニュー対応
**問題**: パートナー画面で「他社案件」メニューが表示されない

**解決策**:
1. **PARTNER_PROPOSAL_MENUS 定数追加** (src/data/constants.js)
   - 管理者用：PROPOSAL_MENUS（「他社案件」を除く）
   - パートナー用：PARTNER_PROPOSAL_MENUS（「他社案件」を含む）

2. **条件分岐レンダリング実装**
   - LogEntryPage.js：isPartnerView判定でメニュー切り替え
   - PartnerProgressDashboard.js：編集モーダルでパートナー用メニュー使用

#### B. UI/UXの統一と改善
**1. ステータス表示の色彩統一**
- パートナー案件一覧のステータスプルダウンに色付け
- STATUS_COLORS定数を全画面で統一使用
- アクションログ一覧のステータスバッジにも色付け適用

**2. ホームダッシュボード機能強化**
- **管理者画面**: メニュー別実績サマリー追加（会社別実績の上位配置）
- **パートナー画面**: 
  - 個人別実績サマリー（金額/件数/成約率）表示
  - ステータス別案件数を4列×2行レイアウトに変更
  - 月次売上実績を確定日ベースに変更

**3. 表示テキストの改善**
- 「案件詳細一覧」→「案件一覧」
- 「カンバンボード」→「看板ボード」
- 「受注月」→「実施月」（全システム統一）

#### C. 確定日機能の実装
**1. データ構造拡張**
```javascript
// progressDashboard コレクション拡張
{
  confirmedDate: string,  // 確定日（受注ステータス変更時自動記録）
  // ...既存フィールド
}
```

**2. 自動確定日記録**
- ステータスが「受注」に変更された時点で自動記録
- PartnerProgressDashboard.js でのインラインステータス変更時対応
- 成約案件一覧での手動編集も対応

**3. 統計の確定日ベース化**
- 月次売上実績：実施月→確定日（今月決まった案件）ベース
- 成約案件一覧サマリー：確定日ベースでの集計
- 管理者・パートナー両画面で統一

#### D. 成約案件一覧機能拡張
**1. 確定日列の追加**
- 日付ピッカーでの編集機能
- 自動記録された確定日の表示
- フィルタリング・ソート機能

**2. サマリー情報の改善**
- 今月の成約件数：確定日ベース
- 今月の受注金額：確定日ベース
- 総件数・累計金額の正確な表示

#### E. パンくずナビゲーション実装
**1. Breadcrumb コンポーネント作成** (src/components/Breadcrumb.js)
```javascript
// 管理者用ルート
'/': 'ホーム', '/progress-dashboard': '案件一覧'
'/log-entry': 'アクションログ記録', '/action-logs': 'ログ一覧'
'/kanban': '看板ボード', '/sales-results': '成約案件一覧'

// パートナー用ルート  
'/partner-entry/piala': 'ホーム'
'/partner-entry/piala/dashboard': '案件一覧'
'/partner-entry/piala/log-entry': 'アクションログ記録'
```

**2. ナビゲーション機能**
- 現在位置の表示（ホーム > 現在のページ）
- ホームアイコン付きのクリック可能リンク
- 管理者・パートナー画面の自動判定
- 案件詳細ページでの動的パス解決

**3. デザイン仕様**
- 白背景、影付きカード表示
- 青系リンク色（#3498db）
- チェブロン（>）区切り記号
- レスポンシブ対応

#### 実装ファイル詳細

**新規作成**:
- Breadcrumb.js：パンくずナビゲーションコンポーネント

**主要更新**:
- LogEntryPage.js：パートナー専用メニュー対応
- PartnerProgressDashboard.js：ステータス色付け、確定日自動記録
- PartnerHomeDashboard.js：個人別実績、4×2レイアウト、確定日ベース統計
- HomeDashboard.js：メニュー別実績、確定日ベース統計
- ActionLogList.js, PartnerActionLogList.js：ステータス色付け
- SalesResultsList.js, PartnerSalesResultsList.js：確定日列、確定日ベース統計
- App.js, PartnerApp.js：Breadcrumb組み込み

#### デプロイ・動作確認
- ビルド成功：管理者用・パートナー用とも正常
- デプロイ完了：Firebase Hosting
- 本番確認：
  - 管理者用: https://admn-45826.web.app
  - パートナー用: https://admn-45826.web.app/partner-entry/piala
- 全機能動作確認済み

### Phase 8: Ver 2.5 - Cmd+Z機能実装とフィルター機能改善 (2025/6/7)
**目的**: 操作取り消し機能の実装とホーム画面フィルター機能の強化

**実装内容**:

#### A. Cmd+Z(Mac)/Ctrl+Z(Windows) アンドゥ機能実装

**1. アンドゥシステム設計**
- **useUndo Hook** (src/hooks/useUndo.js)
  - キーボードショートカット監視（Cmd+Z/Ctrl+Z）
  - アンドゥスタック管理（最大10操作まで保持）
  - 通知システム統合
  - 操作タイムスタンプ記録

- **UndoContext** (src/contexts/UndoContext.js)
  - グローバルアンドゥ状態管理
  - Context APIによる全画面共有
  - アンドゥフック機能の提供

**2. 対応操作の実装**
- **案件削除のアンドゥ**: 削除された案件データを完全復元
- **ステータス変更のアンドゥ**: 前のステータスに戻す
- **案件編集のアンドゥ**: 編集前のデータに復元
- **関連アクションログの復元**: 削除時の関連ログも復元

**3. 実装ファイル**
```javascript
// useUndo.js - アンドゥ機能コア
const recordAction = useCallback((actionData) => {
  const action = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    ...actionData
  };
  setUndoStack(prev => [...prev.slice(-9), action]);
}, []);

// ProgressDashboard.js - 削除アンドゥ
recordAction({
  type: 'DELETE_DEAL',
  description: `案件「${deal.productName}」を削除`,
  undoFunction: async () => {
    await setDoc(docRef, restoreData);
    await fetchProgressData();
  }
});
```

#### B. ドラッグ&ドロップ機能削除

**背景**: カンバンボードでの誤操作防止とUI簡素化

**実装内容**:
- **react-dnd ライブラリ完全削除**
- **package.json から依存関係削除**
- **KanbanBoard.js, PartnerKanbanBoard.js の修正**
  - DragDropContextの削除
  - ドラッグ可能要素の通常カードに変更
  - クリック→詳細画面遷移機能は保持

#### C. 無限ループ問題修正

**問題**: ホーム画面でデータ読み込みが無限に繰り返される

**原因**: useCallbackの依存配列で関数が毎回新しく作られていた

**解決策**:
```javascript
// 修正前：isDateInRangeが毎回新しい関数として作成
const fetchProposalStats = useCallback(async () => {
  // ...
}, [dateFilter, isDateInRange]);

// 修正後：isDateInRangeをuseCallbackでラップ
const isDateInRange = useCallback((dateString, filter) => {
  // 実装
}, []);

const fetchProposalStats = useCallback(async () => {
  // ...
}, [dateFilter, isDateInRange]);
```

#### D. フィルター機能の独立化と改善

**1. 独立したフィルター実装**

**管理者ホーム画面**:
- `menuDateFilter`: メニュー別実績サマリー専用
- `companyDateFilter`: 会社別実績サマリー専用
- 各フィルターは完全に独立して動作

**2. 0件データの表示改善**

**改善前**: データが0件の項目は非表示
**改善後**: 全項目を常時表示、0件の場合も¥0/0件として表示

**実装内容**:
```javascript
// 全メニューを事前に初期化
PROPOSAL_MENUS.forEach(menu => {
  proposalData[menu] = {
    totalDeals: 0,
    receivedOrders: 0,
    totalAmount: 0
  };
});

// 全会社を事前に取得・初期化
const allCompanies = new Set();
querySnapshot.forEach((docSnap) => {
  const company = data.introducer || '社内';
  allCompanies.add(company);
});
```

**3. フィルターUIの改善**
- 各セクションごとに独立したフィルタードロップダウン
- リアルタイムでの期間表示
- 今月、先月、直近3ヶ月、全体の4オプション

#### E. パートナー画面の同期改善

**担当者別実績の0件表示対応**:
- 全担当者を事前に取得
- フィルター適用後も全担当者を表示
- 0件の場合は¥0/0件として表示

#### 実装ファイル詳細

**新規作成**:
- src/hooks/useUndo.js：アンドゥ機能コア
- src/contexts/UndoContext.js：グローバルアンドゥ状態

**主要更新**:
- src/components/HomeDashboard.js：独立フィルター、0件表示、無限ループ修正
- src/components/PartnerHomeDashboard.js：同様の改善適用
- src/components/ProgressDashboard.js：アンドゥ機能統合
- src/components/PartnerProgressDashboard.js：アンドゥ機能統合
- src/components/KanbanBoard.js：ドラッグ&ドロップ削除
- src/components/PartnerKanbanBoard.js：ドラッグ&ドロップ削除
- src/App.js：UndoContext統合
- src/PartnerApp.js：UndoContext統合
- package.json：react-dnd関連削除

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 269.1 kB (main.17f59824.js)
- パートナー用: 269.03 kB (main.68248a08.js)
- ESLint警告のみ（動作に影響なし）

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/
- 全機能正常動作確認済み

**主要機能テスト**:
- ✅ Cmd+Z/Ctrl+Zアンドゥ機能
- ✅ 独立したフィルター動作
- ✅ 0件データの適切な表示
- ✅ 無限ループ問題解決
- ✅ ドラッグ&ドロップ削除完了

### Phase 9: Ver 2.6 - AI議事録分析機能実装 (2025/6/7)
**目的**: OpenAI GPT-4o-miniを活用した議事録の自動分析・要約機能を追加

**実装内容**:

#### A. GPTサービス実装

**1. OpenAI API統合** (src/services/gptService.js)
```javascript
// OpenAI APIクライアント初期化
const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

// 議事録分析機能
export const analyzeMeetingNotes = async (meetingNotes) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'あなたは営業支援AIです。議事録を分析して、次のアクションプランと適切なステータスを提案してください。'
      },
      {
        role: 'user',
        content: createPrompt(meetingNotes)
      }
    ],
    max_tokens: 1000,
    temperature: 0.3
  });
};
```

**2. プロンプト設計**
- **AI要約**: 議事録を5行で要約
- **アクションプラン**: 具体的な次回アクションを複数提案
- **ステータス**: 6つの定義済みステータスから最適なものを選択
  - 与件化_提案中、受注、失注、保留、検討中、稼働終了

**3. レスポンス解析機能**
```javascript
export const parseGPTResponse = (response) => {
  // ■マーカーでセクション分割
  // リストマーカー除去とクリーニング
  // 定義済みステータスのマッチング
  return { summary, actionPlans, status };
};
```

#### B. アクションログ記録画面への統合

**1. LogEntryPage.js機能拡張**
- **議事録フィールド名変更**: "アクション詳細" → "議事録"
- **AI分析ボタン**: 50文字以上入力時に表示
- **自動フォーム適用**: 分析結果を次回アクション、ステータス、要約に自動入力

**2. フォームフィールド拡張**
```javascript
const [formData, setFormData] = useState({
  // 既存フィールド
  summary: '' // 新規追加：AI要約保存用
});

// AI分析結果の自動適用
if (result && !result.error) {
  const allActionPlans = result.actionPlans.join('\n');
  setFormData(prev => ({
    ...prev,
    nextAction: allActionPlans,  // 全アクションプラン
    status: result.status,       // 推奨ステータス
    summary: result.summary      // AI要約
  }));
}
```

**3. データベース統合**
- **progressDashboard**: summaryフィールド追加
- **actionLogs**: summaryフィールド追加
- 既存案件・新規案件両方でAI要約を保存

#### C. パートナー画面対応

**1. 機能統一**
- パートナー用アクションログ記録でも同じAI分析機能を利用可能
- 管理者・パートナー両画面で同等の機能提供

**2. 権限制御削除**
```javascript
// 修正前: 管理者のみ
{!isPartnerView && formData.actionDetails && ...}

// 修正後: 全ユーザー対象
{formData.actionDetails && formData.actionDetails.length > 50 && ...}
```

#### D. 表示制御の最適化

**1. 画面別表示ルール**
- **アクションログ記録**: 議事録入力 + AI分析機能
- **案件詳細（通常表示）**: 要約 + 次回アクションのみ
- **案件詳細（編集時）**: 議事録 + 要約 + 次回アクション
- **アクションログ一覧**: 要約 + 次回アクションのみ

**2. UI/UX改善**
- 次回アクションをTextAreaに変更（複数アクション対応）
- 要約フィールドをステータス下に配置
- AI分析結果の中間表示を削除（直接フォーム適用）

#### E. API設定・デプロイ

**1. 環境設定**
```bash
# .env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

**2. 依存関係追加**
```json
{
  "dependencies": {
    "openai": "^4.x.x"
  }
}
```

#### 実装ファイル詳細

**新規作成**:
- src/services/gptService.js：GPT API統合・議事録分析
- src/test-gpt.js：GPT機能テスト用
- test-direct-gpt.html：ブラウザでの直接APIテスト

**主要更新**:
- src/components/LogEntryPage.js：AI分析機能統合、フィールド名変更、要約追加
- src/components/ProductDetailPage.js：議事録非表示、編集時表示制御
- src/components/ActionLogList.js：議事録非表示、要約表示
- src/components/PartnerActionLogList.js：同様の表示制御
- .env：OpenAI APIキー設定

#### データベーススキーマ拡張

**progressDashboard コレクション**:
```javascript
{
  // 既存フィールド
  summary: string,  // AI要約（新規追加）
}
```

**actionLogs コレクション**:
```javascript
{
  // 既存フィールド
  summary: string,  // AI要約（新規追加）
}
```

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 302.04 kB
- パートナー用: 301.82 kB
- GPTサービス統合済み

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/
- AI分析機能正常動作確認済み

**主要機能テスト**:
- ✅ 議事録50文字以上でAI分析ボタン表示
- ✅ GPT-4o-mini APIによる議事録分析
- ✅ 次回アクション自動生成（複数項目対応）
- ✅ ステータス自動推奨
- ✅ AI要約自動生成
- ✅ 管理者・パートナー両画面対応
- ✅ データベース保存機能
- ✅ 表示制御最適化（画面別の議事録表示/非表示）

#### セキュリティ・パフォーマンス

**1. セキュリティ対策**
- OpenAI APIキーの環境変数管理
- クライアントサイド実行での適切な権限設定
- エラーハンドリングとフォールバック機能

**2. パフォーマンス最適化**
- gpt-4o-miniモデル使用（コスト効率重視）
- temperature: 0.3（一貫性重視）
- max_tokens: 1000（適切な制限）

### Phase 10: Ver 2.7 - アクションログ削除機能拡張 (2025/6/9)
**目的**: 案件詳細ページからアクションログを削除する機能を追加し、削除時に案件一覧の次回アクションを自動更新

**実装内容**:

#### A. 削除機能の実装

**1. ProductDetailPage.js への削除ボタン追加**
```javascript
// 削除ボタンコンポーネント
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
```

**2. handleDeleteLog 関数の実装**
- 削除確認ダイアログ表示
- Firestore からアクションログ削除
- ローカル状態の更新
- progressDashboard の自動更新

#### B. progressDashboard 自動更新ロジック

**1. 最新ログの特定**
```javascript
// 削除後の残存ログから最新のものを特定
const latestLog = updatedLogs.reduce((latest, log) => {
  const latestDate = latest.updatedAt || latest.createdAt || new Date(0);
  const logDate = log.updatedAt || log.createdAt || new Date(0);
  return new Date(logDate) > new Date(latestDate) ? log : latest;
}, updatedLogs[0]);
```

**2. progressDashboard 更新**
```javascript
// 最新ログのデータで更新
await updateDoc(progressRef, {
  status: latestLog.status || deal.status,
  nextAction: latestLog.nextAction || '',
  nextActionDate: latestLog.nextActionDate || '',
  summary: latestLog.summary || deal.summary || '',
  lastContactDate: latestLog.actionDate || latestLog.createdAt?.split('T')[0] || deal.lastContactDate,
  updatedAt: serverTimestamp()
});
```

**3. 全ログ削除時の処理**
```javascript
// ログが全て削除された場合は関連フィールドをクリア
if (deal.id && updatedLogs.length === 0) {
  await updateDoc(progressRef, {
    nextAction: '',
    nextActionDate: '',
    summary: '',
    updatedAt: serverTimestamp()
  });
}
```

#### C. UI/UX の改善

**1. 削除確認ダイアログ**
- ログタイトルを含む確認メッセージ
- 操作の取り消し不可能性の警告

**2. フィードバック**
- 削除成功時のアラート表示
- エラー時の適切なエラーメッセージ

#### D. データ整合性の確保

**1. リアルタイム更新**
- ローカル deal 状態の即時更新
- 画面再読み込み不要の反映

**2. エラーハンドリング**
- Firebase 操作のエラーキャッチ
- ユーザーへの適切なフィードバック

#### 実装ファイル

**更新ファイル**:
- src/components/ProductDetailPage.js：
  - deleteDoc import 追加
  - FiTrash2 アイコン import 追加
  - DeleteButton コンポーネント追加
  - handleDeleteLog 関数実装
  - 削除ボタンの UI 配置

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 302.39 kB
- パートナー用: 302.16 kB
- 削除機能統合済み

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/
- 削除機能正常動作確認済み

**主要機能テスト**:
- ✅ アクションログ削除ボタン表示
- ✅ 削除確認ダイアログ
- ✅ Firestore からの削除処理
- ✅ 最新ログでの progressDashboard 更新
- ✅ 全ログ削除時のフィールドクリア
- ✅ ローカル状態の即時反映
- ✅ エラーハンドリング

### Phase 11: Ver 2.8 - インフルエンサーキャスティング管理機能 (2025/6/16)
**目的**: インフルエンサーマーケティング案件の管理機能を追加（管理者画面のみ）

**実装内容**:

#### A. 新規コレクション設計

**1. influencers コレクション**
```javascript
{
  id: string,                    // ドキュメントID（自動生成）
  name: string,                  // 名前（必須）
  snsHandle: string,             // SNSハンドル名
  followerCount: number,         // フォロワー数
  tiktokPrice: number,           // TikTok料金（円）
  instagramPrice: number,        // Instagram料金（円）
  youtubePrice: number,          // YouTube料金（円）
  agency: string,                // 所属事務所名
  remarks: string,               // 備考
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

**2. castingProposals コレクション**
```javascript
{
  id: string,                    // ドキュメントID（自動生成）
  clientName: string,            // クライアント名（既存案件から）
  projectName: string,           // 案件名（任意）
  dealId: string,                // 関連案件ID（progressDashboardのID）
  influencers: [                 // 提案インフルエンサー配列
    {
      influencerId: string,      // インフルエンサーID
      influencerName: string,    // インフルエンサー名（表示用）
      status: string,            // 進捗状況
      // status値: '未連絡', '連絡済み', '交渉中', 'OK', 'NG', '保留'
      updatedAt: Timestamp       // ステータス更新日時
    }
  ],
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

#### B. 新規画面実装

**1. インフルエンサー登録画面 (/if/register)**
- 新規インフルエンサー情報の登録・編集
- 必須項目：名前のみ
- 媒体別料金の個別管理（TikTok/Instagram/YouTube）
- その他項目は任意入力で柔軟に対応

**2. インフルエンサー一覧画面 (/if/list)**
- 登録済みインフルエンサーの一覧表示
- 検索機能（名前、事務所名、料金範囲）
- ソート機能（名前、フォロワー数、各媒体料金）
- 編集・削除機能

**3. キャスティング進捗管理画面 (/casting/manage)**
- クライアント案件へのインフルエンサー提案管理
- 複数インフルエンサーの一括提案
- 進捗ステータス管理（6段階）
- ステータス集計表示（打診中○名、OK○名、NG○名）
- アコーディオン形式での詳細表示

#### C. UI/UX設計

**1. デザイン統一**
- 既存の管理画面と同じ青系グラデーション
- styled-componentsによる一貫したスタイリング
- レスポンシブ対応

**2. 操作性向上**
- インラインステータス変更（リロード不要）
- モーダルでの提案作成・編集
- 視覚的なステータス色分け表示

#### D. 実装ファイル

**新規作成ファイル**:
- src/components/InfluencerRegisterPage.js
- src/components/InfluencerListPage.js
- src/components/CastingManagePage.js

**更新ファイル**:
- firestore.rules：新規コレクションのルール追加
- src/App.js：ルーティングとナビゲーション追加
- src/components/Breadcrumb.js：新規ルートの追加

#### E. ナビゲーション統合

**管理者画面メニューに追加**:
- インフルエンサー（アイコン：FiStar）
- キャスティング管理（アイコン：FiTrendingUp）

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 307.81 kB
- ESLint警告のみ（動作に影響なし）

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- 新機能正常動作確認済み

**主要機能テスト**:
- ✅ インフルエンサー登録・編集・削除
- ✅ 媒体別料金管理
- ✅ キャスティング提案作成・編集
- ✅ 進捗ステータス管理
- ✅ リアルタイムステータス更新
- ✅ 検索・ソート機能

### Phase 12: Ver 2.8.1 - キャスティング管理機能修正 (2025/6/16)
**目的**: クライアント名の削除、媒体別フォロワー数分離、二次利用費追加

**実装内容**:

#### A. クライアント名フィールドの完全削除
- UIからクライアント名選択を削除
- 案件名のみを既存案件から選択
- 案件名と提案メニューを併記表示

#### B. フォロワー数の媒体別分離
- followerCount → 媒体別フィールドに分離
  - tiktokFollowerCount
  - instagramFollowerCount
  - youtubeFollowerCount
- 既存データとの互換性保持

#### C. 二次利用費フィールド追加
- secondaryUsageFee1Month（1ヶ月）
- secondaryUsageFee2Months（2ヶ月）
- secondaryUsageFee3Months（3ヶ月）

#### D. バグ修正
- serverTimestamp()の配列内使用エラー修正
- influencers配列内のupdatedAtをDate型に変更

### Phase 13: Ver 2.8.2 - インフルエンサー提案状況管理機能 (2025/6/16)
**目的**: インフルエンサーごとの提案状況を管理・更新できる機能の追加

**実装内容**:

#### A. データ構造拡張
- influencersコレクションにproposalStatusフィールド追加
- 初期値：「提案予定」
- 選択肢：提案予定、提案済、回答待ち、OK（確定）、NG（辞退）、未定（保留）

#### B. UI/UX機能

**1. インフルエンサー登録画面**
- 提案状況選択フィールド追加
- プルダウン形式で選択

**2. インフルエンサー一覧画面**
- 提案状況カラム追加
- インライン編集可能なプルダウン
- 変更時のリアルタイム保存
- トースト通知風のアラート表示

**3. フィルター機能**
- 提案状況で絞り込み検索
- 「すべて」選択肢付き

**4. キャスティング管理画面での表示**
- チェックボックスリストに提案状況バッジ表示
- 「提案予定」以外のステータスを表示

#### C. データ整合性
- キャスティング管理のステータスとは独立
- インフルエンサーマスターデータとして管理

### Phase 14: Ver 2.8.3 - キャスティング管理UI改善 (2025/6/16)
**目的**: キャスティング管理画面の操作性向上と提案状況フィルタリング削除

**実装内容**:

#### A. インフルエンサー一覧画面の改修
**1. 提案状況フィールドの削除**
- 提案状況カラムの完全削除
- フィルター機能から提案状況を除外
- ソート機能から提案状況を除外

#### B. キャスティング管理画面の検索機能追加
**1. 案件選択の検索機能実装**
- モーダル内での案件検索UI追加
- 部分一致検索（商材名、提案メニュー、紹介者名で検索）
- リアルタイムフィルタリング表示
- エラーハンドリング（null/undefined データ対応）

**2. UI/UX改善**
```javascript
// 検索UI構成
SearchContainer     // 検索ボックスコンテナ
SearchInput        // 検索入力フィールド（アイコン付き）
DealList          // 検索結果リスト
DealItem          // 案件アイテム（ホバーエフェクト付き）
```

**3. エラー対応**
- ホワイトアウト問題の修正
- null/undefined データのフィルタリング
- 安全な文字列処理（`|| ''`によるフォールバック）

## ビルド出力構成

### dist/admin フォルダ構成
```
dist/admin/
├── asset-manifest.json    # ビルドアセット管理ファイル
├── favicon.ico           # ファビコン
├── index.html           # 管理者用エントリーポイント
├── logo192.png          # PWA用アイコン（192x192）
├── logo512.png          # PWA用アイコン（512x512）
├── manifest.json        # PWAマニフェスト
├── robots.txt           # クローラー設定
├── static/              # 静的アセット
│   ├── css/
│   │   ├── main.8c40c916.css      # メインCSS
│   │   └── main.8c40c916.css.map  # CSSソースマップ
│   └── js/
│       ├── main.1818563d.js       # メインJavaScript
│       ├── main.1818563d.js.map   # JSソースマップ
│       └── 453.cdb8b381.chunk.js  # コード分割チャンク
└── *.svg                # 各種SVGアイコン

### ビルドサイズ
- 管理者用: 約307KB（gzip圧縮前）
- React 19.1.0ベース
- Code Splitting実装済み

---

### Phase 15: Ver 2.9 - アクションログ記録改修と案件一覧横スクロール実装 (2025/6/16)
**目的**: アクションログ記録の必須項目変更と案件一覧の表示改善

**実装内容**:

#### A. アクションログ記録ページの必須項目変更
**1. 議事録フィールド**
- 必須項目から除外
- `*` マーク削除
- バリデーションから必須チェック削除

**2. 次回アクションフィールド**
- 必須項目に変更
- `*` マーク追加
- バリデーションに必須チェック追加
- エラー表示の実装

**3. 適用範囲**
- 管理者画面：/log-entry
- パートナー画面：/partner-entry/piala/log-entry
- 両画面とも同じLogEntryPageコンポーネントを使用

#### B. 案件一覧テーブルの横スクロール実装
**1. 実装方式変更**
- セル内スクロールからページ全体の横スクロールに変更
- TableContainerにoverflow-x: autoを適用
- 画面幅に収まらない場合に横スクロール可能

**2. 実装詳細**
```javascript
// テーブルコンテナ（横スクロール対応）
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
`;

// テーブル本体
const Table = styled.table`
  min-width: 1400px; /* 管理者用 */
  min-width: 1200px; /* パートナー用 */
  width: 100%;
  background: white;
  border-collapse: collapse;
`;
```

**3. 列幅の設定**
- 商材名: 160px
- 提案メニュー: 160px
- 担当者: 200px（管理者） / 160px（パートナー）
- ステータス: 120px
- 紹介者: 120px（管理者のみ）
- 最終接触日: 100px
- 次回アクション: 250px（拡大）
- ログ: 60px
- アクション: 200px

**4. 適用画面**
- 管理者用：ProgressDashboard.js
- パートナー用：PartnerProgressDashboard.js

#### C. 画面幅の最適化
**1. 案件一覧ページの画面幅調整**
- DashboardContainerのmax-width制限を削除
- width: 100%で画面幅いっぱいまで使用可能に
- padding: 0 2remで左右余白確保

**2. パートナー画面全体の幅調整**
- PartnerApp.jsのMainContentからmax-width: 1200px削除
- width: 100%に変更して全画面表示対応
- 案件一覧以外のページは元のmax-width設定を維持

**3. 適用結果**
- 管理者・パートナー両方の案件一覧で画面幅100%使用
- 横スクロールで全項目が確認可能
- その他のページは従来のレイアウトを維持

---

### Phase 16: Ver 2.10 - 実施月ベースデータ表示問題調査 (2025/6/16)
**背景**: 月次売上実績（実施月ベース）で7月の受注金額が¥0と表示される問題の調査

**調査内容**:

#### A. 問題の特定
- 管理者・パートナー両画面で7月・8月の実施月ベースデータが¥0表示
- 決定月ベースは正常に表示されている

#### B. 原因分析

**1. データベース調査結果**
```javascript
// test-implementation-dates.js による調査結果
受注案件数: 7件
- nextActionDate設定済み: 3件（すべて2025-06）
- nextActionDateがnull: 4件
- 7月・8月の案件: 0件
```

**2. コードロジックの確認**
- HomeDashboard.js:596-645 の実装は正しい
- 今月から3ヶ月分（2025-06, 2025-07, 2025-08）を正しく生成
- `nextActionDate`または`implementationDate`を実施月として参照

**3. 根本原因**
- データベースに7月・8月の`nextActionDate`を持つ案件が存在しない
- 多くの案件で`nextActionDate`がnullのまま
- `implementationDate`フィールドは使用されていない（すべてundefined）

#### C. 解決策

**システムは正常動作しており、データの問題であることが判明**

1. **即時対応**:
   - 既存の受注案件の`nextActionDate`を7月・8月に更新
   - 新規案件登録時に適切な実施月を設定

2. **今後の改善案**:
   - 実施月専用フィールド（`implementationMonth`）の追加検討
   - 案件登録時の実施月入力の必須化
   - データ検証機能の追加

#### 技術的詳細

**fetchMonthlyImplementationStats 関数の動作**:
```javascript
// 実施月の判定ロジック（HomeDashboard.js:625）
const implementationDate = data.nextActionDate || data.implementationDate;
if (implementationDate && implementationDate.startsWith(month) && data.proposalMenu !== '他社案件') {
  totalAmount += data.receivedOrderAmount || 0;
  dealCount++;
}
```

**デバッグ結果**:
- 月リスト生成: ["2025-06", "2025-07", "2025-08"] ✓
- データ取得クエリ: 正常動作 ✓
- フィルタリングロジック: 正常動作 ✓
- 表示処理: 正常動作 ✓

### Phase 17: Ver 2.11 - 実施月ベース統計の修正 (2025/6/16)
**背景**: 成約案件一覧の実施月（receivedOrderMonth）フィールドを活用して実施月ベース統計を正しく表示

**実装内容**:

#### A. 問題の発見
- ホームダッシュボードの実施月ベース統計が`nextActionDate`を参照していた
- 成約案件一覧には実施月専用フィールド`receivedOrderMonth`が存在していた

#### B. 修正内容

**1. HomeDashboard.js の修正**
```javascript
// 修正前：nextActionDateを参照
const implementationDate = data.nextActionDate || data.implementationDate;
if (implementationDate && implementationDate.startsWith(month) && data.proposalMenu !== '他社案件') {
  totalAmount += data.receivedOrderAmount || 0;
  dealCount++;
}

// 修正後：receivedOrderMonthを参照
const implementationMonth = data.receivedOrderMonth;
if (implementationMonth && implementationMonth === month && data.proposalMenu !== '他社案件') {
  totalAmount += data.receivedOrderAmount || 0;
  dealCount++;
}
```

**2. PartnerHomeDashboard.js の修正**
- 同様の修正を適用
- パートナー案件の実施月も正しく集計されるように

#### C. 結果
- 成約案件一覧で入力された実施月データが統計に反映
- 実施月ベースの売上予測が正確に表示
- データの整合性が向上

#### 実装ファイル

**更新ファイル**:
- src/components/HomeDashboard.js
  - fetchMonthlyImplementationStats関数の修正
  - receivedOrderMonthフィールドの参照に変更
  
- src/components/PartnerHomeDashboard.js
  - 同様の修正を適用

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 310.05 kB
- パートナー用: 309.82 kB
- 両アプリ正常ビルド完了

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/
- 実施月ベース統計正常動作確認済み

**主要機能テスト**:
- ✅ 成約案件の実施月データを正しく参照
- ✅ 実施月ベースの月次売上統計表示
- ✅ 管理者・パートナー両画面で動作確認
- ✅ データの整合性確保

### Phase 18: Ver 2.12 - 部署フィールド追加と部署別ステータス表示 (2025/6/19)
**目的**: パートナー担当者マスターに部署フィールドを追加し、ホーム画面で部署別のステータス集計を表示

**実装内容**:

#### A. representativesコレクションへの部署フィールド追加
**1. データ構造の拡張**
```javascript
// representatives コレクション
{
  id: string,
  name: string,
  companyName: string,
  department: string,      // 新規追加：部署名
  status: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### B. パートナー担当者マスター画面の改修
**1. PartnerRepresentativeMasterPage.js**
- 部署入力フィールドの追加
- テーブルに部署列を追加
- 新規登録・編集時の部署情報保存

#### C. アクションログ記録画面の改修
**1. LogEntryPage.js**
- 担当者選択時に部署情報を併記表示
- 例：「田中 太郎 (営業部)」

#### D. パートナー案件一覧画面の改修
**1. PartnerProgressDashboard.js**
- 編集モーダルでの担当者選択時に部署情報を併記

#### E. パートナーホーム画面への部署別ステータス集計追加
**1. PartnerHomeDashboard.js**
- 新規関数 `fetchDepartmentStatusCounts` の実装
- 部署別のステータス件数を集計・表示
- 担当者マスターから部署情報を取得し、案件データと結合
- 部署ごとにカード形式で表示

**2. 表示仕様**
- 部署名をタイトルとしたカード
- 各ステータスの件数を一覧表示
- ステータス色を適用した視覚的な表示

#### 実装ファイル

**更新ファイル**:
- src/components/PartnerRepresentativeMasterPage.js
  - 部署フィールドの追加
  - テーブルカラムの追加
  - フォーム入力フィールドの追加
  
- src/components/LogEntryPage.js
  - 担当者選択で部署を併記
  
- src/components/PartnerProgressDashboard.js
  - 編集モーダルで部署を併記
  
- src/components/PartnerHomeDashboard.js
  - fetchDepartmentStatusCounts関数の追加
  - 部署別ステータス集計セクションの追加
  - UIコンポーネントの追加（DepartmentCard等）

#### デプロイ・動作確認

**ビルド結果**:
- 正常にビルド可能
- 部署フィールドが正しく保存・表示される

**主要機能テスト**:
- ✅ 担当者マスターで部署の登録・編集
- ✅ 各画面での部署情報表示
- ✅ パートナーホームでの部署別集計表示
- ✅ 部署未設定の場合は「未設定」として集計

---

### Phase 19: Ver 2.13 - パートナー管理画面の部署情報追加とステータス別件数表示改善 (2025/6/19)
**目的**: パートナー画面に部署情報フィールドを追加し、ホーム画面のステータス別案件数に総数・割合表示を追加

**実装内容**:

#### A. 部署情報フィールドの追加

**1. データ構造の拡張**
```javascript
// progressDashboard コレクション拡張
{
  sub_department_name: string,  // 部署名（Buzz、コンサル、デジコン、マーケD）
  sub_department_owner: string, // 他部署担当者名（自由入力）
  // ...既存フィールド
}
```

**2. 定数の追加** (src/data/constants.js)
```javascript
export const DEPARTMENT_NAMES = [
  'Buzz',
  'コンサル',
  'デジコン',
  'マーケD'
];
```

**3. パートナー案件一覧画面の改修**
- 担当者とステータスの間に部署情報カラムを追加
- 部署名、他部署担当者名を表示
- 編集モーダルで部署情報の編集が可能
- テーブル最小幅を1400pxに拡大

**4. アクションログ記録画面の改修**
- 部署名選択フィールド（プルダウン）
- 他部署担当者名入力フィールド（テキスト）
- 既存案件の部署情報を自動取得・表示
- パートナー画面のみで表示（管理者画面では非表示）

**5. データ保存処理**
- 新規案件・既存案件更新時に部署情報を保存
- アクションログにも部署情報を記録
- 管理者画面側には表示・保存されない

#### B. ステータス別案件数の表示改善

**1. 総数カウントの実装**
- 稼働終了を除いた総案件数をカウント
- `_totalExcludingEnd`として内部保存

**2. 表示の改善**
- 総案件数表示エリアを追加
- 各ステータスに「件数 / 総数 (割合%)」形式で表示
- 稼働終了は割合計算から除外
- 小数点第1位まで表示

**3. スタイルコンポーネント追加**
```javascript
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
```

#### C. 実装ファイル

**更新ファイル**:
- src/data/constants.js：DEPARTMENT_NAMES定数追加
- src/components/PartnerProgressDashboard.js：部署情報カラム追加、編集機能
- src/components/LogEntryPage.js：部署情報入力フィールド追加
- src/components/PartnerHomeDashboard.js：ステータス別件数の総数・割合表示
- src/components/HomeDashboard.js：ステータス別件数の総数・割合表示

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 311.48 kB
- パートナー用: 311.26 kB
- 両アプリ正常ビルド完了

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/
- 全機能正常動作確認済み

**主要機能テスト**:
- ✅ パートナー案件一覧に部署情報カラム表示
- ✅ 部署情報の編集・保存機能
- ✅ アクションログ記録時の部署情報入力
- ✅ 既存案件の部署情報自動取得
- ✅ ステータス別案件数の総数表示（稼働終了除外）
- ✅ 各ステータスの割合表示
- ✅ 管理者・パートナー両画面での動作確認

---

### 現在の開発状況（2025/6/20時点）

#### 最新のGitステータス
```
Current branch: master
Status:
- 修正済みファイル: 24ファイル
- 削除ファイル: 6ファイル  
- 新規追加ファイル: 7ファイル
```

#### 最新の機能追加
- **Slack通知機能**: サーバーサイド通知システム（開発中）
- **AI関連サービス**: 議事録分析の拡張機能
- **Express API**: RESTfulエンドポイント追加
- **Playwright テスト**: E2Eテスト環境構築

#### 依存関係の更新
```json
"dependencies": {
  "react": "^19.1.0",
  "firebase": "^11.8.1",
  "openai": "^5.1.1",
  "crypto-js": "^4.2.0",
  "styled-components": "^6.1.18",
  "react-router-dom": "^7.6.1"
}
```

#### ビルド構成
- **管理者用**: 311.48 kB（gzip圧縮前）
- **パートナー用**: 311.26 kB（gzip圧縮前）
- **React 19.1.0**: 最新バージョン対応
- **コード分割**: 実装済み

#### デプロイ設定
**本番環境**:
- **管理者用**: https://admn-45826.web.app
- **パートナー用**: https://admn-45826.web.app/partner/

**認証情報**:
- **管理者**: ID: salessenjin / PW: salessenjin1234
- **パートナー**: ID: salessenjinpiala / PW: salessenjinpiala1234

### Phase 20: Ver 2.14 - インフルエンサーCSV一括登録機能実装 (2025/6/20)
**目的**: インフルエンサー登録画面にCSVファイルから一括登録する機能を追加

**実装内容**:

#### A. CSV一括登録機能の追加

**1. UI設計**
- タブ形式UI（単体登録 / 一括登録）の実装
- CSVファイルドラッグ&ドロップ対応
- プレビューテーブルでデータ確認可能
- エラー・成功メッセージ表示

**2. CSVフォーマット対応**
```
名前,SNSハンドル,TikTokフォロワー,Instagramフォロワー,YouTubeフォロワー,TikTok料金,Instagram料金,YouTube料金,二次利用費(1ヶ月),二次利用費(2ヶ月),二次利用費(3ヶ月),所属事務所,備考
```

**3. データ解析機能**
- 通貨記号（¥）・カンマの自動除去
- 数値データの適切な変換処理
- 空データの NULL 対応
- エラーハンドリングとバリデーション

#### B. テンプレート機能

**1. テンプレートダウンロード**
- インフルエンサー一覧画面と完全同一の列順序
- サンプルデータ付きテンプレート
- CSV形式での自動ダウンロード

**2. 実データとの整合性**
- 23名のインフルエンサーデータを正確に読み込み
- 辻希美、kemio、田久保夏鈴等の有名インフルエンサー対応
- 料金データの正確な変換処理

#### C. プレビュー機能

**1. データプレビューテーブル**
- インフルエンサー一覧画面と同じレイアウト
- 最大10件のプレビュー表示
- 二次利用費は3行表示で視認性向上
- 横スクロール対応で全項目表示

**2. 一括登録処理**
- Firestoreへの並列処理による高速登録
- 成功・失敗件数の個別カウント
- エラー詳細の表示機能
- 登録完了後の自動画面遷移

#### D. 技術実装詳細

**1. 新規追加スタイルコンポーネント**
```javascript
const UploadButton = styled(Button)`
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CSVSection = styled.div`
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
`;
```

**2. データ処理関数**
```javascript
const parseNumber = (str) => {
  if (!str || str.trim() === '') return null;
  const cleaned = str.replace(/[¥,"]/g, '').trim();
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
};

const parseCSVContent = (content) => {
  // CSV解析・バリデーション・データ変換処理
};

const handleBulkImport = async () => {
  // Firestore一括保存処理
};
```

#### E. ファイル構成の更新

**更新ファイル**:
- src/components/InfluencerRegisterPage.js
  - CSV読み込み・解析機能追加
  - タブUIの実装
  - プレビューテーブル追加
  - 一括登録処理実装
  - react-iconsアイコン統合

#### F. デプロイ・動作確認

**ビルド結果**:
- 管理者用: 313.4 kB
- パートナー用: 313.17 kB
- 機能追加による軽微なサイズ増加

**本番環境確認**:
- 管理者用: https://admn-45826.web.app
- CSV一括登録機能正常動作確認済み

**主要機能テスト**:
- ✅ CSVファイル読み込み・解析
- ✅ データプレビュー表示
- ✅ テンプレートダウンロード
- ✅ 一括登録処理（23名のデータ登録成功）
- ✅ エラーハンドリング
- ✅ インフルエンサー一覧画面との完全対応

#### G. 使用方法

**1. アクセス方法**
1. 管理者画面 → インフルエンサー → 登録
2. 「一括登録 (CSV)」タブを選択

**2. 操作手順**
1. 「テンプレートダウンロード」でサンプル取得（オプション）
2. 「CSVファイルを選択」でファイルアップロード
3. プレビューで内容確認
4. 「○件を一括登録」ボタンで実行

**3. 対応データ形式**
- 名前（必須）
- SNSハンドル名
- 各SNS媒体フォロワー数
- 各SNS媒体料金（通貨記号・カンマ自動除去）
- 二次利用費（1/2/3ヶ月）
- 所属事務所名
- 備考

---

### Phase 21: Ver 2.15 - キャスティング管理機能改善 (2025/6/27)
**目的**: 管理者画面のキャスティング管理機能の使い勝手を向上

**実装内容**:

#### A. インフルエンサー未選択での登録対応
**1. 問題**: インフルエンサーを選択しないと登録できない
**2. 解決策**: 
- CastingManagePage.js の handleSubmit バリデーションを修正
- 案件選択のみ必須とし、インフルエンサーは空配列でも登録可能に

#### B. 案件詳細ボタンの追加
**1. 実装内容**:
- 商材名の横に案件詳細ボタンを配置
- FiExternalLink アイコンを使用した青色のボタン
- クリックで `/product/${dealId}` に遷移
- ProjectHeader コンポーネントで商材名とボタンを横並び配置

**2. スタイル追加**:
```javascript
const DetailButton = styled(IconButton)`
  background: #3498db;
  color: white;
  
  &:hover {
    background: #2980b9;
  }
`;
```

#### C. IFキャスティング選択時の自動登録
**1. 実装ロジック**:
- LogEntryPage.js の handleSubmit 関数を拡張
- 提案メニューが「IFキャスティング」の場合の処理追加

**2. 自動登録フロー**:
1. 通常の progressDashboard と actionLogs への保存
2. castingProposals コレクションに新規レコード作成
3. 初期状態はインフルエンサー空配列で登録

**3. 実装コード**:
```javascript
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
  }
}
```

#### D. デプロイ・動作確認

**ビルド結果**:
- 管理者用: 313.64 kB
- パートナー用: 313.41 kB
- 全機能正常動作確認済み

**本番環境**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/

**主要機能テスト**:
- ✅ インフルエンサー未選択での提案登録
- ✅ 案件詳細ボタンからの画面遷移
- ✅ IFキャスティング選択時の自動登録
- ✅ 既存機能との互換性維持

---

### Phase 22: Ver 2.16 - 商材マスター管理と担当者別目標管理機能実装 (2025/7/7)
**目的**: 商材マスター管理機能の追加と担当者別の月内目標件数・遷移率管理機能を実装

**実装内容**:

#### A. 商材マスター管理機能

**1. 新規コレクション: products**
```javascript
{
  id: string,
  name: string,           // 商材名（ユニーク）
  displayOrder: number,   // 表示順
  isActive: boolean,      // 有効/無効フラグ
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**2. ProductMasterPage.js（新規作成）**
- 商材の一覧表示・新規登録・編集・削除機能
- 関連データがある商材は削除不可
- 初期データとして「AI OSキャンプ」を自動登録

**3. 既存画面の修正**
- LogEntryPage.js: 商材入力をテキストフィールドからプルダウンに変更
- 商材マスターからアクティブな商材のみを選択可能に

**4. 管理画面メニュー追加**
- 商材マスター（アイコン：FiPackage）を紹介者マスターの後に配置

#### B. 担当者別目標管理機能

**1. 新規コレクション: representativeTargets**
```javascript
{
  id: string,                    // {representativeId}_{yearMonth}形式
  representativeId: string,      // 担当者ID
  representativeName: string,    // 担当者名
  yearMonth: string,            // "2025-07" 形式
  targets: {
    'アポ打診中': { count: number, transitionRate: number },
    '初回アポ予定': { count: number, transitionRate: number },
    '与件化_提案中': { count: number, transitionRate: number },
    '検討中': { count: number, transitionRate: number }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**2. PartnerRepresentativeMasterPage.js の拡張**
- 各担当者に「目標設定」ボタンを追加
- モーダルで月別の目標件数・想定遷移率を入力
- 数値のみ入力可能なバリデーション

**3. PartnerProgressDashboard.js の拡張**
- 担当者フィルター適用時のみ目標・実績セクションを表示
- 各ステータスで以下を表示：
  - 現在件数 / 目標件数
  - 想定遷移率（%）
  - 実際遷移率（%）※月内データから自動計算
- 表示形式例：「現在5件 / 目標8件 ｜ 想定遷移率40% ｜ 実際遷移率25%」

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 317.55 kB
- パートナー用: 317.33 kB
- ESLint警告のみ（動作に影響なし）

**本番環境**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/

**主要機能テスト**:
- ✅ 商材マスターの新規登録・編集・削除
- ✅ 初期データ「AI OSキャンプ」の自動登録
- ✅ 商材入力のプルダウン化
- ✅ 担当者別目標設定機能
- ✅ 月別目標データの保存・読み込み
- ✅ 目標・実績の比較表示
- ✅ 実際の遷移率自動計算

### Phase 23: Ver 2.17 - 提案メニューマスター実装とバグ修正 (2025/7/7)
**背景**: 商材マスターではなく提案メニューマスターの実装が必要だった

**実装内容**:

#### A. 提案メニューマスター機能の実装

**1. ProposalMenuMasterPage.js の作成**
- ProductMasterPage.js を ProposalMenuMasterPage.js にリネーム
- 提案メニューの管理機能を実装
- 初期データとして既存の提案メニューを自動登録

**2. システム全体の更新**
- App.js: ルーティングを `/proposal-menu-master` に変更
- LogEntryPage.js: 
  - 商材入力をテキストフィールドに戻す
  - 提案メニューをマスターデータから取得するように変更
- Breadcrumb.js: 提案メニューマスターのルートに対応

#### B. Firestore クエリ問題の修正

**問題**: 複数の `orderBy` や `where` + `orderBy` の組み合わせで複合インデックスエラーが発生

**解決策**:
1. **ProposalMenuMasterPage.js**:
   ```javascript
   // 修正前
   const q = query(menusRef, orderBy('displayOrder', 'asc'), orderBy('createdAt', 'asc'));
   
   // 修正後
   const querySnapshot = await getDocs(menusRef);
   // クライアントサイドでソート
   menusData.sort((a, b) => {
     if (a.displayOrder !== b.displayOrder) {
       return (a.displayOrder || 999) - (b.displayOrder || 999);
     }
     const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
     const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
     return dateA - dateB;
   });
   ```

2. **LogEntryPage.js**:
   ```javascript
   // 修正前
   const q = query(menusRef, where('isActive', '==', true), orderBy('displayOrder', 'asc'));
   
   // 修正後
   const q = query(menusRef, where('isActive', '==', true));
   // クライアントサイドでソート
   menusData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
   ```

#### C. パートナー画面の目標表示問題の修正

**問題**: 担当者フィルター時に目標データが表示されない

**解決策**: PartnerProgressDashboard.js にデバッグログを追加
```javascript
// fetchTargetData 関数
console.log('🎯 目標データ取得開始:', representativeId);
console.log('📅 対象年月:', currentMonth);
console.log('📊 目標データ件数:', snapshot.size);

// useEffect での担当者フィルター処理
console.log('👥 担当者フィルター変更:', representativeFilter);
console.log('📜 担当者リスト:', representativesList);
console.log('🔍 マッチした担当者:', rep);
```

#### 実装ファイル

**新規作成**:
- src/components/ProposalMenuMasterPage.js

**削除**:
- src/components/ProductMasterPage.js

**更新**:
- src/App.js
- src/components/LogEntryPage.js
- src/components/Breadcrumb.js
- src/components/PartnerProgressDashboard.js
- firestore.rules

#### デプロイ・動作確認

**ビルド結果**:
- 管理者用: 317.94 kB
- パートナー用: 317.72 kB

**本番環境**:
- 管理者用: https://admn-45826.web.app
- パートナー用: https://admn-45826.web.app/partner/

**主要機能テスト**:
- ✅ 提案メニューマスターの表示・編集・削除
- ✅ 初期データの自動登録
- ✅ 新規メニューの登録と即時反映
- ✅ LogEntryPage での提案メニュー選択
- ✅ パートナー画面での目標データ表示（デバッグログ付き）

---

**最終更新**: 2025年7月7日
**現在バージョン**: v2.17.0（提案メニューマスター実装・バグ修正版）
**開発ステータス**: 継続開発中（機能拡張フェーズ）

**重要**: このドキュメントは開発の継続性を保つため、機能追加・変更時は必ず更新すること。