// Storage Keys
export const STORAGE_KEYS = {
  SUPABASE_URL: 'stocker_supabase_url',
  SUPABASE_KEY: 'stocker_supabase_key',
  FORCE_OFFLINE: 'stocker_force_offline',
  PRODUCTS: 'stocker_local_products',
  HISTORIES: 'stocker_local_histories',
  USER: 'stocker_local_user',
  LOCATIONS: 'stocker_local_locations',
  TAGS: 'stocker_local_tags',
  PRESETS: 'stocker_local_presets'
} as const;

// Default Fallback Storage Locations
export const DEFAULT_LOCATIONS = [
  '冷蔵庫',
  '冷凍庫',
  '野菜室'
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
