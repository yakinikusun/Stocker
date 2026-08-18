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
  resetLocalData,
  deleteImageIfOrphaned
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getZeroStockCleanupHours } from '../constants';

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
  selectedTagFilters: string[];
  setSelectedTagFilters: (tags: string[]) => void;
  toggleTagFilter: (tag: string) => void;
  clearTagFilters: () => void;
  filteredProducts: Product[];
  clearFilters: () => void;

  // Storage locations CRUD & Edit
  addLocation: (name: string) => Promise<boolean>;
  updateLocation: (id: string, name: string) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;

  // Tags CRUD & Edit
  addTag: (name: string) => Promise<boolean>;
  updateTag: (id: string, name: string) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;

  // Presets CRUD & Edit (Unlinked location)
  addPreset: (preset: Omit<Preset, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updatePreset: (id: string, updated: Partial<Preset>) => Promise<boolean>;
  deletePreset: (id: string) => Promise<boolean>;
  createProductFromPreset: (preset: Preset, targetLocation: string, stockCount?: number) => Promise<Product | null>;

  // Products & Stock CRUD & Edit
  addProduct: (newProd: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updatedFields: Partial<Product>) => Promise<boolean>;
  adjustStock: (productId: string, changeAmount: number) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductByJanCode: (janCode: string) => Product | undefined;
  getProductsByJanCode: (janCode: string) => Product[];
  cleanUpZeroStockProducts: (maxAgeHours?: number) => Promise<number>;
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

  // Multi-tag Filtering Hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    selectedTagFilters,
    setSelectedTagFilters,
    toggleTagFilter,
    clearTagFilters,
    filteredProducts,
    clearFilters
  } = useStockFilter(products);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    const client = getSupabaseClient();

    if (client && isSupabaseActive) {
      try {
        const [
          { data: prods, error: prodErr },
          { data: hists, error: histErr },
          { data: locs, error: locErr },
          { data: tgs, error: tgErr },
          { data: psts, error: pstErr }
        ] = await Promise.all([
          client.from('products').select('*').order('updated_at', { ascending: false }),
          client.from('stock_history').select('*').order('created_at', { ascending: false }),
          client.from('locations').select('*').order('name'),
          client.from('tags').select('*').order('name'),
          client.from('presets').select('*').order('name')
        ]);

        if (prodErr) console.error('Error fetching products from Supabase:', prodErr);
        if (histErr) console.error('Error fetching stock_history from Supabase:', histErr);
        if (locErr) console.error('Error fetching locations from Supabase:', locErr);
        if (tgErr) console.error('Error fetching tags from Supabase:', tgErr);
        if (pstErr) console.error('Error fetching presets from Supabase:', pstErr);

        if (prods) setProducts(prods as Product[]);
        if (locs) setLocations(locs as Location[]);
        if (tgs) setTags(tgs as Tag[]);
        if (psts) setPresets(psts as Preset[]);
        if (hists) {
          const formatted: StockHistory[] = hists.map((h: any) => ({
            id: h.id,
            product_id: h.product_id,
            user_id: h.user_id,
            change_amount: Number(h.change_amount),
            created_at: h.created_at,
            product_name: h.product_name || '在庫',
            jan_code: h.jan_code ?? '',
            location: h.location || '冷蔵庫',
            user_email: h.user_email || undefined,
            user_name: h.user_name || undefined
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
        .channel('public-stock-changes-v10')
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
    if (!janCode.trim()) return undefined;
    return products.find((p) => p.jan_code === janCode.trim());
  };

  const getProductsByJanCode = (janCode: string): Product[] => {
    if (!janCode.trim()) return [];
    return products.filter((p) => p.jan_code === janCode.trim());
  };

  // Location Handlers (Admin Only Deletion)
  const addLocation = async (name: string): Promise<boolean> => {
    const cleanName = name.trim();
    if (!cleanName) return false;

    // Guard against duplicate location names
    const isDuplicate = locations.some(l => l.name.toLowerCase() === cleanName.toLowerCase());
    if (isDuplicate) {
      alert(`保管場所「${cleanName}」は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('locations').insert([{ name: cleanName }]);
      if (error) { alert(`保管場所追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newLoc: Location = { id: `loc-${Date.now()}`, name: cleanName };
      const updated = [...locations, newLoc];
      setLocations(updated);
      saveLocalLocations(updated);
      return true;
    }
  };

  const updateLocation = async (id: string, newName: string): Promise<boolean> => {
    const cleanName = newName.trim();
    if (!cleanName) return false;

    const targetLoc = locations.find(l => l.id === id);
    if (!targetLoc) return false;
    if (targetLoc.name === cleanName) return true;

    // Guard against duplicate location names
    const isDuplicate = locations.some(l => l.id !== id && l.name.toLowerCase() === cleanName.toLowerCase());
    if (isDuplicate) {
      alert(`保管場所「${cleanName}」は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('locations').update({ name: cleanName }).eq('id', id);
      if (error) { alert(`保管場所更新エラー: ${error.message}`); return false; }
      
      // Cascade update location name on existing products
      await client.from('products').update({ location: cleanName }).eq('location', targetLoc.name);

      await fetchAllData();
      return true;
    } else {
      const updatedLocations = locations.map(l => l.id === id ? { ...l, name: cleanName } : l);
      setLocations(updatedLocations);
      saveLocalLocations(updatedLocations);

      // Cascade update products location name locally
      const updatedProducts = products.map(p => p.location === targetLoc.name ? { ...p, location: cleanName } : p);
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);

      return true;
    }
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    if (user?.role !== 'admin') {
      alert('保管場所の削除は管理者権限が必要です。');
      return false;
    }
    const targetLoc = locations.find(l => l.id === id);
    if (!targetLoc) return false;

    // Find all products with positive stock currently in this location
    const prodsInLoc = products.filter(p => p.location === targetLoc.name);
    const stockedProds = prodsInLoc.filter(p => p.current_stock > 0);

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      // 1. Record stock history clearance logs for stocked products being removed
      if (stockedProds.length > 0) {
        const historyRows = stockedProds.map(p => ({
          product_id: p.id,
          user_id: user?.id || null,
          change_amount: -p.current_stock,
          product_name: p.name,
          jan_code: p.jan_code || null,
          location: p.location,
          user_email: user?.email || null,
          user_name: user?.name || null
        }));
        await client.from('stock_history').insert(historyRows);
      }

      // 2. Delete all products stored in this location
      const { error: prodError } = await client
        .from('products')
        .delete()
        .eq('location', targetLoc.name);
      if (prodError) {
        alert(`該当保管場所の在庫在庫削除エラー: ${prodError.message}`);
        return false;
      }

      // 3. Delete the location record
      const { error } = await client.from('locations').delete().eq('id', id);
      if (error) { alert(`保管場所削除エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      // Offline / LocalStorage Mode: Record history logs for stocked products
      const now = new Date().toISOString();
      if (stockedProds.length > 0) {
        const newHistories: StockHistory[] = stockedProds.map(p => ({
          id: `hist-${Date.now()}-${p.id}`,
          product_id: p.id,
          user_id: user?.id || 'usr-guest',
          change_amount: -p.current_stock,
          created_at: now,
          product_name: p.name,
          jan_code: p.jan_code || '',
          location: p.location,
          user_email: user?.email || 'guest@stocker.local',
          user_name: user?.name || 'ゲスト'
        }));
        const updatedHistories = [...newHistories, ...histories];
        setHistories(updatedHistories);
        saveLocalHistories(updatedHistories);
      }

      const updatedLocs = locations.filter(l => l.id !== id);
      setLocations(updatedLocs);
      saveLocalLocations(updatedLocs);

      // Cascade delete all products in this location
      const remainingProducts = products.filter(p => p.location !== targetLoc.name);
      setProducts(remainingProducts);
      saveLocalProducts(remainingProducts);

      return true;
    }
  };

  // Tag Handlers
  const addTag = async (name: string): Promise<boolean> => {
    const cleanName = name.trim();
    if (!cleanName) return false;

    // Guard against duplicate tag names (case-insensitive)
    const isDuplicate = tags.some(t => t.name.toLowerCase() === cleanName.toLowerCase());
    if (isDuplicate) {
      alert(`タグ「#${cleanName}」は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('tags').insert([{ name: cleanName }]);
      if (error) { alert(`タグ追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newTag: Tag = { id: `tag-${Date.now()}`, name: cleanName };
      const updated = [...tags, newTag];
      setTags(updated);
      saveLocalTags(updated);
      return true;
    }
  };

  const updateTag = async (id: string, name: string): Promise<boolean> => {
    const cleanName = name.trim();
    if (!cleanName) return false;

    const targetTag = tags.find(t => t.id === id);
    if (!targetTag) return false;

    // Guard against duplicate tag names (case-insensitive)
    const isDuplicate = tags.some(t => t.id !== id && t.name.toLowerCase() === cleanName.toLowerCase());
    if (isDuplicate) {
      alert(`タグ「#${cleanName}」は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    if (client && isSupabaseActive) {
      const { error } = await client.from('tags').update({ name: cleanName }).eq('id', id);
      if (error) { alert(`タグ更新エラー: ${error.message}`); return false; }

      // Cascade update tag name on existing products if name changed
      if (targetTag.name !== cleanName) {
        const prodsWithTag = products.filter(p => p.tags && p.tags.includes(targetTag.name));
        for (const prod of prodsWithTag) {
          const newTags = prod.tags.map(t => t === targetTag.name ? cleanName : t);
          await client.from('products').update({ tags: newTags }).eq('id', prod.id);
        }
      }

      await fetchAllData();
      return true;
    } else {
      const updatedTags = tags.map(t => t.id === id ? { ...t, name: cleanName } : t);
      setTags(updatedTags);
      saveLocalTags(updatedTags);

      if (targetTag.name !== cleanName) {
        const updatedProducts = products.map(p => {
          if (p.tags && p.tags.includes(targetTag.name)) {
            return { ...p, tags: p.tags.map(t => t === targetTag.name ? cleanName : t) };
          }
          return p;
        });
        setProducts(updatedProducts);
        saveLocalProducts(updatedProducts);
      }

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
    const cleanName = preset.name.trim();
    const cleanJan = preset.jan_code ? preset.jan_code.trim() : '';
    if (!cleanName) return false;

    // Guard against duplicate presets (matching BOTH name AND JAN code)
    const isDuplicate = presets.some(p => {
      const pName = p.name.trim().toLowerCase();
      const pJan = p.jan_code ? p.jan_code.trim() : '';
      return pName === cleanName.toLowerCase() && pJan === cleanJan;
    });

    if (isDuplicate) {
      alert(`プリセット「${cleanName}」${cleanJan ? `(JAN: ${cleanJan})` : ''} は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    const now = new Date().toISOString();
    if (client && isSupabaseActive) {
      const { error } = await client.from('presets').insert([{
        jan_code: cleanJan || null,
        name: cleanName,
        image_url: preset.image_url,
        tags: preset.tags
      }]);
      if (error) { alert(`プリセット追加エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const newPreset: Preset = {
        ...preset,
        name: cleanName,
        jan_code: cleanJan || undefined,
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

  const updatePreset = async (id: string, updatedFields: Partial<Preset>): Promise<boolean> => {
    const targetPreset = presets.find(p => p.id === id);
    if (!targetPreset) return false;

    const checkName = updatedFields.name !== undefined ? updatedFields.name.trim() : targetPreset.name.trim();
    const checkJan = updatedFields.jan_code !== undefined
      ? (updatedFields.jan_code ? updatedFields.jan_code.trim() : '')
      : (targetPreset.jan_code ? targetPreset.jan_code.trim() : '');

    if (!checkName) return false;

    // Guard against duplicate presets (matching BOTH name AND JAN code)
    const isDuplicate = presets.some(p => {
      if (p.id === id) return false;
      const pName = p.name.trim().toLowerCase();
      const pJan = p.jan_code ? p.jan_code.trim() : '';
      return pName === checkName.toLowerCase() && pJan === checkJan;
    });

    if (isDuplicate) {
      alert(`プリセット「${checkName}」${checkJan ? `(JAN: ${checkJan})` : ''} は既に登録されています。`);
      return false;
    }

    const client = getSupabaseClient();
    const now = new Date().toISOString();
    if (client && isSupabaseActive) {
      const { error } = await client.from('presets').update({
        ...updatedFields,
        name: checkName,
        jan_code: checkJan || null,
        updated_at: now
      }).eq('id', id);
      if (error) { alert(`プリセット更新エラー: ${error.message}`); return false; }
      await fetchAllData();
      return true;
    } else {
      const updated = presets.map(p => p.id === id ? {
        ...p,
        ...updatedFields,
        name: checkName,
        jan_code: checkJan || undefined,
        updated_at: now
      } : p);
      setPresets(updated);
      saveLocalPresets(updated);
      return true;
    }
  };

  const deletePreset = async (id: string): Promise<boolean> => {
    const targetPreset = presets.find(p => p.id === id);
    const client = getSupabaseClient();

    if (client && isSupabaseActive) {
      const { error } = await client.from('presets').delete().eq('id', id);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }
      
      const remainingPresets = presets.filter(p => p.id !== id);
      if (targetPreset?.image_url) {
        await deleteImageIfOrphaned(targetPreset.image_url, products, remainingPresets);
      }

      await fetchAllData();
      return true;
    } else {
      const remainingPresets = presets.filter(p => p.id !== id);
      setPresets(remainingPresets);
      saveLocalPresets(remainingPresets);

      if (targetPreset?.image_url) {
        deleteImageIfOrphaned(targetPreset.image_url, products, remainingPresets);
      }
      return true;
    }
  };

  // Add stock from Preset
  const createProductFromPreset = async (
    preset: Preset,
    targetLocation: string = '冷蔵庫',
    stockCount: number = 1
  ): Promise<Product | null> => {
    const existing = products.find(p =>
      ((preset.jan_code && p.jan_code && p.jan_code === preset.jan_code) || p.name.trim() === preset.name.trim()) &&
      p.location === targetLocation
    );

    if (existing) {
      await adjustStock(existing.id, stockCount);
      return existing;
    } else {
      const jan = preset.jan_code || '';
      return await addProduct({
        jan_code: jan,
        name: preset.name,
        image_url: preset.image_url,
        current_stock: stockCount,
        location: targetLocation,
        tags: preset.tags
      });
    }
  };

  // Product CRUD & Edit
  const addProduct = async (newProd: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
    // Automatically increment stock ONLY IF BOTH jan_code (if present) AND name match at the same location!
    const existing = products.find(
      p => ((newProd.jan_code && p.jan_code) ? p.jan_code === newProd.jan_code : true) &&
           p.name.trim().toLowerCase() === newProd.name.trim().toLowerCase() &&
           p.location === (newProd.location || '冷蔵庫')
    );

    if (existing) {
      await adjustStock(existing.id, newProd.current_stock > 0 ? newProd.current_stock : 1);
      return existing;
    }

    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client && isSupabaseActive) {
      const { data, error } = await client
        .from('products')
        .insert([{
          jan_code: newProd.jan_code || null,
          name: newProd.name,
          image_url: newProd.image_url,
          current_stock: newProd.current_stock,
          location: newProd.location || '冷蔵庫',
          tags: newProd.tags || []
        }])
        .select()
        .single();

      if (error) {
        alert(`在庫追加エラー: ${error.message}`);
        return null;
      }

      if (data && newProd.current_stock > 0) {
        await client.from('stock_history').insert([{
          product_id: data.id,
          user_id: user?.id || null,
          change_amount: newProd.current_stock,
          product_name: newProd.name,
          jan_code: newProd.jan_code || null,
          location: newProd.location || '冷蔵庫',
          user_email: user?.email || null,
          user_name: user?.name || null
        }]);
      }

      await fetchAllData();
      return data as Product;
    } else {
      const created: Product = {
        ...newProd,
        id: `prod-${Date.now()}`,
        jan_code: newProd.jan_code || '',
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
          created_at: now,
          product_name: created.name,
          jan_code: created.jan_code || '',
          location: created.location,
          user_email: user?.email || 'guest@stocker.local',
          user_name: user?.name || 'ゲスト'
        };
        const updatedHistories = [historyItem, ...histories];
        setHistories(updatedHistories);
        saveLocalHistories(updatedHistories);
      }

      return created;
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>): Promise<boolean> => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client && isSupabaseActive) {
      const { error } = await client.from('products').update({
        ...updatedFields,
        updated_at: now
      }).eq('id', id);

      if (error) {
        alert(`在庫更新エラー: ${error.message}`);
        return false;
      }
      await fetchAllData();
      return true;
    } else {
      const updatedProducts = products.map(p => p.id === id ? { ...p, ...updatedFields, updated_at: now } : p);
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);
      return true;
    }
  };

  const adjustStock = async (productId: string, changeAmount: number): Promise<boolean> => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return false;

    if (targetProduct.current_stock === 0 && changeAmount < 0) {
      return false;
    }

    const roundedChange = Math.round(changeAmount * 100) / 100;
    const actualChange = roundedChange < 0 ? Math.max(-targetProduct.current_stock, roundedChange) : roundedChange;
    if (actualChange === 0) return false;

    const newStock = Math.max(0, Math.round((targetProduct.current_stock + actualChange) * 100) / 100);
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const currentUserId = user?.id || 'usr-guest';

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
        change_amount: actualChange,
        product_name: targetProduct.name,
        jan_code: targetProduct.jan_code || null,
        location: targetProduct.location,
        user_email: user?.email || null,
        user_name: user?.name || null
      }]);

      await fetchAllData();
      return true;
    } else {
      const updatedProducts = products.map((p) =>
        p.id === productId ? { ...p, current_stock: newStock, updated_at: now } : p
      );
      setProducts(updatedProducts);
      saveLocalProducts(updatedProducts);

      const latestLog = histories[0];
      const timeDiffMs = latestLog ? Math.abs(new Date(now).getTime() - new Date(latestLog.created_at).getTime()) : Infinity;
      const isCompressible =
        latestLog &&
        latestLog.product_id === productId &&
        latestLog.user_id === currentUserId &&
        timeDiffMs <= 10 * 60 * 1000;

      let updatedHistories: StockHistory[];

      if (isCompressible) {
        const updatedLatest: StockHistory = {
          ...latestLog,
          change_amount: latestLog.change_amount + actualChange,
          created_at: now
        };
        updatedHistories = [updatedLatest, ...histories.slice(1)];
      } else {
        const historyItem: StockHistory = {
          id: `hist-${Date.now()}`,
          product_id: productId,
          user_id: currentUserId,
          change_amount: actualChange,
          created_at: now,
          product_name: targetProduct.name,
          jan_code: targetProduct.jan_code || '',
          location: targetProduct.location,
          user_email: user?.email || 'guest@stocker.local',
          user_name: user?.name || 'ゲスト'
        };
        updatedHistories = [historyItem, ...histories];
      }

      setHistories(updatedHistories);
      saveLocalHistories(updatedHistories);

      return true;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return false;

    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (targetProduct.current_stock > 0) {
      if (client && isSupabaseActive) {
        await client.from('stock_history').insert([{
          product_id: productId,
          user_id: user?.id || null,
          change_amount: -targetProduct.current_stock,
          product_name: targetProduct.name,
          jan_code: targetProduct.jan_code || null,
          location: targetProduct.location,
          user_email: user?.email || null,
          user_name: user?.name || null
        }]);
      } else {
        const clearHistoryItem: StockHistory = {
          id: `hist-${Date.now()}`,
          product_id: productId,
          user_id: user?.id || 'usr-guest',
          change_amount: -targetProduct.current_stock,
          created_at: now,
          product_name: targetProduct.name,
          jan_code: targetProduct.jan_code || '',
          location: targetProduct.location,
          user_email: user?.email || 'guest@stocker.local',
          user_name: user?.name || 'ゲスト'
        };
        const updatedHistories = [clearHistoryItem, ...histories];
        setHistories(updatedHistories);
        saveLocalHistories(updatedHistories);
      }
    }

    if (client && isSupabaseActive) {
      const { error } = await client.from('products').delete().eq('id', productId);
      if (error) { alert(`削除エラー: ${error.message}`); return false; }

      const remainingProducts = products.filter(p => p.id !== productId);
      if (targetProduct?.image_url) {
        await deleteImageIfOrphaned(targetProduct.image_url, remainingProducts, presets);
      }

      await fetchAllData();
      return true;
    } else {
      const remainingProducts = products.filter((p) => p.id !== productId);
      setProducts(remainingProducts);
      saveLocalProducts(remainingProducts);

      if (targetProduct?.image_url) {
        deleteImageIfOrphaned(targetProduct.image_url, remainingProducts, presets);
      }
      return true;
    }
  };

  const cleanUpZeroStockProducts = async (maxAgeHours: number = getZeroStockCleanupHours()): Promise<number> => {
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const staleZeroStockProducts = products.filter(p => {
      if (p.current_stock !== 0) return false;
      const updatedTime = new Date(p.updated_at).getTime();
      return updatedTime < cutoffTime;
    });

    if (staleZeroStockProducts.length === 0) return 0;

    let deletedCount = 0;
    for (const p of staleZeroStockProducts) {
      const ok = await deleteProduct(p.id);
      if (ok) deletedCount++;
    }
    return deletedCount;
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
        selectedTagFilters,
        setSelectedTagFilters,
        toggleTagFilter,
        clearTagFilters,
        filteredProducts,
        clearFilters,

        addLocation,
        updateLocation,
        deleteLocation,
        addTag,
        updateTag,
        deleteTag,
        addPreset,
        updatePreset,
        deletePreset,
        createProductFromPreset,

        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        getProductByJanCode,
        getProductsByJanCode,
        cleanUpZeroStockProducts,
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
