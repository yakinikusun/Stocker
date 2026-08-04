# 冷蔵庫・在庫管理システム「Freezer」統合技術仕様書

## 1. システム概要

本システムは、個人および特定家庭・小規模グループにおける冷蔵庫・冷凍庫・野菜室・パントリー等の在庫管理を簡略化・効率化するためのクラウド型在庫管理Webアプリケーション（PWA）です。

- **アプリ名**: Freezer（フリーザー）
- **対象ユーザー**: 完全招待制・家庭内複数ユーザー（管理者 / 一般ユーザー）
- **主要アクセス機器**: スマホ（iOS / Android）および PC・タブレットブラウザ
- **設計方針**: セキュリティ（データ漏洩防止・改ざん防止）を最優先にしつつ、日常の運用の手間を最小化する。

---

## 2. 実装スコープ ＆ ルール仕様

### 2.1 入力必須要件 ＆ 判定ルール
- **商品名のみ必須**: 在庫登録および編集において、必須入力項目は「商品名」のみです。
- **JANコードは完全任意**: バーコードを持たない生鮮食品や自家製品等のため、JANコードの入力は任意（空欄可）として扱います。ダミー文字列の自動付与は行いません。
- **二重登録判定（厳格3条件マッチング）**:
  - 在庫追加時、**「商品名」＋「保管場所」＋「JANコード（入力されている場合）」** の3条件が一致する場合のみ既存在庫と判定し、数量追加モードへと動的に切り替わります。
  - 既存在庫判定時（`isExistingMatch`）、画像およびタグ情報は変更不可の固定表示となり、タグはリードオンリーのバッジとして表示されます。
- **バイナリ在庫ステータス判定**:
  - 在庫状態判定は「在庫あり (`current_stock > 0`)」および「在庫なし (`current_stock === 0`)」の二元管理のみ行います。
- **非負クランプ**: 在庫数は 0 未満に減らす操作（マイナス在庫）を防止します。
- **ヘッダースキャンボタン**: ヘッダーのメインアクションにカメラアイコン付き「スキャン」ボタンを配置し、タップでバーコードスキャナモーダルを起動可能。

### 2.2 バーコードスキャナ ＆ 候補一覧選択クッション UI
- **候補選択クッション確認ステップ**:
  - JANコードをカメラでスキャンまたは手入力検索した際、即座に登録フォームへ遷移せず、カメラストリームを安全に一時停止（`controlsRef.current.stop()`）してスキャン確認画面を表示します。
  - 検出された候補が一覧表示され、各カードの右側に配置された **「選択」** ボタンをタップすることで、希望の候補情報を適用して `ProductModal` へ遷移します。
- **マルチソース候補カード構造**:
  1. **既存在庫商品**: 登録済みの既存商品カード（商品名・保管場所・現在庫数）＋ **「選択」** ボタン。
  2. **Open Food Facts 商品**: データベースより自動取得した商品名・画像カード ＋ **「選択」** ボタン。既存在庫がある場合でも常にOpen Food Factsの候補も並べて表示。
  3. **新規商品手入力登録**: JANコードを保持したまま空欄で新規登録を行うカード ＋ **「選択」** ボタン。
  *（※JANスキャン連携ワークフローにおいてプリセット候補は除外）*
- **候補データ引継ぎ (`InitialProductData`)**:
  - タップされた候補の `name`, `location`, `tags`, `imageUrl` を `onOpenAddModalWithJan(janCode, candidateData)` 経由で `ProductModal` へ渡すことで、複数一致時にも常にユーザーが選択した通りの正確な候補データがフォームに初期表示されます。
- **カメラリソース解放 ＆ セッションクリーンアップ**:
  - モーダル閉鎖時・画面切り替え時に `IScannerControls.stop()` および `videoRef.current.pause()`、メディアストリームの全トラック切断を行い、ブラウザのカメラデバイスを完全にシャットダウン・解放します。

### 2.3 オープンフードファクツ (Open Food Facts) API バーコード自動補完
- **オープンデータベース自動取得**:
  - バーコードスキャンまたは手入力時（8桁以上）、自動的に Open Food Facts API (`https://world.openfoodfacts.org/api/v0/product/{janCode}.json`) を非同期検索します。
  - ヒット時、日本語商品名（`product_name_ja` / `product_name`）および正面画像URL（`image_front_url`）を取得し、候補カードおよびフォームへ自動読み込みします。
- **リバースガード ＆ デバウンス**:
  - 入力時の過剰な API リクエスト発生を防ぐため 400ms デバウンスを導入。
  - `lastFetchedJanRef` 同期ガードにより、同一JANコードに対する二重取得や再レンダリング時の「商品を検索中...」チラつき・無駄な通信ループを100%遮断します。

### 2.4 PC / スマホ ハイブリッド画像操作 UI
- **PCホバー ＆ スマホタップ操作対応**:
  - すべての画像アップロード・プレビュー枠（在庫追加、在庫編集、プリセット追加、プリセット編集）において、PCではホバー時に「変更」・「削除」ボタンが表示されます (`group-hover:opacity-100`)。
  - スマホ・タッチ端末では、画像枠をタップすることで「変更」・「削除」ボタンの表示/非表示がトグル切替されます。
  - 非表示状態では `pointer-events-none` により、見えないボタンがタップされる事故を完全に防止します。

### 2.5 モーダル操作 ＆ ドラッグクローズ防護
- **バックドロップ・ドラッグクローズ保護**:
  - モーダル内側で押し込んだまま外側暗転背景でマウスを放した際の誤クローズを防ぐため、`onMouseDown` と `onClick` の両方で `e.target === e.currentTarget` を検証する `mouseDownOnBackdropRef` ガードを実装。
- **カーソルスタイル維持**:
  - バックドロップのカーソルはデフォルト矢印カーソルを維持。

### 2.6 ログ ＆ 履歴追跡
- **100%確実な履歴記録 (スナップショット方式)**:
  - `stock_history` テーブルには操作時点の `product_name`（商品名）、`location`（保管場所）、`jan_code`（JANコードまたは空欄）をスナップショットとして保存。
  - 商品が削除された後やJANコードが存在しない商品でも、過去ログの表示が崩れず完全に閲覧可能。
- **連続操作の自動圧縮**:
  - 同一ユーザーによる同一商品・同一場所での 10 分以内の連続操作は、1つのログ行に「N回合算」として自動圧縮集計表示。

---

## 3. アーキテクチャ

```
[スマホ (iOS/Android) / PC ブラウザ / PWA]
        ↓ HTTPS (Vite + React 19 + TypeScript)
[Vite SPA + Tailwind CSS v4 + Glassmorphism Design System]
        ↓ @supabase/supabase-js SDK / LocalStorage Fallback
[Supabase Cloud / PostgreSQL Database]
  ├─ PostgreSQL (products, stock_history, locations, tags, presets, profiles)
  ├─ Storage (product-images バケット - 商品画像アップロード)
  ├─ Auth (JWT / Role ベースアクセス制御)
  └─ Realtime (複数端末間でのリアルタイム同期)
```

---

## 4. データモデル (テーブル定義)

### 4.1 `products`（商品マスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| jan_code | text | バーコード値（任意 / 空欄可） |
| name | text | 商品名（必須） |
| image_url | text | 画像URL（Supabase Storage または Base64） |
| current_stock | integer | 現在数量 (>= 0) |
| location | text | 保管場所（例: 冷蔵庫） |
| tags | text[] | 分類タグ配列 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.2 `stock_history`（在庫操作履歴ログ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → products (ON DELETE SET NULL) |
| user_id | uuid | FK → auth.users (ON DELETE SET NULL) |
| change_amount | integer | 増減数量 (+/-) |
| product_name | text | 記録時点の商品名スナップショット |
| jan_code | text | 記録時点のJANコード |
| location | text | 記録時点の保管場所 |
| created_at | timestamptz | 記録日時 |

### 4.3 `locations`, `tags`, `presets`, `profiles`
- `locations`: 保管場所マスタ (`id`, `name`)
- `tags`: 分類タグマスタ (`id`, `name`, `color`)
- `presets`: 再補充用汎用プリセット (`id`, `name`, `jan_code`, `image_url`, `tags`)
- `profiles`: ユーザー権限プロファイル (`id`, `email`, `name`, `role`)

---

## 5. ユーザー権限マトリクス

| 機能 | 一般ユーザー (`member`) | 管理者 (`admin`) |
|---|---|---|
| 在庫閲覧・マルチタグ検索・ソート | 〇 | 〇 |
| 在庫追加・増減・編集・削除（履歴自動記録） | 〇 | 〇 |
| 保管場所・タグ・プリセット追加・編集 | 〇 | 〇 |
| 保管場所の削除 | ✕ | 〇 |
| Supabase クラウド接続設定の変更 | ✕ | 〇 |
