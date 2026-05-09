import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', disabled, type = 'button', onClick, ...props }) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-[14px]';
  const variants = {
    primary:   'px-4 py-2.5 text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_8px_20px_-8px_var(--brand-shadow)]',
    secondary: 'px-4 py-2.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200',
    danger:    'px-4 py-2.5 text-white bg-rose-600 hover:bg-rose-700',
    ghost:     'px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ label, hint, required, error, className = '', ...props }) => {
  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border ${error ? 'border-rose-400' : 'border-slate-200'} bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px] transition-all ${className}`;
  if (!label) return <input className={inputClass} {...props} />;
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-slate-700">
          {label}{required && <span className="text-rose-500"> *</span>}
        </span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <input className={inputClass} {...props} />
      {error && <span className="text-[11px] text-rose-500 mt-1 block">{error}</span>}
    </label>
  );
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    brand:   'bg-[var(--brand-50)] text-[var(--brand-700)] ring-[var(--brand-100)]',
    expired: 'bg-rose-50 text-rose-700 ring-rose-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    soon:    'bg-sky-50 text-sky-700 ring-sky-200',
    good:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] ${className}`} {...props}>
    {children}
  </div>
);
