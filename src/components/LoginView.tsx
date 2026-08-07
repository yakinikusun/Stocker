import React, { useState } from 'react';
import { Refrigerator, LogIn, User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS } from '../lib/mockData';

export const LoginView: React.FC = () => {
  const { login, isSupabaseActive, familyAccounts } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayUsers = familyAccounts.length > 0 ? familyAccounts : MOCK_USERS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const success = await login(identifier.trim(), password.trim() || undefined);
      if (!success) {
        setErrorMessage('ログインに失敗しました。ログインIDを確認してください。');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('ログイン処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (loginId: string, defaultPass?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(loginId, defaultPass || '123456');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Refrigerator className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              Freezer
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              家庭用・冷蔵庫在庫管理システム
            </p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className="flex justify-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isSupabaseActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isSupabaseActive ? '● Supabase クラウド同期' : '○ LocalStorage デモモード'}
          </span>
        </div>

        {/* Login Form Card */}
        <div className="clean-card p-6 bg-white shadow-xl rounded-2xl border border-slate-200/80 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" /> アカウントログイン
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ログインIDとパスワードを入力してください（※権限は自動判定されます）。
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                ログインID (またはメールアドレス)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="例: papa, mom, admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                パスワード
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'ログイン中...' : 'ログインする'}
            </button>
          </form>

          {/* Quick Family Account Selectors */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              登録済み家族アカウントでログイン
            </label>
            <div className="grid grid-cols-2 gap-2">
              {displayUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.login_id || u.email.split('@')[0], u.password)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group cursor-pointer"
                >
                  <div className="font-bold text-xs text-slate-800 group-hover:text-blue-600">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    ID: {u.login_id || u.email.split('@')[0]}
                  </div>
                  <span
                    className={`inline-block mt-1 px-1.5 py-0.2 text-[9px] font-bold rounded ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role === 'admin' ? '管理者 (自動判定)' : 'メンバー (自動判定)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
