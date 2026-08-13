import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  X,
  Check,
  Tag as TagIcon
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { StockHistory } from '../types/stock';

interface CompressedStockHistory extends StockHistory {
  op_count?: number;
}

export type ActionFilterType = 'all' | 'add' | 'subtract';
export type MatchModeType = 'AND' | 'OR';
export type SortOptionType =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'name_asc'
  | 'name_desc';

/**
 * Compress consecutive identical operation logs within 10 minutes
 */
function compressHistories(histories: StockHistory[]): CompressedStockHistory[] {
  if (histories.length === 0) return [];

  const compressed: CompressedStockHistory[] = [];

  for (const item of histories) {
    if (compressed.length === 0) {
      compressed.push({ ...item, op_count: 1 });
      continue;
    }

    const previous = compressed[compressed.length - 1];
    const timeDiffMs = Math.abs(new Date(previous.created_at).getTime() - new Date(item.created_at).getTime());

    const isSameProduct =
      (previous.product_id && item.product_id && previous.product_id === item.product_id) ||
      (previous.product_name === item.product_name && (previous.location || '冷蔵庫') === (item.location || '冷蔵庫'));
    const isSameUser = previous.user_id === item.user_id || previous.user_email === item.user_email;
    const isWithinTime = timeDiffMs <= 10 * 60 * 1000; // Within 10 minutes

    if (isSameProduct && isSameUser && isWithinTime) {
      previous.change_amount += item.change_amount;
      previous.op_count = (previous.op_count || 1) + 1;
    } else {
      compressed.push({ ...item, op_count: 1 });
    }
  }

  return compressed;
}

export const HistoryLog: React.FC = () => {
  const { histories } = useStock();

  // Search & Filter States
  const [filterQuery, setFilterQuery] = useState('');
  const [matchMode, setMatchMode] = useState<MatchModeType>('AND');
  const [actionFilter, setActionFilter] = useState<ActionFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState<SortOptionType>('date_desc');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const compressedHistories = useMemo(() => compressHistories(histories), [histories]);

  // Filtering Logic
  const filteredHistories = useMemo(() => {
    return compressedHistories.filter((h) => {
      // 1. Action Type Filter (追加 / 消費)
      if (actionFilter === 'add' && h.change_amount <= 0) return false;
      if (actionFilter === 'subtract' && h.change_amount >= 0) return false;

      // 2. Date Range Filter (期間指定)
      if (startDate) {
        const itemDate = new Date(h.created_at);
        const start = new Date(startDate + 'T00:00:00');
        if (itemDate < start) return false;
      }
      if (endDate) {
        const itemDate = new Date(h.created_at);
        const end = new Date(endDate + 'T23:59:59');
        if (itemDate > end) return false;
      }

      // 3. Multi-keyword Search with AND / OR
      const cleanQuery = filterQuery.trim().toLowerCase();
      if (cleanQuery) {
        const keywords = cleanQuery.split(/\s+/).filter(Boolean);

        const checkKeyword = (kw: string) => {
          return (
            (h.product_name && h.product_name.toLowerCase().includes(kw)) ||
            (h.jan_code && h.jan_code.toLowerCase().includes(kw)) ||
            (h.user_name && h.user_name.toLowerCase().includes(kw)) ||
            (h.user_email && h.user_email.toLowerCase().includes(kw)) ||
            (h.location && h.location.toLowerCase().includes(kw)) ||
            (h.profiles?.name && h.profiles.name.toLowerCase().includes(kw)) ||
            (h.profiles?.email && h.profiles.email.toLowerCase().includes(kw))
          );
        };

        if (matchMode === 'AND') {
          if (!keywords.every((kw) => checkKeyword(kw))) return false;
        } else {
          if (!keywords.some((kw) => checkKeyword(kw))) return false;
        }
      }

      return true;
    });
  }, [compressedHistories, actionFilter, startDate, endDate, filterQuery, matchMode]);

  // Sorting Logic
  const sortedHistories = useMemo(() => {
    const list = [...filteredHistories];
    list.sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount_desc':
          return Math.abs(b.change_amount) - Math.abs(a.change_amount);
        case 'amount_asc':
          return Math.abs(a.change_amount) - Math.abs(b.change_amount);
        case 'name_asc':
          return (a.product_name || '').localeCompare(b.product_name || '', 'ja');
        case 'name_desc':
          return (b.product_name || '').localeCompare(a.product_name || '', 'ja');
        default:
          return 0;
      }
    });
    return list;
  }, [filteredHistories, sortOption]);

  // Date Range Quick Preset Helpers
  const handleSetDatePreset = (preset: 'today' | 'week' | 'month' | 'clear') => {
    const now = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const todayStr = formatDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateStr(weekAgo));
      setEndDate(formatDateStr(now));
    } else if (preset === 'month') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateStr(firstDayOfMonth));
      setEndDate(formatDateStr(now));
    } else if (preset === 'clear') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setFilterQuery('');
    setMatchMode('AND');
    setActionFilter('all');
    setStartDate('');
    setEndDate('');
    setSortOption('date_desc');
  };

  const hasActiveFilters = Boolean(
    filterQuery || actionFilter !== 'all' || startDate || endDate || sortOption !== 'date_desc' || matchMode !== 'AND'
  );

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Search & Filter Header Panel */}
      <div className="clean-card p-4 space-y-4 bg-white shadow-md rounded-2xl border border-slate-200/80">
        {/* Title & Primary Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">在庫操作履歴ログ</h2>
              <p className="text-xs text-slate-500">
                表示中: <strong className="text-blue-600 font-mono">{sortedHistories.length}</strong> / 全 {compressedHistories.length} 件
              </p>
            </div>
          </div>

          {/* Search Input + Toggle Advanced Filters Button */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="商品名、JAN、ユーザー、場所で検索..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all font-sans"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdvancedOpen
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">絞り込み・並び替え</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row (Action Type, AND/OR, Sort, Date Presets) */}
        {isAdvancedOpen && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Action Type Filter (追加 / 消費) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    actionFilter === 'all'
                      ? 'bg-white text-slate-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全ての操作
                </button>
                <button
                  type="button"
                  onClick={() => setActionFilter('add')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    actionFilter === 'add'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> 追加のみ (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActionFilter('subtract')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    actionFilter === 'subtract'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> 消費のみ (-)
                </button>
              </div>

              {/* Keyword Match Mode (AND / OR) */}
              {filterQuery.trim().includes(' ') && (
                <div className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-xl text-xs">
                  <span className="font-semibold text-blue-900">複数キーワード一致法:</span>
                  <button
                    type="button"
                    onClick={() => setMatchMode('AND')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      matchMode === 'AND'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-blue-700 border border-blue-200'
                    }`}
                  >
                    AND (全ワード一致)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode('OR')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      matchMode === 'OR'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-blue-700 border border-blue-200'
                    }`}
                  >
                    OR (いずれか一致)
                  </button>
                </div>
              )}

              {/* Sort Selector Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[200px]">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOptionType)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="date_desc">日時 (新しい順)</option>
                  <option value="date_asc">日時 (古い順)</option>
                  <option value="amount_desc">変動数量 (大きい順)</option>
                  <option value="amount_asc">変動数量 (小さい順)</option>
                  <option value="name_asc">商品名 (あ〜ん順)</option>
                  <option value="name_desc">商品名 (ん〜あ順)</option>
                </select>
              </div>
            </div>

            {/* Date Range Selector & Quick Presets Panel */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" /> 期間指定 (日付フィルター)
                </label>

                {/* Quick Range Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetDatePreset('today')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    今日
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDatePreset('week')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    過去7日間
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDatePreset('month')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    今月
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDatePreset('clear')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    解除
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">開始日:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">終了日:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Reset Filters Bar */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500 font-medium">
                  フィルター条件を適用中
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 条件を全リセット
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="rounded-xl clean-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">日時</th>
                <th className="p-3.5">対象在庫</th>
                <th className="p-3.5">保管場所</th>
                <th className="p-3.5">変動数量</th>
                <th className="p-3.5">担当ユーザー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedHistories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">該当する操作履歴が見つかりません</p>
                      <p className="text-xs text-slate-400">検索キーワードや日付・期間の絞り込み条件をご確認ください。</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer"
                        >
                          検索条件をリセットする
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedHistories.map((h) => {
                  const isPositive = h.change_amount > 0;
                  const opCount = h.op_count || 1;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(h.created_at)}
                      </td>

                      {/* Product Info */}
                      <td className="p-3.5">
                        <div>
                          <span className="font-semibold text-slate-900">{h.product_name || '在庫'}</span>
                          {h.jan_code ? (
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                              JAN: {h.jan_code}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              JANコードなし
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                          {h.location || '冷蔵庫'}
                        </span>
                      </td>

                      {/* Change Amount & Compression Count */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            {isPositive ? `+${h.change_amount}` : h.change_amount}
                          </span>

                          {opCount > 1 && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"
                              title="10分以内の連続操作が自動合算されています"
                            >
                              <Layers className="w-3 h-3 text-purple-600" />
                              {opCount}回合算
                            </span>
                          )}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-medium text-slate-800 block text-xs">
                            {h.user_name || h.profiles?.name || 'ゲストユーザー'}
                          </span>
                          {(h.user_email || h.profiles?.email) && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {h?.user_email?.split('@')[0] || h.profiles?.email?.split('@')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
