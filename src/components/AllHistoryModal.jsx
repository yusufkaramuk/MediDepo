import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/FirebaseClient';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon   = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const ClockIc = (p) => <Ic {...p} extra={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>;
const SearchIc = (p) => <Ic {...p} extra={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>}/>;

const ACTION_MAP = {
  used:    { label: 'Kullanıldı',  dot: 'bg-emerald-500', tx: 'text-emerald-700' },
  added:   { label: 'Eklendi',     dot: 'bg-blue-500',    tx: 'text-blue-700' },
  edited:  { label: 'Düzenlendi',  dot: 'bg-slate-400',   tx: 'text-slate-700' },
  finished:{ label: 'Bitti',       dot: 'bg-rose-500',    tx: 'text-rose-700' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AllHistoryModal({ userId, medicines, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // medicines: [{ id, name }]
  const medMap = Object.fromEntries((medicines || []).map(m => [m.id, m.name]));

  useEffect(() => {
    if (!userId || !medicines?.length) { setLoading(false); return; }
    const load = async () => {
      try {
        // Tüm ilaçları paralel sorgula — sıralı bekleme yok
        const results = await Promise.all(
          medicines.map(async (med) => {
            try {
              const snap = await getDocs(
                query(collection(db, `users/${userId}/medicines/${med.id}/usageLog`), orderBy('createdAt', 'desc'))
              );
              return snap.docs.map(d => ({ id: d.id, medicineId: med.id, medicineName: med.name, ...d.data() }));
            } catch {
              return [];
            }
          })
        );
        const allLogs = results.flat();
        allLogs.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tb - ta;
        });
        setLogs(allLogs);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const filtered = search.trim()
    ? logs.filter(l => l.medicineName?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <ClockIc size={16}/>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Tüm Kullanım Geçmişi</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{logs.length} kayıt · tüm ilaçlar</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <XIcon size={16}/>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="relative">
            <SearchIc size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İlaç adına göre filtrele…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)]"
            />
          </div>
        </div>

        {/* Log listesi */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-10 text-[13px] text-slate-400">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-[32px] mb-2">📋</div>
              <div className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                {search ? 'Eşleşen kayıt yok' : 'Henüz kullanım kaydı yok'}
              </div>
              <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                İlaç kartındaki geçmiş ikonunu kullanarak kayıt ekleyebilirsiniz.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(log => {
                const a = ACTION_MAP[log.action] || ACTION_MAP.used;
                return (
                  <div key={`${log.medicineId}-${log.id}`} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.dot}`}></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{log.medicineName}</span>
                        <span className={`text-[11.5px] font-medium ${a.tx}`}>{a.label}</span>
                      </div>
                      <div className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{fmtDate(log.createdAt)}</div>
                      {log.note && <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-400 italic">"{log.note}"</div>}
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
