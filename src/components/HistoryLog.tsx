import React, { useState } from 'react';
import { History, ShieldCheck, Search, ArrowUpRight, ArrowDownRight, User, Calendar, Tag, FolderKanban } from 'lucide-react';
import { useStock } from '../context/StockContext';

export const HistoryLog: React.FC = () => {
  const { histories } = useStock();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredHistories = histories.filter((h) => {
    const query = filterQuery.toLowerCase();
    const prodName = (h.product_name || '').toLowerCase();
    const jan = (h.jan_code || '').toLowerCase();
    const reason = (h.reason || '').toLowerCase();
    const userName = (h.user_name || h.user_email || '').toLowerCase();
    const loc = (h.location || '').toLowerCase();

    return (
      prodName.includes(query) ||
      jan.includes(query) ||
      reason.includes(query) ||
      userName.includes(query) ||
      loc.includes(query)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d
        .getDate()
        .toString()
        .padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl clean-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">在庫操作ログ（改ざん不可・追記専用）</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> RLS保護
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              誰が・いつ・何を・どのように変更したかの全履歴です。Supabase RLSにより変更・削除は不可。
            </p>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="履歴を検索 (商品・理由・担当者・場所)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
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
                <th className="p-3.5">変動</th>
                <th className="p-3.5">操作理由</th>
                <th className="p-3.5">担当ユーザー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredHistories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    操作履歴がありません
                  </td>
                </tr>
              ) : (
                filteredHistories.map((h) => {
                  const isPositive = h.change_amount > 0;
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
                          {h.jan_code && (
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                              JAN: {h.jan_code}
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

                      {/* Change Amount */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isPositive ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> +{h.change_amount}
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" /> {h.change_amount}
                            </>
                          )}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                          <Tag className="w-3 h-3 text-blue-500" />
                          {h.reason || '手動調整'}
                        </span>
                      </td>

                      {/* User */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{h.user_name || h.user_email || '操作ユーザー'}</span>
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
