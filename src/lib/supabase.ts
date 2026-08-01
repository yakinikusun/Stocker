import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, StockHistory, UserProfile, Location, Tag, Preset } from '../types/stock';
import {
  INITIAL_PRODUCTS,
  INITIAL_HISTORIES,
  MOCK_USERS,
  INITIAL_LOCATIONS,
  INITIAL_TAGS,
  INITIAL_PRESETS
} from './mockData';

const SUPABASE_URL_KEY = 'freezer_supabase_url';
const SUPABASE_KEY_KEY = 'freezer_supabase_key';
const LOCAL_PRODUCTS_KEY = 'freezer_local_products';
const LOCAL_HISTORIES_KEY = 'freezer_local_histories';
const LOCAL_USER_KEY = 'freezer_local_user';
const LOCAL_LOCATIONS_KEY = 'freezer_local_locations';
const LOCAL_TAGS_KEY = 'freezer_local_tags';
const LOCAL_PRESETS_KEY = 'freezer_local_presets';

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(SUPABASE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(SUPABASE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_KEY_KEY, anonKey);
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
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
// Storage Services (LocalStorage Fallback)
// -------------------------------------------------------------

export function loadLocalLocations(): Location[] {
  const raw = localStorage.getItem(LOCAL_LOCATIONS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(INITIAL_LOCATIONS));
    return INITIAL_LOCATIONS;
  }
  try { return JSON.parse(raw); } catch { return INITIAL_LOCATIONS; }
}

export function saveLocalLocations(items: Location[]) {
  localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(items));
}

export function loadLocalTags(): Tag[] {
  const raw = localStorage.getItem(LOCAL_TAGS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(INITIAL_TAGS));
    return INITIAL_TAGS;
  }
  try { return JSON.parse(raw); } catch { return INITIAL_TAGS; }
}

export function saveLocalTags(items: Tag[]) {
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(items));
}

export function loadLocalPresets(): Preset[] {
  const raw = localStorage.getItem(LOCAL_PRESETS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(INITIAL_PRESETS));
    return INITIAL_PRESETS;
  }
  try { return JSON.parse(raw); } catch { return INITIAL_PRESETS; }
}

export function saveLocalPresets(items: Preset[]) {
  localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(items));
}

export function loadLocalProducts(): Product[] {
  const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try { return JSON.parse(raw); } catch { return INITIAL_PRODUCTS; }
}

export function saveLocalProducts(products: Product[]) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

export function loadLocalHistories(): StockHistory[] {
  const raw = localStorage.getItem(LOCAL_HISTORIES_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_HISTORIES_KEY, JSON.stringify(INITIAL_HISTORIES));
    return INITIAL_HISTORIES;
  }
  try { return JSON.parse(raw); } catch { return INITIAL_HISTORIES; }
}

export function saveLocalHistories(histories: StockHistory[]) {
  localStorage.setItem(LOCAL_HISTORIES_KEY, JSON.stringify(histories));
}

export function loadLocalUser(): UserProfile {
  const raw = localStorage.getItem(LOCAL_USER_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return MOCK_USERS[0];
}

export function saveLocalUser(user: UserProfile) {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

export function resetLocalData() {
  localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(INITIAL_LOCATIONS));
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(INITIAL_TAGS));
  localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(INITIAL_PRESETS));
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(LOCAL_HISTORIES_KEY, JSON.stringify(INITIAL_HISTORIES));
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(MOCK_USERS[0]));
}
