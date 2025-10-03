# PitchCart React + Firebase 実装計画

## 1. 現在のプロジェクト構成の分析

### 1.1 技術スタック
- **React**: v18.3.12 (最新版)
- **TypeScript**: v5.6.2
- **Vite**: v6.0.1 (ビルドツール)
- **UIライブラリ**: Mantine v7.14.3
- **ルーティング**: React Router v7.0.2
- **グラフ/チャート**: Recharts v2.14.1, Mantine Charts
- **アイコン**: Tabler Icons, Lucide React

### 1.2 ディレクトリ構造
```
src/
├── App.tsx                 # メインアプリケーション
├── pages/                  # ページコンポーネント
│   ├── Home.tsx           # ホームページ
│   ├── Entry.tsx          # エントリーページ
│   └── Result.tsx         # 結果表示ページ
├── components/            # 再利用可能なコンポーネント
│   ├── features/          # 機能別コンポーネント
│   │   ├── Entry/
│   │   └── Result/
│   └── ui/                # 汎用UIコンポーネント
├── types/                 # TypeScript型定義
│   └── Result/            # 結果関連の型
├── hooks/                 # カスタムフック
├── services/              # APIサービス層（現在は空）
└── style.css              # グローバルスタイル
```

### 1.3 既存の主要コンポーネント
- **Entry**: プレゼンテーションチェック機能
- **Result**: 
  - Score: スコア表示（総合スコア、カテゴリ別スコア）
  - Flow: フロー分析（タイムライン、詳細ダイアログ）
  - Question: 想定質問表示
  - Improvement: 改善提案

### 1.4 データ構造
現在の主要な型定義：
- `ResultData`: 分析結果の総合データ
- `UserInputProps`: ユーザー入力情報
- `analysisWithScoreProps`: スコア付き分析結果
- `HeatmapData`, `structureData`: フロー分析データ

## 2. Firebase設定計画

### 2.1 必要なFirebaseサービス
1. **Firebase Authentication**
   - Googleログイン
   - メールアドレス認証
   - 匿名認証（お試し利用）

2. **Cloud Firestore**
   - ユーザーデータ管理
   - プレゼンテーション分析結果の保存
   - 履歴管理

3. **Firebase Storage**
   - PowerPointファイルの保存
   - 生成されたスライド画像の保存
   - 分析結果のエクスポートファイル

4. **Cloud Functions**
   - PowerPoint解析処理
   - AI分析のバックエンド処理
   - 定期的なデータクリーンアップ

### 2.2 Firestoreデータベース構造

```typescript
// コレクション構造
interface DatabaseStructure {
  users: {
    [userId: string]: {
      email: string;
      displayName: string;
      createdAt: Timestamp;
      subscription: {
        plan: 'free' | 'pro' | 'enterprise';
        expiresAt?: Timestamp;
      };
      usage: {
        analysisCount: number;
        lastAnalysisAt: Timestamp;
      };
    }
  };

  presentations: {
    [presentationId: string]: {
      userId: string;
      title: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
      fileUrl: string;
      status: 'uploading' | 'processing' | 'completed' | 'failed';
      metadata: {
        slideCount: number;
        fileSize: number;
        originalFileName: string;
      };
    }
  };

  analyses: {
    [analysisId: string]: {
      presentationId: string;
      userId: string;
      createdAt: Timestamp;
      result: ResultData; // 既存の型を使用
      settings: {
        audience: string;
        purpose: string;
        industry: string;
      };
    }
  };

  feedbacks: {
    [feedbackId: string]: {
      analysisId: string;
      userId: string;
      rating: number;
      comment?: string;
      createdAt: Timestamp;
    }
  };
}
```

### 2.3 セキュリティルール概要

```javascript
// Firestore セキュリティルール
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // プレゼンテーションは所有者のみアクセス可能
    match /presentations/{presentationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // 分析結果も所有者のみアクセス可能
    match /analyses/{analysisId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 3. Step 1-4の詳細実装計画

### Step 1: PowerPointアップロード機能（推定工数：3-5日）

#### 実装タスク
1. Firebase初期設定
   - Firebaseプロジェクトの作成
   - 環境変数の設定
   - Firebase SDKの導入

2. 認証機能の実装
   - ログイン/ログアウトコンポーネント
   - 認証状態の管理（Context API）
   - プライベートルートの実装

3. ファイルアップロード機能
   - ドラッグ&ドロップ対応のアップローダー
   - ファイルバリデーション
   - アップロード進捗表示
   - Firebase Storageへの保存

#### 必要なコンポーネント/ファイル
```
src/
├── contexts/
│   └── AuthContext.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── AuthGuard.tsx
│   └── upload/
│       ├── FileUploader.tsx
│       └── UploadProgress.tsx
├── services/
│   ├── firebase.ts
│   └── storage.ts
└── hooks/
    ├── useAuth.ts
    └── useFileUpload.ts
```

#### データフロー
1. ユーザーがファイルを選択/ドロップ
2. ファイルバリデーション（サイズ、形式）
3. Firebase Storageへアップロード
4. Firestoreにメタデータ保存
5. Cloud Functionsトリガーで解析開始

### Step 2: スライド評価機能（推定工数：5-7日）

#### 実装タスク
1. 評価項目の定義とUI実装
   - 評価カテゴリの表示
   - スコアリングロジック
   - レーダーチャートの実装

2. AI分析統合
   - Cloud Functions経由でのAPI呼び出し
   - 分析状態の管理
   - リアルタイム進捗表示

3. 結果表示の最適化
   - 既存のResultコンポーネントの拡張
   - データ取得の最適化
   - キャッシュ戦略

#### 必要なコンポーネント/ファイル
```
src/
├── components/
│   ├── analysis/
│   │   ├── AnalysisProgress.tsx
│   │   ├── ScoreRadarChart.tsx
│   │   └── CategoryBreakdown.tsx
├── services/
│   ├── analysis.ts
│   └── cloudFunctions.ts
└── hooks/
    ├── useAnalysis.ts
    └── useRealtimeData.ts
```

#### データフロー
1. アップロード完了後、自動的に分析開始
2. Cloud Functionsで分析処理
3. Firestoreにリアルタイムで結果を保存
4. クライアントでリアルタイム更新を受信
5. UIに反映

### Step 3: 改善提案生成（推定工数：4-6日）

#### 実装タスク
1. 改善提案の表示UI
   - カテゴリ別の提案表示
   - 優先度による並び替え
   - 実装難易度の表示

2. インタラクティブ機能
   - 提案の採用/却下
   - カスタム提案の追加
   - 提案のエクスポート

3. 比較機能
   - Before/After表示
   - 改善効果の予測表示

#### 必要なコンポーネント/ファイル
```
src/
├── components/
│   ├── improvement/
│   │   ├── ImprovementList.tsx
│   │   ├── ImprovementCard.tsx
│   │   ├── BeforeAfterComparison.tsx
│   │   └── ExportOptions.tsx
└── hooks/
    └── useImprovement.ts
```

### Step 4: ダッシュボード機能（推定工数：3-4日）

#### 実装タスク
1. ダッシュボードレイアウト
   - 分析履歴一覧
   - 統計情報表示
   - クイックアクション

2. 履歴管理
   - 過去の分析結果へのアクセス
   - 比較機能
   - お気に入り機能

3. エクスポート機能
   - PDF出力
   - データのCSVエクスポート
   - 共有リンク生成

#### 必要なコンポーネント/ファイル
```
src/
├── pages/
│   └── Dashboard.tsx
├── components/
│   ├── dashboard/
│   │   ├── AnalysisHistory.tsx
│   │   ├── UsageStats.tsx
│   │   └── QuickActions.tsx
└── services/
    └── export.ts
```

## 4. 技術スタック

### 4.1 追加が必要なライブラリ

```json
{
  "dependencies": {
    // Firebase
    "firebase": "^10.7.0",
    
    // 状態管理
    "zustand": "^4.4.7",
    "react-query": "^3.39.3",
    
    // ファイル処理
    "react-dropzone": "^14.2.3",
    
    // PDF生成
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    
    // グラフ拡張
    "d3": "^7.8.5",
    
    // アニメーション
    "framer-motion": "^10.16.16",
    
    // 開発ツール
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4"
  }
}
```

### 4.2 TypeScriptの活用方針

1. **厳格な型定義**
   - すべてのAPIレスポンスに型定義
   - Firebaseデータの型安全性確保
   - Zodによるランタイム検証

2. **型の再利用**
   - 既存の型定義を最大限活用
   - ジェネリック型の活用
   - ユーティリティ型の定義

3. **型安全なフック**
   - カスタムフックの戻り値を明確に型定義
   - エラーハンドリングの型定義

## 5. 開発スケジュール

### 5.1 フェーズ分け（合計：4-5週間）

#### Phase 1: 基盤構築（1週間）
- Firebase環境設定
- 認証システム実装
- 基本的なルーティング設定
- CI/CD環境構築

#### Phase 2: コア機能実装（2-3週間）
- Step 1: PowerPointアップロード（3-5日）
- Step 2: スライド評価機能（5-7日）
- Step 3: 改善提案生成（4-6日）

#### Phase 3: ダッシュボード・付加機能（1週間）
- Step 4: ダッシュボード機能（3-4日）
- エクスポート機能
- 通知機能

#### Phase 4: 最適化・テスト（1週間）
- パフォーマンス最適化
- セキュリティ監査
- ユーザビリティテスト
- バグ修正

### 5.2 マイルストーン

1. **M1 (Week 1)**: Firebase統合完了、認証機能動作
2. **M2 (Week 2)**: ファイルアップロード・基本分析機能完成
3. **M3 (Week 3)**: 改善提案機能実装完了
4. **M4 (Week 4)**: ダッシュボード完成、全機能統合
5. **M5 (Week 5)**: 本番環境デプロイ準備完了

### 5.3 リスクと対策

1. **AI API統合の複雑性**
   - 対策：早期にプロトタイプ作成、モックデータでのテスト

2. **大容量ファイルの処理**
   - 対策：チャンク処理、プログレッシブアップロード

3. **リアルタイム更新のパフォーマンス**
   - 対策：適切なインデックス設計、データの正規化

## 6. 次のステップ

1. Firebaseプロジェクトの作成
2. 環境変数の設定（.env.local）
3. Firebase SDKの導入とコンフィグ
4. 認証コンテキストの実装
5. 基本的なログイン画面の作成

この計画に基づいて、段階的に実装を進めていくことで、堅牢で拡張性の高いPitchCartアプリケーションを構築できます。