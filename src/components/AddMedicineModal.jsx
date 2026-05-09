import React, { useState, useEffect } from 'react';

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

const FIELD_INPUT = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px] transition-all';

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

const EMPTY = { name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '', createdAt: '' };

export const AddMedicineModal = ({ isOpen, onClose, onSave, initialData, isEdit }) => {
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    if (isOpen) setData(initialData ? { ...EMPTY, ...initialData } : EMPTY);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.18s_ease]"></div>
      <form
        onSubmit={submit}
        className="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <PillIc size={18}/>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                {isEdit ? 'İlacı Düzenle' : 'Yeni İlaç Ekle'}
              </h2>
              <p className="text-[12px] text-slate-500">İlaç bilgilerini eksiksiz girerek SKT takibini kolaylaştırın.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
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

          <Field label="Miktar / Form" hint="Örn: 20 tablet, 100 ml şurup">
            <input
              value={data.quantity}
              onChange={e => set('quantity', e.target.value)}
              placeholder="20 tablet"
              className={FIELD_INPUT}
            />
          </Field>

          <Field label="Son Kullanma Tarihi" hint="Ay / Yıl">
            <input
              type="month"
              value={data.expiryDate}
              onChange={e => set('expiryDate', e.target.value)}
              className={FIELD_INPUT}
            />
          </Field>

          <div className="sm:col-span-2">
            <div className="text-[12px] font-medium text-slate-600 mb-2">Etken Maddeler</div>
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-2">
          <button type="button" className="text-[13px] font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors">
            <CameraIc size={14}/> Kamera ile OCR
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              İptal
            </button>
            <button type="submit"
              className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_6px_16px_-6px_var(--brand-shadow)] inline-flex items-center gap-1.5 transition-colors">
              <CheckIc size={15}/> {isEdit ? 'Kaydet' : 'İlacı Ekle'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
