import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon    = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const CameraIc = (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>;
const LoaderIc = (p) => <Ic {...p} extra={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>}/>;
const CheckIc  = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const AlertIc  = (p) => <Ic {...p} extra={<><path d="m10.3 3.86-8.79 15A2 2 0 0 0 3.24 22h17.5a2 2 0 0 0 1.74-3.14l-8.78-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}/>;

const SCANNER_ID = 'ilac-barcode-scanner';

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
];

async function stopScanner(scanner) {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    // state 2 = SCANNING, state 3 = PAUSED
    if (state === 2 || state === 3) {
      await scanner.stop();
    }
  } catch { /* zaten durmuş */ }
  try { scanner.clear(); } catch { /* ignore */ }
}

export function BarcodeScanner({ onResult, onClose, embedded = false, mode = 'barcode' }) {
  const [status, setStatus] = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const resultHandled = useRef(false);

  useEffect(() => {
    let rafId = null;

    const start = async () => {
      const el = document.getElementById(SCANNER_ID);
      if (!el) {
        setStatus('error');
        setErrorMsg('Kamera alanı yüklenemedi, lütfen tekrar deneyin.');
        return;
      }

      try {
        const scanner = new Html5Qrcode(SCANNER_ID, { formatsToSupport: FORMATS, verbose: false });
        scannerRef.current = scanner;

        // qrbox'u container genişliğine göre hesapla — taşma olmasın
        const containerW = el.clientWidth || 320;
        const boxW = Math.min(280, containerW - 32);
        // QR kod için kare, barkod için yatay dikdörtgen
        const boxH = mode === 'qr' ? boxW : Math.round(boxW * 0.35);

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: boxW, height: boxH }, aspectRatio: 1.777 },
          async (decodedText) => {
            if (resultHandled.current) return;
            resultHandled.current = true;
            setStatus('success');
            // Önce scanner'ı durdur, sonra callback — siyah ekran önlenir
            await stopScanner(scannerRef.current);
            scannerRef.current = null;
            onResult(decodedText);
          },
          () => {}
        );
        setStatus('scanning');
      } catch (err) {
        console.error('[BarcodeScanner]', err?.name, err?.message);
        setStatus('error');
        const msg = err?.message || '';
        const name = err?.name || '';
        if (name === 'NotAllowedError' || msg.includes('ermission')) {
          setErrorMsg('Kamera izni reddedildi. Tarayıcı adres çubuğundaki kilit ikonuna tıklayarak izni açın.');
        } else if (name === 'NotFoundError' || msg.includes('device not found')) {
          setErrorMsg('Kamera bulunamadı. Cihazınızda arka kamera olduğundan emin olun.');
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setErrorMsg('Barkod tarama yalnızca HTTPS bağlantısında çalışır.');
        } else {
          setErrorMsg(`${name ? name + ': ' : ''}${msg || 'Kamera başlatılamadı'}`);
        }
      }
    };

    rafId = requestAnimationFrame(() => requestAnimationFrame(start));

    return () => {
      cancelAnimationFrame(rafId);
      stopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, []);

  // ── Embedded mode: sadece kamera + status ────────────────────────────────
  if (embedded) {
    return (
      <div className="relative w-full bg-slate-950">
        <div className="relative">
          <div id={SCANNER_ID} className="w-full" style={{ minHeight: 200 }}/>
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative" style={mode === 'qr'
                ? { width: 'min(260px, calc(100% - 32px))', height: 'min(260px, calc(100% - 32px))' }
                : { width: 'min(280px, calc(100% - 32px))', height: 'calc(min(280px, calc(100% - 32px)) * 0.35)' }}>
                <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-[var(--brand-400)]"/>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-[var(--brand-400)]"/>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-[var(--brand-400)]"/>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-[var(--brand-400)]"/>
                <div className="absolute left-0 right-0 h-0.5 bg-[var(--brand-400)]/80 animate-[scanLine_2s_ease-in-out_infinite]"/>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 bg-slate-900">
          {status === 'starting' && (
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <LoaderIc size={14} className="animate-spin text-[var(--brand-400)]"/> Kamera başlatılıyor…
            </div>
          )}
          {status === 'scanning' && (
            <div className="flex items-center gap-2 text-[12px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"/>
              {mode === 'qr' ? 'QR kodu kamera ile hizalayın' : 'Barkodu çizgiye hizalayın'}
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-[12px] text-emerald-400">
              <CheckIc size={14}/> Okundu — sonraki ilaç için hazırlanıyor…
            </div>
          )}
          {status === 'error' && (
            <div className="text-[12px] text-rose-400">{errorMsg || 'Kameraya erişilemedi'}</div>
          )}
        </div>
      </div>
    );
  }

  // ── Standalone modal mode ──────────────────────────────────────────────────
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
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{mode === 'qr' ? 'QR Kod Tara' : 'Barkod Tara'}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{mode === 'qr' ? 'Davet QR kodunu kameraya gösterin' : 'EAN-13 barkodunu yatay çizgiye hizalayın'}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <XIcon size={16}/>
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative bg-slate-950">
          <div id={SCANNER_ID} className="w-full" style={{ minHeight: 220 }}></div>

          {/* Viewfinder */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative" style={mode === 'qr'
                ? { width: 'min(260px, calc(100% - 32px))', height: 'min(260px, calc(100% - 32px))' }
                : { width: 'min(280px, calc(100% - 32px))', height: 'calc(min(280px, calc(100% - 32px)) * 0.35)' }}>
                <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-[var(--brand-400)]"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-[var(--brand-400)]"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-[var(--brand-400)]"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-[var(--brand-400)]"></div>
                <div className="absolute left-0 right-0 h-0.5 bg-[var(--brand-400)]/80 animate-[scanLine_2s_ease-in-out_infinite]"></div>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              {mode === 'qr' ? 'QR kodu kameraya gösterin · 15–30 cm uzakta tutun' : 'Barkodu çizgiye hizalayın · 10–20 cm uzakta tutun'}
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
              <div className="flex items-center gap-2 text-[13px] text-rose-700 mb-2">
                <AlertIc size={16} className="text-rose-600 shrink-0"/>
                {errorMsg || 'Kameraya erişilemedi'}
              </div>
              <button
                onClick={onClose}
                className="text-[12px] text-[var(--brand-600)] underline underline-offset-2">
                Kapat ve tekrar dene
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
