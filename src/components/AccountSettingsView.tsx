import React, { useState } from 'react';
import { User, Shield, Key, Database, LogOut, Check, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';

export const AccountSettingsView: React.FC = () => {
  const { user, isSupabaseActive, supabaseConfig, updateSupabaseConfig, switchRole } = useAuth();
  const { resetToDefaultDemoData } = useStock();

  const [urlInput, setUrlInput] = useState(supabaseConfig.url);
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Supabase設定の変更は管理者権限が必要です。');
      return;
    }
    updateSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSaveSuccess('Supabase設定を更新しました。データを同期します。');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleClearConfig = () => {
    if (!isAdmin) {
      alert('Supabase設定の変更は管理者権限が必要です。');
      return;
    }
    setUrlInput('');
    setKeyInput('');
    updateSupabaseConfig('', '');
    setSaveSuccess('Supabase接続を解除し、LocalStorageデモモードに切替えました。');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Current User Profile Card */}
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> アカウント情報
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdmin ? '管理者 (admin)' : '一般ユーザー (member)'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
              {user?.name?.[0] || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm">{user?.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
            <p className="text-[11px] text-slate-400 mt-1">ID: {user?.id}</p>
          </div>
        </div>

        {/* Demo Role Switcher for Testing */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700 block mb-2">デモ権限の切り替え (検証用)</label>
          <div className="flex gap-2">
            <button
              onClick={() => switchRole('admin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                isAdmin
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              管理者 (admin) に切替
            </button>
            <button
              onClick={() => switchRole('member')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                !isAdmin
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              一般ユーザー (member) に切替
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Connection Settings (Restricted to Admin Only) */}
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> Supabase クラウド接続設定
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              SupabaseのURLとAnon Keyを設定することでライブ同期可能になります（※管理者のみ変更可）。
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isSupabaseActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isSupabaseActive ? '● Supabase 接続中' : '○ LocalStorage デモ動作中'}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Requirement 7: If not admin, show lock overlay or disabled state */}
        {!isAdmin ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-500" /> Supabase接続設定の変更は管理者権限が必要です。
            </div>
            <div className="text-xs text-slate-500 space-y-1 font-mono">
              <p>接続URL: {supabaseConfig.url ? `${supabaseConfig.url.slice(0, 20)}...` : '未設定'}</p>
              <p>接続状態: {isSupabaseActive ? '有効 (同期中)' : 'デモモード'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Supabase anon (public) Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearConfig}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                接続を解除 (デモモードへ)
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Key className="w-4 h-4" /> 接続設定を保存
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reset Local Demo Data */}
      <div className="clean-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-500" /> デモデータのリセット
        </h3>
        <p className="text-xs text-slate-500">
          LocalStorage内のローカルデータを初期状態にリセットします。（Supabase上のデータには影響しません）
        </p>
        <button
          onClick={() => {
            if (confirm('ローカルデモデータを初期状態にリセットしますか？')) {
              resetToDefaultDemoData();
              setSaveSuccess('ローカルデータを初期化しました。');
              setTimeout(() => setSaveSuccess(null), 3000);
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> 初期デモデータにリセット
        </button>
      </div>
    </div>
  );
};
