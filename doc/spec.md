# 冷蔵庫・在庫管理システム「Freezer」統合仕様書

## 1. システム概要

本システムは、個人および特定家庭・小規模グループにおける冷蔵庫・冷凍庫・野菜室・パントリー等の在庫管理を簡略化・効率化するためのクラウド型在庫管理Webアプリケーション（PWA）です。

- **アプリ名**: Freezer（フリーザー）
- **対象ユーザー**: 完全招待制・家庭内複数ユーザー（管理者 / 一般ユーザー）
- **主要アクセス機器**: スマホ（iOS / Android）および PC・タブレットブラウザ
- **設計方針**: セキュリティ（データ漏洩防止・改ざん防止）を最優先にしつつ、日常の運用の手間を最小化する。

### 対象および目的
- **目的**: 冷蔵庫・冷凍庫・野菜室、その他保管場所の在庫管理を簡略化・効率化するサービス。
- **対象**: 完全招待制により特定家族・グループのみが使用可能。主にスマホ・タブレット・PCでのアクセスを想定。
- **アカウントの種類**:
  - 管理者 (`admin`): マスタ編集/削除、保管場所削除、Supabase接続設定権限を保持。
  - 一般ユーザー (`member`): 在庫数量変更・追加・削除・マスタ閲覧/追加が可能。

---

## 2. スコープ

### 管理対象データ
1. **在庫状況 (`products`)**：商品ごとの現在数量、保管場所、タグ、商品画像
2. **履歴 (`stock_history`)**：在庫の増減操作ログ（誰が・いつ・何を・どの場所で・どれだけ変更したか）
3. **ユーザー認証情報 (`auth.users` / `profiles`)**：アカウント・権限（接続判定・削除権限）
4. **マスタ設定データ (`locations`, `tags`, `presets`)**：保管場所、分類タグ、再補充用プリセット（編集・削除対応）

### 実装機能一覧 (Fix反映済み)
- 在庫の一覧表示・追加・数量変更・削除（一般ユーザー含む全ユーザー対応、削除前に在庫0ログ自動記録）
- 保管場所・分類タグ・在庫プリセットの編集機能（インライン / モーダル編集）
- プリセットからの個数指定追加（既存商品がある場合は自動的に数量加算）
- 同一JANコード・同名商品の追加時に既存在庫数を自動加算する重複防止
- 24時間以上在庫0の商品の自動クリーンアップ機能
- タグ検索の複数選択・複数絞り込み（マルチタグフィルター）
- Supabase クラウド接続設定の管理者 (`admin`) 限定権限化
- 保管場所削除の管理者 (`admin`) 限定権限化
- 画像ファイルアップロード（ドラッグ＆ドロップ / 画像プレビュー / Supabase Storage保存）
- 使われなくなった画像の自動削除（参照カウントチェックによるクリーンアップ）
- 操作履歴の記録・閲覧（改ざん不可な追記専用ログ、連続操作の自動圧縮表示）
- バーコードスキャンによる商品の特定・在庫更新（Webカメラ + ZXing）
- PWA化（ホーム画面追加、アプリライクなUI）
- DevContainer（Docker開発環境対応）

---

## 3. アーキテクチャ ＆ 採用理由

```
[スマホ (iOS/Android) / PC ブラウザ / PWA]
        ↓ HTTPS (Cloudflare Pages ホスティング想定)
[Vite + React 19 + TypeScript (SPA)]
        ↓ @supabase/supabase-js SDK / LocalStorage Fallback
[Supabase Backend]
  ├─ PostgreSQL（在庫・履歴・ユーザー・マスタデータ）
  ├─ Storage (product-images バケット - 商品画像ファイル保存)
  ├─ Auth（セッション管理）
  ├─ Row Level Security（アクセス制御 ＆ 改ざん防止）
  ├─ Realtime（複数人での同時利用時のリアルタイム反映）
  └─ Edge Functions（カスタムロジックが必要な場合のみ）
```

---

## 4. データモデル (テーブル ＆ ストレージ構造)

### 4.1 `locations`（保管場所マスタ - 管理者のみ削除可能）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| name | text | 保管場所名（例: 冷蔵庫、冷凍庫、野菜室、パントリー） |
| created_at | timestamptz | 作成日時 |

### 4.2 `tags`（分類タグマスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| name | text | タグ名（例: 飲料、調味料、乳製品、冷凍食品、生鮮食品） |
| color | text | カラーコード |
| created_at | timestamptz | 作成日時 |

### 4.3 `presets`（在庫プリセットマスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| jan_code | text | バーコード値（任意） |
| name | text | 商品名 |
| image_url | text | 画像URL（Supabase StorageまたはBase64） |
| location | text | 初期保管場所 |
| tags | text[] | タグ配列 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.4 `products`（商品マスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| jan_code | text | バーコード値（UNIQUE） |
| name | text | 商品名 |
| image_url | text | 画像URL（Supabase StorageまたはBase64） |
| current_stock | integer | 現在数量 (>= 0) |
| location | text | 保管場所（例: 冷蔵庫） |
| tags | text[] | タグ配列 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.5 `stock_history`（操作履歴ログ・追記専用・連続操作自動圧縮対応）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → products |
| user_id | uuid | FK → auth.users |
| change_amount | integer | 増減値 (+/-) |
| created_at | timestamptz | 記録日時 |

---

## 5. 画面構成および権限仕様

### 権限マトリクス
| 機能 | 一般ユーザー (`member`) | 管理者 (`admin`) |
|---|---|---|
| 在庫閲覧・検索・マルチタグ絞り込み | 〇 | 〇 |
| 在庫追加・増減・削除（0ログ自動記録） | 〇 | 〇 |
| 保管場所・タグ・プリセット追加・編集 | 〇 | 〇 |
| 保管場所の削除 | ✕ | 〇 |
| Supabase クラウド接続設定変更 | ✕ | 〇 |
