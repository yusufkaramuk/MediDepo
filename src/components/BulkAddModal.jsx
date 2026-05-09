import React, { useState, useEffect } from 'react';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon  = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const PlusIc = (p) => <Ic {...p} extra={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>;
const ListIc = (p) => <Ic {...p} extra={<><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>}/>;
const Spark  = (p) => <Ic {...p} extra={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>}/>;

const MODAL_INPUT = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[13px] font-mono leading-6 resize-none';

export const BulkAddModal = ({ isOpen, onClose, onSave }) => {
  const [text, setText] = useState('');

  useEffect(() => { if (!isOpen) setText(''); }, [isOpen]);

  if (!isOpen) return null;

  const lines = text.split('\n').filter(l => l.trim()).length;

  const submit = () => {
    const items = text.split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [name, qty, exp] = l.split('|').map(s => s && s.trim());
        return { name: name || '', quantity: qty || '', expiryDate: exp || '' };
      })
      .filter(it => it.name);

    if (items.length === 0) return;
    onSave(items);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.18s_ease]"></div>
      <div
        className="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <ListIc size={18}/>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Toplu İlaç Ekle</h2>
              <p className="text-[12px] text-slate-500">
                Her satıra bir ilaç. Format: <code className="text-[11px] bg-slate-100 px-1 rounded">Ad | Miktar | YYYY-MM</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <XIcon size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
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
              <span className="font-semibold text-slate-700 tabular-nums">{lines}</span> ilaç hazır
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Spark size={13} className="text-[var(--brand-500)]"/> Yapay zekâ otomatik etken madde ekler
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            İptal
          </button>
          <button onClick={submit} disabled={!lines}
            className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-[0_6px_16px_-6px_var(--brand-shadow)] transition-colors">
            <PlusIc size={15}/> {lines || 0} ilacı ekle
          </button>
        </div>
      </div>
    </div>
  );
};
