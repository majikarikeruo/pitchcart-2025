# PitchCart 認証および Mastra 周りの現状整理と改善計画

本書は、現行リポジトリにおける「ログインがうまく動かない場合がある」「Mastra を使っているはずだが動作が不明」といった声の背景を、読み物として整理し、段階的な改善計画を示すものです。箇条書きに寄りすぎず、文脈を通じて全体像がつかめるように記述しています。

---

## はじめに（今どこにいて、どこへ向かうか）

現在のアプリはフロントに Firebase 認証を用い、バックエンドには Vercel Functions 互換のハンドラ（`api/index.ts`）を持ち、開発時はローカルサーバ（`dev-server.ts` / `server.js`）や Cloudflare Workers（`workers/src/index.ts`）からも同じロジックを呼び出せる構成になっています。Mastra については依存関係こそ導入されているものの、実態は将来的な差し替え点としてのプレースホルダに留まっています。

この構成は柔軟性が高い一方で、認証・認可の不在やランタイムの重複により、期待どおりに「ログインすれば守られた API が使える」体験になっていません。まずは現状を落ち着いて捉え、影響が大きい所から順に是正していきます。

---

## 現状サマリ（短く要点）

- ログインは Firebase（Google/Email/匿名）で実装されています。コード上は成立していますが、Firebase Console 側の有効化や Firestore ルール設定が必要で、設定状態によっては失敗します。プロフィール保存（`users/{uid}`）がルールに阻まれる可能性もあります。

---

## ログインの事実確認ポイント（簡潔なチェック）

1. Firebase Console で Google / Email / Anonymous の各プロバイダが有効化されている。
2. Authentication の Authorized domains にローカル開発オリジン（例: `localhost:3000`）が登録されている。
3. Firestore ルールが `users/{uid}` の作成・更新を認証済み本人に許可している。
4. フロントで `onAuthStateChanged` によりユーザーが取得でき、`getIdToken()` が取得できる。
5. 失敗時にコンソールへ出る Firebase エラーコード（例: `auth/operation-not-allowed`）があれば、それに沿って設定を修正する。
- サーバ側 API は `Authorization` ヘッダを受け取っているだけで検証せず、実質的に無認可です。クライアントは `VITE_API_KEY` を付けて送りますが、サーバは何も確認していません。
- `.env` に外部キー（OpenAI/Gemini 等）が平文で置かれており、セキュリティ・運用両面で改善が必要です。
- Mastra は「将来的に差し替える」ための薄いアダプタで、デフォルトでは無効（`USE_MASTRA=false`）。実運用としては LLM 直呼びのコードが動いています。
- 同等処理を複数ランタイムでラップしており、保守コストと整合性リスクがあります。

---

## 何が起きているのか（少し深掘り）

### 認証の実装と躓きどころ

フロントエンドでは `src/services/auth.service.ts` と `src/contexts/AuthContext.tsx` により、Google・メール・匿名の 3 系統を扱います。新規ユーザーや匿名ユーザーに対しては Firestore の `users/{uid}` へプロフィールを保存・更新します。ここで鍵になるのは、Firebase Console 側で各プロバイダを有効化しているか、そして Firestore セキュリティルールがこの書き込みを許可するか、という点です。

加えて、`VITE_FIREBASE_STORAGE_BUCKET` が一般的な `*.appspot.com` ではなく `*.firebasestorage.app` になっており、将来的な Storage 利用では不整合が起こり得ます（現状のログイン動作そのものには即時の影響はありません）。

### サーバ側の認可が無い

`api/index.ts` は CORS を広く許容しつつ、`Authorization` ヘダの検証を行っていません。クライアントは `src/components/Entry/PresentationCheck.tsx` から `Authorization: Bearer ${import.meta.env.VITE_API_KEY}` を送っていますが、サーバはこれを見ていません。結果として、ログインとは独立にエンドポイントが開放されている状態です。

### Mastra は「将来の受け皿」

`api/mastra.ts` は LLM 呼び出しにフォールバックする薄いアダプタです。`USE_MASTRA` を `true` にしても、実体となる Workflow/Server の定義がなければ結局 LLM 直呼びに近い経路になります。期待する「Mastra の恩恵」を得るには、ワークフローの実装と設定が必要です。

### ランタイムが重複しがち

同じ分析ロジックを、ローカル Node、Vercel 互換、Cloudflare Workers という 3 通りでラップしています。機動性は高いものの、どれを正とするかが曖昧になりやすく、細かな差（例: `server.js` の TS 取り扱い）が不具合の温床になります。

---

## 根本原因（症状ではなく、土台の問題）

1. 「ログイン」と「API 利用」の連動がないため、ログインしてもバックエンド側でユーザーを識別・制御できません。
2. Firebase 側の初期設定（プロバイダ有効化、Firestore ルール、Authorized domains）が前提になっており、未設定だと必ず詰まります。
3. 機密管理とデプロイ運用が未整備で、`.env` の扱いに実害のリスクがあります。
4. Mastra は依存だけ入り、ワークフロー実装が無いので「使っている」状態ではありません。
5. ランタイムの多重化により、動作差分とドキュメント不足が読み解きづらさを助長しています。

---

## 改善方針（段階的に、安全に）

本件は、即応が必要なセキュリティ項目と、設計改善・体験改善に分かれます。フェーズを切って、短いサイクルで確実に前進します。

### フェーズ 0：セキュリティの即時是正（短期）

- リポジトリから `.env` を撤去し、環境変数はデプロイ先のシークレットに移行します。
- サーバ側で最小限の認可を実装します。暫定的には Firebase ID トークンの検証（`Authorization: Bearer <idToken>`）を導入し、ログインユーザーのみ API を利用可能にします。
- CORS を限定的にします（開発オリジンと本番ドメインのみに絞る）。

### フェーズ 1：ログイン体験の完成と API の連動（中期）

- Firebase Console の設定（Google/Email/Anonymous の有効化、Authorized domains の確認）を正規手順としてプロジェクトに明文化します。
- Firestore ルールを更新し、`users/{uid}` の作成・更新を「認証済みかつ `request.auth.uid == resource.id`」などの条件で許可します。
- クライアントは Firebase の ID トークンを取得し、API 呼び出し時に送信。サーバはそれを検証し、ユーザー ID をコンテキストに通します。

### フェーズ 2：Mastra の実戦投入とアーキ整流（中期〜）

- Mastra の Workflow/Server を最小構成で導入し、現行の `api/mastra.ts` を本物の実装に差し替えます。
- ランタイムを 1 系統（例: Vercel Functions 互換）に寄せ、Workers 側は必要ならビルド成果物から配布するなど、整合性の持ち方を明確化します。
- 監視・ログ方針（失敗時のフォールバック、タイムアウト、レート制限）を運用レベルで確立します。

---

## 具体的なアクションと成果物

- 認可の導入（フェーズ 0）
  - `api/index.ts` に Firebase Admin SDK 等を用いた ID トークン検証を追加し、失敗時は 401 を返す。
  - クライアントは `onAuthStateChanged` 後に `getIdToken()` を取得し、`Authorization: Bearer <token>` を付与して API を呼び出す。
- Firebase 初期設定の手順化（フェーズ 1）
  - `docs/firebase_setup.md`（新規）にプロバイダ有効化・Authorized domains・Firestore ルールの例を記載する。
- Firestore ルールの更新（フェーズ 1）
  - `users/{uid}` への書き込みを認証済み本人に限定するルールを定義する。
- Mastra 実装（フェーズ 2）
  - 最小の Workflow（ペルソナ評価とマージ）を用意し、`USE_MASTRA=true` で実走できるようにする。
- ランタイム方針の明文化（フェーズ 2）
  - どの実行形態を正とするか（例: Vercel Functions）を `docs/architecture.md` で宣言し、代替のラッパーは最小限に留める。

---

## 受け入れ基準（Done をどう定義するか）

- ログイン後のみ API を利用でき、未ログインは 401 となる。
- 新規ユーザー（匿名を含む）でプロフィール作成・更新が安定して成功する。
- `.env` はリポジトリから無く、デプロイ環境のシークレットだけで本番・開発が回る。
- `USE_MASTRA=true` の構成で、最低限の Mastra Workflow が動作し、結果が一貫する。
- ドキュメントを読めば、セットアップ〜デプロイ〜障害時の切り戻しまで自走できる。

---

## リスクと緩和策

- 認可導入に伴う既存クライアントの呼び出し失敗
  - デプロイを二段階化し、先にクライアント側にトークン付与を実装。サーバの認可強制は後段で有効化します。
- Firebase ルール変更による想定外の拒否
  - 変更前にローカルエミュレータで検証し、最小権限の観点で段階導入します。
- Mastra 実装の学習コスト
  - まずは LLM 直呼びと同等の最小機能を置き換え、段階的に付加価値（監査性、再現性）を活かします。

---

## 次の一手（ここから着手）

1. 機密の除去と環境変数移行（Git から `.env` を外し、本番・開発のシークレットへ移管）。
2. 認可の骨組みを `api/index.ts` に追加（Firebase ID トークン検証）。
3. クライアントの API 呼び出しを ID トークンベースに変更。ここまでで「ログインが効いている」状態をまず確立します。
4. 並行して Firebase Console 設定と Firestore ルールを文書化・適用。
5. 余力で Mastra の最小 Workflow を用意し、切替で挙動確認。

---

必要に応じ、上記の各フェーズをチケット化し、短いスプリントで順に片付けます。どのランタイムを採用し、どの環境で検証するかまで含めて、開発チームと合意を取りながら進めましょう。

***

本文書の対象コード例：
- 認証: `src/services/auth.service.ts`, `src/contexts/AuthContext.tsx`, `src/components/auth/*`
- API: `api/index.ts`, `dev-server.ts`, `server.js`, `workers/src/index.ts`
- Mastra: `api/mastra.ts`
- 設定: `.env`, `.env.example`, `vite.config.ts`
