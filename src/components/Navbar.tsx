import React from 'react';
import {
  Boxes,
  History,
  Layers,
  User,
  Refrigerator
} from 'lucide-react';

export type MainNavTab = 'main' | 'settings' | 'history' | 'account';

interface NavbarProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab
}) => {
  return (
    <>
      {/* Top Header: Logo on left; Desktop nav tabs on right (hidden on mobile, visible on md+) */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onSelectTab('main')}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <Refrigerator className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 font-mono">
                Freezer
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                冷蔵庫・在庫管理
              </span>
            </div>
          </div>

          {/* Desktop Top Navigation Tabs (PC表示用) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectTab('main')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'main'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" /> 在庫一覧
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> 在庫設定
            </button>
            <button
              onClick={() => onSelectTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" /> 操作履歴
            </button>
            <button
              onClick={() => onSelectTab('account')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'account'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> アカウント設定
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (スマホ表示用: md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => onSelectTab('main')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
              activeTab === 'main' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span>メイン</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
              activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>在庫設定</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
              activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-5 h-5" />
            <span>操作履歴</span>
          </button>

          <button
            onClick={() => onSelectTab('account')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
              activeTab === 'account' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5" />
            <span>アカウント</span>
          </button>
        </div>
      </nav>
    </>
  );
};
