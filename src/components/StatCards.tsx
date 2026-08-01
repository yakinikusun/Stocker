import React from 'react';
import { PackageCheck, XCircle, Boxes } from 'lucide-react';
import { useStock } from '../context/StockContext';

export const StatCards: React.FC = () => {
  const { products, setStatusFilter, statusFilter } = useStock();

  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.current_stock > 0).length;
  const outOfStockCount = products.filter((p) => p.current_stock === 0).length;

  const stats = [
    {
      id: 'all' as const,
      label: '全登録品目',
      count: totalCount,
      icon: Boxes,
      color: 'bg-white text-slate-800 border-slate-200 hover:border-blue-300',
      activeBorder: 'border-blue-600 ring-2 ring-blue-100'
    },
    {
      id: 'in_stock' as const,
      label: '在庫あり (あり)',
      count: inStockCount,
      icon: PackageCheck,
      color: 'bg-white text-emerald-800 border-slate-200 hover:border-emerald-300',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-100'
    },
    {
      id: 'out_of_stock' as const,
      label: '在庫切れ (なし)',
      count: outOfStockCount,
      icon: XCircle,
      color: 'bg-white text-rose-800 border-slate-200 hover:border-rose-300',
      activeBorder: 'border-rose-600 ring-2 ring-rose-100'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = statusFilter === stat.id;
        return (
          <button
            key={stat.id}
            onClick={() => setStatusFilter(stat.id)}
            className={`p-3.5 rounded-xl border clean-card-interactive transition-all text-left flex flex-col justify-between cursor-pointer ${stat.color} ${
              isActive ? stat.activeBorder : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">{stat.label}</span>
              <Icon className="w-4 h-4 opacity-70" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight font-mono">
                {stat.count}
              </span>
              <span className="text-[11px] text-slate-400">品目</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
