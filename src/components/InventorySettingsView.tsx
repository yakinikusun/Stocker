import React, { useState, useRef } from 'react';
import {
  FolderKanban,
  Tag as TagIcon,
  BookmarkPlus,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  Upload,
  Pencil,
  X,
  Check
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';
import { Preset, Location, Tag } from '../types/stock';
import { uploadProductImage } from '../lib/supabase';

interface InventorySettingsViewProps {
  onCallPresetToStock: (preset: Preset) => void;
}

export const InventorySettingsView: React.FC<InventorySettingsViewProps> = ({ onCallPresetToStock }) => {
  const {
    locations,
    tags,
    presets,
    addLocation,
    updateLocation,
    deleteLocation,
    addTag,
    updateTag,
    deleteTag,
    addPreset,
    updatePreset,
    deletePreset,
    createProductFromPreset
  } = useStock();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'presets' | 'tags'>('locations');

  // Input & Edit states
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocationName, setEditLocationName] = useState('');

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');

  // Preset input state (Task 3: unlinked location)
  const [presetName, setPresetName] = useState('');
  const [presetJan, setPresetJan] = useState('');
  const [presetTag, setPresetTag] = useState('');
  const [presetImageFile, setPresetImageFile] = useState<File | null>(null);
  const [presetImagePreview, setPresetImagePreview] = useState<string | null>(null);

  // Preset Editing
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetJan, setEditPresetJan] = useState('');

  // Preset Quantity & Location Call Modal (Task 3 & Task 6)
  const [selectedPresetForCall, setSelectedPresetForCall] = useState<Preset | null>(null);
  const [callLocation, setCallLocation] = useState<string>('冷蔵庫');
  const [callQuantity, setCallQuantity] = useState<number>(1);

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const presetFileInputRef = useRef<HTMLInputElement | null>(null);

  const showTempMessage = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePresetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPresetImageFile(file);
      setPresetImagePreview(URL.createObjectURL(file));
    }
  };

  // Location Handlers
  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    const ok = await addLocation(newLocationName.trim());
    if (ok) {
      showTempMessage(`保管場所「${newLocationName}」を追加しました。`);
      setNewLocationName('');
    }
  };

  const handleUpdateLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editLocationName.trim()) return;
    const ok = await updateLocation(editingLocation.id, editLocationName.trim());
    if (ok) {
      showTempMessage(`保管場所を「${editLocationName}」に更新しました。`);
      setEditingLocation(null);
    }
  };

  // Tag Handlers
  const handleAddTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const ok = await addTag(newTagName.trim(), newTagColor);
    if (ok) {
      showTempMessage(`タグ「${newTagName}」を追加しました。`);
      setNewTagName('');
    }
  };

  const handleUpdateTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;
    const ok = await updateTag(editingTag.id, editTagName.trim());
    if (ok) {
      showTempMessage(`タグを「${editTagName}」に更新しました。`);
      setEditingTag(null);
    }
  };

  // Preset Handlers (Unlinked location)
  const handleAddPresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    let imageUrl: string | null = null;
    if (presetImageFile) {
      setIsUploading(true);
      try {
        imageUrl = await uploadProductImage(presetImageFile);
      } catch (err) {
        console.error('Preset image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }

    const ok = await addPreset({
      name: presetName.trim(),
      jan_code: presetJan.trim() || undefined,
      tags: presetTag ? [presetTag] : [],
      image_url: imageUrl
    });

    if (ok) {
      showTempMessage(`プリセット「${presetName}」を作成しました。`);
      setPresetName('');
      setPresetJan('');
      setPresetImageFile(null);
      setPresetImagePreview(null);
    }
  };

  const handleUpdatePresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editPresetName.trim()) return;

    const ok = await updatePreset(editingPreset.id, {
      name: editPresetName.trim(),
      jan_code: editPresetJan.trim() || undefined
    });

    if (ok) {
      showTempMessage(`プリセット「${editPresetName}」を更新しました。`);
      setEditingPreset(null);
    }
  };

  // Execute Call Preset with Location & Quantity
  const handleExecuteCallPreset = async () => {
    if (!selectedPresetForCall) return;
    const loc = callLocation || (locations[0]?.name ?? '冷蔵庫');
    await createProductFromPreset(selectedPresetForCall, loc, Math.max(1, callQuantity));
    showTempMessage(`「${selectedPresetForCall.name}」を (${loc}) に ${callQuantity} 個在庫追加しました。`);
    setSelectedPresetForCall(null);
    setCallQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub Navigation */}
      <div className="clean-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> 在庫設定マスタ管理
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              冷蔵庫・冷凍庫等の保管場所、分類タグ、汎用在庫プリセットの確認・編集・追加・削除を行えます。
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('locations')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'locations'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-blue-500" /> 保管場所一覧 ({locations.length})
          </button>
          <button
            onClick={() => setActiveSubTab('presets')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'presets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookmarkPlus className="w-4 h-4 text-purple-500" /> 在庫プリセット ({presets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('tags')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'tags'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TagIcon className="w-4 h-4 text-amber-500" /> タグ一覧 ({tags.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Storage Locations */}
      {activeSubTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clean-card p-5 space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> 保管場所の追加
            </h3>
            <form onSubmit={handleAddLocationSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">保管場所名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 野菜室、チルド室、スパイスラック"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> 保管場所を保存
              </button>
            </form>
          </div>

          <div className="clean-card p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-800">登録済み保管場所一覧</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map((loc) => {
                const isEditing = editingLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between group"
                  >
                    {isEditing ? (
                      <form onSubmit={handleUpdateLocationSubmit} className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-blue-500 focus:outline-none"
                        />
                        <button type="submit" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setEditingLocation(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <FolderKanban className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-800">{loc.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingLocation(loc);
                              setEditLocationName(loc.name);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`保管場所「${loc.name}」を削除しますか？`)) {
                                  deleteLocation(loc.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="削除 (管理者のみ)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Presets (Task 3: Unlinked Location) */}
      {activeSubTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clean-card p-5 space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" /> プリセット新規登録
            </h3>
            <form onSubmit={handleAddPresetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">商品テンプレート名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: たまご 10個パック"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">画像アップロード</label>
                <input
                  type="file"
                  ref={presetFileInputRef}
                  accept="image/*"
                  onChange={handlePresetImageChange}
                  className="hidden"
                />
                {presetImagePreview ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-300">
                    <img src={presetImagePreview} alt="プレビュー" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    onClick={() => presetFileInputRef.current?.click()}
                    className="w-full h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-purple-50/50 flex flex-col items-center justify-center cursor-pointer p-2 text-center"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-600">画像を選択</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">JANコード (任意)</label>
                <input
                  type="text"
                  placeholder="4901234567890"
                  value={presetJan}
                  onChange={(e) => setPresetJan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> 汎用プリセットを登録
              </button>
            </form>
          </div>

          <div className="clean-card p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-800">登録済みプリセット一覧 (ストック再補充用)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((pst) => {
                const isEditing = editingPreset?.id === pst.id;

                return (
                  <div
                    key={pst.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 group"
                  >
                    {isEditing ? (
                      <form onSubmit={handleUpdatePresetSubmit} className="space-y-2 w-full">
                        <input
                          type="text"
                          required
                          value={editPresetName}
                          onChange={(e) => setEditPresetName(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-purple-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="JANコード"
                          value={editPresetJan}
                          onChange={(e) => setEditPresetJan(e.target.value)}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button type="button" onClick={() => setEditingPreset(null)} className="px-2.5 py-1 text-[11px] rounded border border-slate-300">
                            キャンセル
                          </button>
                          <button type="submit" className="px-2.5 py-1 text-[11px] rounded bg-purple-600 text-white font-semibold">
                            更新
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 min-w-0">
                          {pst.image_url ? (
                            <img
                              src={pst.image_url}
                              alt={pst.name}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-slate-800 truncate">{pst.name}</h4>
                            {pst.jan_code && (
                              <p className="font-mono text-[10px] text-slate-400 mt-1">JAN: {pst.jan_code}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedPresetForCall(pst);
                              setCallLocation(locations[0]?.name || '冷蔵庫');
                              setCallQuantity(1);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-all"
                            title="場所・個数を指定して在庫に追加"
                          >
                            <Sparkles className="w-3 h-3" /> 在庫に追加
                          </button>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingPreset(pst);
                                setEditPresetName(pst.name);
                                setEditPresetJan(pst.jan_code || '');
                              }}
                              className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                              title="編集"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`プリセット「${pst.name}」を削除しますか？`)) {
                                  deletePreset(pst.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tags */}
      {activeSubTab === 'tags' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clean-card p-5 space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" /> タグの追加
            </h3>
            <form onSubmit={handleAddTagSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">タグ名</label>
                <input
                  type="text"
                  required
                  placeholder="例: 生鮮食品、賞味期限近"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> タグを保存
              </button>
            </form>
          </div>

          <div className="clean-card p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-800">登録済みタグ一覧</h3>
            <div className="flex flex-wrap gap-2.5">
              {tags.map((t) => {
                const isEditing = editingTag?.id === t.id;

                return (
                  <div
                    key={t.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2"
                  >
                    {isEditing ? (
                      <form onSubmit={handleUpdateTagSubmit} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          className="px-2 py-0.5 text-xs rounded border border-amber-500 focus:outline-none"
                        />
                        <button type="submit" className="p-0.5 text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingTag(null)} className="p-0.5 text-slate-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <TagIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                        <button
                          onClick={() => {
                            setEditingTag(t);
                            setEditTagName(t.name);
                          }}
                          className="text-slate-400 hover:text-amber-600 transition-colors ml-1"
                          title="編集"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`タグ「${t.name}」を削除しますか？`)) {
                              deleteTag(t.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task 3 & 6: Preset Location + Quantity Prompt Modal */}
      {selectedPresetForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl clean-modal border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> プリセットから在庫に追加
              </h3>
              <button onClick={() => setSelectedPresetForCall(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-3">
              {selectedPresetForCall.image_url ? (
                <img src={selectedPresetForCall.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 truncate">{selectedPresetForCall.name}</p>
                {selectedPresetForCall.jan_code && (
                  <p className="text-[10px] text-purple-700 font-mono mt-0.5">JAN: {selectedPresetForCall.jan_code}</p>
                )}
              </div>
            </div>

            {/* Target Storage Location Selection (Task 3) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">追加先の保管場所 *</label>
              <select
                value={callLocation}
                onChange={(e) => setCallLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Controls */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">追加個数</label>
              <div className="flex items-center justify-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCallQuantity(Math.max(1, callQuantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={callQuantity}
                  onChange={(e) => setCallQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-lg font-bold font-mono py-0.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCallQuantity(callQuantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPresetForCall(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleExecuteCallPreset}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              >
                ({callLocation}) に {callQuantity} 個追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
