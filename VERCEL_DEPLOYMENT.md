# Vercelデプロイメントガイド

## 問題の原因

Vercelデプロイ時に以下のエラーが発生していました：

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/mastra_core/agents/index' 
imported from /var/task/api/mastra.js
```

## 解決した問題

1. **ESモジュールのインポートパス**: TypeScriptファイルで相対インポートを使用する際、Vercelでは `.js` 拡張子が必要
2. **不要なファイルのビルド**: `api/mastra_core/` フォルダは現在使用されていないが、Vercelがコンパイルしようとしていた
3. **ルーティング設定**: `/api/analyze/stream` などのサブパスが404エラーになっていた
4. **Catch-allルート**: `api/index.ts` は `/api` のみに対応し、サブパスには対応していなかった

## 実施した修正

### 1. インポートパスの修正

`api/mastra_core/index.ts`:
```typescript
// 修正前
import { evaluateAgent, mergeAgent } from "./agents";
import { analysisWorkflow } from "./workflows";

// 修正後
import { evaluateAgent, mergeAgent } from "./agents/index.js";
import { analysisWorkflow } from "./workflows/index.js";
```

`api/mastra_core/workflows/index.ts`:
```typescript
// 修正前
import { evaluateAgent } from "../agents";

// 修正後
import { evaluateAgent } from "../agents/index.js";
```

### 2. `.vercelignore` の作成

不要なフォルダをビルドから除外：
```
api/mastra_core/
api/tests/
dist-server/
venv/
node_modules/
*.test.ts
*.test.js
```

### 3. Catch-allルートの作成

Vercelでは、`api/index.ts` は `/api` または `/api/index` にのみマッピングされます。
`/api/analyze/stream` のようなサブパスに対応するため、catch-allルートを使用：

```bash
# api/index.ts を api/[...path].ts にコピー
cp api/index.ts api/[...path].ts

# 元の index.ts をバックアップに変更（競合を避けるため）
mv api/index.ts api/_index.ts.backup
```

### 4. `vercel.json` の更新

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/[...path].ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### 5. `.vercelignore` の更新

```
api/mastra_core/
api/tests/
api/_*.backup
dist-server/
venv/
*.test.ts
*.test.js
```

## Vercelでの環境変数設定

Vercelダッシュボードで以下の環境変数を設定してください：

### 必須の環境変数

```bash
# OpenAI API（LLM機能を使用する場合）
OPENAI_API_KEY=sk-...

# または Google Gemini API
GOOGLE_API_KEY=...

# LLMプロバイダー（openai または google）
LLM_PROVIDER=openai

# Firebase Admin SDK（認証用）
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS設定（本番環境のドメイン）
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

### オプションの環境変数

```bash
# LLMモデル指定
PERSONA_MODEL=gpt-4o
MERGE_MODEL=gpt-4o

# タイムアウト設定（ミリ秒）
PERSONA_TIMEOUT_MS=10000
MERGE_TIMEOUT_MS=10000

# LLM機能の有効/無効
USE_LLM=true
USE_MASTRA=false

# アップロードサイズ制限（バイト）
MAX_UPLOAD_BYTES=26214400
```

## デプロイ手順

1. Vercelプロジェクトに接続
```bash
vercel link
```

2. 環境変数を設定
```bash
vercel env add OPENAI_API_KEY
vercel env add FIREBASE_PROJECT_ID
# ... その他の環境変数
```

3. デプロイ
```bash
vercel --prod
```

## トラブルシューティング

### エラー: "Cannot find module"

- すべての相対インポートに `.js` 拡張子が付いているか確認
- `.vercelignore` で不要なフォルダが除外されているか確認

### エラー: "サーバ未起動"

- Vercelダッシュボードで環境変数が正しく設定されているか確認
- `/api` エンドポイントにアクセスして `{"ok": true}` が返されるか確認

### エラー: "Unauthorized"

- Firebase Admin SDKの環境変数が正しく設定されているか確認
- `FIREBASE_PRIVATE_KEY` の改行文字が正しくエスケープされているか確認

## 確認方法

デプロイ後、以下のURLにアクセスして動作確認：

1. ヘルスチェック: `https://your-domain.vercel.app/api`
   - 期待される応答: `{"ok": true, "version": "v1.0-serverless"}`

2. フロントエンド: `https://your-domain.vercel.app`
   - 「分析を開始する」ボタンが正常に動作するか確認

## 注意事項

- Vercelの無料プランでは、サーバーレス関数の実行時間は最大60秒です
- 大きなファイルのアップロードには時間がかかる場合があります
- LLM APIの呼び出しには追加の時間がかかります

