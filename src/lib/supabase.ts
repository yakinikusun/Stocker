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
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
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

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey);
  }
  return supabaseInstance;
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

export const loadLocalUser = (): UserProfile => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return MOCK_USERS[0];
};

export const saveLocalUser = (user: UserProfile) =>
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

export const resetLocalData = () => {
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(INITIAL_LOCATIONS));
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(INITIAL_TAGS));
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(INITIAL_PRESETS));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(INITIAL_HISTORIES));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(MOCK_USERS[0]));
};
