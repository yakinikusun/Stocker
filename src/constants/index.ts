// Storage Keys
export const STORAGE_KEYS = {
  SUPABASE_URL: 'freezer_supabase_url',
  SUPABASE_KEY: 'freezer_supabase_key',
  FORCE_OFFLINE: 'freezer_force_offline',
  PRODUCTS: 'freezer_local_products',
  HISTORIES: 'freezer_local_histories',
  USER: 'freezer_local_user',
  LOCATIONS: 'freezer_local_locations',
  TAGS: 'freezer_local_tags',
  PRESETS: 'freezer_local_presets'
} as const;

// Default Fallback Storage Locations
export const DEFAULT_LOCATIONS = [
  '冷蔵庫',
  '冷凍庫',
  '野菜室',
  'パントリー',
  '調味料ラック'
] as const;

// Auto Cleanup Configuration (Default: 7 days)
export const DEFAULT_ZERO_STOCK_CLEANUP_HOURS = 168;

export const getZeroStockCleanupHours = (): number => {
  const envVal = import.meta.env.VITE_ZERO_STOCK_CLEANUP_HOURS;
  if (envVal) {
    const parsed = parseFloat(envVal);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_ZERO_STOCK_CLEANUP_HOURS;
};
