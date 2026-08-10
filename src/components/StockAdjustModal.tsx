import React, { useState } from 'react';
import { Plus, Minus, Check, PackageCheck } from 'lucide-react';
import { Product } from '../types/stock';
import { useStock } from '../context/StockContext';
import { FormModal } from './FormModal';

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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="在庫数量の変更"
      icon={<PackageCheck className="w-5 h-5 text-blue-600" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        {/* Target Product Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 font-bold text-lg">
              {product.name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 truncate">{product.name}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>場所: <strong className="text-slate-700">{product.location}</strong></span>
              <span>•</span>
              <span>現在数: <strong className="text-slate-900 font-mono text-sm">{product.current_stock}</strong></span>
            </div>
          </div>
        </div>

        {/* Operation Mode Selector (Add / Subtract) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'add'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" /> 在庫を追加する (+)
          </button>
          <button
            type="button"
            onClick={() => setMode('subtract')}
            disabled={product.current_stock <= 0}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'subtract'
                ? 'bg-rose-50 text-rose-800 border-rose-500 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Minus className="w-4 h-4 text-rose-600" /> 在庫を減らす (-)
          </button>
        </div>

        {/* Quantity Controls */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">変動数量</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChangeAmount(Math.max(0, Math.round((changeAmount - 1) * 100) / 100))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-lg shadow-sm flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                step="any"
                min="0"
                max={mode === 'subtract' ? product.current_stock : 999}
                value={changeAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const parsedVal = isNaN(val) ? 0 : Math.round(val * 100) / 100;
                  const maxAllowed = mode === 'subtract' ? product.current_stock : 999;
                  setChangeAmount(Math.max(0, Math.min(maxAllowed, parsedVal)));
                }}
                className="w-20 text-center text-xl font-extrabold font-mono py-1 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const maxAllowed = mode === 'subtract' ? product.current_stock : 999;
                  setChangeAmount(Math.min(maxAllowed, Math.round((changeAmount + 1) * 100) / 100));
                }}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-lg shadow-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Projected Stock Preview */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">変更後の予測在庫数</span>
          <div className="flex items-center gap-1 font-mono font-bold text-sm">
            <span className="text-slate-400">{product.current_stock}</span>
            <span className="text-slate-400">→</span>
            <span className={projectedStock === 0 ? 'text-rose-600' : 'text-blue-700'}>
              {Math.round(projectedStock * 100) / 100} 個
            </span>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" /> 数量を更新
          </button>
        </div>
      </form>
    </FormModal>
  );
};
