import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { MedicineDatabase } from '../services/MedicineDatabase';
import { BarcodeParser } from '../services/BarcodeParser';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon     = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const PlusIc    = (p) => <Ic {...p} extra={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>;
const ListIc    = (p) => <Ic {...p} extra={<><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>}/>;
const Spark     = (p) => <Ic {...p} extra={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>}/>;
const CamIc     = (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>;
const TrashIc   = (p) => <Ic {...p} extra={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const CheckIc   = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const SpinnerIc = (p) => <Ic {...p} extra={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>}/>;
const CalIc     = (p) => <Ic {...p} extra={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>;
const BarcodeIc = (p) => <Ic {...p} extra={<><path d="M3 5v14M7 5v14M11 5v14M15 5v5M15 14v5M19 5v14"/></>}/>;

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseMedicineName(fullName = '') {
  const doseMatch  = fullName.match(/^(.+?)\s+\d/);
  const tradeName  = doseMatch ? doseMatch[1].trim() : fullName.split(',')[0].trim();
  const dosePartM  = fullName.slice(tradeName.length).match(/^\s+([\d.,/]+\s*(?:MG|ML|MCG|IU|G|%)(?:\/[\d.,]+\s*(?:MG|ML|MCG|IU|G|%))*(?:\/\d+\s*ML)?)/i);
  const dose       = dosePartM ? dosePartM[1].trim() : '';
  const formMatch  = fullName.match(/((?:FILM KAPLI |ENTERIK KAPLI |UZUN ETKILI |KONTROLLÜ SALIMLI )?(?:TABLET|KAPSÜL|ŞURUP|AMPUL|FLAKON|SAŞE|DRAJE|DAMLA|JEL|KREM|MERHEM|SPREY|INHALER|SOLÜSYON|SÜSPANSIYON|EMÜLSIYON|PATCH|POMAD))/i);
  const countMatch = fullName.match(/,\s*(\d+)\s*(?:ADET|TABLET|KAPSÜL|ML|G\b)/i);
  const quantity   = [dose, formMatch?.[1]?.trim(), countMatch ? countMatch[1] + ' adet' : ''].filter(Boolean).join(' · ');
  const ingredients = [];
  return { tradeName, quantity, ingredients };
}

// ── ContinuousScanner: kamera kapatılmadan sürekli tarar ─────────────────────
// Her başarılı okuma sonrası scanner reset edilir ve tarama devam eder.
function ContinuousScanner({ onScan, disabled }) {
  const [key, setKey] = useState(0); // remount trick
  const lastScan = useRef('');

  const handleResult = useCallback((rawBarcode) => {
    if (rawBarcode === lastScan.current) return; // aynı barkod çift okuma
    lastScan.current = rawBarcode;
    onScan(rawBarcode);
    // 1.5sn sonra scanner'ı yeniden başlat
    setTimeout(() => {
      lastScan.current = '';
      setKey(k => k + 1);
    }, 1500);
  }, [onScan]);

  if (disabled) return null;

  return (
    <Suspense fallback={null}>
      <BarcodeScanner
        key={key}
        embedded
        onResult={handleResult}
        onClose={() => {}}
      />
    </Suspense>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const MODAL_INPUT = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[13px] font-mono leading-6 resize-none';
const FIELD_INPUT = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] outline-none text-[13px]';

// ── Main Modal ────────────────────────────────────────────────────────────────
export const BulkAddModal = ({ isOpen, onClose, onSave }) => {
  const [tab, setTab] = useState('barcode'); // 'barcode' | 'text'

  // Barcode tab state
  const [scannedList, setScannedList] = useState([]); // [{id, name, quantity, expiryDate, barcode, status}]
  const [scanning, setScanning] = useState(false);
  const [lastScanMsg, setLastScanMsg] = useState(null); // {kind:'success'|'error', text}

  // Text tab state
  const [text, setText] = useState('');

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setScannedList([]);
      setScanning(false);
      setLastScanMsg(null);
      setText('');
      setTab('barcode');
    }
  }, [isOpen]);

  // ── Barcode scan handler ────────────────────────────────────────────────────
  const handleScan = useCallback(async (rawBarcode) => {
    const parsed = BarcodeParser.parse(rawBarcode);
    const id = Date.now() + Math.random();

    // Önce placeholder olarak ekle
    setScannedList(prev => [...prev, {
      id,
      barcode: parsed.barcode || rawBarcode,
      name: '',
      quantity: '',
      expiryDate: parsed.expiryDate || '',
      status: 'searching',
    }]);
    setLastScanMsg(null);

    try {
      let med = null;
      for (const candidate of parsed.candidates) {
        med = await MedicineDatabase.findByBarcode(candidate);
        if (med) break;
      }

      if (med) {
        const { tradeName, quantity } = parseMedicineName(med.name || '');
        const ingredients = (med.activeIngredient || '').split(/[,/]/).map(s => s.trim()).filter(Boolean);
        setScannedList(prev => prev.map(item => item.id === id ? {
          ...item,
          name: tradeName,
          quantity,
          activeIngredient1: ingredients[0] || '',
          activeIngredient2: ingredients[1] || '',
          activeIngredient3: ingredients[2] || '',
          status: 'found',
        } : item));
        setLastScanMsg({ kind: 'success', text: `✓ ${tradeName || 'İlaç'} eklendi` });
      } else {
        // Bulunamadı ama yine de barkodla listeye ekle — kullanıcı adı girebilir
        setScannedList(prev => prev.map(item => item.id === id ? {
          ...item,
          name: `Bilinmeyen (${parsed.barcode || rawBarcode})`,
          status: 'not-found',
        } : item));
        setLastScanMsg({ kind: 'warn', text: 'Veritabanında bulunamadı — adı düzenleyebilirsiniz' });
      }
    } catch {
      setScannedList(prev => prev.map(item => item.id === id ? {
        ...item, status: 'error', name: `Hata (${parsed.barcode || rawBarcode})`,
      } : item));
      setLastScanMsg({ kind: 'error', text: 'Barkod sorgulanırken hata oluştu' });
    }
  }, []);

  const removeItem = (id) => setScannedList(prev => prev.filter(i => i.id !== id));
  const updateItem = (id, field, value) =>
    setScannedList(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  // ── Submit handlers ─────────────────────────────────────────────────────────
  const submitBarcode = () => {
    const items = scannedList
      .filter(i => i.name)
      .map(({ name, quantity, expiryDate, barcode,
               activeIngredient1, activeIngredient2, activeIngredient3 }) => ({
        name, quantity, expiryDate: expiryDate || '',
        barcode: barcode || '',
        activeIngredient1: activeIngredient1 || '',
        activeIngredient2: activeIngredient2 || '',
        activeIngredient3: activeIngredient3 || '',
      }));
    if (!items.length) return;
    onSave(items);
    onClose();
  };

  const submitText = () => {
    const items = text.split('\n')
      .map(l => l.trim()).filter(Boolean)
      .map(l => {
        const [name, qty, exp] = l.split('|').map(s => s && s.trim());
        return { name: name || '', quantity: qty || '', expiryDate: exp || '' };
      }).filter(it => it.name);
    if (!items.length) return;
    onSave(items);
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  const textLines = text.split('\n').filter(l => l.trim()).length;
  const readyCount = scannedList.filter(i => i.status !== 'searching').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.18s_ease]"/>
      <div
        className="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[96vh] flex flex-col animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <ListIc size={18}/>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Toplu İlaç Ekle</h2>
              <p className="text-[12px] text-slate-500">Barkod tarayın veya liste yapıştırın</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <XIcon size={18}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0 px-6 pt-3 gap-1">
          {[
            { id: 'barcode', label: 'Barkod ile Tara', icon: <BarcodeIc size={14}/> },
            { id: 'text',    label: 'Liste Yapıştır',  icon: <ListIc size={14}/> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[var(--brand-600)] text-[var(--brand-700)] bg-[var(--brand-50)]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── BARCODE TAB ─────────────────────────────────────────────────────── */}
        {tab === 'barcode' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scanner toggle */}
            <div className="px-6 pt-4 pb-2 shrink-0">
              <button
                onClick={() => setScanning(s => !s)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all border-2 ${
                  scanning
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-[var(--brand-600)] border-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] shadow-[0_6px_16px_-6px_var(--brand-shadow)]'
                }`}
              >
                <CamIc size={16}/>
                {scanning ? 'Kamerayı Kapat' : 'Kamerayı Aç · Taramaya Başla'}
              </button>

              {/* Feedback message */}
              {lastScanMsg && (
                <div className={`mt-2 flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-lg font-medium ${
                  lastScanMsg.kind === 'success' ? 'bg-emerald-50 text-emerald-700' :
                  lastScanMsg.kind === 'warn'    ? 'bg-amber-50 text-amber-700' :
                                                   'bg-rose-50 text-rose-700'
                }`}>
                  {lastScanMsg.kind === 'success' ? <CheckIc size={13}/> :
                   lastScanMsg.kind === 'warn' ? '⚠' : '✕'}
                  {lastScanMsg.text}
                </div>
              )}
            </div>

            {/* Embedded camera — BarcodeScanner continuous mode */}
            {scanning && (
              <div className="shrink-0 px-6 pb-3">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-950" style={{ minHeight: 200 }}>
                  <EmbeddedScanner onScan={handleScan} />
                </div>
                <p className="text-center text-[11.5px] text-slate-400 mt-2">
                  Her barkod okunduktan sonra kamera otomatik sıfırlanır — sonraki ilacı okutun
                </p>
              </div>
            )}

            {/* Scanned list */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {scannedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <BarcodeIc size={36} className="mb-3 opacity-30"/>
                  <p className="text-[13px]">Henüz ilaç taranmadı</p>
                  <p className="text-[12px] mt-1">Kamerayı açın ve barkodları sırayla okutun</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-slate-500 font-medium">
                      <span className="text-slate-800 font-semibold">{readyCount}</span> ilaç tarandı
                    </span>
                    {scannedList.length > 0 && (
                      <button onClick={() => setScannedList([])}
                        className="text-[11.5px] text-rose-500 hover:text-rose-700 flex items-center gap-1">
                        <TrashIc size={11}/> Tümünü temizle
                      </button>
                    )}
                  </div>

                  {scannedList.map((item, idx) => (
                    <ScannedRow
                      key={item.id}
                      index={idx}
                      item={item}
                      onRemove={() => removeItem(item.id)}
                      onChange={(field, val) => updateItem(item.id, field, val)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-4 flex justify-end gap-2 shrink-0">
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                İptal
              </button>
              <button onClick={submitBarcode} disabled={readyCount === 0}
                className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-[0_6px_16px_-6px_var(--brand-shadow)] transition-colors">
                <PlusIc size={15}/> {readyCount} ilacı ekle
              </button>
            </div>
          </div>
        )}

        {/* ── TEXT TAB ────────────────────────────────────────────────────────── */}
        {tab === 'text' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-[12.5px] text-slate-600">
                <div className="font-medium text-slate-700 mb-1.5">Örnek</div>
                <div className="font-mono text-[12px] text-slate-600 leading-6 whitespace-pre">
                  {'Parol | 20 tablet | 2027-08\nAspirin Cardio | 30 tablet | 2025-11\nBepanthen | 30 g tüp | 2027-12'}
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                className={MODAL_INPUT}
                placeholder={'Parol | 20 tablet | 2027-08\nAugmentin BID | 14 tablet | 2026-06'}
              />
              <div className="flex items-center justify-between text-[12px] text-slate-500">
                <span>
                  <span className="font-semibold text-slate-700 tabular-nums">{textLines}</span> ilaç hazır
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Spark size={13} className="text-[var(--brand-500)]"/> Yapay zekâ otomatik etken madde ekler
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-4 flex justify-end gap-2 shrink-0">
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                İptal
              </button>
              <button onClick={submitText} disabled={!textLines}
                className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-[0_6px_16px_-6px_var(--brand-shadow)] transition-colors">
                <PlusIc size={15}/> {textLines || 0} ilacı ekle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── EmbeddedScanner: kamera sürekli açık, her okumada callback ───────────────
// BarcodeScanner bileşeninin key prop'u ile reset edilir.
function EmbeddedScanner({ onScan }) {
  const [key, setKey] = useState(0);
  const cooldown = useRef(false);

  const handleResult = useCallback((rawBarcode) => {
    if (cooldown.current) return;
    cooldown.current = true;
    onScan(rawBarcode);
    // 2 saniye bekleme → scanner remount
    setTimeout(() => {
      cooldown.current = false;
      setKey(k => k + 1);
    }, 2000);
  }, [onScan]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-10 text-slate-400 text-[13px] gap-2">
        <SpinnerIc size={16} className="animate-spin"/> Kamera yükleniyor…
      </div>
    }>
      <EmbeddedBarcode key={key} onResult={handleResult} />
    </Suspense>
  );
}

// BarcodeScanner'ı gömülü modda kullanan wrapper
function EmbeddedBarcode({ onResult }) {
  return <BarcodeScanner onResult={onResult} onClose={() => {}} embedded />;
}

// ── ScannedRow: listedeki her ilaç satırı ────────────────────────────────────
function ScannedRow({ item, index, onRemove, onChange }) {
  const [showDate, setShowDate] = useState(!!item.expiryDate);

  const statusConfig = {
    searching: { dot: 'bg-amber-400 animate-pulse', label: 'Aranıyor…' },
    found:     { dot: 'bg-emerald-500', label: 'Bulundu' },
    'not-found':{ dot: 'bg-slate-400',  label: 'Veritabanında yok' },
    error:     { dot: 'bg-rose-500',    label: 'Hata' },
  };
  const sc = statusConfig[item.status] || statusConfig.searching;

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      item.status === 'searching' ? 'border-amber-200 bg-amber-50/40' :
      item.status === 'found'     ? 'border-emerald-200 bg-emerald-50/30' :
      item.status === 'not-found' ? 'border-slate-200 bg-slate-50' :
                                    'border-rose-200 bg-rose-50/30'
    }`}>
      <div className="flex items-start gap-2">
        {/* Index */}
        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold grid place-items-center mt-0.5">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <input
              value={item.name}
              onChange={e => onChange('name', e.target.value)}
              className={`${FIELD_INPUT} flex-1 min-w-0`}
              placeholder="İlaç adı"
            />
            <div className={`shrink-0 w-2 h-2 rounded-full ${sc.dot}`} title={sc.label}/>
          </div>

          {/* Expiry date — isteğe bağlı */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDate(s => !s)}
              className={`flex items-center gap-1.5 text-[11.5px] font-medium transition-colors shrink-0 ${
                showDate ? 'text-[var(--brand-600)]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CalIc size={12}/>
              {showDate ? 'SKT:' : '+ SKT ekle'}
            </button>
            {showDate && (
              <input
                type="month"
                value={item.expiryDate || ''}
                onChange={e => onChange('expiryDate', e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] outline-none text-[12px]"
              />
            )}
          </div>

          {/* Barcode chip */}
          {item.barcode && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              <BarcodeIc size={10}/> {item.barcode}
            </span>
          )}
        </div>

        {/* Remove */}
        <button onClick={onRemove}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mt-0.5">
          <TrashIc size={13}/>
        </button>
      </div>
    </div>
  );
}
