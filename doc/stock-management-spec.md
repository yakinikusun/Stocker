# 在庫管理システム 仕様書

## 1. 概要

個人〜小規模グループ用の在庫管理システム。保管場所は1か所、複数人で共有利用。
外出先（自宅ネットワーク外）からもスマホ（iOS/Android）でアクセスできること。

**最重要方針：セキュリティ（データ漏洩防止）を最優先に、運用の手間を最小化する。**
自前サーバー・VPN・独自バックエンドは持たず、マネージドサービスの標準機能（認証・DB・HTTPS）
にできる限り委譲する構成とする。

## 2. スコープ

### 管理対象データ（3種類のみ）
1. **在庫状況**：商品ごとの現在数量
2. **履歴**：在庫の増減操作ログ（誰が・いつ・何を・どれだけ変更したか）
3. **ユーザー認証情報**：アカウント・権限（「接続に値するか」の判定に使用）

### MVPに含む機能
- 在庫の一覧表示・追加・数量変更
- 操作履歴の記録・閲覧（改ざん不可な追記専用ログ）
- ユーザー認証・ログイン（複数ユーザー、権限管理）
- バーコードスキャンによる商品の特定・在庫更新
- PWA化（ホーム画面追加、アプリライクなUI）

### MVPに含まない機能（将来検討・後付け前提で設計）
- 画像認識による商品判定（優先度低、バーコードで代替できない商品のみの補助機能として将来検討）
- 自動発注・原価計算などの複雑なビジネスロジック（現時点で要件なし）

## 3. アーキテクチャ

```
[スマホ (iOS/Android) ブラウザ / PWA]
        ↓ HTTPS（自動、証明書管理不要）
[Cloudflare Pages: フロントエンド (React SPA)]
        ↓ supabase-js SDK 経由で直接呼び出し
[Supabase]
  ├─ PostgreSQL（在庫・履歴・ユーザーデータ）
  ├─ Auth（ログイン・セッション管理）
  ├─ Row Level Security（アクセス制御）
  ├─ Realtime（複数人での同時利用時のリアルタイム反映）
  └─ Edge Functions（カスタムロジックが必要な場合のみ）
```

### 採用理由・決定事項
- **独自バックエンドサーバーは作らない**：SupabaseがDB・認証・APIを兼ねるため、
  フロントから直接Supabaseを呼び出すだけで大半のCRUD操作が完結する。
- **VPN（Tailscale等）は使わない**：Cloudflare Pages + Supabaseはどちらも公開HTTPSエンドポイントを
  持つため、VPN経由でなくても安全にアクセスできる。認証とRow Level Securityでアクセス制御する。
- **KVではなくPostgreSQL（Supabase）を使う**：在庫数量は正確性が重要なデータのため、
  結果整合性のあるKVストアではなく、ACID特性を持つリレーショナルDBを採用。
- **クレジットカード登録不要**：Cloudflare Pages・Supabaseともに無料枠はGitHubアカウント等での
  サインアップのみで利用可能。
- **SSR/Next.jsは不要**：社内ツール的性質でSEO要件がないため、Vite + React の SPA構成とする。

## 4. 技術スタック

### フロントエンド
| 用途 | 採用ライブラリ |
|---|---|
| フレームワーク | React + TypeScript + Vite |
| UIコンポーネント | shadcn/ui + Tailwind CSS |
| データ取得・キャッシュ | TanStack Query |
| フォーム・バリデーション | React Hook Form + Zod |
| ルーティング | React Router |
| PWA化 | vite-plugin-pwa |
| バーコードスキャン | @zxing/browser（getUserMedia + ZXingデコード） |

### バックエンド／インフラ
| 用途 | 採用サービス |
|---|---|
| ホスティング（フロント） | Cloudflare Pages |
| DB・認証・API | Supabase（PostgreSQL / Auth / RLS / Realtime / Edge Functions） |

## 5. データモデル（想定テーブル）

### `locations`（保管場所）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| name | text | 保管場所名 |

### `presets`（商品プリセット）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| jan_code | text | バーコード値、unique |
| name | text | 商品名 |
| image_url | text | 任意 |
| created_at | timestamptz | |
| updated_at | timestamptz | |


### `products`（商品マスタ）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| jan_code | text | バーコード値、unique |
| name | text | 商品名 |
| image_url | text | 任意 |
| current_stock | integer | 現在数量 |
| location | text | 保管場所 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `stock_history`（履歴、追記専用・UPDATE/DELETE禁止）
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → products |
| user_id | uuid | FK → auth.users（Supabase Auth標準テーブル） |
| change_amount | integer | 増減値（+/-） |
| reason | text | 任意（例：入荷、出荷、棚卸修正） |
| created_at | timestamptz | |

### `auth.users`（Supabase標準）
Supabase Authが自動管理。追加の権限情報が必要な場合は `profiles` テーブルを
`user_id` で1:1紐付けし、role（例：admin / member）などを持たせる。

## 6. セキュリティ要件

- パスワードはSupabase Auth標準機能によりハッシュ化・管理（自前実装しない）
- Row Level Security（RLS）で、ログインユーザーのみ読み書き可能に設定。
  role列がある場合は、role に応じた読み書き制限（例：member は自分の履歴のみ閲覧可、
  adminは全履歴閲覧可）をポリシーとして定義する
- `stock_history` テーブルはUPDATE/DELETEを許可しないRLSポリシーを設定（改ざん防止）
- 通信は全てHTTPS（Cloudflare Pages / Supabaseともに標準対応）
- カメラ（バーコードスキャン）はHTTPS環境でのみ動作するため、上記構成であれば
  追加対応不要

## 7. 将来拡張の余地（設計時に考慮）

- 商品情報の自動補完：バーコード読み取り時、外部の商品検索API
  （楽天商品検索API等）と連携して商品名・画像を自動取得する拡張が可能。
  Supabase Edge Functions経由で実装想定。
- 画像認識による商品判定：将来必要になった場合、Edge Functionsから外部の
  画像認識APIを呼び出す形で後付け可能。既存構成を崩さずに追加できる設計とする。

## 8. 非スコープ・明示的に採用しない技術

- Tailscale / WireGuard 等のVPN
- 独自VPS（Oracle Cloud等）でのセルフホスト
- Next.js（SSR不要のため）
- Cloudflare KV（在庫数量の整合性要件を満たさないため）
- ネイティブアプリ（iOS/Android別開発）：PWAで代替
