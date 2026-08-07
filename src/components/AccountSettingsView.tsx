import React, { useState } from 'react';
import { User, Shield, Database, LogOut, Check, RotateCcw, UserPlus, Key, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import { UserRole } from '../types/stock';

export const AccountSettingsView: React.FC = () => {
  const {
    user,
    familyAccounts,
    isSupabaseActive,
    supabaseConfig,
    toggleSupabaseMode,
    switchRole,
    updateProfile,
    createFamilyAccount,
    resetFamilyMemberPassword,
    logout
  } = useAuth();
  const { resetToDefaultDemoData } = useStock();

  // Self Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [loginIdInput, setLoginIdInput] = useState(user?.login_id || user?.email.split('@')[0] || '');
  const [passwordInput, setPasswordInput] = useState('');

  // Admin Add Family Account State
  const [newLoginId, setNewLoginId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('123456');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [addAccountSuccess, setAddAccountSuccess] = useState<string | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(nameInput, loginIdInput, passwordInput || undefined);
    if (success) {
      setIsEditing(false);
      setPasswordInput('');
      setSaveSuccess('アカウントプロファイルを更新しました。');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleAddFamilyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoginId.trim() || !newName.trim() || !newPass.trim()) return;

    const success = await createFamilyAccount(newLoginId, newName, newPass, newRole);
    if (success) {
      setNewLoginId('');
      setNewName('');
      setNewPass('123456');
      setNewRole('member');
      setAddAccountSuccess(`家族アカウント「${newName} (ID: ${newLoginId})」を発行しました。`);
      setTimeout(() => setAddAccountSuccess(null), 4000);
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">ログインID</label>
                <input
                  type="text"
                  required
                  value={loginIdInput}
                  onChange={(e) => setLoginIdInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  新しいパスワード (変更しない場合は空欄)
                </label>
                <input
                  type="password"
                  placeholder="新しいパスワード"
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
                    setLoginIdInput(user?.login_id || user?.email.split('@')[0] || '');
                    setPasswordInput('');
                    setIsEditing(false);
                  }}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> 設定を保存
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user?.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {user?.login_id || user?.email.split('@')[0]}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">システムメール: {user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNameInput(user?.name || '');
                  setLoginIdInput(user?.login_id || user?.email.split('@')[0] || '');
                  setPasswordInput('');
                  setIsEditing(true);
                }}
                className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                編集する
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
                一般メンバー (member) に切替
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Admin Family Member Management (管理者限定機能) */}
      {isAdmin && (
        <div className="clean-card p-5 space-y-4 border-l-4 border-l-purple-600">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" /> 家族アカウント管理 (管理者専用)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              家族メンバーのアカウントを発行・管理できます。ログイン権限（admin/member）は自動適用されます。
            </p>
          </div>

          {addAccountSuccess && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{addAccountSuccess}</span>
            </div>
          )}

          {/* Add Account Form */}
          <form onSubmit={handleAddFamilyAccount} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800">新規家族アカウントの発行</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">ログインID</label>
                <input
                  type="text"
                  required
                  placeholder="例: mom, ken"
                  value={newLoginId}
                  onChange={(e) => setNewLoginId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">お名前 (表示名)</label>
                <input
                  type="text"
                  required
                  placeholder="例: お母さん"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">初期パスワード</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">割当権限 (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="member">一般メンバー (member)</option>
                  <option value="admin">管理者 (admin)</option>
                </select>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> アカウントを発行する
              </button>
            </div>
          </form>

          {/* Registered Accounts List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800">登録済み家族アカウント一覧</h3>
            <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 overflow-hidden">
              {familyAccounts.map((acc) => (
                <div key={acc.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{acc.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {acc.role === 'admin' ? '管理者' : 'メンバー'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ID: {acc.login_id || acc.email.split('@')[0]} ({acc.email})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`「${acc.name}」のパスワードを初期パスワード (123456) に初期化しますか？`)) {
                        await resetFamilyMemberPassword(acc.id, '123456');
                        alert(`「${acc.name}」のパスワードを 123456 に初期化しました。`);
                      }
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" /> パスワード初期化
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Database Connection Status & Mode Switch */}
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

      {/* 4. Reset Local Demo Data */}
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
    </div>
  );
};
