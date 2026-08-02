import React, { useState } from 'react';
import { X, Shield, Database, User, RefreshCw, Key, ExternalLink, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, switchRole, supabaseConfig, updateSupabaseConfig, isSupabaseActive } = useAuth();
  const { resetToDefaultDemoData } = useStock();

  const [url, setUrl] = useState(supabaseConfig.url);
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(url.trim(), anonKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearConfig = () => {
    updateSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-modal border border-slate-700/60 shadow-2xl max-h-[90vh] flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100">システム設定＆Supabase連携</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: User Profile & Role Switcher */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" /> ユーザー権限設定
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-100">{user?.name || 'ゲストユーザー'}</div>
                  <div className="text-xs text-slate-400">{user?.email}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                    user?.role === 'admin'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                      : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {user?.role === 'admin' ? '管理者 (admin)' : '一般メンバー (member)'}
                </span>
              </div>

              {/* Role Toggle Switcher */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">操作権限の切替（動作デモ用）:</span>
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => switchRole('member')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      user?.role === 'member'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => switchRole('admin')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      user?.role === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Supabase Connection Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" /> Supabase クラウドDB設定
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isSupabaseActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}
              >
                {isSupabaseActive ? '● Supabase 接続中' : '○ ローカルデモDB動作中'}
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-400">
                本番運用のSupabaseプロジェクト URL と anon API Key を設定すると、直接PostgreSQLデータベースと通信します。
              </p>

              {savedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs">
                  設定を保存しました。Supabaseへの接続を更新しました。
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Supabase URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSupabaseActive && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    設定解除 (デモDBに戻す)
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-950"
                >
                  設定を保存して接続
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Reset Demo Data */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-semibold text-slate-200">ローカルデモデータの初期化</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">サンプル商品・初期履歴に戻します。</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetToDefaultDemoData();
                alert('デモ初期データにリセットされました。');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
