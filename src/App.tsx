import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { StockProvider, useStock } from './context/StockContext';
import { Navbar, MainNavTab } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { StockList } from './components/StockList';
import { InventorySettingsView } from './components/InventorySettingsView';
import { HistoryLog } from './components/HistoryLog';
import { AccountSettingsView } from './components/AccountSettingsView';
import { BarcodeScanner } from './components/BarcodeScanner';
import { ProductModal } from './components/ProductModal';
import { Refrigerator } from 'lucide-react';
import { Preset } from './types/stock';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('main');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledJan, setPrefilledJan] = useState('');

  const { createProductFromPreset } = useStock();

  const handleOpenAddModalWithJan = (janCode: string) => {
    setPrefilledJan(janCode);
    setIsAddModalOpen(true);
  };

  const handleCallPresetToStock = async (preset: Preset) => {
    const prod = await createProductFromPreset(preset, 1);
    if (prod) {
      alert(`「${preset.name}」を【${preset.location}】の在庫に1個追加しました。`);
      setActiveTab('main');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-12">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'main' && (
          <div className="space-y-4">
            <StatCards />
            <StockList
              onOpenAddModal={() => {
                setPrefilledJan('');
                setIsAddModalOpen(true);
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <InventorySettingsView onCallPresetToStock={handleCallPresetToStock} />
        )}

        {activeTab === 'history' && <HistoryLog />}

        {activeTab === 'account' && <AccountSettingsView />}
      </main>

      {/* Clean Footer */}
      {/* <footer className="mt-12 py-6 border-t border-slate-200 text-slate-500 text-xs text-center bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Refrigerator className="w-4 h-4 text-blue-600" />
            <span>冷蔵庫・在庫管理システム Freezer</span>
          </div>
          <p className="text-[11px] text-slate-400">
            完全招待制・家庭用モデル / Cloudflare Pages & Supabase RLS
          </p>
        </div>
      </footer> */}

      {/* Modals */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onOpenAddModalWithJan={handleOpenAddModalWithJan}
      />

      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPrefilledJan('');
        }}
        initialJanCode={prefilledJan}
        onTriggerScanner={() => setIsScannerOpen(true)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <StockProvider>
        <AppContent />
      </StockProvider>
    </AuthProvider>
  );
}

export default App;
