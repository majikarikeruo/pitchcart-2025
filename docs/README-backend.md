PitchCart 合議MVP バックエンド（モック）

概要
- 仕様書 v1.0 の I/O スキーマに準拠した、TypeScript/Node の軽量モック実装です。
- エンドポイント: `POST /api/analyze`（同期）, `POST /api/analyze/stream`（SSE）
- ペルソナは `config/personas.json` で外部化。並列実行・タイムアウト・フォールバック実装済み。
- 現状はLLM非依存のヒューリスティック生成（ネットワーク不要）。Mastra/LLM統合は後段で差し替え可能な構成です。

起動方法
1) 依存（TypeScript）は既に本リポに含まれています。追加インストールは不要です。
2) ビルド+起動
   - `npm run server` → `http://localhost:8787`
   - ヘルスチェック: `GET /api/health`
   - ペルソナ一覧: `GET /api/personas`

Vite 開発プロキシ
- `vite.config.ts` は `VITE_API_URL` に `/api` をプロキシします。
- `.env` で `VITE_API_URL=http://localhost:8787` を指定するとフロントから呼べます。

API 仕様（要約）
- `POST /api/analyze`
  - 入力: `{ summary?: string, slides?: any[] }`（自由形式; 現状は `summary` を主に利用）
  - 出力: `docs/仕様書.md` の `AnalysisResponse v1.0`
  - オプション（リクエスト単位のLLM切替・上書き）:
    - `use_llm: boolean`（trueでLLM経路/falseでヒューリスティック）
    - `use_mastra: boolean`
    - `llm_provider: "openai"|"anthropic"|"gemini"`
    - `persona_model: string`, `merge_model: string`
    - `persona_timeout_ms: number`, `merge_timeout_ms: number`
- `POST /api/analyze/stream`（SSE）
  - イベント順: `persona` × N → `consensus` → `done`
  - フォームデータでもJSONでも上記オプションを同名フィールドで指定可能
- `GET /api/personas`
  - 現在のペルソナ設定を返す（UIの補助などに利用可能）

フォールバック/検証
- Zod非使用の内製バリデーション/リペアを実装。
- 1回リペアしても不整合な場合、ペルソナは `scores=50/50/50, confidence=0.3` のフォールバックを返却。
- 1人失敗しても残り＋合議を返します。

構成
- `server/index.ts` … HTTP サーバ（API実装/SSE/CORS/並列）
- `server/schema.ts` … スキーマ定義と検証/リペア/フォールバック
- `config/personas.json` … ペルソナ定義（増減可能）
- `docs/sample-analysis-response.json` … サンプルレスポンス

Mastra/LLM 統合方針（メモ）
- `USE_LLM=true` で LLM 経路を有効化。
- `server/llm.ts` が Persona/Consensus を生成。
  - 環境変数:
    - `LLM_PROVIDER=openai|anthropic|gemini`
    - `PERSONA_MODEL`（例: openai: gpt-4o-mini / gemini: gemini-1.5-flash）、`MERGE_MODEL`（例: openai: gpt-4o / gemini: gemini-1.5-pro）
    - OpenAI互換: `OPENAI_API_KEY` または `LLM_API_KEY`、`LLM_BASE_URL`（省略時 https://api.openai.com）
    - Anthropic: `ANTHROPIC_API_KEY`、`LLM_BASE_URL`（省略時 https://api.anthropic.com）
    - Gemini: `GEMINI_API_KEY`、`LLM_BASE_URL`（省略時 https://generativelanguage.googleapis.com）
- どちらの経路も JSON 専用応答（`response_format: json_object`）を要求し、受信後に厳格検証→自動リペア→フォールバック。

テスト（オプション）
- サーバをビルド (`npm run server:build`) した上で、Nodeの組み込み `node --test` で `dist-server` を検証可能な構成にしています（必要に応じて追加してください）。
