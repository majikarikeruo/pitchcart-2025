# API ディレクトリ

## ⚠️ 重要な注意事項

### `index.ts` を作成しないでください！

このディレクトリでは、**`api/[...path].ts`** がすべてのAPIリクエストを処理します。

❌ **やってはいけないこと:**
```
api/index.ts を作成する
```

✅ **正しい構造:**
```
api/
  ├── [...path].ts          ← すべての /api/* リクエストを処理
  ├── _index.ts.backup      ← バックアップ（参照用）
  ├── auth.ts               ← ユーティリティ
  ├── llm_client.ts         ← ユーティリティ
  └── ...
```

## なぜ `index.ts` を使わないのか？

Vercelのファイルベースルーティングでは：

1. `api/index.ts` → `/api` または `/api/index` **のみ**にマッピング
2. `api/[...path].ts` → `/api/*` **すべて**にマッピング（catch-all）

両方が存在すると、Vercelは `index.ts` を優先し、`[...path].ts` が無視されます。

その結果：
- ❌ `/api` → 200 OK
- ❌ `/api/analyze/stream` → **404 Not Found** ← これが問題！

## 現在の動作

`api/[...path].ts` のみを使用することで：
- ✅ `/api` → 200 OK
- ✅ `/api/analyze` → 200 OK
- ✅ `/api/analyze/stream` → 200 OK
- ✅ `/api/analyze/emotional_arc` → 200 OK
- ✅ `/api/simulate/structure` → 200 OK

## コードの編集

すべてのAPIロジックは `api/[...path].ts` に記述してください。

新しいエンドポイントを追加する場合：

```typescript
// api/[...path].ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = parseUrl(req.url || "/", true);
  
  // 新しいエンドポイントを追加
  if (req.method === "POST" && pathname === "/api/your-new-endpoint") {
    // ここに処理を記述
    return res.status(200).json({ success: true });
  }
  
  // 既存のエンドポイント...
}
```

## トラブルシューティング

### 404エラーが出る場合

1. `api/index.ts` が存在しないことを確認
2. `api/[...path].ts` が存在することを確認
3. `.vercelignore` に `api/index.ts` が含まれていることを確認
4. Vercelに再デプロイ

### Codexが `index.ts` を作成してしまった場合

```bash
# すぐに削除
rm api/index.ts

# 再デプロイ
vercel --prod
```

## 参考

- `.vercelignore` に `api/index.ts` が含まれています
- `.gitignore` にも `api/index.ts` が含まれています
- これにより、誤って作成されてもデプロイされません

