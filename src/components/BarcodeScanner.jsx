import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon     = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const CameraIc  = (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>;
const LoaderIc  = (p) => <Ic {...p} extra={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>}/>;
const CheckIc   = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const AlertIc   = (p) => <Ic {...p} extra={<><path d="m10.3 3.86-8.79 15A2 2 0 0 0 3.24 22h17.5a2 2 0 0 0 1.74-3.14l-8.78-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}/>;

const SCANNER_ID = 'ilac-barcode-scanner';

export function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('starting'); // starting | scanning | success | error | not-found
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    let scanner = null;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 1.5 },
          (decodedText) => {
            setStatus('success');
            scanner.stop().catch(() => {});
            onResult(decodedText);
          },
          () => {} // ignore per-frame errors
        );
        setStatus('scanning');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err?.message || 'Kamera erişimi sağlanamadı');
      }
    };

    start();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <CameraIc size={16}/>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Barkod Tara</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kutunun barkodunu kameraya gösterin</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <XIcon size={16}/>
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative bg-slate-950">
          <div id={SCANNER_ID} className="w-full" style={{ minHeight: 200 }}></div>

          {/* Overlay için viewfinder */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[280px] h-[160px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--brand-400)] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--brand-400)] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--brand-400)] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--brand-400)] rounded-br-lg"></div>
                <div className="absolute top-1/2 -translate-y-px left-2 right-2 h-0.5 bg-[var(--brand-500)]/60 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-5 py-4">
          {status === 'starting' && (
            <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-400">
              <LoaderIc size={16} className="animate-spin text-[var(--brand-600)]"/>
              Kamera başlatılıyor…
            </div>
          )}
          {status === 'scanning' && (
            <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Barkod aranıyor — kutuyu kameraya düz tutun
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2.5 text-[13px] text-emerald-700">
              <CheckIc size={16} className="text-emerald-600"/>
              Barkod okundu, ilaç aranıyor…
            </div>
          )}
          {status === 'error' && (
            <div>
              <div className="flex items-center gap-2 text-[13px] text-rose-700 mb-3">
                <AlertIc size={16} className="text-rose-600"/>
                {errorMsg || 'Kameraya erişilemedi'}
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Tarayıcı kamera izni vermesine onay verin ve tekrar deneyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
