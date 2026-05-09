import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/FirebaseClient';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon     = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const ClockIc   = (p) => <Ic {...p} extra={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>;
const PlusIc    = (p) => <Ic {...p} extra={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>;
const CheckIc   = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const PencilIc  = (p) => <Ic {...p} d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>;
const TrashIc   = (p) => <Ic {...p} extra={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;

const ACTION_MAP = {
  used:   { label: 'Kullanıldı',  bg: 'bg-emerald-50', tx: 'text-emerald-700', dot: 'bg-emerald-500' },
  added:  { label: 'Eklendi',     bg: 'bg-blue-50',    tx: 'text-blue-700',    dot: 'bg-blue-500' },
  edited: { label: 'Düzenlendi',  bg: 'bg-slate-50',   tx: 'text-slate-700',   dot: 'bg-slate-400' },
  finished:{ label: 'Bitti',      bg: 'bg-rose-50',    tx: 'text-rose-700',    dot: 'bg-rose-500' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function UsageHistoryModal({ medicine, userId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const logPath = `users/${userId}/medicines/${medicine.id}/usageLog`;

  useEffect(() => {
    if (!userId || !medicine?.id) return;
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, logPath), orderBy('createdAt', 'desc')));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setLogs([]); }
      finally { setLoading(false); }
    };
    load();
  }, [medicine?.id]);

  const addLog = async (action) => {
    if (adding) return;
    setAdding(true);
    try {
      const entry = { action, note: note.trim(), createdAt: serverTimestamp() };
      const ref = await addDoc(collection(db, logPath), entry);
      setLogs(prev => [{ id: ref.id, ...entry, createdAt: { toDate: () => new Date() } }, ...prev]);
      setNote('');
    } catch { /* hata sessizce geçilir */ }
    finally { setAdding(false); }
  };

  if (!medicine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <ClockIc size={16}/>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{medicine.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kullanım geçmişi</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <XIcon size={16}/>
          </button>
        </div>

        {/* Log giriş */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Not ekle (isteğe bağlı)…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] mb-3"
          />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => addLog('used')} disabled={adding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 transition-colors">
              <CheckIc size={14}/> Kullandım
            </button>
            <button onClick={() => addLog('finished')} disabled={adding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 transition-colors">
              <TrashIc size={14}/> Bitti / Attım
            </button>
            <button onClick={() => addLog('added')} disabled={adding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition-colors">
              <PlusIc size={14}/> Yeni kutu aldım
            </button>
          </div>
        </div>

        {/* Log listesi */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-8 text-[13px] text-slate-400">Yükleniyor…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[32px] mb-2">📋</div>
              <div className="text-[14px] font-medium text-slate-700 dark:text-slate-300">Henüz kayıt yok</div>
              <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">İlk kullanımınızı yukarıdan kaydedin.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const a = ACTION_MAP[log.action] || ACTION_MAP.used;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.dot}`}></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[12px] font-semibold ${a.tx}`}>{a.label}</span>
                        <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{fmtDate(log.createdAt)}</span>
                      </div>
                      {log.note && <div className="mt-0.5 text-[12.5px] text-slate-600 dark:text-slate-400">{log.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
