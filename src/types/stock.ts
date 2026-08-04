export interface Location {
  id: string;
  name: string;
}

export interface InitialProductData {
  name?: string;
  location?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Preset {
  id: string;
  jan_code?: string; // Optional
  name: string;
  image_url?: string | null;
  location?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  jan_code?: string; // Optional
  name: string;
  image_url?: string | null;
  current_stock: number;
  location: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StockHistory {
  id: string;
  product_id: string;
  user_id: string;
  change_amount: number;
  created_at: string;
  // Joined fields for display
  product_name?: string;
  jan_code?: string;
  user_email?: string;
  user_name?: string;
  location?: string;
}

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

// Binary stock status: 'all' | 'in_stock' (stock > 0) | 'out_of_stock' (stock === 0)
export type FilterStockStatus = 'all' | 'in_stock' | 'out_of_stock';
