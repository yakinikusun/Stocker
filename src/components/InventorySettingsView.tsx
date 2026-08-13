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
  Check,
  Loader2,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';
import { Preset, Location, Tag } from '../types/stock';
import { uploadProductImage } from '../lib/supabase';
import { FormModal } from './FormModal';

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

  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'presets' | 'tags'>('presets');

  // Preset Search & Sort state
  const [presetSearch, setPresetSearch] = useState('');
  type PresetSortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';
  const [presetSort, setPresetSort] = useState<PresetSortOption>('created_desc');

  // Shared FormModal open states (Addition)
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState(false);

  // Shared FormModal open states (Editing)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocationName, setEditLocationName] = useState('');

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');

  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetJan, setEditPresetJan] = useState('');
  const [editPresetImageFile, setEditPresetImageFile] = useState<File | null>(null);
  const [editPresetImagePreview, setEditPresetImagePreview] = useState<string | null>(null);

  // Addition Input states
  const [newLocationName, setNewLocationName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const [presetName, setPresetName] = useState('');
  const [presetJan, setPresetJan] = useState('');
  const [presetTag, setPresetTag] = useState('');
  const [presetImageFile, setPresetImageFile] = useState<File | null>(null);
  const [presetImagePreview, setPresetImagePreview] = useState<string | null>(null);

  // Preset Call Modal
  const [selectedPresetForCall, setSelectedPresetForCall] = useState<Preset | null>(null);
  const [callLocation, setCallLocation] = useState<string>('冷蔵庫');
  const [callQuantity, setCallQuantity] = useState<number>(1);

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddPresetImageControls, setShowAddPresetImageControls] = useState(false);
  const [showEditPresetImageControls, setShowEditPresetImageControls] = useState(false);
  const presetFileInputRef = useRef<HTMLInputElement | null>(null);
  const editPresetFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleEditPresetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditPresetImageFile(file);
      setEditPresetImagePreview(URL.createObjectURL(file));
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
      setIsAddLocationModalOpen(false);
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
    const ok = await addTag(newTagName.trim());
    if (ok) {
      showTempMessage(`タグ「${newTagName}」を追加しました。`);
      setNewTagName('');
      setIsAddTagModalOpen(false);
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

  // Preset Handlers
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
      setIsAddPresetModalOpen(false);
    }
  };

  const handleUpdatePresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editPresetName.trim()) return;

    let finalImageUrl = editPresetImagePreview;

    if (editPresetImageFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadProductImage(editPresetImageFile);
      } catch (err) {
        console.error('Preset edit image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }

    const ok = await updatePreset(editingPreset.id, {
      name: editPresetName.trim(),
      jan_code: editPresetJan.trim() || undefined,
      image_url: finalImageUrl
    });

    if (ok) {
      showTempMessage(`プリセット「${editPresetName}」を更新しました。`);
      setEditingPreset(null);
      setEditPresetImageFile(null);
      setEditPresetImagePreview(null);
    }
  };

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> 在庫設定マスタ管理
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              冷蔵庫・冷凍庫等の保管場所、分類タグ、汎用在庫プリセットの確認・編集・追加・削除を行えます。
            </p>
          </div>

          {/* Action Trigger Buttons */}
          {activeSubTab === 'locations' && (
            <button
              onClick={() => setIsAddLocationModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> 保管場所を追加
            </button>
          )}

          {activeSubTab === 'presets' && (
            <button
              onClick={() => setIsAddPresetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> プリセットを追加
            </button>
          )}

          {activeSubTab === 'tags' && (
            <button
              onClick={() => setIsAddTagModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> タグを追加
            </button>
          )}
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
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
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SubTab 1: Storage Locations */}
      {activeSubTab === 'locations' && (
        <div className="clean-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">登録済み保管場所一覧</h3>
            <button
              onClick={() => setIsAddLocationModalOpen(true)}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 新規追加
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between group"
              >
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
                    title="編集 (モーダル表示)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm(`保管場所「${loc.name}」および、そこに登録されているすべての在庫商品を削除しますか？`)) {
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Presets */}
      {activeSubTab === 'presets' && (() => {
        const filteredPresetsList = presets.filter(p => {
          if (!presetSearch.trim()) return true;
          const term = presetSearch.toLowerCase().trim();
          return (
            p.name.toLowerCase().includes(term) ||
            (p.jan_code && p.jan_code.includes(term)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
          );
        });

        const sortedFilteredPresets = [...filteredPresetsList].sort((a, b) => {
          switch (presetSort) {
            case 'created_desc':
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            case 'created_asc':
              return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            case 'updated_desc':
              return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
            case 'updated_asc':
              return new Date(a.updated_at || a.created_at || 0).getTime() - new Date(b.updated_at || b.created_at || 0).getTime();
            case 'name_asc':
              return a.name.localeCompare(b.name, 'ja');
            case 'name_desc':
              return b.name.localeCompare(a.name, 'ja');
            default:
              return 0;
          }
        });

        return (
          <div className="clean-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">登録済みプリセット一覧 (ストック再補充用)</h3>
              <button
                onClick={() => setIsAddPresetModalOpen(true)}
                className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 新規追加
              </button>
            </div>

            {/* Presets Controls: Search & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="プリセット名、JAN、タグで検索..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
                {presetSearch && (
                  <button
                    onClick={() => setPresetSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    クリア
                  </button>
                )}
              </div>

              <select
                value={presetSort}
                onChange={(e) => setPresetSort(e.target.value as PresetSortOption)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
              >
                <option value="created_desc">並び替え: 登録が新しい順</option>
                <option value="created_asc">並び替え: 登録が古い順</option>
                <option value="updated_desc">並び替え: 更新が新しい順</option>
                <option value="updated_asc">並び替え: 更新が古い順</option>
                <option value="name_asc">並び替え: 名前順 (あ〜ん)</option>
                <option value="name_desc">並び替え: 名前順 (ん〜あ)</option>
              </select>
            </div>

            {sortedFilteredPresets.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-400 text-xs">
                該当するプリセットが存在しません。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sortedFilteredPresets.map((pst) => (
              <div
                key={pst.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPreset(pst);
                        setEditPresetName(pst.name);
                        setEditPresetJan(pst.jan_code || '');
                        setEditPresetImagePreview(pst.image_url || null);
                        setEditPresetImageFile(null);
                      }}
                      className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                      title="編集 (モーダル表示)"
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
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })()}

      {/* SubTab 3: Tags */}
      {activeSubTab === 'tags' && (
        <div className="clean-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">登録済みタグ一覧</h3>
            <button
              onClick={() => setIsAddTagModalOpen(true)}
              className="text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 新規追加
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {tags.map((t) => (
              <div
                key={t.id}
                className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2"
              >
                <TagIcon className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                <button
                  onClick={() => {
                    setEditingTag(t);
                    setEditTagName(t.name);
                  }}
                  className="text-slate-400 hover:text-amber-600 transition-colors ml-1 p-0.5"
                  title="編集 (モーダル表示)"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`タグ「${t.name}」を削除しますか？`)) {
                      deleteTag(t.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                  title="削除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* 1. Modal: Edit Storage Location */}
      {/* =============================================================== */}
      <FormModal
        isOpen={Boolean(editingLocation)}
        onClose={() => setEditingLocation(null)}
        title="保管場所の編集"
        icon={<Pencil className="w-4 h-4 text-blue-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateLocationSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">保管場所名 *</label>
            <input
              type="text"
              required
              value={editLocationName}
              onChange={(e) => setEditLocationName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingLocation(null)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              <Check className="w-4 h-4" /> 変更を保存
            </button>
          </div>
        </form>
      </FormModal>

      {/* =============================================================== */}
      {/* 2. Modal: Edit Tag */}
      {/* =============================================================== */}
      <FormModal
        isOpen={Boolean(editingTag)}
        onClose={() => setEditingTag(null)}
        title="タグの編集"
        icon={<Pencil className="w-4 h-4 text-amber-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateTagSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">タグ名 *</label>
            <input
              type="text"
              required
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingTag(null)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              <Check className="w-4 h-4" /> 変更を保存
            </button>
          </div>
        </form>
      </FormModal>

      {/* =============================================================== */}
      {/* 3. Modal: Edit Preset (Includes Image Upload / Change) */}
      {/* =============================================================== */}
      <FormModal
        isOpen={Boolean(editingPreset)}
        onClose={() => setEditingPreset(null)}
        title="プリセットの編集"
        icon={<Pencil className="w-4 h-4 text-purple-600" />}
        maxWidth="md"
      >
        <form onSubmit={handleUpdatePresetSubmit} className="space-y-3 text-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">商品テンプレート名 *</label>
            <input
              type="text"
              required
              value={editPresetName}
              onChange={(e) => setEditPresetName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> プリセット画像の変更
            </label>
            <input
              type="file"
              ref={editPresetFileInputRef}
              accept="image/*"
              onChange={handleEditPresetImageChange}
              className="hidden"
            />
            {editPresetImagePreview ? (
              <div
                onClick={() => setShowEditPresetImageControls(!showEditPresetImageControls)}
                className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer"
              >
                <img src={editPresetImagePreview} alt="プレビュー" className="w-full h-full object-cover" />
                <div
                  className={`absolute inset-0 bg-slate-900/50 transition-opacity flex items-center justify-center gap-2 ${
                    showEditPresetImageControls
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      editPresetFileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditPresetImageFile(null);
                      setEditPresetImagePreview(null);
                      setShowEditPresetImageControls(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => editPresetFileInputRef.current?.click()}
                className="w-full h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-slate-600"
              >
                <Upload className="w-4 h-4" /> 画像をアップロード
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">JANコード (任意)</label>
            <input
              type="text"
              value={editPresetJan}
              onChange={(e) => setEditPresetJan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingPreset(null)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 変更を保存
            </button>
          </div>
        </form>
      </FormModal>

      {/* Shared FormModal 4: Add Location */}
      <FormModal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        title="保管場所の新規追加"
        icon={<FolderKanban className="w-4 h-4 text-blue-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleAddLocationSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">保管場所名 *</label>
            <input
              type="text"
              required
              placeholder="例: 野菜室、チルド室、スパイスラック"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddLocationModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> 保存する
            </button>
          </div>
        </form>
      </FormModal>

      {/* Shared FormModal 5: Add Preset */}
      <FormModal
        isOpen={isAddPresetModalOpen}
        onClose={() => setIsAddPresetModalOpen(false)}
        title="在庫プリセットの新規追加"
        icon={<BookmarkPlus className="w-4 h-4 text-purple-600" />}
        maxWidth="md"
      >
        <form onSubmit={handleAddPresetSubmit} className="space-y-3 text-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">商品テンプレート名 *</label>
            <input
              type="text"
              required
              placeholder="例: たまご 10個パック"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">画像アップロード</label>
            <input
              type="file"
              ref={presetFileInputRef}
              accept="image/*"
              onChange={handlePresetImageChange}
              className="hidden"
            />
            {presetImagePreview ? (
              <div
                onClick={() => setShowAddPresetImageControls(!showAddPresetImageControls)}
                className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer"
              >
                <img src={presetImagePreview} alt="プレビュー" className="w-full h-full object-cover" />
                <div
                  className={`absolute inset-0 bg-slate-900/50 transition-opacity flex items-center justify-center gap-2 ${
                    showAddPresetImageControls
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      presetFileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPresetImageFile(null);
                      setPresetImagePreview(null);
                      setShowAddPresetImageControls(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    削除
                  </button>
                </div>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">JANコード (任意)</label>
            <input
              type="text"
              placeholder="4901234567890"
              value={presetJan}
              onChange={(e) => setPresetJan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddPresetModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 保存する
            </button>
          </div>
        </form>
      </FormModal>

      {/* Shared FormModal 6: Add Tag */}
      <FormModal
        isOpen={isAddTagModalOpen}
        onClose={() => setIsAddTagModalOpen(false)}
        title="タグの新規追加"
        icon={<TagIcon className="w-4 h-4 text-amber-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleAddTagSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">タグ名 *</label>
            <input
              type="text"
              required
              placeholder="例: 生鮮食品、賞味期限近"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddTagModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> 保存する
            </button>
          </div>
        </form>
      </FormModal>

      {/* Shared FormModal 7: Preset Call Modal */}
      <FormModal
        isOpen={Boolean(selectedPresetForCall)}
        onClose={() => setSelectedPresetForCall(null)}
        title="プリセットから在庫に追加"
        icon={<Sparkles className="w-4 h-4 text-purple-600" />}
        maxWidth="sm"
      >
        {selectedPresetForCall && (
          <div className="space-y-4">
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

            {/* Storage Location Selection */}
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
        )}
      </FormModal>
    </div>
  );
};
