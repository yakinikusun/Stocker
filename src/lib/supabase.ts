import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, StockHistory, UserProfile, Location, Tag, Preset } from '../types/stock';
import { STORAGE_KEYS } from '../constants';
import {
  INITIAL_PRODUCTS,
  INITIAL_HISTORIES,
  MOCK_USERS,
  INITIAL_LOCATIONS,
  INITIAL_TAGS,
  INITIAL_PRESETS
} from './mockData';

export function getStoredSupabaseConfig() {
  const isForceOffline = localStorage.getItem(STORAGE_KEYS.FORCE_OFFLINE) === 'true';
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || import.meta.env.VITE_SUPABASE_KEY || '';
  const isConfigured = !isForceOffline && Boolean(url && anonKey);
  return { url, anonKey, isConfigured, isForceOffline };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, anonKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  }
}

export function setForceOffline(offline: boolean) {
  if (offline) {
    localStorage.setItem(STORAGE_KEYS.FORCE_OFFLINE, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.FORCE_OFFLINE);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey);
  }
  return supabaseInstance;
}

// -------------------------------------------------------------
// Image Upload & Garbage Collection Cleanup Service
// -------------------------------------------------------------

export async function uploadProductImage(file: File): Promise<string> {
  const client = getSupabaseClient();

  if (client && getStoredSupabaseConfig().isConfigured) {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.warn('Supabase storage upload error, falling back to compressed base64:', uploadError);
      return compressImageToDataURL(file);
    }

    const { data: publicUrlData } = client.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  return compressImageToDataURL(file);
}

/**
 * Client-side Canvas image resizing & compression to prevent LocalStorage quota overflow
 */
export function compressImageToDataURL(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string || '');
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Extract storage relative object path from public URL
 */
export function extractStoragePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Delete image file from Supabase Storage if it's no longer used by any product or preset.
 */
export async function deleteImageIfOrphaned(
  imageUrl: string | null | undefined,
  products: Product[],
  presets: Preset[]
): Promise<boolean> {
  const filePath = extractStoragePath(imageUrl);
  if (!filePath) return false;

  // Check if any other product or preset still references this image
  const isUsedInProducts = products.some((p) => p.image_url === imageUrl);
  const isUsedInPresets = presets.some((pst) => pst.image_url === imageUrl);

  if (!isUsedInProducts && !isUsedInPresets) {
    const client = getSupabaseClient();
    if (client && getStoredSupabaseConfig().isConfigured) {
      const { error } = await client.storage.from('product-images').remove([filePath]);
      if (error) {
        console.warn('Failed to delete orphaned storage file:', error);
      } else {
        console.log('Successfully deleted unused image from storage:', filePath);
        return true;
      }
    }
  }
  return false;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Helper to safely load array from LocalStorage
function loadFromStorage<T>(key: string, defaultData: T[]): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

// -------------------------------------------------------------
// Storage Services (LocalStorage Fallback)
// -------------------------------------------------------------

export const loadLocalLocations = (): Location[] =>
  loadFromStorage(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);

export const saveLocalLocations = (items: Location[]) =>
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(items));

export const loadLocalTags = (): Tag[] =>
  loadFromStorage(STORAGE_KEYS.TAGS, INITIAL_TAGS);

export const saveLocalTags = (items: Tag[]) =>
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(items));

export const loadLocalPresets = (): Preset[] =>
  loadFromStorage(STORAGE_KEYS.PRESETS, INITIAL_PRESETS);

export const saveLocalPresets = (items: Preset[]) =>
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(items));

export const loadLocalProducts = (): Product[] =>
  loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

export const saveLocalProducts = (products: Product[]) =>
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

export const loadLocalHistories = (): StockHistory[] =>
  loadFromStorage(STORAGE_KEYS.HISTORIES, INITIAL_HISTORIES);

export const saveLocalHistories = (histories: StockHistory[]) =>
  localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(histories));

export const loadLocalUser = (): UserProfile | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    } catch { /* ignore */ }
  }
  return null;
};

export const saveLocalUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const loadFamilyAccounts = (): UserProfile[] => {
  return loadFromStorage('stocker_family_users', MOCK_USERS);
};

export const saveFamilyAccounts = (users: UserProfile[]) => {
  localStorage.setItem('stocker_family_users', JSON.stringify(users));
};

export const resetLocalData = () => {
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(INITIAL_LOCATIONS));
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(INITIAL_TAGS));
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(INITIAL_PRESETS));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(INITIAL_HISTORIES));
  localStorage.setItem('stocker_family_users', JSON.stringify(MOCK_USERS));
  localStorage.removeItem(STORAGE_KEYS.USER);
};
