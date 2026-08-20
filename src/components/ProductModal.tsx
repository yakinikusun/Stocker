import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Plus, Package, Upload, Image as ImageIcon, BookmarkPlus, Tag as TagIcon, FolderKanban, Loader2, ChevronDown, Lock, RotateCcw, Sparkles, FileText } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { uploadProductImage } from '../lib/supabase';
import { fetchProductByJanCode } from '../lib/barcodeLookup';
import { FormModal } from './FormModal';
import { InitialProductData } from '../types/stock';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJanCode?: string;
  initialData?: InitialProductData;
  onTriggerScanner?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  initialJanCode = '',
  initialData,
  onTriggerScanner
}) => {
  const { addProduct, addPreset, adjustStock, getProductsByJanCode, locations, tags, presets, products, locationFilter } = useStock();

  // Helper to determine the default location based on currently active location filter
  const getDefaultLocation = useCallback(() => {
    if (locationFilter && locationFilter !== 'all' && locations.some((l) => l.name === locationFilter)) {
      return locationFilter;
    }
    return locations.length > 0 ? locations[0].name : '冷蔵庫';
  }, [locationFilter, locations]);

  const [janCode, setJanCode] = useState('');
  const [name, setName] = useState('');
  const [currentStock, setCurrentStock] = useState<number>(1);
  const [location, setLocation] = useState<string>(getDefaultLocation);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [showImageControls, setShowImageControls] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  // Reactively check if current input values match an existing Preset (by Name and optional JAN)
  const matchedPreset = name.trim()
    ? presets.find(p =>
        p.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (janCode.trim() ? (p.jan_code && p.jan_code.trim() === janCode.trim()) : true)
      )
    : null;

  const selectedPresetId = matchedPreset ? matchedPreset.id : '';

  // Check matching existing product by JAN Code (if present) AND Product Name AND Storage Location
  const matchingJanProducts = (name.trim())
    ? products.filter(p =>
        p.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        p.location === (location || '冷蔵庫') &&
        (janCode.trim() ? (p.jan_code && p.jan_code.trim() === janCode.trim()) : true)
      )
    : [];

  const isExistingMatch = matchingJanProducts.length > 0;
  const matchedProduct = isExistingMatch ? matchingJanProducts[0] : null;

  // Safely derive displayed image preview without unsafe useEffect state mutation loops
  const displayImagePreview = isExistingMatch ? (matchedProduct?.image_url || null) : imagePreview;

  const [isFetchingJan, setIsFetchingJan] = useState(false);
  const [janFetchedSource, setJanFetchedSource] = useState<string | null>(null);

  const lastFetchedJanRef = useRef<string>('');

  // Clear all form inputs
  const handleClearForm = useCallback(() => {
    setName('');
    setJanCode('');
    setCurrentStock(1);
    setLocation(getDefaultLocation());
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    setSelectedTags([]);
    setMemo('');
    setSaveAsPreset(false);
    setShowImageControls(false);
    setJanFetchedSource(null);
    setIsFetchingJan(false);
    lastFetchedJanRef.current = '';
    setError(null);
  }, [getDefaultLocation]);

  useEffect(() => {
    if (!isOpen) {
      handleClearForm();
    } else if (!initialJanCode) {
      handleClearForm();
    }
  }, [isOpen, initialJanCode, handleClearForm]);

  useEffect(() => {
    if (initialJanCode) {
      setJanCode(initialJanCode);
      if (initialData) {
        if (initialData.name !== undefined) setName(initialData.name);
        if (initialData.location !== undefined) {
          setLocation(initialData.location);
        } else {
          setLocation(getDefaultLocation());
        }
        if (initialData.tags !== undefined) setSelectedTags(initialData.tags);
        if (initialData.memo !== undefined) setMemo(initialData.memo);
        if (initialData.imageUrl !== undefined) {
          setImagePreview(initialData.imageUrl);
          setImageUrl(initialData.imageUrl);
        }
      } else {
        const matches = getProductsByJanCode(initialJanCode);
        if (matches.length > 0) {
          // If a specific location is filtered and a match exists in that location, prioritize it
          const matchInFilter = locationFilter !== 'all' ? matches.find(m => m.location === locationFilter) : null;
          const targetMatch = matchInFilter || matches[0];
          setName(targetMatch.name);
          setLocation(targetMatch.location);
          setSelectedTags(targetMatch.tags);
          if (targetMatch.memo) setMemo(targetMatch.memo);
          if (targetMatch.image_url) setImagePreview(targetMatch.image_url);
        } else {
          const matchedPreset = presets.find(p => p.jan_code && p.jan_code.trim() === initialJanCode.trim());
          if (matchedPreset) {
            setName(matchedPreset.name);
            setLocation(getDefaultLocation());
            if (matchedPreset.tags) setSelectedTags(matchedPreset.tags);
            if (matchedPreset.image_url) setImagePreview(matchedPreset.image_url);
          } else {
            setLocation(getDefaultLocation());
          }
        }
      }
    }
  }, [initialJanCode, initialData, presets, getDefaultLocation, locationFilter, getProductsByJanCode]);

  // Open Food Facts Barcode Lookup with Synchronous Ref Guard
  useEffect(() => {
    let isMounted = true;
    const cleanJan = janCode.trim();

    if (!cleanJan || cleanJan.length < 8) {
      setJanFetchedSource(null);
      setIsFetchingJan(false);
      return;
    }

    // Synchronous Guard: Skip if we already started or completed lookup for this exact JAN code
    if (lastFetchedJanRef.current === cleanJan) {
      return;
    }

    // Skip external fetch if local product or preset exists
    const matches = getProductsByJanCode(cleanJan);
    if (matches.length > 0) {
      setJanFetchedSource(null);
      setIsFetchingJan(false);
      return;
    }

    const matchedPreset = presets.find(p => p.jan_code && p.jan_code.trim() === cleanJan);
    if (matchedPreset) {
      setJanFetchedSource(null);
      setIsFetchingJan(false);
      return;
    }

    // Set Ref IMMEDIATELY synchronously to prevent re-triggering during re-renders!
    lastFetchedJanRef.current = cleanJan;

    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsFetchingJan(true);

      fetchProductByJanCode(cleanJan)
        .then((info) => {
          if (!isMounted) return;
          setIsFetchingJan(false);

          if (info) {
            if (info.name) setName((prev) => (prev ? prev : info.name));
            if (info.imageUrl) {
              setImagePreview((prev) => (prev ? prev : info.imageUrl));
              setImageUrl((prev) => (prev ? prev : info.imageUrl || ''));
            }
            setJanFetchedSource(info.source);
          }
        })
        .catch(() => {
          if (isMounted) setIsFetchingJan(false);
        });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [janCode]);

  useEffect(() => {
    if (locations.length > 0 && !location) {
      setLocation(getDefaultLocation());
    }
  }, [locations, getDefaultLocation, location]);

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

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
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

  const handleSelectPresetCall = (presetId: string) => {
    setSaveAsPreset(false);
    if (!presetId) {
      handleClearForm();
      return;
    }

    const target = presets.find((p) => p.id === presetId);
    if (target) {
      setName(target.name);
      if (target.jan_code) setJanCode(target.jan_code);
      if (target.tags) setSelectedTags(target.tags);
      if (target.image_url) {
        setImageUrl(target.image_url);
        setImagePreview(target.image_url);
      } else {
        setImageUrl('');
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('在庫名を入力してください。');
      return;
    }

    // If an existing matching product is detected, directly adjust stock of that existing product!
    if (isExistingMatch && matchingJanProducts.length > 0) {
      setIsSubmitting(true);
      const targetProduct = matchingJanProducts[0];
      const success = await adjustStock(targetProduct.id, Math.max(1, currentStock));
      setIsSubmitting(false);

      if (success) {
        handleClearForm();
        onClose();
      }
      return;
    }

    const finalJan = janCode.trim();
    setIsSubmitting(true);
    let finalImageUrl = imageUrl.trim() || null;

    if (imageFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadProductImage(imageFile);
      } catch (err: any) {
        console.error('Image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }

    const result = await addProduct({
      jan_code: finalJan,
      name: name.trim(),
      current_stock: Math.max(0, currentStock),
      location: location || '冷蔵庫',
      tags: selectedTags,
      memo: memo.trim() || undefined,
      image_url: finalImageUrl
    });

    if (result && saveAsPreset && !matchedPreset) {
      await addPreset({
        jan_code: finalJan,
        name: name.trim(),
        tags: selectedTags,
        image_url: finalImageUrl
      });
    }

    setIsSubmitting(false);

    if (result) {
      handleClearForm();
      onClose();
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="在庫在庫の新規追加・補充"
      icon={<Package className="w-5 h-5 text-blue-600" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Preset Selector Call-out */}
        {presets.length > 0 && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-purple-600" /> プリセットから呼び出す
              </label>
              {(name || janCode || imagePreview || selectedTags.length > 0) && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline transition-all"
                  title="入力内容を全クリア"
                >
                  <RotateCcw className="w-3 h-3" /> クリア
                </button>
              )}
            </div>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPresetCall(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-purple-200 text-purple-900 focus:outline-none"
            >
              <option value="">-- 登録済みプリセットを選択 --</option>
              {[...presets].sort((a, b) => a.name.localeCompare(b.name, 'ja')).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">在庫名 *</label>
          <input
            type="text"
            required
            placeholder="例: パック牛乳 1000ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Storage Location Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <FolderKanban className="w-3.5 h-3.5 text-blue-500" /> 保管場所 *
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload Zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> 
              {isExistingMatch ? '写真・画像プレビュー' : '写真・画像アップロード'}
            </span>
            {isExistingMatch && (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> 登録済み情報 (編集不可)
              </span>
            )}
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          {displayImagePreview ? (
            <div
              onClick={() => {
                if (!isExistingMatch) setShowImageControls(!showImageControls);
              }}
              className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer"
            >
              <img
                src={displayImagePreview}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              {!isExistingMatch && (
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
                      setImageUrl('');
                      setShowImageControls(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-3 text-center">
              {isExistingMatch ? (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-8 h-8 mb-1" />
                  <span className="text-xs font-medium">画像未登録</span>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">
                    クリックして画像をアップロード
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPEG, PNG, WEBP 画像ファイルに対応
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* JAN Code Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>JANコード (任意)</span>
            {onTriggerScanner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerScanner();
                }}
                className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <Camera className="w-3.5 h-3.5" /> スキャン
              </button>
            )}
          </label>
          <input
            type="text"
            placeholder="4901234567890"
            value={janCode}
            onChange={(e) => setJanCode(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
          />
          {isFetchingJan && (
            <p className="text-[11px] text-blue-600 flex items-center gap-1 pt-0.5 animate-pulse font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Open Food Facts で在庫情報を検索中...
            </p>
          )}
          {janFetchedSource && !isFetchingJan && (
            <p className="text-[11px] text-emerald-700 flex items-center gap-1 pt-0.5 font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-500" /> {janFetchedSource} より在庫名・画像を自動読み込みしました
            </p>
          )}
        </div>

        {/* Initial Stock Count */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">追加・補充数量 (小数可: 0.5, 1.5 等)</label>
          <input
            type="number"
            step="any"
            min="0"
            value={currentStock}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentStock(isNaN(val) ? 0 : Math.round(val * 100) / 100);
            }}
            className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tag Selector / Display */}
        <div className="space-y-1 relative" ref={tagDropdownRef}>
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-amber-500" /> 分類タグ
            </span>
            {isExistingMatch && (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> 登録済み情報 (編集不可)
              </span>
            )}
          </label>

          {isExistingMatch ? (
            /* Read-Only Display of Attached Tags for Existing Product */
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap gap-1.5 min-h-[38px] items-center">
              {matchingJanProducts[0]?.tags && matchingJanProducts[0].tags.length > 0 ? (
                matchingJanProducts[0].tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    #{t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 font-medium">タグ未設定</span>
              )}
            </div>
          ) : (
            /* Editable Tag Selector Dropdown for New Product */
            <>
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
            </>
          )}
        </div>

        {/* Memo / Notes Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              メモ・備考
            </span>
            {isExistingMatch && (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> 登録済み情報 (編集不可)
              </span>
            )}
          </label>

          {isExistingMatch ? (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 min-h-[42px] flex items-center">
              {matchedProduct?.memo ? (
                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                  {matchedProduct.memo}
                </p>
              ) : (
                <span className="text-xs text-slate-400 font-medium">メモ未設定</span>
              )}
            </div>
          ) : (
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={200}
              className="w-full px-3.5 py-2 min-h-[60px] text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-y"
            />
          )}
        </div>

        {/* Save to Preset Checkbox */}
        {!matchedPreset && (
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
              <input
                type="checkbox"
                checked={saveAsPreset}
                onChange={(e) => setSaveAsPreset(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>この在庫を在庫プリセットにも追加保存する</span>
            </label>
          </div>
        )}

        {/* Dynamic Action Button */}
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
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
              isExistingMatch
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 画像送信中...
              </>
            ) : isExistingMatch ? (
              <>
                <Plus className="w-4 h-4" /> 在庫を追加 (+{currentStock})
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> 新規在庫として保存
              </>
            )}
          </button>
        </div>
      </form>
    </FormModal>
  );
};
