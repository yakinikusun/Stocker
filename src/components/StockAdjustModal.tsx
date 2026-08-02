import React, { useState } from 'react';
import { X, Plus, Minus, Check, PackageCheck } from 'lucide-react';
import { Product } from '../types/stock';
import { useStock } from '../context/StockContext';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { adjustStock } = useStock();
  const [changeAmount, setChangeAmount] = useState<number>(1);
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const finalAmount = mode === 'add' ? Math.abs(changeAmount) : -Math.abs(changeAmount);
  const projectedStock = Math.max(0, product.current_stock + finalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount === 0) return;

    setIsSubmitting(true);
    const success = await adjustStock(product.id, finalAmount);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl clean-modal border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">在庫数量の変更</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800">
          {/* Target Product Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <PackageCheck className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-slate-900 truncate">{product.name}</h4>
              <p className="text-[11px] text-blue-700 mt-0.5">保管場所: {product.location}</p>
              <div className="text-xs text-slate-600 mt-1">
                現在在庫: <span className="font-bold text-slate-900 font-mono text-sm">{product.current_stock}</span> 個
              </div>
            </div>
          </div>

          {/* Mode Switcher: 追加 (+) vs 減少 (-) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'add'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" /> 在庫を追加 (+)
            </button>
            <button
              type="button"
              onClick={() => setMode('subtract')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'subtract'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-4 h-4" /> 在庫を減らす (-)
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">変動数量</label>
            <div className="flex items-center justify-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChangeAmount(Math.max(1, changeAmount - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 flex items-center justify-center text-lg font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={changeAmount}
                onChange={(e) => setChangeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center text-xl font-bold font-mono py-1 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setChangeAmount(changeAmount + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 flex items-center justify-center text-lg font-bold transition-colors"
              >
                +
              </button>
            </div>
            <div className="text-center text-xs text-slate-500">
              変更後の想定在庫: <span className="font-bold text-slate-900 font-mono">{projectedStock}</span> 個
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" /> 決定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
