# Vercel デプロイチェックリスト

## ✅ 完了した修正

- [x] ESモジュールのインポートパスに `.js` 拡張子を追加
- [x] `.vercelignore` で不要なフォルダを除外
- [x] `api/[...path].ts` でcatch-allルートを作成
- [x] `api/index.ts` を `api/_index.ts.backup` にリネーム
- [x] `vercel.json` を更新
- [x] ビルドエラーを修正（AppLayout.tsx）
- [x] ローカルビルドが成功することを確認

## 📋 デプロイ前の確認事項

### 1. ファイル構造
```
api/
  ├── [...path].ts          ← すべての /api/* リクエストを処理
  ├── _index.ts.backup      ← バックアップ（デプロイされない）
  ├── auth.ts
  ├── llm_client.ts
  ├── llm.ts
  ├── mastra.ts
  └── schema.ts
```

### 2. Vercel環境変数の設定

Vercelダッシュボード（Settings → Environment Variables）で以下を設定：

#### 必須
```bash
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

⚠️ **重要**: `FIREBASE_PRIVATE_KEY` は改行を `\n` でエスケープしてください

#### オプション
```bash
PERSONA_MODEL=gpt-4o
MERGE_MODEL=gpt-4o
USE_LLM=true
USE_MASTRA=false
PERSONA_TIMEOUT_MS=10000
MERGE_TIMEOUT_MS=10000
MAX_UPLOAD_BYTES=26214400
```

### 3. デプロイコマンド

```bash
# プロジェクトをVercelにリンク（初回のみ）
vercel link

# 本番環境にデプロイ
vercel --prod
```

## 🧪 デプロイ後のテスト

### 1. ヘルスチェック
```bash
curl https://your-domain.vercel.app/api
```

期待される応答:
```json
{"ok": true, "version": "v1.0-serverless"}
```

### 2. エンドポイントの確認

以下のエンドポイントがすべて動作することを確認：

- ✅ `GET /api` - ヘルスチェック
- ✅ `POST /api/analyze` - 通常の分析
- ✅ `POST /api/analyze/stream` - ストリーミング分析（これが404だった）
- ✅ `POST /api/analyze/emotional_arc` - 感情アーク分析
- ✅ `POST /api/simulate/structure` - 構造シミュレーション

### 3. フロントエンドのテスト

1. アプリにアクセス: `https://your-domain.vercel.app`
2. ログイン
3. プレゼンテーションファイルをアップロード
4. 「分析を開始する」ボタンをクリック
5. エラーが出ないことを確認

## 🐛 トラブルシューティング

### エラー: "Cannot find module"
→ すべての相対インポートに `.js` 拡張子があるか確認

### エラー: "404 Not Found" on `/api/analyze/stream`
→ `api/[...path].ts` が存在し、`api/index.ts` が存在しないことを確認

### エラー: "サーバ未起動"
→ Vercelダッシュボードで環境変数が設定されているか確認

### エラー: "Unauthorized"
→ Firebase Admin SDKの環境変数が正しいか確認
→ `FIREBASE_PRIVATE_KEY` の改行が正しくエスケープされているか確認

### エラー: "Function execution timed out"
→ `vercel.json` の `maxDuration` を確認（無料プランは最大60秒）
→ LLMのタイムアウト設定を確認

## 📊 Vercelダッシュボードで確認すること

1. **Deployments** タブ
   - ビルドが成功しているか
   - エラーログがないか

2. **Functions** タブ
   - `api/[...path].ts` が表示されているか
   - メモリ使用量が1024MBに設定されているか
   - 実行時間が60秒に設定されているか

3. **Logs** タブ（Runtime Logs）
   - リクエストが正しく処理されているか
   - エラーが発生していないか
   - `pathname` が正しく認識されているか

## 🎯 期待される動作

デプロイ後、以下が正常に動作するはずです：

1. ✅ ヘルスチェックが成功する
2. ✅ ファイルアップロードが動作する
3. ✅ ストリーミング分析が開始される
4. ✅ ペルソナ評価が順次受信される
5. ✅ コンセンサスが生成される
6. ✅ 結果が表示される

## 📝 次回のデプロイ時の注意

- `api/index.ts` を作成しない（`api/[...path].ts` と競合するため）
- 新しいエンドポイントを追加する場合は、`api/[...path].ts` 内で処理する
- 環境変数を変更した場合は、Vercelで再デプロイが必要

