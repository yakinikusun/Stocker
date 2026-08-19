-- ===============================================================
-- 在庫管理システム Stocker - Supabase SQL Schema (DDL + RLS Policies + Storage + Realtime + Data API)
-- ===============================================================

-- 1. 保管場所マスタ (locations)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期保管場所データ
INSERT INTO public.locations (name, sort_order) VALUES
  ('冷蔵庫', 0),
  ('冷凍庫', 1),
  ('野菜室', 2)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 2. タグマスタ (tags)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期タグデータ
INSERT INTO public.tags (name, sort_order) VALUES
  ('飲料', 0),
  ('冷凍食品', 1),
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 3. 在庫プリセットマスタ (presets) - 在庫切れ後の再呼び出し用 (保管場所非紐付け)
CREATE TABLE IF NOT EXISTS public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jan_code TEXT,
  name TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 在庫マスタ (products)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jan_code TEXT,
  name TEXT NOT NULL,
  image_url TEXT,
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  location TEXT NOT NULL DEFAULT '冷蔵庫',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_jan_code ON public.products(jan_code);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);

-- 5. ユーザープロフィール (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 在庫操作履歴 (stock_history) - 追記専用ログ (在庫名・場所・JANスナップショット保持)
CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_amount NUMERIC(10, 2) NOT NULL,
  product_name TEXT,
  jan_code TEXT,
  location TEXT,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON public.stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON public.stock_history(created_at DESC);

-- ===============================================================
-- Supabase Storage バケット設定 (在庫画像アップロード用)
-- ===============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS ポリシー
CREATE POLICY "authenticated_upload_product_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "authenticated_update_product_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "authenticated_delete_product_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- ===============================================================
-- トリガー機能 (updated_at の自動更新)
-- ===============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_presets_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- 新規ユーザー登録時の自動 profile 作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===============================================================
-- Row Level Security (RLS) ポリシー
-- ===============================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_locations" ON public.locations FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all_tags" ON public.tags FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all_presets" ON public.presets FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_select_products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_products" ON public.products FOR DELETE TO authenticated USING (true);

-- ユーザープロファイル (全認証ユーザーが閲覧可能、自身のプロファイルのみ更新可能)
CREATE POLICY "authenticated_select_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_update_profiles" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 履歴ログ（追記専用、UPDATE/DELETE不可）
CREATE POLICY "authenticated_select_history" ON public.stock_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_history" ON public.stock_history FOR INSERT TO authenticated WITH CHECK (true);

-- ===============================================================
-- Data API / PostgREST 権限設定 (最新 Supabase 仕様対応)
-- ===============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ===============================================================
-- Realtime (リアルタイム同期) 自動有効化設定
-- ===============================================================
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.stock_history REPLICA IDENTITY FULL;
ALTER TABLE public.locations REPLICA IDENTITY FULL;
ALTER TABLE public.tags REPLICA IDENTITY FULL;
ALTER TABLE public.presets REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
DECLARE
  t record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR t IN
      SELECT c.relname, n.nspname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('products', 'stock_history', 'locations', 'tags', 'presets', 'profiles')
        AND c.relkind = 'r'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_publication_rel pr
          JOIN pg_publication p ON p.oid = pr.prpubid
          WHERE p.pubname = 'supabase_realtime'
            AND pr.prrelid = c.oid
        )
    LOOP
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I', t.nspname, t.relname);
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;
    END LOOP;
  END IF;
END $$;
