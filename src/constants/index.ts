// Storage Keys
export const STORAGE_KEYS = {
  SUPABASE_URL: 'freezer_supabase_url',
  SUPABASE_KEY: 'freezer_supabase_key',
  PRODUCTS: 'freezer_local_products',
  HISTORIES: 'freezer_local_histories',
  USER: 'freezer_local_user',
  LOCATIONS: 'freezer_local_locations',
  TAGS: 'freezer_local_tags',
  PRESETS: 'freezer_local_presets'
} as const;

// Common Inventory Reasons
export const STOCK_ADJUST_REASONS = [
  '入荷（買い物・補充）',
  '消費・調理使用',
  '賞味期限切れ・廃棄',
  '棚卸調整',
  'その他'
] as const;

// Default Fallback Storage Locations
export const DEFAULT_LOCATIONS = [
  '冷蔵庫',
  '冷凍庫',
  '野菜室',
  'パントリー',
  '調味料ラック'
] as const;
