import React, { useState, useEffect, useRef } from 'react';
import { Pencil, FolderKanban, Tag as TagIcon, Upload, Image as ImageIcon, Check, Loader2, ChevronDown } from 'lucide-react';
import { Product } from '../types/stock';
import { useStock } from '../context/StockContext';
import { uploadProductImage } from '../lib/supabase';
import { FormModal } from './FormModal';

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
  const [showImageControls, setShowImageControls] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setJanCode(product.jan_code || '');
      setLocation(product.location || (locations[0]?.name ?? '冷蔵庫'));
      setSelectedTags(product.tags || []);
      setImagePreview(product.image_url || null);
      setImageFile(null);
      setShowImageControls(false);
    }
  }, [product, locations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !product) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImageControls(false);
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
      jan_code: janCode.trim() || undefined,
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="在庫情報の編集"
      icon={<Pencil className="w-5 h-5 text-blue-600" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        {/* Product Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">在庫名 *</label>
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
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> 在庫写真の変更
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          {imagePreview ? (
            <div
              onClick={() => setShowImageControls(!showImageControls)}
              className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer"
            >
              <img src={imagePreview} alt="プレビュー" className="w-full h-full object-cover" />
              <div
                className={`absolute inset-0 bg-slate-900/50 transition-opacity flex items-center justify-center gap-2 ${
                  showImageControls
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  変更
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFile(null);
                    setImagePreview(null);
                    setShowImageControls(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  削除
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-600"
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

        {/* Tag Selection Dropdown + Checkboxes */}
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
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isTagDropdownOpen && (
            <>
              {/* Transparent Backdrop to close dropdown without closing modal */}
              <div
                className="fixed inset-0 z-10 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTagDropdownOpen(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-20 p-2 rounded-xl bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto space-y-1">
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
            </>
          )}
        </div>

        {/* JAN Code Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">JANコード (任意)</label>
          <input
            type="text"
            value={janCode}
            onChange={(e) => setJanCode(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
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
            {isUploading || isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            変更を保存
          </button>
        </div>
      </form>
    </FormModal>
  );
};
