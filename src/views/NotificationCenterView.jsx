import React from 'react';
import * as Icon from 'lucide-react';

// Uygulama içi bildirim merkezi (sunum bileşeni — veri App'ten gelir).
// Sınırlı saklama: App tarafı 30 günden eski / 100 kaydı aşan bildirimleri budar.

const TYPE_META = {
  intake: { label: 'Kullanım', icon: Icon.Pill, cls: 'bg-[var(--brand-50)] text-[var(--brand-600)]' },
  refill: { label: 'Stok', icon: Icon.PackageOpen, cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  expiry: { label: 'SKT', icon: Icon.CalendarClock, cls: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  system: { label: 'Sistem', icon: Icon.Info, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
};

function timeLabel(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Şimdi';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} sa önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const NotificationCenterView = ({ items, loading, medicineNameById, onMarkRead, onMarkAllRead, onDelete }) => {
  const unread = items.filter(n => !n.read).length;

  return (
    <section aria-label="Bildirim merkezi" className="mb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Icon.Bell size={18} className="text-[var(--brand-600)]"/>
          Bildirimler
          {unread > 0 && (
            <span className="text-[11.5px] font-bold bg-[var(--brand-accent)] text-white px-2 py-0.5 rounded-full tabular-nums">{unread} yeni</span>
          )}
        </h2>
        {unread > 0 && (
          <button onClick={onMarkAllRead}
            className="text-[13px] font-medium text-[var(--brand-600)] hover:underline min-h-[44px] px-2">
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-10 text-center text-[14px] text-slate-500 dark:text-slate-400">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-6 py-14 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--brand-50)] grid place-items-center mb-3">
            <Icon.BellOff size={24} className="text-[var(--brand-600)]"/>
          </div>
          <p className="text-[14.5px] font-medium text-slate-700 dark:text-slate-300">Henüz bildiriminiz yok</p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Hatırlatıcı kurduğunuzda ve SKT uyarıları geldiğinde burada görünür.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 shadow-card overflow-hidden">
          {items.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const IconCmp = meta.icon;
            const medName = n.medicineId ? medicineNameById?.get(n.medicineId) : null;
            return (
              <li key={n.id} className={`flex items-start gap-3 px-4 py-3.5 ${n.read ? '' : 'bg-[var(--brand-50)]/40'}`}>
                <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${meta.cls}`} aria-hidden="true">
                  <IconCmp size={16}/>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--brand-accent)] shrink-0" aria-hidden="true"></span>}
                    <span className={`text-[13.5px] ${n.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>
                      {n.title}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {meta.label}{!n.read && <span className="sr-only"> · okunmadı</span>}
                    </span>
                  </div>
                  {n.body && <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>}
                  <div className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
                    <span>{timeLabel(n.createdAt)}</span>
                    {medName && <><span aria-hidden="true">·</span><span className="truncate">{medName}</span></>}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {!n.read && (
                    <button onClick={() => onMarkRead(n.id)} aria-label={`"${n.title}" bildirimini okundu işaretle`}
                      className="p-2.5 rounded-lg text-slate-400 hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] transition-colors">
                      <Icon.Check size={15}/>
                    </button>
                  )}
                  <button onClick={() => onDelete(n.id)} aria-label={`"${n.title}" bildirimini sil`}
                    className="p-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <Icon.Trash2 size={15}/>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[11.5px] text-slate-400 dark:text-slate-500 text-center">
        Bildirimler 30 gün sonra otomatik silinir; en fazla son 100 kayıt saklanır.
      </p>
    </section>
  );
};

export default NotificationCenterView;
