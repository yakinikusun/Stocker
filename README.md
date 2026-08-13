# 📦 Stocker（ストッカー）

**個人・家庭向けクラウド在庫管理 PWA (Progressive Web App)**

`Stocker` は、冷蔵庫・冷凍庫・野菜室・パントリー・調味料ラック等の在庫管理をシンプルかつ安全・高速に行うための Web アプリケーションです。スマホ（iOS / Android）および PC ブラウザから直感的に操作できます。

---

## ✨ 主要機能

- 🥛 **在庫管理 (リアルタイムCRUD)**
  - 在庫の追加・数量変更・削除。
  - **小数在庫 ＆ 0直接入力対応**: `0.5` 個、`1.5` 個などの小数管理、および `0` の直接入力に完全対応。
  - 保管場所（冷蔵庫、冷凍庫、野菜室等）ごとの表示切り替え。

- 🔍 **バーコードスキャン ＆ 4ソース候補クッション確認**
  - カメラによるJANコード自動読み取り（ZXing）および手入力検索。
  - **Open Food Facts API 連携**: JANコードから日本語商品名および画像を自動取得・補完（400ms デバウンス＆同期ガード）。
  - **マルチソース候補確認ステップ**:
    1. 既存在庫商品（数量追加モード）
    2. 登録済みプリセット
    3. Open Food Facts 取得品
    4. 新規商品手入力登録

- 🏷️ **マスターデータ管理 (保管場所・タグ・プリセット)**
  - 保管場所・分類タグ・汎用再利用プリセットの管理。
  - **連動カスケード機能**: 保管場所削除時の在庫一括整理 ＆ 履歴スナップショット自動記録、名前変更時のアトミック一括更新。

- 📜 **操作履歴追跡 ＆ 高度なログ検索 (`HistoryLog`)**
  - 誰が・いつ・何を・どれだけ変更したかを記録（改ざん防止追記専用ログ）。
  - **10分間連続操作の自動合算** (`op_count`)。
  - **高度な検索・フィルタリング**:
    - 開閉式詳細フィルターパネル (`isAdvancedOpen`)
    - 期間指定 (日付ピッカー ＆ 「今日」「7日間」「今月」「全期間」ボタン)
    - 操作種別絞り込み (全ての操作 / 追加のみ (+) / 消費のみ (-))
    - 複数キーワード AND / OR 検索 (スペース区切り)
    - 6パターン多角ソート (日時順 / 変動量順 / 五十音順)

- 🔒 **認証 ＆ 権限管理 (プライベート運用モデル)**
  - 管理者 (`admin`) / 一般メンバー (`member`) のロール全自動判定ログイン。
  - Supabase ダッシュボード (`Authentication -> Users`) でのアカウント一括集中発行・削除。
  - 未認証アクセスの全画面即時遮断 (Route Guard)。

- 📱 **PWA ＆ デュアル動作モード**
  - PWA (Progressive Web App) 対応（ホーム画面追加、スタンドアロン動作）。
  - 「Supabase クラウドモード」と「LocalStorage オフラインデモモード」のワンタップ切替。
  - LocalStorage フォールバック時の Canvas クライアントサイド画像自動圧縮 (800px / JPEG 75%)。

---

## 🛠️ 技術スタック

| 分野 | 採用技術・ライブラリ |
|---|---|
| **フロントエンド** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **アイコン / UI** | Lucide React + Glassmorphism Design System |
| **バーコード解析** | `@zxing/browser` |
| **バックエンド / DB** | Supabase (PostgreSQL / Auth / Storage / Realtime / RLS) |
| **PWA** | `vite-plugin-pwa` |

---

## 🚀 クイックスタート (ローカル開発)

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/yakinikusun/Freezer.git
cd Freezer
npm install
```

### 2. 環境変数の設定 (`.env`)

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

`.env` 内にお使いの Supabase URL、Anon Key、および 0件在庫の自動消去時間を設定します：

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key
VITE_ZERO_STOCK_CLEANUP_HOURS=24
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスして動作を確認します。

---

## 🗄️ データベースのセットアップ (Supabase)

Supabase ダッシュボードの **SQL Editor** にて、[`supabase/schema.sql`](file:///home/yakinikusun/tmp/Freezer/supabase/schema.sql) の内容を実行します。

このスクリプトにより以下が自動生成されます：
- テーブル構築 (`products`, `stock_history`, `locations`, `tags`, `presets`, `profiles`)
- Row Level Security (RLS) ポリシーおよびアクセス権限
- Storage バケット (`product-images`) およびアップロード権限
- トリガー関数 (`updated_at` 自動更新、`handle_new_user` 自動プロファイル作成)

---

## 📖 関連ドキュメント 

詳細な技術仕様やコードレビュー報告書は `doc/` ディレクトリ配下に格納されています。

- 📘 [統合技術仕様書 (`doc/spec.md`)](file:///home/yakinikusun/tmp/Freezer/doc/spec.md)
- 📗 [Stocker 要件・構成仕様書 (`doc/stock-management-spec.md`)](file:///home/yakinikusun/tmp/Freezer/doc/stock-management-spec.md)
- 📕 [コード詳細レビュー評価報告書 (`doc/review.md`)](file:///home/yakinikusun/tmp/Freezer/doc/review.md)
