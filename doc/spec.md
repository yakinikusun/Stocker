# 在庫管理システム「Stocker（ストッカー）」統合技術仕様書

## 1. システム概要

本システムは、個人および特定家庭・小規模グループにおける冷蔵庫・冷凍庫・野菜室・パントリー等の在庫管理を簡略化・効率化するためのクラウド型在庫管理Webアプリケーション（PWA）です。

- **アプリ名**: Stocker（ストッカー）
- **対象ユーザー**: 完全招待制・家庭内複数ユーザー（管理者 / 一般メンバー）
- **主要アクセス機器**: スマホ（iOS / Android）および PC・タブレットブラウザ
- **基本理念**: **「家庭内・小規模環境でデプロイして運用する」** プライベート運用モデル。アカウントの発行・削除・全体制限は Supabase ダッシュボード (`Authentication -> Users`) にて一括集中管理し、Webアプリ側はスムーズなログイン・セッション保持・各自のアカウント設定に特化する。
- **設計方針**: セキュリティ（データ漏洩防止・改ざん防止・未認証遮断・国内限定Geo-blocking）を最優先にしつつ、日常の運用の手間を最小化する。

---

## 2. ディレクトリ構成

プロジェクト全体のディレクトリおよび主要ファイルの役割一覧です：

```
Stocker/
├── .env.example                # 環境変数テンプレート (Supabase URL/Key, 自動消去時間)
├── README.md                   # プロジェクト総合ガイド・セットアップ・運用手順
├── index.html                  # SPA エントリーポイント HTML (PWA メタタグ含む)
├── package.json                # 依存パッケージ定義 & npm scripts
├── tsconfig.json               # TypeScript コンパイラ設定
├── vite.config.ts              # Vite + PWA (vite-plugin-pwa) ビルド設定
├── doc/                        # 技術仕様書・ドキュメント群
│   ├── fix.md                  # 課題・修正対応チェックリスト
│   ├── function-spec.md        # 機能詳細定義書
│   ├── review.md               # コード詳細レビュー・品質評価報告書
│   ├── spec.md                 # 統合技術仕様書 (本ドキュメント)
│   └── stock-management-spec.md# 要件・構成仕様書
├── functions/                  # Cloudflare Pages Functions
│   └── _middleware.ts          # 日本国内限定アクセス制御 (Geo-blocking / cf-ipcountry ヘッダー検証)
├── public/                     # 静的公開アセット
│   ├── _routes.json            # Cloudflare Pages ルーティング定義 (Middleware vs CDN Cache)
│   ├── favicon.ico             # ファビコン
│   ├── apple-touch-icon.png    # iOS ホーム画面アプリアイコン (180x180)
│   ├── pwa-192x192.png         # PWA 192px アイコン
│   ├── pwa-512x512.png         # PWA 512px アイコン
│   ├── maskable-icon.png       # Android マスカブルアプリアイコン
│   ├── masked-icon.svg         # SVG ベクターアイコン
│   └── robots.txt              # クローラー制御設定 (全遮断)
├── src/                        # アプリケーションソースコード
│   ├── App.tsx                 # ルートコンポーネント (AuthGuard / タブナビゲーション / モーダル統括)
│   ├── main.tsx                # React 19 ルートエントリーレンダラー
│   ├── index.css               # グローバルスタイル (Tailwind CSS v4 + Glassmorphism UI)
│   ├── vite-env.d.ts           # Vite 環境変数型定義
│   ├── components/             # UI コンポーネント群
│   │   ├── AccountSettingsView.tsx # アカウント・パスワード変更・動作モード切替画面
│   │   ├── BarcodeScanner.tsx      # ZXing カメラバーコードスキャン & 4ソース候補選択モーダル
│   │   ├── FormModal.tsx           # 汎用フォームモーダルラッパー
│   │   ├── HistoryLog.tsx          # 操作履歴一覧・詳細検索・期間指定・多角ソート
│   │   ├── InventorySettingsView.tsx # 保管場所・タグ・プリセットマスタ管理画面
│   │   ├── LoginView.tsx           # ログイン画面 (全自動ロール判定 / 厳格認証)
│   │   ├── Navbar.tsx              # ヘッダーナビゲーション & モバイルボトムバー
│   │   ├── ProductCard.tsx         # 在庫商品カード (数量増減 / タップ編集)
│   │   ├── ProductEditModal.tsx    # 在庫商品編集モーダル (名前・場所・タグ・画像)
│   │   ├── ProductModal.tsx        # 在庫新規追加モーダル (自動補完 / 重複判定)
│   │   ├── ProductTableRow.tsx     # リスト表示用行コンポーネント
│   │   ├── StatCards.tsx           # 在庫統計サマリーカード
│   │   ├── StockAdjustModal.tsx    # 数量直接入力・加減算モーダル (小数対応)
│   │   └── StockList.tsx           # メイン在庫一覧 (タブ切替・検索・タグ絞り込み)
│   ├── constants/              # 定数定義
│   │   └── index.ts            # LocalStorage キー / デフォルト保管場所 / 自動消去時間取得
│   ├── context/                # React Context (グローバル状態管理)
│   │   ├── AuthContext.tsx     # 認証・セッション復元・プロファイル管理・厳格ログイン
│   │   └── StockContext.tsx    # 在庫・マスタ・履歴・Realtime同期・CRUD ハンドラー
│   ├── hooks/                  # カスタムフック
│   │   └── useStockFilter.ts   # 在庫一覧マルチタグ・キーワード・保管場所フィルタリング
│   ├── lib/                    # ユーティリティ・外部連携ライブラリ
│   │   ├── barcodeLookup.ts    # Open Food Facts API 連携 (デバウンス・重複ガード)
│   │   ├── mockData.ts         # オフライン / デモ用初期モックデータ
│   │   └── supabase.ts         # Supabase クライアント初期化 / Storage画像圧縮 / ローカル保存
│   └── types/                  # TypeScript 型定義
│       └── stock.ts            # Product, StockHistory, UserProfile, Location, Tag, Preset 型
└── supabase/                   # Supabase データベース定義
    └── schema.sql              # DDL / RLS / トリガー / Data API 権限 / Realtime パブリケーション
```

---

## 3. 実装スコープ ＆ ルール仕様

### 3.1 入力必須要件 ＆ 判定ルール
- **商品名のみ必須**: 在庫登録および編集において、必須入力項目は「商品名」のみです。
- **JANコードは完全任意**: バーコードを持たない生鮮食品や自家製品等のため、JANコードの入力は任意（空欄可）として扱います。ダミー文字列の自動付与は行いません。
- **メモ・備考欄（賞味期限・特記事項・検索連動）**:
  - 在庫商品（`products`）に任意のメモ欄（`memo`）を搭載。賞味期限、特記事項、開封状態などを自由に記録・編集可能（プリセットテンプレートには保持せず、個別の在庫インスタンスごとに管理）。
  - 在庫カード（`ProductCard`）および一覧行（`ProductTableRow`）にメモが表示され、メイン画面の検索バーによるキーワード検索対象にも自動連動。
- **二重登録判定（厳格3条件マッチング）**:
  - 在庫追加時、**「商品名」＋「保管場所」＋「JANコード（入力されている場合）」** の3条件が一致する場合のみ既存在庫と判定し、数量追加モードへと動的に切り替わります。
  - 既存在庫判定時（`isExistingMatch`）、画像およびタグ情報は変更不可の固定表示となり、タグはリードオンリーのバッジとして表示されます。
- **バイナリ在庫ステータス判定 ＆ 小数在庫・0直接入力対応**:
  - 在庫状態判定は「在庫あり (`current_stock > 0`)」および「在庫なし (`current_stock === 0`)」の二元管理を行います。
  - **小数在庫 ＆ 0直接入力対応**: `0` 個の直接入力、および `0.5` 個、`1.5` 個、`0.25` 個などの小数入力・加減算に完全対応（小数点以下2桁精度 `Math.round(val * 100) / 100`）。
- **非負クランプ**: 在庫数は 0 未満に減らす操作（マイナス在庫）を防止します (`Math.max(0, ...)`）。
- **保管場所の連動削除 ＆ 履歴自動記録**: 保管場所が削除された場合、該当する保管場所に所属するすべての在庫商品（`products`）も自動的に一括連動削除（カスケード削除）されます。その際、在庫数が0より大きかった商品については、減少分（マイナス数量）が自動的に履歴ログ（`stock_history`）へスナップショット記録されます。
- **マスターデータの全重複防止 ＆ 連動更新**: 保管場所および分類タグの新規追加・編集更新時、同名（ケースインセンシティブ）の重複登録を即時ブロック・アラート通知します。デフォルト初期保管場所は `['冷蔵庫', '冷凍庫', '野菜室']` です。また、保管場所名やタグ名が変更された場合、所属・設定されているすべての在庫商品データも一括連動更新されます。プリセットについては **「商品名」＋「JANコード」** の組み合わせの一致による重複判定を行います。
- **保管場所 ＆ タグの自由な並び替え（ドラッグ＆ドロップ ＆ カスタムソート順）**:
  - 保管場所マスタおよびタグマスタは、設定画面（`InventorySettingsView`）にて**直感的なドラッグ＆ドロップ（DnD）操作**で**ユーザーが自由な表示順に並び替え可能**。
  - 並び順（`sort_order`）は Supabase および LocalStorage に即時保存され、メイン画面の保管場所タブ、タグ絞り込みボタン、在庫追加・編集モーダルの選択肢に即座に反映。
- **在庫 ＆ プリセットの多角的ソート・検索機能**:
  - **在庫一覧 (`StockList`)**: 登録日時 (新着順/古い順)、更新日時 (更新が新しい順/古い順)、在庫数 (多い順/少ない順) の6通りで動的並び替えが可能。
  - **プリセット一覧 (`InventorySettingsView`)**: リアルタイム検索バー（名前・JAN・タグ）と並び替え機能（登録日時順/更新日時順/五十音順）を搭載。商品追加フォームのプリセット選択ドロップダウンも五十音順表示。
  - **タグ絞り込みドロップダウン左端見切れ防護**: `StockList` のタグ絞り込みメニューは `left-0 max-w-[calc(100vw-2rem)]` で配置され、ボタンが画面左端にある場合でもメニューが左外側へ溢れる事故を100%防止。
- **ヘッダースキャンボタン**: ヘッダーのメインアクションにカメラアイコン付き「スキャン」ボタンを配置し、タップでバーコードスキャナモーダルを起動可能。

### 3.2 アカウント・認証 ＆ 未認証アクセス遮断
- **アカウント集中発行・削除（Supabase Dashboard）**:
  - アカウントの新規作成、発行、権限割り当て、削除・停止は、管理者が **Supabase ダッシュボード (`Authentication -> Users`)** にて一括集中管理します。
- **ログイン時権限 (Role) の自動判定 ＆ 厳格認証境界**:
  - ログイン画面 (`LoginView`) ではユーザーに権限（管理者 / メンバー）を手動選択させず、ログインID ＋ パスワード入力時、データベース/セッションに登録されている権限属性（`role: 'admin' | 'member'`）を**全自動で判定して適用**します。
  - 存在しないユーザーや誤ったパスワードによるログインは即座に拒絶され、フォールスルーによる不正セッション生成を防止。
- **画面リロード・PWA再起動時のロール永続化**:
  - `getSession` および `onAuthStateChange` のセッション復元時、必ず `profiles` テーブルから最新の `role` / `name` を取得して適用。リロード時に管理者権限が一般メンバーに戻ってしまう現象を完全に防護。
- **ログイン直後の自動データ同期 ＆ Realtime 連動**:
  - ログイン完了と同時に `StockContext` の初期データ取得（`fetchAllData`）および Realtime チャンネルが認証済みセッションで即時確立され、画面リロードなしで最新データが全画面に反映されます。
- **メールアドレス非依存のログインID連携**:
  - Supabase Auth の仕様に合わせ、ログインID（例: `papa`）使用時にシステム内部で `papa@stocker.local` というダミーメールアドレスを全自動生成して認証。外部メール送信サービス（SMTP）不要でスムーズに動作します。
- **未ログイン保護（Route Guard）**:
  - 未認証時（`!user || !isAuthenticated`）はアプリのメインコンテンツ、ナビゲーション、各種モーダルを一切レンダリングせず、**全画面で `<LoginView />` のみを固定表示**して他ページへのアクセスを完全に遮断します。
- **各自のプロファイル ＆ パスワード変更**:
  - ログイン中の各ユーザーは「アカウント設定」画面から、自分自身の**お名前（表示名）**および**パスワード**を安全に変更できます (`supabase.auth.updateUser({ password })`, `profiles` テーブル更新)。
- **.env による接続固定・自動消去時間設定 ＆ 動作モード切替**:
  - 接続先および0件在庫自動消去時間は `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_ZERO_STOCK_CLEANUP_HOURS`) で設定可能。デフォルトは `24` 時間。LocalStorage キー接頭辞は `stocker_*` (`stocker_local_products` 等) で統一管理。「アカウント設定」画面にてワンタップで「Supabase クラウド接続モード」と「LocalStorage オフラインデモモード」を切替可能です。

### 3.3 バーコードスキャナ ＆ 候補一覧選択クッション UI
- **候補選択クッション確認ステップ**:
  - JANコードをカメラでスキャンまたは手入力検索した際、即座に登録フォームへ遷移せず、カメラストリームを安全に一時停止（`controlsRef.current.stop()`）してスキャン確認画面を表示します。
  - 検出された候補が一覧表示され、各カードの右側に配置された **「選択」** ボタンをタップすることで、希望の候補情報を適用して `ProductModal` へ遷移します。
- **マルチソース候補カード構造**:
  1. **既存在庫商品**: 登録済みの既存商品カード（商品名・保管場所・現在庫数）＋ **「選択」** ボタン。
  2. **登録済みプリセット**: 同一JANコードで登録されている再利用プリセットカード ＋ **「選択」** ボタン。
  3. **Open Food Facts 商品**: データベースより自動取得した商品名・画像カード ＋ **「選択」** ボタン。
  4. **新規商品手入力登録**: JANコードを保持したまま空欄で新規登録を行うカード ＋ **「選択」** ボタン。
- **カメラリソース解放 ＆ セッションクリーンアップ**:
  - モーダル閉鎖時・画面切り替え時に `IScannerControls.stop()` および `videoRef.current.pause()`、メディアストリームの全トラック切断を行い、ブラウザのカメラデバイスを完全にシャットダウン・解放します。

### 3.4 オープンフードファクツ (Open Food Facts) API バーコード自動補完
- **オープンデータベース自動取得**:
  - バーコードスキャンまたは手入力時（8桁以上）、自動的に Open Food Facts API (`https://world.openfoodfacts.org/api/v0/product/{janCode}.json`) を非同期検索します。
  - ヒット時、日本語商品名（`product_name_ja` / `product_name`）および正面画像URL（`image_front_url`）を取得し、候補カードおよびフォームへ自動読み込みします。
- **リバースガード ＆ デバウンス**:
  - 入力時の過剰な API リクエスト発生を防ぐため 400ms デバウンスを導入。
  - `lastFetchedJanRef` 同期ガードにより、同一JANコードに対する二重取得や再レンダリング時のチラつき通信ループを遮断します。

### 3.5 PC / スマホ ハイブリッド画像操作 UI ＆ クライアントサイド画像圧縮
- **PCホバー ＆ スマホタップ操作対応**:
  - すべての画像アップロード・プレビュー枠において、PCではホバー時に「変更」・「削除」ボタンが表示されます (`group-hover:opacity-100`)。
  - スマホ・タッチ端末では、画像枠をタップすることで「変更」・「削除」ボタンの表示/非表示がトグル切替されます。
- **クライアントサイド画像圧縮 (LocalStorage 容量溢れ防止)**:
  - Supabase Storage 非接続時・失敗時の DataURL フォールバックにおいて、`compressImageToDataURL` により画像を Canvas 描画で最大横幅 800px・JPEG 画質 0.75 に動的リサイズ＆圧縮してから保存。LocalStorage の 5MB 容量制限超過事故を防止します。

### 3.6 ログ ＆ 履歴追跡
- **100%確実な履歴記録 (スナップショット方式)**:
  - `stock_history` テーブルには操作時点の `product_name`（商品名）、`location`（保管場所）、`jan_code`（JANコードまたは空欄）、`user_name`（操作者名）、`user_email`（メール）をスナップショットとして直接保存。
  - 外部キー JOIN に依存せず `select('*')` で安全に読み込むため、商品やアカウントが削除された後や RLS 設定下でも、過去ログが欠損せず完全に閲覧可能。
- **連続操作の自動圧縮 ＆ 小数精度補正**:
  - 同一ユーザーによる同一商品・同一場所での 10 分以内の連続操作は、1つのログ行に「N回合算」として自動圧縮集計表示 (`op_count`)。
  - 浮動小数点数（IEEE 754）の演算誤差を `Math.round(val * 100) / 100` で補正し、`8.2` 等の正確ですっきりとした数値を表示。
- **高度なログ検索 ＆ 多角フィルタリング機能 (`HistoryLog`)**:
  - **開閉式フィルターパネル (`isAdvancedOpen`)**: 「絞り込み・並び替え」ボタンタップで詳細フィルターパネルをスマートに伸縮トグル表示（フィルター適用中 `hasActiveFilters` は自動展開）。
  - **期間指定 (日付フィルター)**: 開始日〜終了日の範囲指定（HTML5 `input[type="date"]`）およびクイック期間ボタン（「今日」「過去7日間」「今月」「全期間」）。
  - **操作種別絞り込み**: 「全ての操作」「追加のみ (+)」「消費のみ (-)」の即時切り替え。
  - **複数キーワード AND / OR 絞り込み**: スペース区切りの複数検索ワードに対し、全ワード一致（`AND`）とキーいずれか一致（`OR`）を切り替え可能。
  - **多角ソート機能**: 日時順 (新しい/古い順)、変動数量順 (大きい/小さい順)、商品名順 (五十音あ〜ん/ん〜あ) の6パターン並び替え。

### 3.7 Cloudflare Pages セキュリティ (Geo-blocking ＆ 最適化)
- **日本国内限定アクセス制御 (`functions/_middleware.ts`)**:
  - Cloudflare のエッジで `cf-ipcountry` ヘッダーを検証し、日本（`JP`）以外のアクセスを即時 `403 Forbidden` で完全遮断。
- **ルーティング最適化 (`public/_routes.json`)**:
  - すべてのページアクセス（`/*`）を Middleware の国判定に通しつつ、静的アセット（JS/CSS/画像/PWAマニフェスト）は `exclude` により Cloudflare CDN キャッシュから直接最速配信し、Functions 実行回数を節約。

---

## 4. アーキテクチャ

```
[クライアント端末 (iOS/Android / PC / PWA)]
        ↓ HTTPS (日本国内限定 Geo-blocking: Cloudflare Pages Functions)
[Cloudflare Edge / CDN & Middleware (_middleware.ts + _routes.json)]
        ↓ Vite SPA + Glassmorphism UI + Tailwind CSS v4 + React 19
[@supabase/supabase-js SDK / LocalStorage Fallback (stocker_*)]
        ↓ 認証済み JWT / RLS ポリシー
[Supabase Cloud (PostgreSQL Database)]
  ├─ Data API / PostgREST (Exposed schemas: public - REST/CRUD API エンドポイント)
  ├─ PostgreSQL (products, stock_history, locations, tags, presets, profiles)
  ├─ Storage (product-images バケット - クライアントサイドCanvas圧縮画像)
  ├─ Auth (Supabase Auth - ユーザー管理・JWT / stocker.local / 権限自動判定)
  └─ Realtime (複数端末間でのリアルタイム同期 - Publications `supabase_realtime`)
```

---

## 5. データモデル (テーブル定義)

### 5.1 `products`（商品マスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK (デフォルト: gen_random_uuid()) |
| jan_code | text | バーコード値（任意 / 空欄可） |
| name | text | 商品名（必須） |
| image_url | text | 画像URL（Supabase Storage または Base64 DataURL） |
| current_stock | numeric(10,2) | 現在数量 (>= 0, 小数可) |
| location | text | 保管場所（例: 冷蔵庫） |
| tags | text[] | 分類タグ配列 |
| created_at | timestamptz | 登録日時 (デフォルト: NOW()) |
| updated_at | timestamptz | 更新日時 (トリガー自動更新) |

### 5.2 `stock_history`（在庫操作履歴ログ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK (デフォルト: gen_random_uuid()) |
| product_id | uuid | FK → products (ON DELETE SET NULL) |
| user_id | uuid | FK → auth.users (ON DELETE SET NULL) |
| change_amount | numeric(10,2) | 増減数量 (+/-, 小数可) |
| product_name | text | 記録時点の商品名スナップショット |
| jan_code | text | 記録時点のJANコード |
| location | text | 記録時点の保管場所 |
| user_name | text | 記録時点の操作者名スナップショット |
| user_email | text | 記録時点の操作者メールスナップショット |
| created_at | timestamptz | 記録日時 (デフォルト: NOW()) |

### 5.3 `locations`, `tags`, `presets`, `profiles`
- `locations`: 保管場所マスタ (`id`, `name`, `sort_order`, `created_at`)
- `tags`: 分類タグマスタ (`id`, `name`, `sort_order`, `created_at`)
- `presets`: 再補充用汎用プリセット (`id`, `name`, `jan_code`, `image_url`, `tags`, `created_at`, `updated_at`)
- `profiles`: ユーザー権限プロファイル (`id` (FK→auth.users), `email`, `name`, `role` ('admin' | 'member'), `created_at`, `updated_at`)

---

## 6. ユーザー権限 ＆ 運用マトリクス

| 機能 | 一般ユーザー (`member`) | 管理者 (`admin`) | 管理方法 / 管理場所 |
|---|---|---|---|
| アカウントの新規作成・発行・削除 | ✕ | 〇 | **Supabase ダッシュボード (`Authentication -> Users`)** |
| ユーザーのロール（権限）変更 | ✕ | 〇 | **Supabase ダッシュボード (`Table Editor -> profiles`)** |
| 自身のお名前・パスワード変更 | 〇 | 〇 | Web アプリ (アカウント設定) |
| 在庫閲覧・マルチタグ検索・ソート | 〇 | 〇 | Web アプリ |
| 在庫追加・増減・編集・削除（履歴自動記録） | 〇 | 〇 | Web アプリ |
| 保管場所・タグ・プリセット追加・編集 | 〇 | 〇 | Web アプリ |
| 保管場所の削除 | ✕ | 〇 | Web アプリ |
| 動作モード切り替え (Supabase / LocalStorage) | 〇 | 〇 | Web アプリ (アカウント設定) |
