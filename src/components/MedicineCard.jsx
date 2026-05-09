import React from 'react';
import { Pencil, Trash2, Calendar, Clock, Droplets, History } from 'lucide-react';

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmtExpiry(s) {
  if (!s) return '—';
  const [y, m] = s.split('-');
  return `${TR_MONTHS[+m - 1]} ${y}`;
}

function calcStatus(expiryDate) {
  if (!expiryDate) return { key: 'unknown', daysLeft: null };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [y, m] = expiryDate.split('-').map(Number);
  const exp = new Date(y, m, 0); exp.setHours(23, 59, 59, 999);
  const daysLeft = Math.ceil((exp - now) / 86400000);
  if (daysLeft < 0)   return { key: 'expired', daysLeft };
  if (daysLeft <= 30) return { key: 'warning', daysLeft };
  if (daysLeft <= 90) return { key: 'soon',    daysLeft };
  return { key: 'good', daysLeft };
}

const STATUS = {
  expired: { pill: 'bg-rose-50 text-rose-700 ring-rose-200',     dot: 'bg-rose-500',    bar: 'bg-rose-500',    border: 'border-rose-200',  label: 'Süresi Dolmuş' },
  warning: { pill: 'bg-amber-50 text-amber-800 ring-amber-200',  dot: 'bg-amber-500',   bar: 'bg-amber-500',   border: 'border-amber-200', label: 'Yakında Bitiyor' },
  soon:    { pill: 'bg-sky-50 text-sky-700 ring-sky-200',        dot: 'bg-sky-500',     bar: 'bg-sky-500',     border: 'border-slate-200', label: 'Yaklaşıyor' },
  good:    { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500', border: 'border-slate-200', label: 'Güvenli' },
  unknown: { pill: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400',   bar: 'bg-slate-300',   border: 'border-slate-200', label: 'Tarih Yok' },
};

const StatusPill = ({ status, daysLeft }) => {
  const s = STATUS[status] || STATUS.unknown;
  let label = s.label;
  if (status === 'expired' && daysLeft != null) label = `${Math.abs(daysLeft)} gün geçti`;
  else if (status === 'warning' && daysLeft != null) label = `${daysLeft} gün kaldı`;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {label}
    </span>
  );
};

export const MedicineCard = ({ medicine, onEdit, onDelete, onHistory }) => {
  const st = calcStatus(medicine.expiryDate);
  const s = STATUS[st.key] || STATUS.unknown;
  const ingredients = [medicine.activeIngredient1, medicine.activeIngredient2, medicine.activeIngredient3].filter(Boolean);
  const count = medicine.count || 1;
  const allIds = medicine.allIds || [medicine.id];

  const handleDelete = () => onDelete && onDelete({ ...medicine, allIds });

  return (
    <div className={`group relative bg-white rounded-2xl border ${s.border} shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col`}>
      {/* Status accent bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${s.bar} opacity-90`}></div>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={st.key} daysLeft={st.daysLeft} />
          {count > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-100)] tabular-nums">
              ×{count} adet
            </span>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {onHistory && (
            <button onClick={() => onHistory(medicine)}
              className="p-1.5 text-slate-500 hover:text-[var(--brand-700)] hover:bg-[var(--brand-50)] rounded-lg transition-colors" aria-label="Geçmiş">
              <History size={15} />
            </button>
          )}
          <button onClick={() => onEdit && onEdit(medicine)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Düzenle">
            <Pencil size={15} />
          </button>
          <button onClick={handleDelete}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" aria-label="Sil">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Name */}
      <h3 className="mt-3 text-[17px] font-semibold text-slate-900 leading-snug tracking-tight">{medicine.name}</h3>
      {medicine.quantity && <div className="mt-0.5 text-[13px] text-slate-500">{medicine.quantity}</div>}

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ingredients.map((ing, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11.5px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md ring-1 ring-slate-200/80">
              <Droplets size={11} className="text-[var(--brand-500)]" />{ing}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {medicine.tags && medicine.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {medicine.tags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-100)] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {medicine.notes && (
        <div className="mt-3 text-[12.5px] text-slate-500 line-clamp-2 italic">"{medicine.notes}"</div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          <span className={st.key === 'expired' ? 'text-rose-700 font-semibold' : 'text-slate-700 font-medium'}>
            {fmtExpiry(medicine.expiryDate)}
          </span>
        </div>
        {st.daysLeft != null && st.key !== 'expired' && (
          <span className={`inline-flex items-center gap-1 text-[12px] tabular-nums ${
            st.key === 'warning' ? 'text-amber-700' : st.key === 'soon' ? 'text-sky-700' : 'text-slate-500'
          }`}>
            <Clock size={12} /> {st.daysLeft} gün
          </span>
        )}
      </div>
    </div>
  );
};
