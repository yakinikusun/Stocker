import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Package, LayoutGrid, List, RotateCcw, FolderKanban, Tag as TagIcon, Sparkles, Trash2, X, ChevronDown, Check, Camera } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types/stock';
import { StockAdjustModal } from './StockAdjustModal';
import { ProductEditModal } from './ProductEditModal';
import { ProductCard } from './ProductCard';
import { ProductTableRow } from './ProductTableRow';

interface StockListProps {
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
}

export const StockList: React.FC<StockListProps> = ({ onOpenAddModal, onOpenScanner }) => {
  const {
    filteredProducts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    selectedTagFilters,
    toggleTagFilter,
    clearTagFilters,
    locations,
    tags,
    adjustStock,
    deleteProduct,
    cleanUpZeroStockProducts,
    resetToDefaultDemoData,
    products
  } = useStock();
  const { user } = useAuth();

  type StockSortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc' | 'stock_desc' | 'stock_asc';
  const [stockSort, setStockSort] = useState<StockSortOption>('created_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    switch (stockSort) {
      case 'created_desc':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'created_asc':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'updated_desc':
        return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
      case 'updated_asc':
        return new Date(a.updated_at || a.created_at || 0).getTime() - new Date(b.updated_at || b.created_at || 0).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name, 'ja');
      case 'name_desc':
        return b.name.localeCompare(a.name, 'ja');
      case 'stock_desc':
        return b.current_stock - a.current_stock;
      case 'stock_asc':
        return a.current_stock - b.current_stock;
      default:
        return 0;
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (target && confirm(`「${target.name}」の在庫を0にして削除しますか？（履歴ログに記録されます）`)) {
      deleteProduct(productId);
    }
  };

  const handleRunCleanup = async () => {
    const deletedCount = await cleanUpZeroStockProducts(24);
    if (deletedCount > 0) {
      setCleanupMessage(`24時間以上在庫が0の商品 ${deletedCount} 件を自動削除しました。`);
    } else {
      setCleanupMessage('24時間以上在庫が0の商品は存在しません。');
    }
    setTimeout(() => setCleanupMessage(null), 4000);
  };

  const zeroStockCount = products.filter(p => p.current_stock === 0).length;

  return (
    <div className="space-y-4">
      {/* Location Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setLocationFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            locationFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" /> 全ての保管場所 ({products.length})
        </button>
        {locations.map((loc) => {
          const count = products.filter((p) => p.location === loc.name).length;
          const isActive = locationFilter === loc.name;
          return (
            <button
              key={loc.id}
              onClick={() => setLocationFilter(loc.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{loc.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search & Filter & Views */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl clean-card">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="商品名、JAN、タグ、保管場所で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              クリア
            </button>
          )}
        </div>

        {/* Action Buttons & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tag Filter Dropdown */}
          {tags.length > 0 && (
            <div className="relative" ref={tagDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className={`px-3 py-2 text-xs rounded-xl border font-medium flex items-center gap-1.5 transition-all ${
                  selectedTagFilters.length > 0
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-semibold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TagIcon className="w-3.5 h-3.5" />
                <span>
                  {selectedTagFilters.length === 0
                    ? 'タグ選択'
                    : `タグ: ${selectedTagFilters.length}件選択中`}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isTagDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 p-2 rounded-xl bg-white border border-slate-200 shadow-xl z-30 space-y-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 px-1">
                    <span className="text-[11px] font-bold text-slate-600">タグで絞り込み</span>
                    {selectedTagFilters.length > 0 && (
                      <button
                        onClick={clearTagFilters}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        全解除
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {tags.map((t) => {
                      const isChecked = selectedTagFilters.includes(t.name);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTagFilter(t.name)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="font-medium text-slate-800">#{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">すべての状態</option>
            <option value="in_stock">在庫あり (あり)</option>
            <option value="out_of_stock">在庫切れ (なし)</option>
          </select>

          {/* Stock Sort Dropdown */}
          <select
            value={stockSort}
            onChange={(e) => setStockSort(e.target.value as StockSortOption)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="created_desc">並び替え: 登録が新しい順</option>
            <option value="created_asc">並び替え: 登録が古い順</option>
            <option value="updated_desc">並び替え: 更新が新しい順</option>
            <option value="updated_asc">並び替え: 更新が古い順</option>
            <option value="name_asc">並び替え: 商品名 (あ〜ん順)</option>
            <option value="name_desc">並び替え: 商品名 (ん〜あ順)</option>
            <option value="stock_desc">並び替え: 在庫数 (多い順)</option>
            <option value="stock_asc">並び替え: 在庫数 (少ない順)</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-slate-500 transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
              }`}
              title="カード表示"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-slate-500 transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
              }`}
              title="リスト表示"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Barcode Scan Button */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
            title="バーコードスキャナを起動"
          >
            <Camera className="w-4 h-4 text-blue-400" />
            <span>スキャン</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> 新規在庫追加
          </button>
        </div>
      </div>

      {cleanupMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {/* Main List Display */}
      {sortedFilteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-xl clean-card space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">該当する在庫が見つかりません</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            検索または絞り込み条件を変更するか、新規在庫を追加してください。
          </p>
          {products.length === 0 && (
            <button
              onClick={resetToDefaultDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-blue-600 hover:bg-slate-200 transition-colors mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 初期デモデータを読み込む
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFilteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAdmin={user?.role === 'admin'}
              onAdjustStock={adjustStock}
              onSelectProductForAdjust={setSelectedProductForAdjust}
              onSelectProductForEdit={setSelectedProductForEdit}
              onDeleteProduct={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl clean-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">商品情報</th>
                  <th className="p-3.5">保管場所</th>
                  <th className="p-3.5">ステータス</th>
                  <th className="p-3.5 text-right">数量</th>
                  <th className="p-3.5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedFilteredProducts.map((p) => (
                  <ProductTableRow
                    key={p.id}
                    product={p}
                    onAdjustStock={adjustStock}
                    onSelectProductForAdjust={setSelectedProductForAdjust}
                    onSelectProductForEdit={setSelectedProductForEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        product={selectedProductForAdjust}
        isOpen={Boolean(selectedProductForAdjust)}
        onClose={() => setSelectedProductForAdjust(null)}
      />

      {/* Task 6: Product Edit Modal */}
      <ProductEditModal
        product={selectedProductForEdit}
        isOpen={Boolean(selectedProductForEdit)}
        onClose={() => setSelectedProductForEdit(null)}
      />
    </div>
  );
};
