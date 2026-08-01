import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Package,
  LayoutGrid,
  List,
  Trash2,
  RotateCcw,
  FolderKanban
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types/stock';
import { StockAdjustModal } from './StockAdjustModal';

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
    selectedTagFilter,
    setSelectedTagFilter,
    locations,
    tags,
    adjustStock,
    deleteProduct,
    resetToDefaultDemoData,
    products
  } = useStock();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);

  // Binary Stock Badge: 在庫あり vs 在庫なし
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" /> 在庫なし
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        在庫あり ({stock})
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Location Filter Bar (冷蔵庫, 冷凍庫, 野菜室 etc.) */}
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
            placeholder="商品名、JAN、タグで検索..."
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
          {/* Tag Filter */}
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">全てのタグ</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                🏷️ {t.name}
              </option>
            ))}
          </select>

          {/* Binary Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">すべての状態</option>
            <option value="in_stock">在庫あり (あり)</option>
            <option value="out_of_stock">在庫切れ (なし)</option>
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

          {/* Add Product Button */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> 新規在庫追加
          </button>
        </div>
      </div>

      {/* Main List Display */}
      {filteredProducts.length === 0 ? (
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
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl clean-card-interactive p-4 flex flex-col justify-between space-y-3 relative group bg-white"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Package className="w-8 h-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    {getStockBadge(p.current_stock)}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`「${p.name}」を削除してもよろしいですか？`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                      {p.location}
                    </span>
                    {p.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stock Count & Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">現在数</span>
                  <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {p.current_stock}
                  </span>
                </div>

                {/* Direct Adjust Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustStock(p.id, -1, '出庫・消費')}
                    disabled={p.current_stock <= 0}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 flex items-center justify-center transition-colors disabled:opacity-30"
                    title="-1 消費"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedProductForAdjust(p)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    変更
                  </button>

                  <button
                    onClick={() => adjustStock(p.id, 1, '入荷・追加')}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-colors"
                    title="+1 追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
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
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 block">{p.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">JAN: {p.jan_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                        {p.location}
                      </span>
                    </td>
                    <td className="p-3.5">{getStockBadge(p.current_stock)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-sm text-slate-900">
                      {p.current_stock}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => adjustStock(p.id, -1, '出庫・消費')}
                          disabled={p.current_stock <= 0}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedProductForAdjust(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => adjustStock(p.id, 1, '入荷・追加')}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
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
    </div>
  );
};
