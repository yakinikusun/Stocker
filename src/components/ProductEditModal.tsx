import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, FolderKanban, Tag as TagIcon, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { Product } from '../types/stock';
import { useStock } from '../context/StockContext';
import { uploadProductImage } from '../lib/supabase';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { updateProduct, locations, tags } = useStock();

  const [name, setName] = useState('');
  const [janCode, setJanCode] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setJanCode(product.jan_code || '');
      setLocation(product.location);
      setSelectedTags(product.tags || []);
      setImagePreview(product.image_url || null);
      setImageFile(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    let finalImageUrl = imagePreview;

    if (imageFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadProductImage(imageFile);
      } catch (err) {
        console.error('Image upload error:', err);
      } finally {
        setIsUploading(false);
      }
    }

    const success = await updateProduct(product.id, {
      name: name.trim(),
      jan_code: janCode.trim() || product.jan_code,
      location: location || '冷蔵庫',
      tags: selectedTags,
      image_url: finalImageUrl
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl clean-modal border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">商品情報の編集</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">商品名 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Image Upload Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> 商品写真の変更
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-300 group">
                <img src={imagePreview} alt="プレビュー" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 text-xs bg-white font-semibold rounded-lg"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="px-3 py-1 text-xs bg-rose-600 text-white font-semibold rounded-lg"
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-600"
              >
                <Upload className="w-4 h-4" /> 画像をアップロード
              </div>
            )}
          </div>

          {/* Storage Location Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5 text-blue-500" /> 保管場所
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task 4: Tag Selection Dropdown + Checkboxes */}
          <div className="space-y-1 relative" ref={tagDropdownRef}>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-amber-500" /> 分類タグ (ドロップダウン選択)
            </label>
            <button
              type="button"
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-left flex items-center justify-between"
            >
              <span className="truncate">
                {selectedTags.length === 0
                  ? '未選択 (クリックして選択)'
                  : `${selectedTags.join(', ')} (${selectedTags.length}件選択中)`}
              </span>
              <span className="text-slate-400 text-xs">▼</span>
            </button>

            {isTagDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 p-2 rounded-xl bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto space-y-1">
                {tags.map((t) => {
                  const isChecked = selectedTags.includes(t.name);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTag(t.name)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-800">#{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* JAN Code Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">JANコード (任意)</label>
            <input
              type="text"
              value={janCode}
              onChange={(e) => setJanCode(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
            />
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 画像送信中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> 変更を保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
