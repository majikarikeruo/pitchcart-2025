# Firebase セットアップ手順（認証 + Firestore ルール）

このドキュメントは、PitchCart の認証・保存機能を安定稼働させるための Firebase 側設定手順です。

## 1. プロジェクト変数の一致

- フロントエンド `.env`（ビルド時の環境）に設定する `VITE_FIREBASE_*` が、操作する Firebase プロジェクトと一致していることを確認します。
- 本リポジトリでは `.env` をコミットしません。デプロイ環境にて変数を設定してください。

必要なキー:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 2. 認証プロバイダの有効化

Firebase Console → Authentication → Sign-in method で以下を有効化します。
- Email/Password : Enable
- Google : 必要に応じて Enable（サポートメール等の設定が必要な場合あり）
- Anonymous : ゲスト利用を許可する場合は Enable

併せて、Authentication → Settings → Authorized domains にフロントのオリジンを登録します。
- 例: `localhost`（ローカル開発）、本番ドメイン

## 3. Firestore セキュリティルール

以下は最小の例です。ユーザー本人のみが `users/{uid}` を作成・更新でき、分析結果は認証ユーザーであれば書き込み可能とします（必要に応じてさらに厳格化してください）。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザー情報
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // 分析履歴
    match /analysisHistory/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // 必要なら所有者チェックを追加
    }

    // 実践フィードバック
    match /practiceFeedback/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 4. サーバ（API）の認証

- 環境変数 `FIREBASE_SERVICE_ACCOUNT` にサービスアカウント JSON を 1 行で設定します（改行は `\n` にエスケープ）。
- サーバ側で Firebase Admin SDK により ID トークンを検証します（本リポジトリの `api/auth.ts`）。
- 設定例: Vercel/Cloud Run 等のシークレットに保存。

## 5. CORS の制限

- 環境変数 `ALLOWED_ORIGIN` に許可オリジン（カンマ区切り）を設定します。
- 例: `ALLOWED_ORIGIN=http://localhost:3000,https://your-domain.example`

以上で、
- ログイン（Email/Google/Anonymous）が動作
- ログインユーザー（匿名含む）は分析 API を利用可能
- 分析結果は Firestore に保存され、ダッシュボードに実データとして表示
の一連が成立します。

