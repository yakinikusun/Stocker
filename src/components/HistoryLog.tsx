import React, { useState } from 'react';
import { History, Search, Calendar, Package, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { StockHistory } from '../types/stock';

interface CompressedStockHistory extends StockHistory {
  op_count?: number;
}

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
  const [filterQuery, setFilterQuery] = useState('');

  const compressedHistories = compressHistories(histories);

  const filteredHistories = compressedHistories.filter((h) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      (h.product_name && h.product_name.toLowerCase().includes(q)) ||
      (h.jan_code && h.jan_code.toLowerCase().includes(q)) ||
      (h.user_name && h.user_name.toLowerCase().includes(q)) ||
      (h.user_email && h.user_email.toLowerCase().includes(q)) ||
      (h.location && h.location.toLowerCase().includes(q))
    );
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl clean-card">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-800">在庫操作履歴ログ</h2>
            <p className="text-xs text-slate-500">
              直近10分以内の連続操作は自動圧縮集計されています ({histories.length}件 → {compressedHistories.length}行)
            </p>
          </div>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="商品名、JAN、ユーザー、場所で検索..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl clean-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">日時</th>
                <th className="p-3.5">対象商品</th>
                <th className="p-3.5">保管場所</th>
                <th className="p-3.5">変動数量</th>
                <th className="p-3.5">担当ユーザー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredHistories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    操作履歴がありません
                  </td>
                </tr>
              ) : (
                filteredHistories.map((h) => {
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
                          <span className="font-semibold text-slate-900">{h.product_name || '商品'}</span>
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
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {(h.user_name || h.user_email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 block text-xs">
                              {h.user_name || 'ゲストユーザー'}
                            </span>
                            {h.user_email && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {h.user_email}
                              </span>
                            )}
                          </div>
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
