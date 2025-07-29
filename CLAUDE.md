# 営業管理システム v3.4 - 現在の仕様書

## プロジェクト概要
React.js + Firebase で構築された営業進捗管理システム。管理者向けの統合管理機能を提供し、案件進捗管理、担当者管理、KPI管理等の機能を統合。

## 技術スタック
- **フロントエンド**: React 18 (CDN版), Babel, Firebase Compat SDK
- **バックエンド**: Firebase (Firestore, Hosting)  
- **認証**: SHA256暗号化、localStorage セッション管理
- **デプロイ**: Firebase Hosting (https://psmt-6724f.web.app)
- **リポジトリ**: https://github.com/tomoki725/SMT

## システム構成

### Firebase設定
```javascript
const firebaseConfig = {
  projectId: "psmt-6724f",
  appId: "1:683825497775:web:0bec91982bc1b497a3365a",
  storageBucket: "psmt-6724f.firebasestorage.app",
  apiKey: "AIzaSyAgwYYikH_diGanJNLTHKyBmk-4-u6osHY",
  authDomain: "psmt-6724f.firebaseapp.com",
  messagingSenderId: "683825497775"
};
```

### 認証システム
- **管理者アカウント**: 
  - ID: `salessenjin`
  - Password: `salessenjin1234`
- **セッション管理**: 30分間の自動タイムアウト
- **セッションキー**: `sales_admin_session`

## 現在の機能一覧

### 1. サマリー（全体）(📊)
- **統計ダッシュボード**: 新規・既存案件数、受注件数の表示
- **KPIカード**: 各指標を色分けで視覚的に表示
- **YoY比較グラフ**: 年次推移分析
- **受注率推移**: 累積データに基づく推移表示
- **客単価推移**: 月次客単価の変動表示

### 2. サマリー（個人用）(👤)
- **個人・部署別切り替え**: 表示モードの選択
- **個人実績サマリー**: 総案件数、新規・既存案件数、受注件数、成約率、ログ件数、予算達成率
- **ステータス別内訳**: 8ステータスの詳細表示
- **予算達成率グラフ**: 月次予算vs実績の視覚的比較

### 3. 案件管理 (📋)
- **案件・クライアント切り替え**: 2つの表示モード
- **案件単位表示**: 商材名、提案メニュー、クライアント、担当者、ステータス、最終接触日（短縮表示）
- **クライアント単位表示**: クライアント名、担当者、メインステータス、最終接触日
- **アクションボタン**: 詳細・編集・追加・削除の4機能
- **フィルター機能**: 検索、ステータス、担当者による絞り込み
- **ステータス色分け**: 8段階のステータスを色で視覚化

### 4. アクションログ (📝)
- **活動履歴表示**: 全アクションログの時系列表示
- **詳細情報**: タイトル、商材名、アクション内容、詳細説明、面談メモ、要約、作成日時
- **詳細・削除ボタン**: 各ログの詳細表示と削除機能
- **カード形式**: 読みやすいカード表示

### 5. ログ記録 (✏️)
- **必須項目**: タイトル、商材名、提案メニュー、担当者、アクション、要約
- **新規項目**: 面談メモ、クライアント名、サブ担当部署
- **自動判定**: 既存案件の検索・更新または新規作成
- **事前入力対応**: 案件管理からの「追加」ボタン経由で情報事前入力
- **Firebase連携**: progressDashboard と actionLogs の同時更新

### 6. 受注管理 (💰)
- **受注案件一覧**: ステータスが「受注」の案件表示
- **表示項目**: 新規クライアント名、担当者、確定日、提案メニュー、実装月
- **詳細情報**: 受注に関する詳細データ

### 7. 担当者マスター (👥)
- **担当者管理**: 名前と部署の登録・編集・削除
- **部署管理**: 4部署（Buzz、コンサル、デジコン、マーケD）から選択
- **モーダル編集**: ポップアップでの編集機能
- **簡素化**: 会社名・ステータス項目を削除してシンプル化

### 8. 提案メニューマスター (📋)
- **CRUD機能**: 提案メニューの作成・読み取り・更新・削除
- **動的管理**: データベース連携による提案メニューの動的管理
- **全システム連携**: 他の機能で使用される提案メニューの一元管理

### 9. KPI管理 (🎯)
- **年度選択**: 過去2年〜未来2年の5年間選択可能
- **4つのKPI項目**:
  - 新規商談数
  - 新規受注数  
  - 既存商談数
  - 既存受注数
- **月別入力**: 1月〜12月の横並び入力フォーム
- **色分け表示**: 各KPI項目ごとに色分けされたヘッダー
- **年度別管理**: 各年度独立したKPI目標設定

### 10. 実績ページ (📈)
- **担当者別実績管理**: 月次予算・実績の設定・表示
- **CSV インポート**: 実績データの一括取り込み
- **表示切替**: 人別表示・クライアント別表示
- **自動計算**: 実績データからの自動集計
- **グラフ表示**: 予算達成率の視覚的表示

## データ構造 (Firestore)

### 1. progressDashboard コレクション
```javascript
{
  id: string,                   // ドキュメントID
  productName: string,          // 商材名
  proposalMenu: string,         // 提案メニュー
  representative: string,       // 担当者名
  clientName: string,           // クライアント名
  status: string,              // ステータス
  lastContactDate: string,     // 最終接触日
  nextAction: string,          // 次回アクション
  nextActionDate: string,      // 次回アクション日
  createdAt: Timestamp,        // 作成日時
  updatedAt: Timestamp         // 更新日時
}
```

### 2. actionLogs コレクション
```javascript
{
  id: string,                   // ドキュメントID
  title: string,               // タイトル（必須）
  productName: string,          // 商材名
  proposalMenu: string,         // 提案メニュー
  representative: string,       // 担当者名
  clientName: string,          // クライアント名
  subDepartment: string,       // サブ担当部署
  action: string,              // アクション内容
  description: string,         // 詳細説明
  meetingNotes: string,        // 面談メモ
  summary: string,             // 要約（必須）
  status: string,              // ステータス
  createdAt: Timestamp,        // 作成日時
  updatedAt: Timestamp         // 更新日時
}
```

### 3. representatives コレクション
```javascript
{
  id: string,                   // ドキュメントID
  name: string,                // 担当者名
  department: string,          // 部署名
  createdAt: Timestamp,       // 作成日時
  updatedAt: Timestamp        // 更新日時
}
```

### 4. proposalMenus コレクション
```javascript
{
  id: string,                   // ドキュメントID
  name: string,                // 提案メニュー名
  createdAt: Timestamp,        // 作成日時
  updatedAt: Timestamp         // 更新日時
}
```

### 5. representativeTargets コレクション（KPI管理）
```javascript
{
  id: string,                    // {representativeId}_{year}形式
  representativeId: string,      // 担当者ID
  representativeName: string,    // 担当者名
  year: number,                 // 対象年度
  targets: {
    newDeals: {                 // 新規商談数
      '01': number,             // 1月目標
      '02': number,             // 2月目標
      // ... 12月まで
    },
    newOrders: {                // 新規受注数
      '01': number,
      // ... 12月まで
    },
    existingDeals: {            // 既存商談数
      '01': number,
      // ... 12月まで
    },
    existingOrders: {           // 既存受注数
      '01': number,
      // ... 12月まで
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 6. clientProjectData コレクション
```javascript
{
  id: string,                    // {projectName}_{clientName}_{representative}形式
  projectName: string,           // プロジェクト名
  clientName: string,            // クライアント名
  representative: string,        // 担当者名
  monthlyResults: {              // 月次実績データ
    "2025-01": number,           // 1月実績
    "2025-02": number,           // 2月実績...
    // 値が0でない月のみ保存される
  },
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

### 7. budgetAndResults コレクション
```javascript
{
  id: string,                    // {representativeId}_{yearMonth}形式
  representativeId: string,      // 担当者ID
  representativeName: string,    // 担当者名
  yearMonth: string,            // "2025-01" 形式
  budget: {                     // 予算データ
    "2025-01": number           // 該当月の予算値
  },
  actual: {                     // 実績データ（自動計算）
    "2025-01": number           // 該当月の実績値
  },
  calculatedAt: Timestamp,      // 自動計算実行日時
  updatedAt: Timestamp          // 更新日時
}
```

## 定数定義

### ステータス
```javascript
const STATUS_OPTIONS = [
  'アポ打診中',
  '初回アポ予定', 
  '与件化_提案中',
  '受注',
  '失注',
  '保留',
  '検討中',
  '稼働終了'
];
```

### ステータス色定義
```javascript
const STATUS_COLORS = {
  'アポ打診中': '#f39c12',
  '初回アポ予定': '#3498db', 
  '与件化_提案中': '#9b59b6',
  '受注': '#27ae60',
  '失注': '#e74c3c',
  '保留': '#95a5a6',
  '検討中': '#f1c40f',
  '稼働終了': '#34495e'
};
```

### 部署名
```javascript
const DEPARTMENT_NAMES = [
  'Buzz',
  'コンサル',
  'デジコン',
  'マーケD'
];
```

## UI/UX仕様

### デザインシステム
- **カラーテーマ**: 青系グラデーション (#3498db → #2c3e50)
- **レイアウト**: サイドバーナビゲーション + メインコンテンツ
- **レスポンシブ**: Grid システムによる柔軟な表示
- **アイコン**: 絵文字によるビジュアル表現

### ナビゲーション
```javascript
const navigationItems = [
  { key: 'dashboard', label: 'サマリー（全体）', icon: '📊' },
  { key: 'personal-summary', label: 'サマリー（個人用）', icon: '👤' },
  { key: 'progress', label: '案件管理', icon: '📋' },
  { key: 'logs', label: 'アクションログ', icon: '📝' },
  { key: 'entry', label: 'ログ記録', icon: '✏️' },
  { key: 'sales', label: '受注管理', icon: '💰' },
  { key: 'representatives', label: '担当者マスター', icon: '👥' },
  { key: 'proposal-menus', label: '提案メニューマスター', icon: '📋' },
  { key: 'targets', label: 'KPI管理', icon: '🎯' },
  { key: 'budget-results', label: '実績ページ', icon: '📈' }
];
```

### 統計カード仕様
```javascript
function StatCard({ title, value, icon, color }) {
  // 統一されたカードデザイン
  // 左側にカラーアイコン、右側に数値とタイトル
  // 4px左ボーダーで色分け
}
```

## 案件管理ページ仕様詳細

### 表示項目
**案件単位タブ**:
- 商材名、提案メニュー、クライアント、担当者、ステータス、最終接触日（短縮表示YY/MM/DD）

**クライアント単位タブ**:
- クライアント名、担当者、メインステータス、最終接触日

### アクションボタン
1. **詳細**: 案件詳細情報を表示
2. **編集**: 案件情報を編集可能
3. **追加**: ログ記録ページに遷移し、案件情報を事前入力
4. **削除**: 案件を削除（確認ダイアログ付き）

### 削除された項目
- 案件数・クライアント数の統計表示
- 累計売上・累計受注率
- 売上項目
- 次回アクション項目

## KPI管理ページ仕様詳細

### 年度選択機能
- **選択可能年度**: 現在年度±2年（計5年間）
- **デフォルト**: 現在年度が自動選択
- **データ管理**: 年度ごとに独立したKPI目標

### KPI項目仕様
```javascript
const kpiItems = [
  { key: 'newDeals', label: '新規商談数', color: '#3498db' },
  { key: 'newOrders', label: '新規受注数', color: '#27ae60' },
  { key: 'existingDeals', label: '既存商談数', color: '#9b59b6' },
  { key: 'existingOrders', label: '既存受注数', color: '#e67e22' }
];
```

### 月別入力レイアウト
- **ヘッダー**: 1月〜12月の色分けヘッダー
- **入力フィールド**: 各月の数値入力（12列×4行）
- **グリッドシステム**: `repeat(12, 1fr)`でレスポンシブ対応

## セキュリティ仕様

### Firestore Rules
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
    match /representatives/{document} {
      allow read, write: if true;
    }
    match /representativeTargets/{document} {
      allow read, write: if true;
    }
    match /proposalMenus/{document} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if true; // 開発用
    }
  }
}
```

### 認証フロー
1. **ログイン**: ID/Password チェック
2. **セッション作成**: localStorage に保存
3. **自動チェック**: ページロード時の認証状態確認
4. **タイムアウト**: 30分後の自動ログアウト

## デプロイ仕様

### Firebase Hosting
- **プロジェクトID**: psmt-6724f
- **URL**: https://psmt-6724f.web.app
- **リライトルール**: すべてのパスを `/admin/index.html` にリダイレクト

### Firebase設定 (firebase.json)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/admin/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### ビルド構成
```
dist/
├── admin/
│   ├── index.html      # メインアプリケーション（CDN React使用）
│   └── favicon.ico     # ファビコン
└── favicon.ico         # ルートファビコン
```

## ファイル構成

### 現在のプロジェクト構造
```
/
├── dist/
│   ├── admin/
│   │   ├── index.html           # 管理者用SPAアプリケーション
│   │   └── favicon.ico          # ファビコン
│   └── favicon.ico              # ルートファビコン
├── firebase.json                # Firebase Hosting設定
├── firestore.rules             # Firestoreセキュリティルール
├── .firebaserc                 # Firebaseプロジェクト設定
└── CLAUDE.md                   # この仕様書
```

### 削除された機能・ファイル
- **パートナー機能**: 完全削除（パートナー画面、認証、データ分離）
- **カンバンボード**: ドラッグ&ドロップ機能削除
- **紹介者マスター**: 機能削除
- **インフルエンサー管理**: 機能削除
- **キャスティング管理**: 機能削除
- **部署別ステータス**: 機能削除

## データフロー

### 案件登録フロー
1. **ログ記録画面**: フォーム入力（必須項目チェック強化）
2. **既存案件チェック**: productName + proposalMenu で検索
3. **データ保存**: 
   - 新規: progressDashboard + actionLogs に保存
   - 既存: progressDashboard 更新 + actionLogs 追加
4. **画面更新**: データ再取得で即座反映

### 案件管理からのログ記録フロー
1. **追加ボタンクリック**: 案件管理ページから
2. **データ事前入力**: sessionStorageに案件情報保存
3. **画面遷移**: ログ記録ページへ自動遷移
4. **自動入力**: useEffectで事前入力データを読み込み
5. **ログ作成**: 既存案件への新しいアクション追加

### KPI管理フロー
1. **担当者・年度選択**: プルダウンで選択
2. **データ読み込み**: `{担当者ID}_{年度}`でFirestore検索
3. **月別入力**: 4つのKPI×12ヶ月の目標設定
4. **一括保存**: 年度別データとして保存

## 開発履歴

### v3.4.0 (2025年7月29日) - 最新バージョン
**案件管理ページ大幅改修 & KPI管理年度選択機能追加**:

**主要変更**:
1. **案件管理ページリニューアル**:
   - 統計セクション完全削除（案件数カウンター、クライアント数、受注クライアント数）
   - クライアントタブ簡素化（累計売上・累計粗利・受注率削除）
   - 案件単位タブ最適化（売上・次回アクション削除）
   - 最終接触日を短縮表示（YY/MM/DD）

2. **アクションボタン統一**:
   - **詳細**: 詳細情報表示
   - **編集**: 案件情報編集
   - **追加**: ログ記録ページに事前入力付きで遷移
   - **削除**: 案件削除（確認ダイアログ付き）

3. **KPI管理年度選択機能**:
   - 過去2年〜未来2年の年度選択
   - 年度別独立データ管理
   - `{担当者ID}_{年度}`形式のドキュメント構造

4. **ログ記録事前入力機能**:
   - sessionStorage経由でのデータ事前入力
   - React useEffectによる自動フォーム入力
   - 案件管理「追加」ボタンとの連携

**技術実装**:
```javascript
// 事前入力データの保存
sessionStorage.setItem('prefillData', JSON.stringify({
  productName: deal.productName,
  proposalMenu: deal.proposalMenu,
  clientName: deal.clientName,
  representative: deal.representative
}));

// KPI管理年度別データ構造
const docId = `${selectedRep}_${selectedYear}`;
const data = {
  representativeId: selectedRep,
  representativeName: repName,
  year: selectedYear,
  targets: targetData
};
```

### v3.3.0 (2025年7月29日)
**大規模UI改修・機能拡張リリース**:
- 全体ページ改修（タブシステム廃止→月選択方式）
- 実績管理ページ大幅拡張（CSV インポート機能）
- YoY比較・受注率推移・客単価推移グラフ実装
- 自動計算エンジン実装

### v3.2.1 (2025年7月29日)
**マイナス値対応グラフ実装**:
- 個人サマリーグラフでマイナス値表示対応
- ゼロライン基準の上下表示実装

### v3.2.0 (2025年7月29日)
**大幅UI改善 & グラフ機能追加**:
- 実績ページの完全リニューアル（担当者リスト表示）
- 個人サマリーに予算達成率グラフ追加
- SVG描画による高品質チャート実装

### v3.1.0 (2025年7月29日)
**予算・実績管理システム実装**:
- 月次予算入力機能（1月～12月）
- CSV アップロード機能
- 予算達成率表示機能

### v3.0.1 (2025年7月28日)
**パフォーマンス最適化**:
- HTMLファイル15%削減（3925行→3776行）
- React production版で40%高速化
- デバッグコード完全除去

### v3.0.0 (2025年7月28日) - 基本バージョン
**主要変更**:
- パートナー機能完全削除
- 管理者機能大幅拡張
- CDN React による軽量化
- Firebase プロジェクト移行（psmt-6724f）

## パフォーマンス仕様

### ファイルサイズ（最適化後）
- **admin/index.html**: 約190KB（最適化済み）
- **CDN React Production**: 外部読み込み（40%高速化）
- **Firebase SDK**: CDN経由で読み込み

### 読み込み時間
- **初回読み込み**: Firebase SDK + React Production CDN（高速化）
- **2回目以降**: ブラウザキャッシュ活用
- **データ取得**: Firestore からのリアルタイム取得

## 今後の改善項目

### セキュリティ
- Firebase Authentication の実装
- Firestoreセキュリティルールの厳格化
- パスワードハッシュ化の強化
- HTTPS 通信の確保

### 機能拡張
- データエクスポート機能（CSV/Excel）
- 通知機能
- レポート機能の充実
- 検索・フィルター機能の強化

### パフォーマンス
- Firestoreクエリの最適化
- インデックス最適化
- 仮想スクロールの実装
- 画像最適化

### UI/UX
- モバイル対応の強化
- ダークモード対応
- アクセシビリティ向上
- ユーザビリティテスト実施

---

**現在バージョン**: v3.4.0  
**最終更新**: 2025年7月29日  
**開発ステータス**: 本格運用版（管理者専用・案件管理特化版）  
**メンテナンス**: 継続中

## 重要事項

### データバックアップ
- Firestoreの定期バックアップ設定を推奨
- 重要データの手動エクスポート機能検討

### 運用注意点
- 現在のセキュリティルールは開発用設定
- 本番運用時はルールの厳格化が必要
- 定期的なパフォーマンス監視推奨

### サポート
- システム障害時の対応手順書作成予定
- ユーザーマニュアル作成予定
- 定期メンテナンス計画策定予定

## 最新の更新履歴

### 2025年7月29日 - v3.4.0 案件管理ページ & KPI管理更新完了
**実行したタスク**:
1. ✅ 案件管理ページの統計セクション削除
2. ✅ クライアントタブから累計売上・粗利・受注率削除
3. ✅ 案件単位タブから売上・次回アクション削除
4. ✅ 最終接触日の短縮表示実装（YY/MM/DD）
5. ✅ アクションボタンの統一（詳細・編集・追加・削除）
6. ✅ 「追加」ボタンからログ記録への事前入力機能実装
7. ✅ KPI管理に年度選択機能追加（±2年、計5年間）
8. ✅ 年度別独立データ管理実装
9. ✅ デプロイして動作確認

**新機能**:
- **案件管理**: よりシンプルで使いやすいインターフェース
- **ログ記録事前入力**: 案件情報の自動入力で効率化
- **KPI管理年度選択**: 過去・未来のKPI目標設定が可能
- **データ構造最適化**: 年度別データ管理の実装

**成果**:
- 案件管理の操作性大幅向上
- ログ記録業務の効率化
- KPI管理の柔軟性向上
- https://psmt-6724f.web.app への正常デプロイ確認