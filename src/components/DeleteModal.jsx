import React, { useState, useEffect } from 'react';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const AlertTri = (p) => <Ic {...p} extra={<><path d="m10.3 3.86-8.79 15A2 2 0 0 0 3.24 22h17.5a2 2 0 0 0 1.74-3.14l-8.78-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}/>;
const TrashIc = (p) => <Ic {...p} extra={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;

export const DeleteModal = ({ medicine, onClose, onConfirm }) => {
  const total = medicine?.count || 1;
  const [n, setN] = useState(1);

  useEffect(() => { setN(1); }, [medicine]);

  if (!medicine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.18s_ease]"></div>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center ring-1 ring-rose-100 shrink-0">
              <AlertTri size={20}/>
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">İlacı sil?</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{medicine.name}</span>
                {medicine.quantity ? ` (${medicine.quantity})` : ''} kalıcı olarak listenizden kaldırılacak.
              </p>
            </div>
          </div>

          {total > 1 && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 p-4">
              <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-2">Kaç adet silinsin? (toplam {total})</div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={total} value={n}
                  onChange={e => setN(+e.target.value)}
                  className="flex-1 accent-[var(--brand-600)]"
                />
                <span className="tabular-nums text-[18px] font-semibold text-slate-900 dark:text-slate-100 w-10 text-center">{n}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Vazgeç
          </button>
          <button onClick={() => { onConfirm(n); onClose(); }}
            className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-rose-600 hover:bg-rose-700 inline-flex items-center gap-1.5 transition-colors">
            <TrashIc size={15}/> {n > 1 ? `${n} adet sil` : 'Sil'}
          </button>
        </div>
      </div>
    </div>
  );
};
