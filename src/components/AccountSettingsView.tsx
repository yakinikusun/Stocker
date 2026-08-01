import React, { useState } from 'react';
import { User, LogOut, Shield, Database, Key, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';

export const AccountSettingsView: React.FC = () => {
  const { user, switchRole, logout, supabaseConfig, updateSupabaseConfig, isSupabaseActive } = useAuth();
  const { resetToDefaultDemoData } = useStock();

  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [url, setUrl] = useState(supabaseConfig.url);
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey);

  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [dbSaveSuccess, setDbSaveSuccess] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleDbSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(url.trim(), anonKey.trim());
    setDbSaveSuccess(true);
    setTimeout(() => setDbSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Account Profile Card */}
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">アカウント情報設定</h3>
          </div>
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-bold ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {user?.role === 'admin' ? '管理者 (Admin)' : '一般ユーザー (Member)'}
          </span>
        </div>

        {profileSaveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            アカウント情報を更新しました。
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4 text-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">お名前</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">メールアドレス</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Switcher */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">アカウント権限の切り替え</span>
              <span className="text-[11px] text-slate-500">管理者のみ商品の最終削除が可能です</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => switchRole('member')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  user?.role === 'member' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                一般ユーザー
              </button>
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  user?.role === 'admin' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                管理者
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              プロフィールを更新
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Connection Setup Card */}
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Supabase クラウド接続設定</h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isSupabaseActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isSupabaseActive ? '● Supabase 接続中' : '○ ローカルデモDB動作中'}
          </span>
        </div>

        {dbSaveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            Supabase接続設定を保存しました。
          </div>
        )}

        <form onSubmit={handleDbSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Supabase URL</label>
            <input
              type="url"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Supabase Anon Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                resetToDefaultDemoData();
                alert('初期デモデータにリセットしました。');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> デモデータリセット
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              接続設定を保存
            </button>
          </div>
        </form>
      </div>

      {/* Logout Action */}
      <div className="clean-card p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">ログアウト</span>
          <span className="text-[11px] text-slate-500">現在のセッションを終了します</span>
        </div>
        <button
          onClick={() => {
            logout();
            alert('ログアウトしました。');
          }}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> ログアウト
        </button>
      </div>
    </div>
  );
};
