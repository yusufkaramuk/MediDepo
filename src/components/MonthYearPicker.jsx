import React from 'react';

export const MonthYearPicker = ({ value, onChange, className = '' }) => {
  const [year, month] = (value || '').split('-');
  const y = year || new Date().getFullYear().toString();
  const m = month || '01';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select 
        value={m} 
        onChange={e => onChange(`${y}-${e.target.value}`)}
        className="flex-1 px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 text-[13px] cursor-pointer appearance-none"
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const val = String(i + 1).padStart(2, '0');
          return <option key={val} value={val}>{val}. Ay</option>;
        })}
      </select>
      <span className="text-slate-400 text-[16px] leading-none">/</span>
      <select 
        value={y} 
        onChange={e => onChange(`${e.target.value}-${m}`)}
        className="flex-1 px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 text-[13px] cursor-pointer appearance-none"
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        {Array.from({ length: 15 }, (_, i) => {
          const val = String(new Date().getFullYear() + i);
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
    </div>
  );
};
