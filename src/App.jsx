import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StorageManager } from './services/StorageManager';
import { FirebaseService } from './services/FirebaseService';
import { AuthService } from './services/AuthService';
import { fuzzyMatch } from './services/FuzzySearch';
import { normalizeAndValidateMedicine, normalizeMedicineList } from './services/MedicineValidation';
import { exportMedicinesToCsv } from './services/CsvExport';
import { MedicineDatabase } from './services/MedicineDatabase';
import { BarcodeParser } from './services/BarcodeParser';
import { useTheme } from './context/ThemeContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './services/FirebaseClient';
import { NotificationService } from './services/NotificationService';
import { MedicineCard } from './components/MedicineCard';
import { AddMedicineModal } from './components/AddMedicineModal';
import { BarcodeScanner } from './components/BarcodeScanner';
import { BulkAddModal } from './components/BulkAddModal';
import { DeleteModal } from './components/DeleteModal';
import { AuthModal } from './components/AuthModal';
import { UsageHistoryModal } from './components/UsageHistoryModal';
import { AllHistoryModal } from './components/AllHistoryModal';
import { ShareView } from './components/ShareView';
import { FamilyModal } from './components/FamilyModal';
import { PrivacyModal, TermsModal } from './components/LegalModal';
import { FamilyService } from './services/FamilyService';
import { clearKeyCache } from './services/EncryptionService';
import appLogo from './assets/logo.png';

// ── Icons (inline SVG, matches design handoff) ──────────────────────────────
const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const Icon = {
  Pill:     (p) => <Ic {...p} extra={<><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></>}/>,
  Plus:     (p) => <Ic {...p} extra={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>,
  Search:   (p) => <Ic {...p} extra={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>}/>,
  Cloud:    (p) => <Ic {...p} d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4 12.5 4.5 4.5 0 0 0 6.5 19h11Z"/>,
  HardDisk: (p) => <Ic {...p} extra={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>}/>,
  Settings: (p) => <Ic {...p} extra={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.66.43.86.78"/></>}/>,
  Logout:   (p) => <Ic {...p} extra={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>}/>,
  X:        (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>,
  Filter:   (p) => <Ic {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/>,
  ChevDown: (p) => <Ic {...p} d="m6 9 6 6 6-6"/>,
  Check:    (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>,
  Calendar: (p) => <Ic {...p} extra={<><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>,
  Clock:    (p) => <Ic {...p} extra={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  AlertTri: (p) => <Ic {...p} extra={<><path d="m10.3 3.86-8.79 15A2 2 0 0 0 3.24 22h17.5a2 2 0 0 0 1.74-3.14l-8.78-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}/>,
  Shield:   (p) => <Ic {...p} extra={<><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3v7Z"/><path d="m9 12 2 2 4-4"/></>}/>,
  Box:      (p) => <Ic {...p} extra={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>}/>,
  Heart:    (p) => <Ic {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  Grid:     (p) => <Ic {...p} extra={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}/>,
  List:     (p) => <Ic {...p} extra={<><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>}/>,
  Camera:   (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>,
  Upload:   (p) => <Ic {...p} extra={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></>}/>,
  Download: (p) => <Ic {...p} extra={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>}/>,
  Edit:     (p) => <Ic {...p} d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>,
  Trash:    (p) => <Ic {...p} extra={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>,
  Sparkles: (p) => <Ic {...p} extra={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>}/>,
  Drop:     (p) => <Ic {...p} d="M12 2.7s5 5.3 5 9.3a5 5 0 0 1-10 0c0-4 5-9.3 5-9.3Z"/>,
  Moon:     (p) => <Ic {...p} d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
  Sun:      (p) => <Ic {...p} extra={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>}/>,
  History:  (p) => <Ic {...p} extra={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></>}/>,
  Bell:     (p) => <Ic {...p} extra={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}/>,
  BellOff:  (p) => <Ic {...p} extra={<><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 1 .6 5"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="2" x2="22" y1="2" y2="22"/></>}/>,
  Users:    (p) => <Ic {...p} extra={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
};

// ── Status helpers ────────────────────────────────────────────────────────────
const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function fmtExpiry(s) { if (!s) return '—'; const [y, m] = s.split('-'); return `${TR_MONTHS[+m - 1]} ${y}`; }
function statusOf(med) {
  if (!med.expiryDate) return { key: 'unknown', daysLeft: null };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [y, m] = med.expiryDate.split('-').map(Number);
  const exp = new Date(y, m, 0); exp.setHours(23, 59, 59, 999);
  const d = Math.ceil((exp - now) / 86400000);
  if (d < 0)    return { key: 'expired', daysLeft: d };
  if (d <= 30)  return { key: 'warning', daysLeft: d };
  if (d <= 90)  return { key: 'soon',    daysLeft: d };
  return { key: 'good', daysLeft: d };
}

// ── Turkish date label ────────────────────────────────────────────────────────
function todayLabel() {
  const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const d = new Date();
  return `${days[d.getDay()]} · ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const ACCENT = {
  indigo:  'from-indigo-500/10 to-indigo-500/0 text-indigo-700 border-indigo-100',
  emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-700 border-emerald-100',
  amber:   'from-amber-500/10 to-amber-500/0 text-amber-700 border-amber-100',
  rose:    'from-rose-500/10 to-rose-500/0 text-rose-700 border-rose-100',
};
const StatCard = ({ label, value, sublabel, accent = 'indigo', icon }) => {
  const [from, to, tx, bd] = ACCENT[accent].split(' ');
  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${from} ${to} pointer-events-none opacity-60 dark:opacity-30`}></div>
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
          <div className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{value}</div>
          {sublabel && <div className={`mt-1 text-xs ${tx} font-medium`}>{sublabel}</div>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx} bg-white dark:bg-slate-800 border ${bd}`}>{icon}</div>
      </div>
    </div>
  );
};

// ── Status Pill ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  expired: { bg:'bg-rose-50', tx:'text-rose-700', dot:'bg-rose-500', ring:'ring-rose-200', label:'Süresi Dolmuş' },
  warning: { bg:'bg-amber-50', tx:'text-amber-800', dot:'bg-amber-500', ring:'ring-amber-200', label:'Yakında Bitiyor' },
  soon:    { bg:'bg-sky-50', tx:'text-sky-700', dot:'bg-sky-500', ring:'ring-sky-200', label:'Yaklaşıyor' },
  good:    { bg:'bg-emerald-50', tx:'text-emerald-700', dot:'bg-emerald-500', ring:'ring-emerald-200', label:'Güvenli' },
  unknown: { bg:'bg-slate-100', tx:'text-slate-600', dot:'bg-slate-400', ring:'ring-slate-200', label:'Tarih Yok' },
};
const StatusPill = ({ status, daysLeft }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.unknown;
  let label = s.label;
  if (status === 'expired' && daysLeft != null) label = `${Math.abs(daysLeft)} gün geçti`;
  else if (status === 'warning' && daysLeft != null) label = `${daysLeft} gün kaldı`;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ${s.bg} ${s.tx} ring-1 ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{label}
    </span>
  );
};

// ── Medicine Row (list view) ──────────────────────────────────────────────────
const MedicineRow = ({ medicine, onEdit, onDelete }) => {
  const st = statusOf(medicine);
  const ings = [medicine.activeIngredient1, medicine.activeIngredient2, medicine.activeIngredient3].filter(Boolean);
  const dotColor = st.key === 'expired' ? 'bg-rose-500' : st.key === 'warning' ? 'bg-amber-500' : st.key === 'soon' ? 'bg-sky-500' : 'bg-emerald-500';
  return (
    <div className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`w-1.5 self-stretch rounded-full ${dotColor}`}></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[14.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">{medicine.name}</h4>
          {(medicine.count || 1) > 1 && (
            <span className="text-[11px] font-semibold text-[var(--brand-700)] bg-[var(--brand-50)] ring-1 ring-[var(--brand-100)] px-1.5 py-0.5 rounded-md tabular-nums">×{medicine.count}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {medicine.quantity && <span>{medicine.quantity}</span>}
          {ings.length > 0 && <><span>·</span><span className="truncate">{ings.join(', ')}</span></>}
        </div>
      </div>
      <div className="hidden sm:block min-w-[140px]"><StatusPill status={st.key} daysLeft={st.daysLeft}/></div>
      <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-slate-700 dark:text-slate-300 min-w-[110px]">
        <Icon.Calendar size={13} className="text-slate-400"/> {fmtExpiry(medicine.expiryDate)}
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {medicine.canEdit !== false && <>
          <button onClick={() => onEdit(medicine)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100" aria-label="Düzenle"><Icon.Edit size={14}/></button>
          <button onClick={() => onDelete(medicine)} className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600" aria-label="Sil"><Icon.Trash size={14}/></button>
        </>}
        {medicine.isOwn === false && <span className="text-[11px] text-slate-400 px-1">{medicine.ownerName}</span>}
      </div>
    </div>
  );
};

// ── Sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { v: 'date-desc',   l: 'En yeni eklenenler',   ic: <Icon.Clock size={14}/> },
  { v: 'date-asc',    l: 'En eski eklenenler',    ic: <Icon.Clock size={14}/> },
  { v: 'name-asc',    l: 'Ada göre A → Z',        ic: <Icon.List size={14}/> },
  { v: 'name-desc',   l: 'Ada göre Z → A',        ic: <Icon.List size={14}/> },
  { v: 'expiry-asc',  l: 'Yakında bitecekler',    ic: <Icon.Calendar size={14}/> },
  { v: 'expiry-desc', l: 'Uzun süreli olanlar',   ic: <Icon.Calendar size={14}/> },
  { v: 'count-desc',  l: 'Çok stokta olanlar',    ic: <Icon.Box size={14}/> },
  { v: 'count-asc',   l: 'Az stokta olanlar',     ic: <Icon.Box size={14}/> },
];
const SortMenu = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTS.find(o => o.v === value) || SORT_OPTS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <Icon.Filter size={14} className="text-slate-400"/>
        <span className="hidden sm:inline">Sırala:</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{current.l}</span>
        <Icon.ChevDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-64 z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 animate-[slideUp_.15s_ease]">
            {SORT_OPTS.map(o => (
              <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-left ${o.v === value ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                <span className={o.v === value ? 'text-[var(--brand-600)]' : 'text-slate-400'}>{o.ic}</span>
                <span className="flex-1">{o.l}</span>
                {o.v === value && <Icon.Check size={14} className="text-[var(--brand-600)]"/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Tag Filter Menu ───────────────────────────────────────────────────────────
const TagFilterMenu = ({ tags, value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-colors ${
          value
            ? 'bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-700)]'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
        }`}>
        <Icon.Filter size={14} className={value ? 'text-[var(--brand-600)]' : 'text-slate-400'}/>
        <span className="hidden sm:inline font-medium">{value || 'Etiket'}</span>
        <Icon.ChevDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-52 z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 animate-[slideUp_.15s_ease] max-h-64 overflow-y-auto">
            <button onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-left ${!value ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span className="flex-1">Tüm etiketler</span>
              {!value && <Icon.Check size={14} className="text-[var(--brand-600)]"/>}
            </button>
            {tags.map(tag => (
              <button key={tag} onClick={() => { onChange(tag); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-left ${value === tag ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]"></span>
                <span className="flex-1">{tag}</span>
                {value === tag && <Icon.Check size={14} className="text-[var(--brand-600)]"/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const TOAST_MAP = {
  success: { ic: <Icon.Check size={16}/>, bg: 'bg-emerald-600' },
  error:   { ic: <Icon.AlertTri size={16}/>, bg: 'bg-rose-600' },
  info:    { ic: <Icon.Cloud size={16}/>, bg: 'bg-slate-900' },
};
const Toast = ({ kind = 'success', children, onClose }) => {
  const m = TOAST_MAP[kind] || TOAST_MAP.info;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]">
      <div className={`flex items-center gap-2.5 ${m.bg} text-white text-[13.5px] font-medium px-4 py-2.5 rounded-full shadow-2xl ring-1 ring-black/5`}>
        <span className="grid place-items-center w-5 h-5 rounded-full bg-white/15">{m.ic}</span>
        <span>{children}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><Icon.X size={14}/></button>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ searching, onAdd, onBulk }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-6 py-16 text-center">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--brand-50)] grid place-items-center ring-1 ring-[var(--brand-100)] mb-4">
      <Icon.Pill size={28} className="text-[var(--brand-600)]"/>
    </div>
    <h3 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
      {searching ? 'Aramanızla eşleşen ilaç yok' : 'Henüz ilaç eklenmemiş'}
    </h3>
    <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
      {searching
        ? 'Farklı bir terim deneyin — yazımı yanlış girseniz bile bulmaya çalışırız.'
        : 'Bir ilaç eklemekle başlayın. Tek tek veya toplu olarak ekleyebilirsiniz.'}
    </p>
    {!searching && (
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        <button onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_8px_20px_-8px_var(--brand-shadow)]">
          <Icon.Plus size={15}/> İlk ilacı ekle
        </button>
        <button onClick={onBulk}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Icon.List size={15}/> Toplu ekle
        </button>
      </div>
    )}
  </div>
);

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ user, totalCount, useCloud, onToggleCloud, syncing, onSignOut, theme, onToggleTheme, isOnline, notifPermission, onToggleNotifications, onShowAllHistory, onShowFamily, pendingInviteCount }) => (
  <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <img src={appLogo} alt="İlaç Takip" className="w-10 h-10 object-contain rounded-xl bg-[var(--brand-50)] p-0.5"/>
        <div className="leading-tight">
          <div className="text-[14.5px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">İlaç Takip Sistemi</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">{totalCount} kayıtlı ilaç · {user.displayName || user.email?.split('@')[0]}</div>
        </div>
      </div>

      <div className="flex-1"/>

      {!isOnline && (
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Çevrimdışı
        </div>
      )}

      <button onClick={onToggleCloud}
        className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
          useCloud
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : useCloud ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
        {syncing ? 'Senkronize…' : useCloud ? 'Bulut · Senkron' : 'Yerel'}
      </button>

      <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"/>

      <div className="flex items-center gap-1.5">
        {onShowAllHistory && (
          <button onClick={onShowAllHistory}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            aria-label="Tüm kullanım geçmişi">
            <Icon.History size={17}/>
          </button>
        )}
        <button onClick={onShowFamily}
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          aria-label="Aile modu">
          <Icon.Users size={17}/>
          {pendingInviteCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"/>
          )}
        </button>
        {notifPermission !== 'unsupported' && notifPermission !== 'denied' && (
          <button onClick={onToggleNotifications}
            className={`p-2 rounded-xl transition-colors ${
              notifPermission === 'granted'
                ? 'text-[var(--brand-600)] bg-[var(--brand-50)] hover:bg-[var(--brand-100)]'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            aria-label={notifPermission === 'granted' ? 'Bildirimleri kapat' : 'Bildirimleri aç'}>
            {notifPermission === 'granted' ? <Icon.Bell size={17}/> : <Icon.BellOff size={17}/>}
          </button>
        )}
        <button onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          aria-label={theme === 'dark' ? 'Açık mod' : 'Karanlık mod'}>
          {theme === 'dark' ? <Icon.Sun size={17}/> : <Icon.Moon size={17}/>}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-100)] to-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center text-[12px] font-semibold ring-1 ring-[var(--brand-100)]">
          {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
        </div>
        <button onClick={onSignOut} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100" aria-label="Çıkış">
          <Icon.Logout size={17}/>
        </button>
      </div>
    </div>
  </header>
);

// ── Utility ───────────────────────────────────────────────────────────────────
const createLocalMedicine = (medicine) => ({
  id: medicine.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ...medicine,
});

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const isOnline = useNetworkStatus();

  // /share/:token route — auth gerektirmez
  const shareToken = window.location.pathname.startsWith('/share/')
    ? window.location.pathname.split('/share/')[1]
    : null;
  if (shareToken) return <ShareView token={shareToken} />;
  const [swUpdateReady, setSwUpdateReady] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expired' | 'warning' | 'good'
  const [tagFilter, setTagFilter] = useState(null); // null = tümü, string = spesifik tag
  const [sortBy, setSortBy] = useState('date-desc');
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [loaded, setLoaded] = useState(false);
  const [useCloud, setUseCloud] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // TITCK veritabanını arka planda güncelle
  useEffect(() => { MedicineDatabase.syncInBackground(); }, []);

  // Service Worker güncelleme bildirimi
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setSwUpdateReady(true);
          }
        });
      });
    });
  }, []);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [showSearchScanner, setShowSearchScanner] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingOwner, setEditingOwner] = useState(null); // başkasının ilacını düzenlerken ownerId
  const [modalInitialData, setModalInitialData] = useState(null);
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [historyMedicine, setHistoryMedicine] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [family, setFamily] = useState(null);
  const [familyMedicines, setFamilyMedicines] = useState([]);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [stockMode, setStockMode] = useState('personal');
  const [notifPermission, setNotifPermission] = useState(
    NotificationService.isSupported() ? NotificationService.getPermission() : 'unsupported'
  );

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => { if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const showToast = (kind, text) => setToast({ kind, text });

  // Auth listener
  useEffect(() => {
    const unsub = AuthService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) { setMedicines([]); setLoaded(false); }
    });
    return () => unsub();
  }, []);

  // Load medicines
  useEffect(() => {
    if (!user || !useCloud) return;
    loadMedicines();
    loadFamily();
  }, [user, useCloud]);

  useEffect(() => {
    if (loaded && !useCloud) StorageManager.save(medicines);
  }, [medicines, loaded, useCloud]);

  const loadMedicines = async () => {
    if (!user && useCloud) return;
    try {
      setSyncing(true);
      if (useCloud && user) {
        const data = await FirebaseService.getAllMedicines(user.uid);
        setMedicines(data);
      } else {
        setMedicines(StorageManager.load());
      }
      setLoaded(true);
    } catch (err) {
      showToast('error', 'Yükleme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const loadFamily = async () => {
    if (!user) return;
    try {
      const [fam, invites] = await Promise.all([
        FamilyService.getMyFamily(user.uid),
        FamilyService.getPendingInvites(user.email),
      ]);
      setFamily(fam);
      setPendingInviteCount(invites.length);
      if (fam) {
        const fMeds = await FamilyService.getFamilyMedicines(fam, user.uid);
        setFamilyMedicines(fMeds);
      } else {
        setFamilyMedicines([]);
        setStockMode('personal');
      }
    } catch (e) { console.error('[App] loadFamily ERROR:', e.code, e.message); }
  };

  const handleAuth = async (action, data) => {
    if (action === 'signup') return await AuthService.signUp(data.email, data.password, data.displayName);
    else if (action === 'signin') await AuthService.signIn(data.email, data.password);
    else if (action === 'google') await AuthService.signInWithGoogle();
    else if (action === 'reset') await AuthService.resetPassword(data.email);
    else if (action === 'resend') await AuthService.resendVerification(data.email, data.password);
  };

  const handleSignOut = async () => {
    if (!window.confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    try {
      await AuthService.signOut();
      clearKeyCache();
      setMedicines([]); setLoaded(false);
    } catch (err) {
      showToast('error', 'Çıkış yapılamadı: ' + err.message);
    }
  };

  const handleSave = async (data) => {
    try {
      setSyncing(true);
      const clean = normalizeAndValidateMedicine(data, { preserveCreatedAt: Boolean(data.createdAt) });
      if (editingId) {
        const targetUid = editingOwner || user.uid;
        const updated = { ...clean, id: editingId };
        if (useCloud && user) await FirebaseService.updateMedicine(targetUid, editingId, clean);
        if (targetUid === user.uid) {
          setMedicines(prev => prev.map(m => m.id === editingId ? updated : m));
        } else {
          await loadFamily(); // aile ilacı güncellendi, familyMedicines'i yenile
        }
        showToast('success', `"${clean.name}" güncellendi`);
      } else {
        if (useCloud && user) {
          const newMed = await FirebaseService.addMedicine(user.uid, clean);
          setMedicines(prev => [newMed, ...prev]);
        } else {
          setMedicines(prev => [createLocalMedicine(clean), ...prev]);
        }
        showToast('success', `"${clean.name}" eklendi`);
      }
    } catch (err) {
      showToast('error', 'Kaydetme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkAdd = async (medicinesData) => {
    try {
      setSyncing(true);
      const clean = normalizeMedicineList(medicinesData);
      if (useCloud && user) {
        const added = [];
        for (const d of clean) { added.push(await FirebaseService.addMedicine(user.uid, d)); }
        setMedicines(prev => [...added, ...prev]);
      } else {
        setMedicines(prev => [...clean.map(createLocalMedicine), ...prev]);
      }
      showToast('success', `${clean.length} ilaç eklendi`);
    } catch (err) {
      showToast('error', 'Toplu ekleme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.id);
    setEditingOwner(medicine.ownerId && medicine.ownerId !== user?.uid ? medicine.ownerId : null);
    setModalInitialData(medicine);
    setIsAddModalOpen(true);
  };

  const handleDeleteRequest = (medicine) => setDeletingMedicine(medicine);

  const handleDeleteConfirm = async (n) => {
    if (!deletingMedicine) return;
    const med = deletingMedicine;
    const idsToDelete = (med.allIds || [med.id]).slice(0, n);
    try {
      setSyncing(true);
      if (useCloud && user) {
        for (const id of idsToDelete) await FirebaseService.deleteMedicine(user.uid, id);
      }
      if (n >= (med.count || 1)) {
        setMedicines(prev => prev.filter(m => !idsToDelete.includes(m.id)));
      } else {
        setMedicines(prev => prev.map(m => m.id === med.id ? { ...m, count: (m.count || 1) - n } : m));
      }
      showToast('info', `${n} adet silindi`);
    } catch (err) {
      showToast('error', 'Silme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
    setDeletingMedicine(null);
  };

  const handleShare = async (medicine) => {
    if (!user) return;
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // İlaç verisini sharedLinks dökümanına gömüyoruz — başka kullanıcı medicines okuyamaz
      await setDoc(doc(db, `sharedLinks/${token}`), {
        userId: user.uid,
        medicineId: medicine.id,
        expiresAt,
        createdAt: new Date().toISOString(),
        medicine: {
          name: medicine.name || '',
          quantity: medicine.quantity || '',
          expiryDate: medicine.expiryDate || '',
          activeIngredient1: medicine.activeIngredient1 || '',
          activeIngredient2: medicine.activeIngredient2 || '',
          activeIngredient3: medicine.activeIngredient3 || '',
          notes: medicine.notes || '',
          tags: medicine.tags || [],
        },
      });

      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      showToast('success', 'Paylaşım linki kopyalandı (7 gün geçerli)');
    } catch {
      showToast('error', 'Paylaşım linki oluşturulamadı');
    }
  };

  const handleSearchBarcode = async (rawBarcode) => {
    setShowSearchScanner(false);
    const parsed = BarcodeParser.parse(rawBarcode);
    const candidates = parsed.candidates.map(v => String(v).toLowerCase());
    const exact = groupedAll.find(m => m.barcode && candidates.includes(String(m.barcode).toLowerCase()));
    if (exact) {
      setSearchTerm(exact.barcode);
      showToast('success', `"${exact.name}" barkod ile bulundu`);
      return;
    }

    try {
      let med = null;
      for (const candidate of parsed.candidates) {
        med = await MedicineDatabase.findByBarcode(candidate);
        if (med) break;
      }
      if (med) {
        const name = (med.name || '').split(',')[0].trim();
        setSearchTerm(name || parsed.barcode);
        showToast('info', 'Barkod TİTCK verisiyle eşleştirildi');
      } else {
        setSearchTerm(parsed.barcode || rawBarcode);
        showToast('error', 'Bu barkod mevcut stokta bulunamadı');
      }
    } catch (err) {
      showToast('error', 'Barkod arama hatası: ' + err.message);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user) return;
    if (notifPermission === 'granted') {
      await NotificationService.unsubscribe(user.uid);
      setNotifPermission('default');
      showToast('info', 'Bildirimler kapatıldı');
    } else {
      const granted = await NotificationService.requestPermission();
      if (granted) {
        await NotificationService.subscribe(user.uid);
        setNotifPermission('granted');
        showToast('success', 'Bildirimler açıldı — SKT yaklaşınca uyarılacaksınız');
      } else {
        setNotifPermission('denied');
        showToast('error', 'Bildirim izni reddedildi');
      }
    }
  };

  const handleExportCsv = () => {
    if (medicines.length === 0) { showToast('info', 'Dışa aktarılacak ilaç yok'); return; }
    exportMedicinesToCsv(medicines);
    showToast('success', `${medicines.length} ilaç CSV olarak indirildi`);
  };

  const handleExportJson = () => StorageManager.exportToJSON(medicines);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSyncing(true);
      const data = await StorageManager.importFromJSON(file);
      if (Array.isArray(data)) {
        if (useCloud && user) {
          const uploaded = [];
          for (const m of data) uploaded.push(await FirebaseService.addMedicine(user.uid, m));
          setMedicines(uploaded);
          showToast('success', `${uploaded.length} ilaç Firebase'e yüklendi`);
        } else {
          setMedicines(data.map(createLocalMedicine));
          showToast('success', 'Veriler yüklendi');
        }
      }
    } catch (err) {
      showToast('error', 'İçe aktarma hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
    e.target.value = null;
  };

  const toggleCloudMode = async () => {
    if (!user && !useCloud) { setShowAuthModal(true); return; }
    const newMode = !useCloud;
    setUseCloud(newMode);
    setLoaded(false);
    if (newMode && user) { await loadMedicines(); }
    else { setMedicines(StorageManager.load()); setLoaded(true); }
    showToast('info', newMode ? 'Bulut senkronu açıldı' : 'Yerel depolamaya geçildi');
  };

  // Computed list: filter + group duplicates + sort
  // Tüm ilaçlar (kendi + aile), duplicate gruplandırılmış
  // Giriş yapan kullanıcının aile rolü — editor ise başkasının ilacını da düzenleyebilir
  const myFamilyRole = user && family ? (family.members?.[user.uid]?.role ?? 'member') : null;
  const canEditFamilyMeds = myFamilyRole === 'admin' || myFamilyRole === 'editor';

  // ── Duplicate-group helper ────────────────────────────────────────────────
  function groupDupes(flat) {
    const grouped = [];
    const seen = new Set();
    flat.forEach(med => {
      if (seen.has(med.id)) return;
      const dupes = flat.filter(m => {
        if (seen.has(m.id)) return false;
        return (
          m.name.toLowerCase() === med.name.toLowerCase() &&
          (m.activeIngredient1 || '').toLowerCase() === (med.activeIngredient1 || '').toLowerCase() &&
          (m.activeIngredient2 || '').toLowerCase() === (med.activeIngredient2 || '').toLowerCase() &&
          (m.activeIngredient3 || '').toLowerCase() === (med.activeIngredient3 || '').toLowerCase() &&
          (m.quantity || '').toLowerCase() === (med.quantity || '').toLowerCase() &&
          m.expiryDate === med.expiryDate &&
          (m.notes || '').toLowerCase() === (med.notes || '').toLowerCase()
        );
      });
      dupes.forEach(d => seen.add(d.id));
      grouped.push({ ...med, count: dupes.length, allIds: dupes.map(d => d.id) });
    });
    return grouped;
  }

  // Kişisel ilaçlar (yalnızca bu kullanıcıya ait)
  const groupedPersonal = useMemo(() => {
    return groupDupes(medicines.map(m => ({ ...m, isOwn: true, canEdit: true })));
  }, [medicines]);

  // Aile deposu (tüm üyelerin ilaçları — kişisel dahil)
  const groupedFamily = useMemo(() => {
    const ownIds = new Set(medicines.map(m => m.id));
    const others = familyMedicines.filter(m => !ownIds.has(m.id)).map(m => ({ ...m, isOwn: false, canEdit: canEditFamilyMeds }));
    const flat = [...medicines.map(m => ({ ...m, isOwn: true, canEdit: true })), ...others];
    return groupDupes(flat);
  }, [medicines, familyMedicines]);

  // groupedAll: barkod araması için hâlâ tüm listeye erişim gerekiyor
  const groupedAll = groupedFamily;

  // Aktif mod: aile yoksa her zaman kişisel
  const activeGrouped = (family && stockMode === 'family') ? groupedFamily : groupedPersonal;

  const filteredMedicines = useMemo(() => {
    const q = debouncedSearch;
    const filtered = activeGrouped.filter(m => {
      if (statusFilter !== 'all') {
        const k = statusOf(m).key;
        if (statusFilter === 'good' && k !== 'good' && k !== 'soon') return false;
        if (statusFilter !== 'good' && k !== statusFilter) return false;
      }
      if (tagFilter && !(m.tags || []).includes(tagFilter)) return false;
      if (!q) return true;
      if (m.barcode && String(m.barcode).toLowerCase().includes(q)) return true;
      if (fuzzyMatch(q, m.name)) return true;
      if (m.activeIngredient1 && fuzzyMatch(q, m.activeIngredient1)) return true;
      if (m.activeIngredient2 && fuzzyMatch(q, m.activeIngredient2)) return true;
      if (m.activeIngredient3 && fuzzyMatch(q, m.activeIngredient3)) return true;
      return false;
    });
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':    return a.name.localeCompare(b.name, 'tr');
        case 'name-desc':   return b.name.localeCompare(a.name, 'tr');
        case 'expiry-asc':  return (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999');
        case 'expiry-desc': return (b.expiryDate || '0').localeCompare(a.expiryDate || '0');
        case 'count-asc':   return (a.count || 1) - (b.count || 1);
        case 'count-desc':  return (b.count || 1) - (a.count || 1);
        case 'date-asc':    return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'date-desc':
        default:            return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
  }, [activeGrouped, debouncedSearch, statusFilter, tagFilter, sortBy]);

  const allMedicines = activeGrouped;

  const allTags = useMemo(() => {
    const set = new Set();
    allMedicines.forEach(m => (m.tags || []).forEach(t => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allMedicines]);

  const stats = useMemo(() => {
    let total = 0, expired = 0, warning = 0, good = 0;
    allMedicines.forEach(m => {
      total += 1;
      const k = statusOf(m).key;
      if (k === 'expired') expired += 1;
      else if (k === 'warning') warning += 1;
      else good += 1;
    });
    return { total, expired, warning, good };
  }, [allMedicines]);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <img src={appLogo} alt="İlaç Takip" className="w-20 h-20 object-contain mx-auto mb-4 rounded-2xl bg-[var(--brand-50)] p-1"/>
          <div className="w-6 h-6 border-2 border-[var(--brand-200)] border-t-[var(--brand-600)] rounded-full animate-spin mx-auto"/>
        </div>
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => {}}
        onAuth={handleAuth}
      />
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const firstName = (user.displayName || user.email || 'Kullanıcı').split(' ')[0];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-24" style={{
      backgroundImage: 'radial-gradient(1200px 600px at 80% -10%, color-mix(in srgb, var(--brand-500) 8%, transparent), transparent), radial-gradient(800px 400px at -10% 0%, rgba(20,184,166,0.06), transparent)',
    }}>
      <Header
        user={user}
        totalCount={filteredMedicines.length}
        useCloud={useCloud}
        onToggleCloud={toggleCloudMode}
        syncing={syncing}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
        notifPermission={notifPermission}
        onToggleNotifications={handleToggleNotifications}
        onShowAllHistory={useCloud && user ? () => setShowAllHistory(true) : null}
        onShowFamily={() => setShowFamilyModal(true)}
        pendingInviteCount={pendingInviteCount}
      />

      {/* SW güncelleme bildirimi */}
      {swUpdateReady && (
        <div className="fixed top-[60px] left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-[var(--brand-600)] text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-2xl ring-1 ring-black/10 animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]">
            <Icon.Sparkles size={15}/>
            <span>Yeni sürüm hazır!</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-1 underline underline-offset-2 hover:no-underline">
              Yenile
            </button>
            <button onClick={() => setSwUpdateReady(false)} className="opacity-70 hover:opacity-100 ml-1">
              <Icon.X size={14}/>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Depo Geçiş Toggle (Segmented Control) */}
        {family && (
          <div className="flex justify-center w-full mb-8">
            <div className="flex w-full max-w-[500px] bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/60 dark:border-slate-700/60 relative">
              <button
                id="stock-toggle-family"
                onClick={() => setStockMode('family')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-300 ease-out ${
                  stockMode === 'family'
                    ? 'bg-white dark:bg-slate-700 text-[var(--brand-700)] dark:text-[var(--brand-300)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon.Users size={18} className={`transition-opacity ${stockMode === 'family' ? 'text-[var(--brand-500)] opacity-100' : 'opacity-60'}`}/>
                <span className="truncate">{family.name}</span>
              </button>
              <button
                id="stock-toggle-personal"
                onClick={() => setStockMode('personal')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-300 ease-out ${
                  stockMode === 'personal'
                    ? 'bg-white dark:bg-slate-700 text-[var(--brand-700)] dark:text-[var(--brand-300)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon.Shield size={18} className={`transition-opacity ${stockMode === 'personal' ? 'text-[var(--brand-500)] opacity-100' : 'opacity-60'}`}/>
                <span className="truncate">Kişisel Depom</span>
              </button>
            </div>
          </div>
        )}

        {/* Hero / greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[12.5px] font-medium text-[var(--brand-700)] inline-flex items-center gap-1.5 bg-[var(--brand-50)] ring-1 ring-[var(--brand-100)] px-2.5 py-1 rounded-full">
              <Icon.Heart size={12}/> {todayLabel()}
            </div>
            <h1 className="mt-2 text-[24px] sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Merhaba, {firstName} 👋
            </h1>
            {stats.warning > 0 ? (
              <p className="text-[13.5px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bugün <span className="font-semibold text-amber-700">{stats.warning}</span> ilacınız 30 gün içinde sona eriyor.
              </p>
            ) : stats.expired > 0 ? (
              <p className="text-[13.5px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-rose-700">{stats.expired}</span> ilacınızın süresi dolmuş, kontrol etmeniz önerilir.
              </p>
            ) : (
              <p className="text-[13.5px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
                Stoğunuz güvende görünüyor. İyi günler!
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setEditingId(null); setModalInitialData(null); setIsAddModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_8px_20px_-8px_var(--brand-shadow)] transition-colors">
              <Icon.Plus size={15}/> Yeni ilaç
            </button>
            <button onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors">
              <Icon.List size={15}/> <span className="hidden sm:inline">Toplu ekle</span>
            </button>

            {/* Masaüstü: CSV / JSON / İçe aktar düz göster */}
            <button onClick={handleExportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors"
              title="CSV olarak indir">
              <Icon.Download size={15}/> CSV
            </button>
            <button onClick={handleExportJson}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors"
              title="JSON yedeği al">
              <Icon.Download size={15}/> JSON
            </button>
            <label className="hidden sm:block cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors">
                <Icon.Upload size={15}/> İçe aktar
              </span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden"/>
            </label>

            {/* Mobil: ⋯ açılır menü */}
            <div className="relative sm:hidden" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors"
                aria-label="Daha fazla">
                <Icon.Download size={15}/> Dışa aktar
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                  <button onClick={() => { handleExportCsv(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[13.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Icon.Download size={14}/> CSV olarak indir
                  </button>
                  <button onClick={() => { handleExportJson(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[13.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800">
                    <Icon.Download size={14}/> JSON yedeği al
                  </button>
                  <label className="block border-t border-slate-100 dark:border-slate-800 cursor-pointer">
                    <span className="w-full flex items-center gap-2.5 px-4 py-3 text-[13.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Icon.Upload size={14}/> JSON içe aktar
                    </span>
                    <input type="file" accept=".json" onChange={(e) => { handleImport(e); setShowExportMenu(false); }} className="hidden"/>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Toplam İlaç"     value={stats.total}   sublabel={`${allMedicines.length} farklı kayıt`}         accent="indigo"  icon={<Icon.Box size={16}/>}/>
          <StatCard label="Süresi Geçmiş"   value={stats.expired} sublabel={stats.expired > 0 ? 'Kontrol önerilir' : 'Şu an temiz'} accent="rose"    icon={<Icon.AlertTri size={16}/>}/>
          <StatCard label="Yakında Bitiyor" value={stats.warning} sublabel="30 gün eşiği"                               accent="amber"   icon={<Icon.Clock size={16}/>}/>
          <StatCard label="Güvenli Stokta"  value={stats.good}    sublabel="3 ay üstü süre"                             accent="emerald" icon={<Icon.Shield size={16}/>}/>
        </div>

        {/* Search + sort + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="İlaç adı veya etken madde ile ara…"
              className="w-full pl-10 pr-20 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px] shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            />
            <button onClick={() => setShowSearchScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" aria-label="Barkod ile ara">
              <Icon.Camera size={14}/>
            </button>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <Icon.X size={14}/>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 justify-between">
            <SortMenu value={sortBy} onChange={setSortBy}/>
            {allTags.length > 0 && (
              <TagFilterMenu tags={allTags} value={tagFilter} onChange={setTagFilter}/>
            )}
            <div className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg ${view === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`} aria-label="Kart görünümü">
                <Icon.Grid size={15}/>
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-lg ${view === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`} aria-label="Liste görünümü">
                <Icon.List size={15}/>
              </button>
            </div>
          </div>
        </div>

        {/* Result count + filter chips */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-[12.5px] text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5">
            <span><span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{filteredMedicines.length}</span> sonuç</span>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="text-[var(--brand-600)] hover:underline">
                × {STATUS_MAP[statusFilter]?.label}
              </button>
            )}
            {tagFilter && (
              <button onClick={() => setTagFilter(null)} className="text-[var(--brand-600)] hover:underline">
                × {tagFilter}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { k: 'all',     l: 'Tümü',          c: allMedicines.length,                                                          color: null },
              { k: 'expired', l: 'Süresi geçmiş', c: allMedicines.filter(m => statusOf(m).key === 'expired').length,               color: 'rose' },
              { k: 'warning', l: 'Yakında biter',  c: allMedicines.filter(m => statusOf(m).key === 'warning').length,               color: 'amber' },
              { k: 'good',    l: 'Güvenli',        c: allMedicines.filter(m => ['good','soon'].includes(statusOf(m).key)).length,   color: 'emerald' },
            ].map(chip => {
              const active = statusFilter === chip.k;
              const dotCls = chip.color === 'rose' ? 'bg-rose-500' : chip.color === 'amber' ? 'bg-amber-500' : chip.color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400';
              return (
                <button key={chip.k}
                  onClick={() => setStatusFilter(chip.k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] transition-colors ${
                    active
                      ? 'bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-700)] font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
                  {chip.l} <span className={`tabular-nums ${active ? '' : 'font-semibold text-slate-900 dark:text-slate-200'}`}>{chip.c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Medicine list or grid */}
        {filteredMedicines.length === 0 ? (
          <EmptyState
            searching={!!searchTerm}
            onAdd={() => { setEditingId(null); setModalInitialData(null); setIsAddModalOpen(true); }}
            onBulk={() => setIsBulkModalOpen(true)}
          />
        ) : view === 'list' ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            {filteredMedicines.map(m => (
              <MedicineRow key={m.id} medicine={m} onEdit={handleEdit} onDelete={handleDeleteRequest}/>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map(m => (
              <MedicineCard key={m.id} medicine={m} onEdit={handleEdit} onDelete={handleDeleteRequest}
                onHistory={useCloud && user ? setHistoryMedicine : null}
                onShare={useCloud && user ? handleShare : null}/>
            ))}
          </div>
        )}

        <div className="mt-10 pb-4 text-center text-[11.5px] text-slate-400 dark:text-slate-600 flex flex-col items-center gap-1.5">
          <span>İlaç Takip Sistemi · Verileriniz {useCloud ? 'bulutta şifreli' : 'cihazınızda yerel olarak'} saklanır</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 transition-colors">Gizlilik Politikası</button>
            <span>·</span>
            <button onClick={() => setShowTerms(true)} className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 transition-colors">Kullanım Koşulları</button>
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditingId(null); setModalInitialData(null); setIsAddModalOpen(true); }}
        className="sm:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-[var(--brand-600)] text-white grid place-items-center shadow-[0_16px_30px_-8px_var(--brand-shadow)] active:scale-95 transition-transform"
        aria-label="Yeni ilaç">
        <Icon.Plus size={22}/>
      </button>

      {/* Modals */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingId(null); setEditingOwner(null); setModalInitialData(null); }}
        onSave={handleSave}
        initialData={modalInitialData}
        isEdit={!!editingId}
        familyId={family?.id || null}
      />
      <BulkAddModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={handleBulkAdd}
      />
      <DeleteModal
        medicine={deletingMedicine}
        onClose={() => setDeletingMedicine(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Auth modal (cloud toggle when logged out) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      )}

      {/* Usage History Modal — tek ilaç */}
      {historyMedicine && (
        <UsageHistoryModal
          medicine={historyMedicine}
          userId={user?.uid}
          onClose={() => setHistoryMedicine(null)}
        />
      )}

      {/* All History Modal — tüm ilaçlar */}
      {showAllHistory && (
        <AllHistoryModal
          userId={user?.uid}
          medicines={medicines}
          onClose={() => setShowAllHistory(false)}
        />
      )}

      {/* Family Modal */}
      {showFamilyModal && user && (
        <FamilyModal
          user={user}
          onClose={() => setShowFamilyModal(false)}
          onFamilyChange={loadFamily}
        />
      )}

      {/* Legal Modals */}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)}/>}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)}/>}

      {showSearchScanner && (
        <BarcodeScanner
          onResult={handleSearchBarcode}
          onClose={() => setShowSearchScanner(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.text}</Toast>}
    </div>
  );
}

export default App;
