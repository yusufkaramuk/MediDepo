import React from 'react';
import * as Icon from 'lucide-react';
import { ModalShell } from './ui/ModalShell';

// Uygulama açıkken tam ekran alarm görünümü.
// Tıbbi yorum içermez; yalnızca kullanıcının kendi planını hatırlatır.
export const AlarmOverlay = ({ alarm, onTaken, onSnooze, onSkip, onClose }) => {
  if (!alarm) return null;
  const { schedule, time, medicineName, snoozed } = alarm;
  const doseText = schedule.dosePerIntake
    ? `${schedule.dosePerIntake} ${schedule.unitLabel || 'doz'}`
    : null;

  return (
    <ModalShell onClose={onClose} labelledBy="alarm-title" maxWidth="max-w-sm" zIndex="z-[70]">
      <div className="p-6 text-center space-y-5">
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--brand-50)] grid place-items-center ring-8 ring-[var(--brand-50)]/50">
          <Icon.BellRing size={36} className="text-[var(--brand-600)] animate-gentle-pulse"/>
        </div>

        <div>
          <h2 id="alarm-title" className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
            {snoozed ? 'Ertelenen hatırlatma' : 'İlaç zamanı'}
          </h2>
          <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {medicineName ? <strong className="text-slate-900 dark:text-slate-100">{medicineName}</strong> : 'Planladığınız ilaç'}
            {doseText ? ` — ${doseText}` : ''}
          </p>
          {time && (
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 tabular-nums inline-flex items-center gap-1.5">
              <Icon.Clock size={13}/> Planlanan saat: {time}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <button onClick={onTaken}
            className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] transition-colors min-h-[52px] inline-flex items-center justify-center gap-2">
            <Icon.Check size={18}/> Aldım
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={onSnooze}
              className="py-3 rounded-2xl text-[14px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[48px] inline-flex items-center justify-center gap-1.5">
              <Icon.AlarmClock size={15}/> {schedule.snoozeMinutes || 10} dk ertele
            </button>
            <button onClick={onSkip}
              className="py-3 rounded-2xl text-[14px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px] inline-flex items-center justify-center gap-1.5">
              <Icon.SkipForward size={15}/> Atla
            </button>
          </div>
        </div>

        <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
          Bu hatırlatma sizin girdiğiniz plana dayanır; tıbbi tavsiye değildir.
        </p>
      </div>
    </ModalShell>
  );
};

export default AlarmOverlay;
