import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Package, AlertCircle, Plus, Search, Play, Square, ArrowRight, FolderKanban, Sparkles, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { useStock } from '../context/StockContext';
import { Product } from '../types/stock';
import { fetchProductByJanCode, ExternalProductInfo } from '../lib/barcodeLookup';

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
  const { getProductsByJanCode } = useStock();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedJan, setScannedJan] = useState<string | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [externalProduct, setExternalProduct] = useState<ExternalProductInfo | null>(null);
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [manualJanInput, setManualJanInput] = useState('');
  const isProcessingScanRef = useRef(false);

  const resetScannerState = () => {
    stopCamera();
    setScannedJan(null);
    setMatchedProducts([]);
    setExternalProduct(null);
    setIsFetchingExternal(false);
    setManualJanInput('');
    setCameraError(null);
    isProcessingScanRef.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      resetScannerState();
      codeReaderRef.current = new BrowserMultiFormatReader();
      startCamera();
    } else {
      resetScannerState();
    }

    return () => {
      resetScannerState();
    };
  }, [isOpen]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);
    isProcessingScanRef.current = false;

    try {
      if (videoRef.current && codeReaderRef.current) {
        const controls = await codeReaderRef.current.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              handleScannedCode(text);
            }
          }
        );
        controlsRef.current = controls;
      }
    } catch (err: any) {
      setCameraError('カメラの起動に失敗しました（権限またはHTTPS接続をご確認ください）。');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {}
      controlsRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {}
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    setIsScanning(false);
  };

  const handleScannedCode = async (janCode: string) => {
    const cleanJan = janCode.trim();
    if (!cleanJan) return;

    // Guard: Prevent rapid 60fps repeated calls from ZXing camera stream!
    if (isProcessingScanRef.current || scannedJan === cleanJan) {
      return;
    }

    isProcessingScanRef.current = true;
    setScannedJan(cleanJan);
    setExternalProduct(null);
    const matches = getProductsByJanCode(cleanJan);
    setMatchedProducts(matches);
    
    // Stop camera stream & ZXing decoder immediately upon first successful scan
    stopCamera();

    if (onScanResult) {
      onScanResult(cleanJan);
    }

    if (matches.length === 0 && cleanJan.length >= 8) {
      setIsFetchingExternal(true);
      try {
        const extInfo = await fetchProductByJanCode(cleanJan);
        setIsFetchingExternal(false);
        if (extInfo) {
          setExternalProduct(extInfo);
        }
      } catch (err) {
        setIsFetchingExternal(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJanInput.trim()) return;
    handleScannedCode(manualJanInput.trim());
    setManualJanInput('');
  };

  const handleSelectAndProceed = () => {
    if (scannedJan && onOpenAddModalWithJan) {
      stopCamera();
      onClose();
      onOpenAddModalWithJan(scannedJan);
    }
  };

  const mouseDownOnBackdropRef = useRef(false);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      mouseDownOnBackdropRef.current = true;
    } else {
      mouseDownOnBackdropRef.current = false;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownOnBackdropRef.current) {
      onClose();
    }
    mouseDownOnBackdropRef.current = false;
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl clean-modal border border-slate-200 shadow-2xl cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">バーコードスキャン</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Camera Viewfinder */}
          <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-700 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scan Box Overlay */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-32 border-2 border-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br" />
                  <div className="w-full h-0.5 bg-blue-500/80 animate-pulse top-1/2 relative" />
                </div>
              </div>
            )}

            {/* Camera Controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {isScanning ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-semibold backdrop-blur-sm flex items-center gap-1"
                >
                  <Square className="w-3 h-3" /> カメラ停止
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold backdrop-blur-sm flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> 再スキャン
                </button>
              )}
            </div>
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="手入力 JANコード (例: 4901234567890)"
                value={manualJanInput}
                onChange={(e) => setManualJanInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              検索
            </button>
          </form>

          {/* Scanned Result Summary & Cushion Buffer */}
          {scannedJan && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  スキャンしたJAN: <span className="font-bold text-slate-800">{scannedJan}</span>
                </span>
                {matchedProducts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    一致商品 {matchedProducts.length}件 発見
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    未登録コード
                  </span>
                )}
              </div>

              {matchedProducts.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-600 font-medium">以下の商品がこのJANコードに登録されています：</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">{prod.name}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="text-blue-700 font-medium flex items-center gap-1">
                                <FolderKanban className="w-3 h-3" /> {prod.location}
                              </span>
                              <span>•</span>
                              <span>在庫: <strong className="text-slate-900 font-mono">{prod.current_stock}</strong> 個</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAndProceed}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm mt-2"
                  >
                    <span>このJANコードを選択して在庫追加・補充画面へ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1 text-center">
                  {isFetchingExternal ? (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center justify-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> Open Food Facts で商品情報を検索中...
                    </div>
                  ) : externalProduct ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Open Food Facts に商品が見つかりました</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                        {externalProduct.imageUrl ? (
                          <img
                            src={externalProduct.imageUrl}
                            alt={externalProduct.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-slate-900 truncate">
                            {externalProduct.name || '名称未取得'}
                          </h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">JAN: {scannedJan}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAndProceed}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> この商品名と画像で新規在庫を追加
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600">このJANコードの商品情報はまだ登録されていません。</p>
                      <button
                        type="button"
                        onClick={handleSelectAndProceed}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> このJANコードで新規在庫を追加
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
