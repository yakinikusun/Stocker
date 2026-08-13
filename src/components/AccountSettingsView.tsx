import React, { useState } from 'react';
import { User, Shield, Database, LogOut, Check, RotateCcw, Lock, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';

export const AccountSettingsView: React.FC = () => {
  const {
    user,
    isSupabaseActive,
    supabaseConfig,
    toggleSupabaseMode,
    switchRole,
    updateProfile,
    logout
  } = useAuth();
  const { resetToDefaultDemoData } = useStock();

  // Self Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [passwordInput, setPasswordInput] = useState('');

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(nameInput, passwordInput || undefined);
    if (success) {
      setIsEditing(false);
      setPasswordInput('');
      setSaveSuccess('アカウントプロファイル（お名前・パスワード）を更新しました。');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. My Account Profile Card */}
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> マイアカウント情報
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdmin ? '管理者 (admin)' : '一般メンバー (member)'}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Profile Info / Self Edit Form */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          {isEditing ? (
            <form onSubmit={handleProfileSave} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">お名前 (表示名)</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ログインID (変更不可)</label>
                <input
                  type="text"
                  disabled
                  value={user?.login_id || user?.email.split('@')[0] || ''}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  新しいパスワード (変更する場合のみ入力)
                </label>
                <input
                  type="password"
                  placeholder="新しいパスワードを入力"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(user?.name || '');
                    setPasswordInput('');
                    setIsEditing(false);
                  }}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> 変更を保存する
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user?.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {user?.login_id || user?.email.split('@')[0]}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNameInput(user?.name || '');
                  setPasswordInput('');
                  setIsEditing(true);
                }}
                className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                名前・パスワードを変更
              </button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={async () => {
              if (confirm('ログアウトしますか？')) {
                await logout();
              }
            }}
            className="py-2 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> ログアウト
          </button>
        </div>

        {/* Demo Role Switcher for Testing (開発環境限定) */}
        {import.meta.env.DEV && (
          <div className="pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              デモ権限の切り替え (開発・検証環境限定)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => switchRole('admin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                管理者 (admin) に切替
              </button>
              <button
                onClick={() => switchRole('member')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  !isAdmin
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                一般メンバー (member) に切替
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Database Connection Status & Mode Switch */}
      
      {import.meta.env.DEV && isAdmin && (
      <div className="clean-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> データベース接続ステータス
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              環境変数 (.env) で管理された Supabase クラウド同期環境とローカルデモ環境を切り替えます。
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

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">現在の動作モード:</span>
              <span className="font-bold text-slate-900">
                {isSupabaseActive ? 'Supabase クラウド同期モード' : 'LocalStorage オフラインデモモード'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span>接続先設定:</span>
              <span>
                {supabaseConfig.url ? `${supabaseConfig.url.slice(0, 30)}... (.env 定義済み)` : '未設定 (デモ動作中)'}
              </span>
            </div>
          </div>
            
          <div className="pt-2 border-t border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={() => {
                toggleSupabaseMode(true);
                setSaveSuccess('Supabase クラウド接続モードへ切り替えました。データを同期します。');
                setTimeout(() => setSaveSuccess(null), 3000);
              }}
              disabled={isSupabaseActive}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                isSupabaseActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm opacity-90 cursor-default'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <Database className="w-4 h-4" /> Supabase 接続モードに切替
            </button>

            <button
              type="button"
              onClick={() => {
                toggleSupabaseMode(false);
                setSaveSuccess('LocalStorage デモモードへ切り替えました。');
                setTimeout(() => setSaveSuccess(null), 3000);
              }}
              disabled={!isSupabaseActive}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                !isSupabaseActive
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm opacity-90 cursor-default'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              ○ デモモードに切替
            </button>
          </div>
        </div>
      </div>
      )}

      {/* 3. Reset Local Demo Data */}
      {import.meta.env.DEV && isAdmin && (
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
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> 初期デモデータにリセット
        </button>
      </div>
    )}
    </div>
  );
};
