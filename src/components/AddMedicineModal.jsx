import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { MedicineDatabase } from '../services/MedicineDatabase';
import { BarcodeParser } from '../services/BarcodeParser';
import { MonthYearPicker } from './MonthYearPicker';

const BarcodeScanner = lazy(() => import('./BarcodeScanner').then(m => ({ default: m.BarcodeScanner })));

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const PillIc   = (p) => <Ic {...p} extra={<><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></>}/>;
const XIcon    = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const CheckIc  = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const CameraIc = (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>;

const FIELD_INPUT = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all';

const Field = ({ label, hint, required, children }) => (
  <label className="block">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[12px] font-medium text-slate-700">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
    {children}
  </label>
);

const EMPTY = { name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '', tags: [], createdAt: '', isPrivate: false, stockCount: 1, barcode: '' };

const StockCounter = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-[var(--brand-500)] focus-within:ring-4 focus-within:ring-[var(--brand-100)] transition-all h-[42px]">
    <button type="button"
      onClick={() => onChange(Math.max(1, value - 1))}
      className="px-2.5 h-full text-slate-400 hover:text-[var(--brand-700)] hover:bg-[var(--brand-50)] transition-colors text-[16px] font-light leading-none border-r border-slate-100 shrink-0 select-none">
      −
    </button>
    <input
      type="number"
      min={1} max={999}
      value={value}
      onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 999) onChange(v); }}
      className="w-10 text-center text-[13px] font-semibold text-slate-900 dark:text-slate-100 outline-none bg-transparent tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button type="button"
      onClick={() => onChange(Math.min(999, value + 1))}
      className="px-2.5 h-full text-slate-400 hover:text-[var(--brand-700)] hover:bg-[var(--brand-50)] transition-colors text-[16px] font-light leading-none border-l border-slate-100 shrink-0 select-none">
      +
    </button>
  </div>
);

const SUGGESTED_TAGS = ['Ağrı Kesici', 'Antibiyotik', 'Vitamin', 'Antidepresan', 'Tansiyon', 'Şeker', 'Soğuk Algınlığı', 'Cilt', 'Göz', 'Sindirim'];

const TagInput = ({ tags, onChange }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTag = (val) => {
    const tag = val.trim();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    onChange([...tags, tag]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  };

  const suggestions = SUGGESTED_TAGS.filter(s => !tags.includes(s));

  return (
    <div>
      <div
        className="min-h-[44px] w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-[var(--brand-500)] focus-within:ring-4 focus-within:ring-[var(--brand-100)] flex flex-wrap gap-1.5 cursor-text"
        onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-100)] text-[12px] font-medium">
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }} className="hover:text-[var(--brand-900)] opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? 'Etiket ekle ve Enter\'a bas…' : ''}
          className="flex-1 min-w-[120px] outline-none text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 bg-transparent py-0.5 px-1"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {suggestions.slice(0, 6).map(s => (
            <button key={s} type="button" onClick={() => addTag(s)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-500 dark:text-slate-400 hover:border-[var(--brand-400)] hover:text-[var(--brand-700)] transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AddMedicineModal = ({ isOpen, onClose, onSave, initialData, isEdit, familyId }) => {
  const [data, setData] = useState(EMPTY);
  const [showScanner, setShowScanner] = useState(false); // false | 'barcode' | 'qr'
  const [scanStatus, setScanStatus] = useState(null); // null | 'searching' | 'found' | 'not-found' | 'error'
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (isOpen) { setData(initialData ? { ...EMPTY, ...initialData } : EMPTY); setScanStatus(null); }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    const saveData = { ...data };
    if (familyId) {
      saveData.familyId = familyId;
    }
    onSave(saveData);
    onClose();
  };

  const fillFromBarcode = async (rawCode, closeScanner = false, mode = 'barcode') => {
    if (closeScanner) setShowScanner(false);
    
    let parsedBarcode = '';
    let parsedExpiry = '';
    let candidates = [];

    if (mode === 'qr') {
      const qrParsed = BarcodeParser.parseKarekod(rawCode);
      parsedBarcode = qrParsed.barcode;
      parsedExpiry = qrParsed.formExpiryDate;
      candidates = [qrParsed.barcode].filter(Boolean);
    } else {
      const parsed = BarcodeParser.parse(rawCode);
      parsedBarcode = parsed.barcode;
      parsedExpiry = parsed.expiryDate;
      candidates = parsed.candidates;
    }

    if (parsedBarcode) set('barcode', parsedBarcode);
    setScanStatus('searching');
    setScanError('');
    try {
      let med = null;
      for (const candidate of candidates) {
        med = await MedicineDatabase.findByBarcode(candidate);
        if (med) break;
      }
      if (med) {
        const fullName = med.name || '';
        // Ticari ad: doz rakamına kadar olan kısım (ör: "DEKSİT 25 MG..." → "DEKSİT")
        const doseMatch = fullName.match(/^(.+?)\s+\d/);
        const tradeName = doseMatch ? doseMatch[1].trim() : fullName.split(',')[0].trim();

        // Miktar/Form: doz + form tipi + adet
        // "DEKSİT 25 MG/4 MG FILM KAPLI TABLET, 20 ADET" → "25 MG/4 MG · FILM KAPLI TABLET · 20 adet"
        const dosePartMatch = fullName.slice(tradeName.length).match(/^\s+([\d.,/]+\s*(?:MG|ML|MCG|IU|G|%)(?:\/[\d.,]+\s*(?:MG|ML|MCG|IU|G|%))*(?:\/\d+\s*ML)?)/i);
        const dose       = dosePartMatch ? dosePartMatch[1].trim() : '';
        const formMatch  = fullName.match(/((?:FILM KAPLI |ENTERIK KAPLI |UZUN ETKILI |KONTROLLÜ SALIMLI )?(?:TABLET|KAPSÜL|ŞURUP|AMPUL|FLAKON|SAŞE|DRAJE|DAMLA|JEL|KREM|MERHEM|SPREY|INHALER|SOLÜSYON|SÜSPANSIYON|EMÜLSIYON|PATCH|POMAD))/i);
        const countMatch = fullName.match(/,\s*(\d+)\s*(?:ADET|TABLET|KAPSÜL|ML|G\b)/i);
        const formQty    = [dose, formMatch?.[1].trim(), countMatch ? countMatch[1] + ' adet' : ''].filter(Boolean).join(' · ');

        // Etkin maddeleri virgül veya / ile böl, max 3
        const ingredients = (med.activeIngredient || '').split(/[,/]/).map(s => s.trim()).filter(Boolean);

        setData(prev => ({
          ...prev,
          name: tradeName || prev.name,
          quantity: formQty || prev.quantity,
          activeIngredient1: ingredients[0] || prev.activeIngredient1,
          activeIngredient2: ingredients[1] || prev.activeIngredient2,
          activeIngredient3: ingredients[2] || prev.activeIngredient3,
          expiryDate: prev.expiryDate || parsedExpiry || '',
          barcode: parsedBarcode || prev.barcode,
        }));
        setScanStatus('found');
      } else {
        setScanStatus('not-found');
      }
    } catch (err) {
      setScanStatus('error');
      setScanError(err?.message || String(err));
    }
    setTimeout(() => { setScanStatus(null); }, 10000);
  };

  const handleBarcodeResult = async (barcode) => {
    await fillFromBarcode(barcode, true, showScanner);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.18s_ease]"></div>
      <form
        onSubmit={submit}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <PillIc size={18}/>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {isEdit ? 'İlacı Düzenle' : 'Yeni İlaç Ekle'}
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">İlaç bilgilerini eksiksiz girerek SKT takibini kolaylaştırın.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <XIcon size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="İlaç Adı" required>
              <input
                value={data.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Örn: Parol 500 mg"
                className={FIELD_INPUT}
              />
            </Field>
          </div>

          <Field label="Barkod" hint="EAN / GS1">
            <input
              value={data.barcode || ''}
              onChange={e => set('barcode', BarcodeParser.primary(e.target.value))}
              onBlur={e => { if (e.target.value.trim()) fillFromBarcode(e.target.value); }}
              placeholder="869..."
              className={FIELD_INPUT}
            />
          </Field>

          <div className="sm:col-span-2">
            <div className="mb-1.5">
              <span className="text-[12px] font-medium text-slate-700">Miktar / Form</span>
              <span className="text-[11px] text-slate-400 ml-2">· Örn: 20 tablet, 100 ml şurup</span>
            </div>
            <div className="flex gap-2">
              <input
                value={data.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="20 tablet"
                className={`${FIELD_INPUT} flex-1`}
              />
              <StockCounter value={data.stockCount ?? 1} onChange={v => set('stockCount', v)}/>
            </div>
          </div>

          <Field label="Son Kullanma Tarihi" hint="Ay / Yıl">
            <MonthYearPicker
              value={data.expiryDate}
              onChange={v => set('expiryDate', v)}
            />
          </Field>

          <div className="sm:col-span-2">
            <div className="text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-2">Etken Maddeler</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[1, 2, 3].map(n => (
                <input
                  key={n}
                  value={data[`activeIngredient${n}`] || ''}
                  onChange={e => set(`activeIngredient${n}`, e.target.value)}
                  placeholder={n === 1 ? 'Parasetamol' : 'Opsiyonel'}
                  className={FIELD_INPUT}
                />
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field label="Etiketler" hint="En fazla 10 etiket">
              <TagInput
                tags={data.tags || []}
                onChange={tags => set('tags', tags)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Notlar" hint="Saklama, doz, lokasyon — kişisel notlarınız">
              <textarea
                rows={3}
                value={data.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Buzdolabı kapısı, çocuk erişiminden uzak…"
                className={`${FIELD_INPUT} resize-none`}
              />
            </Field>
          </div>

          {familyId && (
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors select-none
                border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20">
                <input
                  type="checkbox"
                  checked={!!data.isPrivate}
                  onChange={e => set('isPrivate', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-rose-500 shrink-0"
                />
                <div>
                  <div className="text-[13px] font-semibold text-rose-700 dark:text-rose-400">
                    Özel İlaç (Bu İlaç Sadece Size Gözükür)
                  </div>
                  <div className="text-[11.5px] text-rose-500 dark:text-rose-500 mt-0.5">
                    İşaretlenirse bu ilaç aile üyelerinize gözükmez.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="button"
              onClick={() => setShowScanner('qr')}
              className="text-[13px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors">
              <CameraIc size={14}/> Karekod (QR)
            </button>
            <button type="button"
              onClick={() => setShowScanner('barcode')}
              className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors">
              <CameraIc size={14}/> Barkod
            </button>
            {scanStatus === 'searching' && (
              <span className="text-[11.5px] text-[var(--brand-600)] animate-pulse ml-2">Aranıyor…</span>
            )}
            {scanStatus === 'found' && (
              <span className="text-[11.5px] text-emerald-600 font-medium ml-2">✓ İlaç bulundu</span>
            )}
            {scanStatus === 'not-found' && (
              <span className="text-[11.5px] text-slate-500 dark:text-slate-400 ml-2">Bulunamadı</span>
            )}
            {scanStatus === 'error' && (
              <span className="text-[11px] text-rose-600 break-all ml-2">{scanError}</span>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button type="button" onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              İptal
            </button>
            <button type="submit"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_6px_16px_-6px_var(--brand-shadow)] inline-flex items-center gap-1.5 transition-colors">
              <CheckIc size={15}/> {isEdit ? 'Kaydet' : 'İlacı Ekle'}
            </button>
          </div>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            mode={showScanner}
            onResult={handleBarcodeResult}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
