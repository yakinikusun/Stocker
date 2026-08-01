import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, RefreshCw, Zap, CheckCircle2, AlertCircle, PlusCircle, Package } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { Product } from '../types/stock';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (janCode: string) => void;
  onOpenAddModalWithJan?: (janCode: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
  onOpenAddModalWithJan
}) => {
  const { products, getProductByJanCode, adjustStock } = useStock();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedJan, setScannedJan] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [manualJanInput, setManualJanInput] = useState('');
  const [quickAdjustSuccess, setQuickAdjustSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedJan(null);
      setMatchedProduct(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      if (!videoInputDevices || videoInputDevices.length === 0) {
        setCameraError('利用可能なカメラが見つかりません。以下よりJANコードを直接入力するかテスト用コードをご利用ください。');
        setIsScanning(false);
        return;
      }

      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')
      ) || videoInputDevices[0];

      if (videoRef.current) {
        codeReaderRef.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              handleScannedCode(text);
            }
          }
        );
      }
    } catch (err: any) {
      setCameraError('カメラの起動に失敗しました（権限またはHTTPS接続をご確認ください）。');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleScannedCode = (janCode: string) => {
    setScannedJan(janCode);
    const prod = getProductByJanCode(janCode);
    setMatchedProduct(prod || null);

    if (onScanResult) {
      onScanResult(janCode);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJanInput.trim()) return;
    handleScannedCode(manualJanInput.trim());
    setManualJanInput('');
  };

  const handleQuickAdjust = async (amount: number) => {
    if (!matchedProduct) return;
    const success = await adjustStock(matchedProduct.id, amount, amount > 0 ? 'バーコードスキャン入荷' : 'バーコードスキャン出庫');
    if (success) {
      setQuickAdjustSuccess(`${matchedProduct.name} の在庫を ${amount > 0 ? '+1' : '-1'} しました。`);
      const updated = getProductByJanCode(matchedProduct.jan_code);
      setMatchedProduct(updated || null);
      setTimeout(() => setQuickAdjustSuccess(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl clean-modal border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">バーコードスキャン</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          {/* Camera View / Fallback */}
          <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            {isScanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-32 border-2 border-blue-400/80 rounded-lg relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-scanline" />
                </div>
                <p className="mt-3 text-xs text-blue-300 font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-blue-500/30">
                  枠内にバーコードを合わせてください
                </p>
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center space-y-2 text-white">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 再試行
                </button>
              </div>
            )}
          </div>

          {/* Quick Simulation Buttons */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> テスト用バーコード読み取り:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleScannedCode(p.jan_code)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition-all text-left truncate max-w-[180px]"
                >
                  {p.name.split(' ')[0]} ({p.jan_code.slice(-4)})
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="JANコード入力 (例: 4901330574345)"
              value={manualJanInput}
              onChange={(e) => setManualJanInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
            >
              照会
            </button>
          </form>

          {/* Scanned Result Banner */}
          {scannedJan && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">スキャン結果:</span>
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {scannedJan}
                </span>
              </div>

              {quickAdjustSuccess && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{quickAdjustSuccess}</span>
                </div>
              )}

              {matchedProduct ? (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{matchedProduct.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      保管場所: <span className="font-semibold text-blue-600">{matchedProduct.location}</span> | 現在数:{' '}
                      <span className="font-bold text-slate-900">{matchedProduct.current_stock}</span> 個
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickAdjust(-1)}
                      disabled={matchedProduct.current_stock <= 0}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <Package className="w-3.5 h-3.5" /> 消費 ( -1 )
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(1)}
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> 追加 ( +1 )
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 text-center space-y-2">
                  <p className="text-xs text-amber-700">
                    未登録のJANコードです。新規追加しますか？
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAddModalWithJan) {
                        onOpenAddModalWithJan(scannedJan);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" /> このJANコードで新在庫を登録
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
