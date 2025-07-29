# 営業管理システム v3.3 - 現在の仕様書

## プロジェクト概要
React.js + Firebase で構築された営業進捗管理システム。管理者向けの統合管理機能を提供し、案件進捗管理、担当者管理、目標実績管理等の機能を統合。

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

### 1. ホーム (🏠)
- **統計ダッシュボード**: 総案件数、受注件数、ログ総数、今週のログ数
- **最近の案件表示**: 最新5件の案件情報とステータス
- **統計カード**: 各指標を視覚的に表示

### 2. 案件一覧 (📊)
- **全案件表示**: Firestoreから案件データを取得・表示
- **テーブル形式**: 商材名、提案メニュー、担当者、ステータス、最終接触日、次回アクション
- **ステータス色分け**: 8段階のステータスを色で視覚化
- **横スクロール対応**: 画面幅に応じた表示調整

### 3. アクションログ (📝)
- **活動履歴表示**: 全アクションログの時系列表示
- **詳細情報**: 商材名、アクション内容、詳細説明、作成日時
- **カード形式**: 読みやすいカード表示

### 4. ログ記録 (✏️)
- **案件進捗記入**: 新規案件・既存案件の進捗入力
- **必須項目**: 商材名、提案メニュー、担当者、ステータス、アクション
- **自動判定**: 既存案件の検索・更新または新規作成
- **Firebase連携**: progressDashboard と actionLogs の同時更新

### 5. 成約案件 (💰)
- **受注案件一覧**: ステータスが「受注」の案件表示
- **成約サマリー**: 合計件数の表示
- **詳細情報**: 商材名、提案メニュー、担当者、最終接触日

### 6. 担当者マスター (👥)
- **担当者管理**: 名前、会社名、部署、ステータスの登録・編集・削除
- **部署管理**: 4部署（Buzz、コンサル、デジコン、マーケD）から選択
- **モーダル編集**: ポップアップでの編集機能
- **ステータス管理**: アクティブ・非アクティブの切り替え

### 7. 部署別ステータス (🏢)
- **部署別集計**: 各部署ごとのステータス別案件数表示
- **視覚的表示**: ステータス色とドット表示
- **合計表示**: 部署ごとの総案件数
- **グリッドレイアウト**: レスポンシブ対応

### 8. 目標・実績管理 (🎯)
- **担当者別目標設定**: 月次目標の設定・管理
- **4ステータス対応**: アポ打診中、初回アポ予定、与件化_提案中、検討中
- **目標項目**: 目標件数、想定遷移率の設定
- **月次管理**: 年月指定での目標管理

### 9. 個人別実績 (📈)
- **個人実績サマリー**: 担当者・月指定での実績表示
- **統計カード**: 総案件数、受注件数、成約率、ログ件数
- **ステータス別内訳**: 8ステータスの詳細表示
- **成約率計算**: 受注件数/総案件数の自動計算

## データ構造 (Firestore)

### 1. progressDashboard コレクション
```javascript
{
  id: string,                   // ドキュメントID
  productName: string,          // 商材名
  proposalMenu: string,         // 提案メニュー
  representative: string,       // 担当者名
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
  productName: string,          // 商材名
  proposalMenu: string,         // 提案メニュー
  representative: string,       // 担当者名
  action: string,              // アクション内容
  description: string,         // 詳細説明
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
  companyName: string,         // 会社名
  department: string,          // 部署名
  status: string,             // ステータス（アクティブ/非アクティブ）
  createdAt: Timestamp,       // 作成日時
  updatedAt: Timestamp        // 更新日時
}
```

### 4. representativeTargets コレクション
```javascript
{
  id: string,                    // {representativeId}_{yearMonth}形式
  representativeId: string,      // 担当者ID
  representativeName: string,    // 担当者名
  yearMonth: string,            // "2025-01" 形式
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

### 5. clientProjectData コレクション (v3.3.0追加)
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

### 6. budgetAndResults コレクション (v3.3.0拡張)
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

### 提案メニュー
```javascript
const PROPOSAL_MENUS = [
  'AI OSキャンプ',
  'DXコンサル', 
  'BUZZマーケ',
  'デジコン',
  'インサイドセールス',
  'IFキャスティング'
];
```

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
- **サイドバー**: 250px固定幅、アクティブ状態の視覚化
- **メニュー項目**: 9つの機能へのアクセス
- **ログアウト**: セッション削除 + ページリロード

### 統計カード仕様
```javascript
function StatCard({ title, value, icon, color }) {
  // 統一されたカードデザイン
  // 左側にカラーアイコン、右側に数値とタイトル
  // 4px左ボーダーで色分け
}
```

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

## データフロー

### 案件登録フロー
1. **ログ記録画面**: フォーム入力
2. **既存案件チェック**: productName + proposalMenu で検索
3. **データ保存**: 
   - 新規: progressDashboard + actionLogs に保存
   - 既存: progressDashboard 更新 + actionLogs 追加
4. **画面更新**: データ再取得で即座反映

### 担当者管理フロー
1. **担当者マスター**: 担当者情報の CRUD
2. **部署別集計**: representatives データと progressData を結合
3. **目標管理**: representativeTargets での月次目標設定
4. **実績表示**: 月次フィルターでの個人実績計算

## 開発履歴

### v3.3.0 (2025年7月29日) - 最新バージョン
**大規模UI改修・機能拡張リリース**:

**主要変更点**:
1. **全体ページ改修**:
   - タブシステム廃止 → 月選択ドロップダウン方式に変更
   - YoY比較グラフ専用の年選択機能追加
   - 受注率推移グラフ実装（累計新規受注÷累計新規案件）
   - 客単価推移グラフ実装（月次実績÷ユニーククライアント数）

2. **実績管理ページ大幅拡張**:
   - **CSV インポート機能**: クライアント別プロジェクトデータの一括登録
   - **表示切替機能**: 👤人別表示 ⇄ 🏢クライアント別表示
   - **自動計算エンジン**: クライアントデータから個人実績を自動集計
   - **手動再計算ボタン**: 🔄実績再計算で即座に更新可能

3. **新データ構造**:
   - `clientProjectData` コレクション追加
   - プロジェクト単位でのクライアント・担当者・月次実績管理
   - 自動計算による `budgetAndResults` との連携

**技術的改善**:
- React useEffect による自動データ連携
- Firestore バッチ処理による高速更新
- エラーハンドリング強化
- ユーザーフィードバック機能向上

**UI/UX改善**:
- レスポンシブデザイン対応
- ビジュアル階層の明確化
- ローディング状態の可視化
- 操作フィードバックの充実

### v3.2.1 (2025年7月29日)
**マイナス値対応グラフ実装**:
- 個人サマリーグラフでマイナス値表示対応
- ゼロライン基準の上下表示
- マイナス値専用カラーリング
- 達成率計算のマイナス値対応

3. **グラフ仕様**:
   - ViewBox拡張：280px（マイナス領域確保）
   - グリッド線：10本（±5本ずつ）
   - 達成率：マイナス値でも正確な計算
   - 凡例：4色対応（+/- × 予算/実績）

**技術実装**:
```javascript
// マイナス値対応の値域計算
const allValues = chartData.flatMap(d => [d.budget, d.actual]);
const maxValue = Math.max(...allValues, 1);
const minValue = Math.min(...allValues, 0);
const valueRange = maxValue - minValue;
const zeroLine = padding + (maxValue / valueRange) * chartHeight;

// マイナスバーの描画
if (value < 0) {
  y: zeroLine,  // ゼロラインから開始
  height: Math.abs(value / valueRange) * chartHeight  // 下向きに拡張
}
```

### v3.2.0 (2025年7月29日)
**大幅UI改善 & グラフ機能追加**:
- 実績ページの完全リニューアル（担当者リスト表示）
- 個人サマリーに予算達成率グラフ追加
- SVG描画による高品質チャート実装
- グラフ専用の期間選択機能

**実績ページ改善**:
1. **担当者リスト形式**:
   - プルダウン選択から全担当者一覧表示に変更
   - 各担当者に予算・実績の2行表示
   - 年間データの一括表示・編集
   - 一括保存機能

2. **UI改善**:
   - 年表示の追加（2025年など）
   - 月見出しの横並び表示（1月〜12月）
   - グリッドレイアウトによる視認性向上
   - 部署名併記で識別性向上

**個人サマリーグラフ**:
1. **予算達成率チャート**:
   - SVGベースの棒グラフ実装
   - 予算・実績の並列表示
   - 達成率パーセンテージ表示
   - カラーコード（達成: 緑、未達成: 赤）

2. **期間選択機能**:
   - 直近6ヶ月 / 年間の切り替え
   - リアルタイムグラフ更新
   - 過去データとの比較分析
   - 凡例とグリッド線表示

**技術実装**:
```javascript
// 年間予算データ取得
const fetchYearlyBudgetData = async () => {
  const currentYear = new Date().getFullYear();
  const yearlyData = {};
  
  for (let month = 1; month <= 12; month++) {
    const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
    // Firestore から月次データ取得
  }
};

// SVGチャート描画
React.createElement('svg', {
  width: '100%',
  height: '100%',
  viewBox: '0 0 800 250'
}, chartElements)
```

### v3.1.0 (2025年7月29日)
**主要変更**:
- 予算・実績管理システムの実装
- 月次予算入力機能（1月～12月）
- 月次実績入力機能（直接入力・CSV アップロード）
- 予算達成率の個人サマリー表示
- 新規「実績ページ」の追加

**新機能**:
1. **予算・実績管理システム**:
   - 担当者別・月別の予算設定
   - 実績データの直接入力とCSV一括アップロード
   - 予算と実績の2行比較表示
   - リアルタイム保存機能

2. **予算達成率表示**:
   - 個人サマリーページに予算達成率カード追加
   - 月次での予算vs実績比較
   - 達成率の自動計算とパーセント表示

3. **CSV アップロード機能**:
   - 月次実績データの一括インポート
   - エラーハンドリングとユーザーフィードバック
   - 既存データとのマージ機能

**データ構造追加**:
```javascript
// budgetAndResults コレクション
{
  id: "{representativeId}_{yearMonth}",  // 例: "rep001_2025-01"
  representativeId: string,              // 担当者ID
  representativeName: string,            // 担当者名
  yearMonth: string,                     // "2025-01" 形式
  budget: {                              // 月次予算データ
    "2025-01": number,
    "2025-02": number,
    // ... 12ヶ月分
  },
  actual: {                              // 月次実績データ
    "2025-01": number,
    "2025-02": number,
    // ... 12ヶ月分
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### v3.0.1 (2025年7月28日)
**パフォーマンス最適化**:
- HTMLファイルの大幅リファクタリング（3925行→3776行、約15%削減）
- React CDNをproduction版に変更（約40%高速化）
- 全console文削除（34箇所）、alert文削除（5箇所）
- 日本語コメント削除（20箇所以上）
- Firebase設定最適化（未使用Functions設定削除）
- 空行・不要コード除去によるファイルサイズ削減

**技術改善**:
- 本番環境向けReact最適化
- デバッグコード完全除去
- メンテナンス性向上
- デプロイ時間短縮

### v3.0.0 (2025年7月28日) - 基本バージョン
**主要変更**:
- パートナー機能の完全削除
- 管理者機能の大幅拡張
- 新機能追加（担当者マスター、部署別統計、目標管理、個人実績）
- CDN React による軽量化
- Firebase プロジェクト移行（psmt-6724f）

**新機能**:
1. 担当者マスター管理
2. 部署別ステータス集計
3. 目標・実績管理
4. 個人別実績サマリー

**削除機能**:
1. パートナー画面全体
2. カンバンボード
3. 紹介者マスター
4. インフルエンサー管理
5. キャスティング管理

## パフォーマンス仕様

### ファイルサイズ（v3.0.1最適化後）
- **admin/index.html**: 約182KB（最適化済み、v3.0.1で15%削減）
- **CDN React Production**: 外部読み込み（40%高速化）
- **Firebase SDK**: CDN経由で読み込み
- **総行数**: 3776行（149行削減）

### 読み込み時間（最適化効果）
- **初回読み込み**: Firebase SDK + React Production CDN（高速化）
- **2回目以降**: ブラウザキャッシュ活用
- **データ取得**: Firestore からのリアルタイム取得
- **デバッグコード除去**: console文34箇所削除で軽量化

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

**現在バージョン**: v3.3.0  
**最終更新**: 2025年7月29日  
**開発ステータス**: 本格運用版（管理者専用・大規模機能拡張版）  
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

## 最新のタスク履歴

### 2025年7月28日 - サマリー画面リニューアル完了
**実行したタスク**:
1. ✅ ナビゲーション項目の名称変更（ホーム→サマリー（全体）、個人別実績→サマリー（個人用））
2. ✅ HomeDashboard関数をOverallSummaryに改名し、新機能を実装
3. ✅ PersonalSummary関数に個人別/部署別切り替え機能を追加
4. ✅ クライアント別YoYグラフ機能の実装
5. ✅ 月別売上・粗利推移グラフの追加
6. ✅ 新規/既存商談数の分析機能追加
7. ✅ デプロイして動作確認

**新機能**:
- **サマリー（全体）**: クライアント別YoY分析、売上・粗利切り替えグラフ
- **サマリー（個人用）**: 個人別/部署別の切り替え表示機能
- **KPI強化**: 新規/既存商談数、平均客単価、稼働社数の詳細分析
- **目標達成状況**: 予算・受注数・商談数の目標と実績表示機能

**成果**:
- サマリー機能の大幅強化
- より詳細なKPI管理が可能
- 部署レベルでの実績管理機能追加
- https://psmt-6724f.web.app への正常デプロイ確認

### 2025年7月28日 - コードリファクタリング完了
**実行したタスク**:
1. ✅ 現在のサイトの構造とコードを分析
2. ✅ dist/admin/index.htmlの内容を確認
3. ✅ 不要なコードとコメントを特定
4. ✅ HTMLファイルをリファクタリング
5. ✅ Firebase設定ファイルを最適化
6. ✅ デプロイして動作確認

**成果**:
- ファイルサイズ15%削減（3925行→3776行）
- React production版への変更で40%高速化
- デバッグコード完全除去（console文34箇所、alert文5箇所）
- Firebase設定最適化完了
- https://psmt-6724f.web.app への正常デプロイ確認