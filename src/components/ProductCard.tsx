import React from 'react';
import { Package, Trash2, Minus, Plus } from 'lucide-react';
import { Product } from '../types/stock';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onAdjustStock: (productId: string, amount: number) => void;
  onSelectProductForAdjust: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdmin,
  onAdjustStock,
  onSelectProductForAdjust,
  onDeleteProduct
}) => {
  const isOutOfStock = product.current_stock === 0;

  return (
    <div className="rounded-xl clean-card-interactive p-4 flex flex-col justify-between space-y-3 relative group bg-white">
      {/* Header Info */}
      <div className="flex items-start gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <Package className="w-8 h-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            {/* Status Badge */}
            {isOutOfStock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" /> 在庫なし
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                在庫あり ({product.current_stock})
              </span>
            )}

            {isAdmin && (
              <button
                onClick={() => onDeleteProduct(product.id)}
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">
            {product.name}
          </h4>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
              {product.location}
            </span>
            {product.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Quantity & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 block">現在数</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
            {product.current_stock}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAdjustStock(product.id, -1)}
            disabled={product.current_stock <= 0}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 flex items-center justify-center transition-colors disabled:opacity-30"
            title="-1 消費"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectProductForAdjust(product)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            変更
          </button>

          <button
            onClick={() => onAdjustStock(product.id, 1)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-colors"
            title="+1 追加"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
