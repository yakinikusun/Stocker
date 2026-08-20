import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { StockProvider, useStock } from './context/StockContext';
import { Navbar, MainNavTab } from './components/Navbar';
import { StockList } from './components/StockList';
import { InventorySettingsView } from './components/InventorySettingsView';
import { HistoryLog } from './components/HistoryLog';
import { AccountSettingsView } from './components/AccountSettingsView';
import { BarcodeScanner } from './components/BarcodeScanner';
import { ProductModal } from './components/ProductModal';
import { Preset, InitialProductData } from './types/stock';

import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('main');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledJan, setPrefilledJan] = useState('');
  const [prefilledData, setPrefilledData] = useState<InitialProductData | undefined>(undefined);

  const { createProductFromPreset, locationFilter } = useStock();

  const handleOpenAddModalWithJan = (janCode: string, initialData?: InitialProductData) => {
    setPrefilledJan(janCode);
    setPrefilledData(initialData);
    setIsAddModalOpen(true);
  };

  const handleCallPresetToStock = async (preset: Preset) => {
    const targetLoc = locationFilter && locationFilter !== 'all' ? locationFilter : '冷蔵庫';
    const prod = await createProductFromPreset(preset, targetLoc, 1);
    if (prod) {
      alert(`「${preset.name}」の在庫を「${targetLoc}」に1個追加しました。`);
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
          setPrefilledData(undefined);
        }}
        initialJanCode={prefilledJan}
        initialData={prefilledData}
        onTriggerScanner={() => setIsScannerOpen(true)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!user || !isAuthenticated) {
    return <LoginView />;
  }

  return (
    <StockProvider>
      <MainApp />
    </StockProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
