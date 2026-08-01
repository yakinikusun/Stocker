import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, StockHistory, FilterStockStatus, Location, Tag, Preset } from '../types/stock';
import { useStockFilter } from '../hooks/useStockFilter';
import {
  getSupabaseClient,
  loadLocalProducts,
  saveLocalProducts,
  loadLocalHistories,
  saveLocalHistories,
  loadLocalLocations,
  saveLocalLocations,
  loadLocalTags,
  saveLocalTags,
  loadLocalPresets,
  saveLocalPresets,
  resetLocalData
} from '../lib/supabase';
import { useAuth } from './AuthContext';

interface StockContextType {
  products: Product[];
  histories: StockHistory[];
  locations: Location[];
  tags: Tag[];
  presets: Preset[];
  isLoading: boolean;
  
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: FilterStockStatus;
  setStatusFilter: (status: FilterStockStatus) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  selectedTagFilter: string;
  setSelectedTagFilter: (tag: string) => void;
  filteredProducts: Product[];
  clearFilters: () => void;

  // Storage locations CRUD
  addLocation: (name: string) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;

  // Tags CRUD
  addTag: (name: string, color?: string) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;

  // Presets CRUD
  addPreset: (preset: Omit<Preset, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  deletePreset: (id: string) => Promise<boolean>;
  createProductFromPreset: (preset: Preset, stockCount?: number) => Promise<Product | null>;

  // Products & Stock CRUD
  addProduct: (newProd: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product | null>;
  adjustStock: (productId: string, changeAmount: number, reason: string) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductByJanCode: (janCode: string) => Product | undefined;
  resetToDefaultDemoData: () => void;
  refreshData: () => Promise<void>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseActive } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [histories, setHistories] = useState<StockHistory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dedicated filtering hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    selectedTagFilter,
    setSelectedTagFilter,
    filteredProducts,
    clearFilters
  } = useStockFilter(products);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    const client = getSupabaseClient();

    if (client && isSupabaseActive) {
      try {
        const [
          { data: prods },
          { data: hists },
          { data: locs },
          { data: tgs },
          { data: psts }
        ] = await Promise.all([
          client.from('products').select('*').order('updated_at', { ascending: false }),
          client.from('stock_history').select('*, products(name, jan_code, location), profiles(email, name)').order('created_at', { ascending: false }),
          client.from('locations').select('*').order('name'),
          client.from('tags').select('*').order('name'),
          client.from('presets').select('*').order('name')
        ]);

        if (prods) setProducts(prods as Product[]);
        if (locs) setLocations(locs as Location[]);
        if (tgs) setTags(tgs as Tag[]);
        if (psts) setPresets(psts as Preset[]);
        if (hists) {
          const formatted: StockHistory[] = hists.map((h: any) => ({
            id: h.id,
            product_id: h.product_id,
            user_id: h.user_id,
            change_amount: h.change_amount,
            reason: h.reason,
            created_at: h.created_at,
            product_name: h.products?.name,
            jan_code: h.products?.jan_code,
            location: h.products?.location,
            user_email: h.profiles?.email,
            user_name: h.profiles?.name
          }));
          setHistories(formatted);
        }
      } catch (err) {
        console.error('Error fetching Supabase data, loading local fallback:', err);
        setProducts(loadLocalProducts());
        setHistories(loadLocalHistories());
        setLocations(loadLocalLocations());
        setTags(loadLocalTags());
        setPresets(loadLocalPresets());
      }
    } else {
      setProducts(loadLocalProducts());
      setHistories(loadLocalHistories());
      setLocations(loadLocalLocations());
      setTags(loadLocalTags());
      setPresets(loadLocalPresets());
    }
    setIsLoading(false);
  }, [isSupabaseActive]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Realtime Supabase Subscription
  useEffect(() => {
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const channel = client
        .channel('public-stock-changes-v4')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_history' }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'presets' }, fetchAllData)
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [isSupabaseActive, fetchAllData]);

  const getProductByJanCode = (janCode: string) => {
    return products.find((p) => p.jan_code === janCode);
  };

  // Location Handlers
  const addLocation = async (name: string): Promise<boolean> => {
    if (!name.trim()) return false;
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('locations').insert([{ name: name.trim() }]);
      if (error) { alert(`保管場所追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newLoc: Location = { id: `loc-${Date.now()}`, name: name.trim() };
      const updated = [...locations, newLoc];
      setLocations(updated);
      saveLocalLocations(updated);
      return true;
    }
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('locations').delete().eq('id', id);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const updated = locations.filter(l => l.id !== id);
      setLocations(updated);
      saveLocalLocations(updated);
      return true;
    }
  };

  // Tag Handlers
  const addTag = async (name: string, color?: string): Promise<boolean> => {
    if (!name.trim()) return false;
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('tags').insert([{ name: name.trim(), color: color || '#3b82f6' }]);
      if (error) { alert(`タグ追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newTag: Tag = { id: `tag-${Date.now()}`, name: name.trim(), color: color || '#3b82f6' };
      const updated = [...tags, newTag];
      setTags(updated);
      saveLocalTags(updated);
      return true;
    }
  };

  const deleteTag = async (id: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('tags').delete().eq('id', id);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const updated = tags.filter(t => t.id !== id);
      setTags(updated);
      saveLocalTags(updated);
      return true;
    }
  };

  // Preset Handlers
  const addPreset = async (preset: Omit<Preset, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    if (client && isSupabaseActive) {
      const { error } = await client.from('presets').insert([{
        jan_code: preset.jan_code,
        name: preset.name,
        image_url: preset.image_url,
        location: preset.location,
        tags: preset.tags
      }]);
      if (error) { alert(`プリセット追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newPreset: Preset = {
        ...preset,
        id: `preset-${Date.now()}`,
        created_at: now,
        updated_at: now
      };
      const updated = [newPreset, ...presets];
      setPresets(updated);
      saveLocalPresets(updated);
      return true;
    }
  };

  const deletePreset = async (id: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('presets').delete().eq('id', id);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const updated = presets.filter(p => p.id !== id);
      setPresets(updated);
      saveLocalPresets(updated);
      return true;
    }
  };

  const createProductFromPreset = async (preset: Preset, stockCount: number = 1): Promise<Product | null> => {
    const jan = preset.jan_code || `JAN-${Date.now()}`;
    const existing = getProductByJanCode(jan);

    if (existing) {
      await adjustStock(existing.id, stockCount, 'プリセットからの再補充');
      return existing;
    } else {
      return await addProduct({
        jan_code: jan,
        name: preset.name,
        image_url: preset.image_url,
        current_stock: stockCount,
        location: preset.location,
        tags: preset.tags
      });
    }
  };

  // Product CRUD
  const addProduct = async (newProd: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client && isSupabaseActive) {
      const { data, error } = await client
        .from('products')
        .insert([{
          jan_code: newProd.jan_code,
          name: newProd.name,
          image_url: newProd.image_url,
          current_stock: newProd.current_stock,
          location: newProd.location || '冷蔵庫',
          tags: newProd.tags || []
        }])
        .select()
        .single();

      if (error) {
        alert(`商品追加エラー: ${error.message}`);
        return null;
      }

      if (data && newProd.current_stock > 0) {
        await client.from('stock_history').insert([{
          product_id: data.id,
          user_id: user?.id || null,
          change_amount: newProd.current_stock,
          reason: '新規商品登録'
        }]);
      }

      await fetchAllData();
      return data as Product;
    } else {
      const created: Product = {
        ...newProd,
        id: `prod-${Date.now()}`,
        location: newProd.location || '冷蔵庫',
        tags: newProd.tags || [],
        created_at: now,
        updated_at: now
      };

      const updatedProducts = [created, ...products];
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);

      if (created.current_stock > 0) {
        const historyItem: StockHistory = {
          id: `hist-${Date.now()}`,
          product_id: created.id,
          user_id: user?.id || 'usr-guest',
          change_amount: created.current_stock,
          reason: '新規商品登録',
          created_at: now,
          product_name: created.name,
          jan_code: created.jan_code,
          location: created.location,
          user_email: user?.email || 'guest@freezer.local',
          user_name: user?.name || 'ゲスト'
        };
        const updatedHistories = [historyItem, ...histories];
        setHistories(updatedHistories);
        saveLocalHistories(updatedHistories);
      }

      return created;
    }
  };

  const adjustStock = async (productId: string, changeAmount: number, reason: string): Promise<boolean> => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return false;

    const newStock = Math.max(0, targetProduct.current_stock + changeAmount);
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client && isSupabaseActive) {
      const { error: updateErr } = await client
        .from('products')
        .update({ current_stock: newStock, updated_at: now })
        .eq('id', productId);

      if (updateErr) {
        alert(`在庫更新エラー: ${updateErr.message}`);
        return false;
      }

      await client.from('stock_history').insert([{
        product_id: productId,
        user_id: user?.id || null,
        change_amount: changeAmount,
        reason: reason || (changeAmount >= 0 ? '入荷' : '出庫')
      }]);

      await fetchAllData();
      return true;
    } else {
      const updatedProducts = products.map((p) =>
        p.id === productId ? { ...p, current_stock: newStock, updated_at: now } : p
      );
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);

      const historyItem: StockHistory = {
        id: `hist-${Date.now()}`,
        product_id: productId,
        user_id: user?.id || 'usr-guest',
        change_amount: changeAmount,
        reason: reason || (changeAmount >= 0 ? '入荷' : '出庫'),
        created_at: now,
        product_name: targetProduct.name,
        jan_code: targetProduct.jan_code,
        location: targetProduct.location,
        user_email: user?.email || 'guest@freezer.local',
        user_name: user?.name || 'ゲスト'
      };

      const updatedHistories = [historyItem, ...histories];
      setHistories(updatedHistories);
      saveLocalHistories(updatedHistories);

      return true;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (user?.role !== 'admin') {
      alert('商品削除は管理者権限が必要です。');
      return false;
    }

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('products').delete().eq('id', productId);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      saveLocalProducts(updated);
      return true;
    }
  };

  const resetToDefaultDemoData = () => {
    resetLocalData();
    fetchAllData();
  };

  return (
    <StockContext.Provider
      value={{
        products,
        histories,
        locations,
        tags,
        presets,
        isLoading,

        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        locationFilter,
        setLocationFilter,
        selectedTagFilter,
        setSelectedTagFilter,
        filteredProducts,
        clearFilters,

        addLocation,
        deleteLocation,
        addTag,
        deleteTag,
        addPreset,
        deletePreset,
        createProductFromPreset,

        addProduct,
        adjustStock,
        deleteProduct,
        getProductByJanCode,
        resetToDefaultDemoData,
        refreshData: fetchAllData
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStock must be used within a StockProvider');
  return context;
};
