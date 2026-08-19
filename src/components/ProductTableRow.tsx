import React from 'react';
import { Package, Minus, Plus, Pencil } from 'lucide-react';
import { Product } from '../types/stock';

interface ProductTableRowProps {
  product: Product;
  onAdjustStock: (productId: string, amount: number) => void;
  onSelectProductForAdjust: (product: Product) => void;
  onSelectProductForEdit: (product: Product) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  onAdjustStock,
  onSelectProductForAdjust,
  onSelectProductForEdit
}) => {
  const isOutOfStock = product.current_stock === 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-900 block">{product.name}</span>
            {product.jan_code ? (
              <span className="font-mono text-[10px] text-slate-400 block">JAN: {product.jan_code}</span>
            ) : null}
          </div>
          <button
            onClick={() => onSelectProductForEdit(product)}
            className="p-1.5 rounded-lg  hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            title="在庫情報編集"
          >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        </div>
      </td>
      <td className="p-3.5">
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 flex w-max">
          {product.location}
        </span>
      </td>
      <td className="p-3.5">
        {isOutOfStock ? (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
            在庫なし
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
            在庫あり ({product.current_stock})
          </span>
        )}
      </td>
      <td className="p-3.5 text-right font-mono font-bold text-sm text-slate-900">
        {product.current_stock}
      </td>
      <td className="p-3.5">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onAdjustStock(product.id, -1)}
            disabled={product.current_stock <= 0}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectProductForAdjust(product)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors"
          >
            数量
          </button>

          <button
            onClick={() => onAdjustStock(product.id, 1)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
