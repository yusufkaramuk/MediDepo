import React, { useState, useMemo } from 'react';
import * as Icon from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { SCHEDULE_LIMITS } from '../services/ScheduleService';
import { estimateRunoutDate, dailyConsumption } from '../utils/reminderMath';

// İlaç kullanım hatırlatıcısı kurulum ekranı.
// Orta yaş ve ileri yaş kullanıcılar hedeflendiği için:
// - Saat seçimi hazır çiplerle + <input type="time"> ile yapılır
// - Her bölümde kısa, sade açıklama metni vardır
// - Hata mesajları alanla ilişkilendirilir (aria-describedby)

const DAY_LABELS = [
  { d: 1, l: 'Pzt' }, { d: 2, l: 'Sal' }, { d: 3, l: 'Çar' },
  { d: 4, l: 'Per' }, { d: 5, l: 'Cum' }, { d: 6, l: 'Cmt' }, { d: 0, l: 'Paz' },
];

const COMMON_TIMES = ['08:00', '12:00', '18:00', '22:00'];
const SNOOZE_OPTIONS = [5, 10, 15, 30];
const LEAD_OPTIONS = [3, 5, 7, 14];

const Section = ({ title, hint, children }) => (
  <section className="space-y-2">
    <div>
      <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      {hint && <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{hint}</div>}
    </div>
    {children}
  </section>
);

const ToggleRow = ({ label, hint, checked, onChange, id }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer min-h-[56px]">
    <span>
      <span className="block text-[14px] font-medium text-slate-900 dark:text-slate-100">{label}</span>
      {hint && <span className="block text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{hint}</span>}
    </span>
    <button
      type="button" id={id} role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? 'bg-[var(--brand-600)]' : 'bg-slate-300 dark:bg-slate-600'}`}>
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></span>
    </button>
  </label>
);

export const ReminderModal = ({ medicine, schedule, notifPermission, onClose, onSave, onRemove }) => {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [medReminder, setMedReminder] = useState(schedule?.medicationReminderEnabled ?? true);
  const [times, setTimes] = useState(schedule?.scheduleTimes || ['08:00']);
  const [customTime, setCustomTime] = useState('');
  const [days, setDays] = useState(schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
  const [dose, setDose] = useState(schedule?.dosePerIntake ?? 1);
  const [unitLabel, setUnitLabel] = useState(schedule?.unitLabel || 'tablet');
  const [unitsPerPackage, setUnitsPerPackage] = useState(schedule?.unitsPerPackage || '');
  const [remainingUnits, setRemainingUnits] = useState(schedule?.remainingUnits ?? '');
  const [refillEnabled, setRefillEnabled] = useState(schedule?.refillReminderEnabled ?? false);
  const [refillLeadDays, setRefillLeadDays] = useState(schedule?.refillLeadDays ?? 7);
  const [snoozeMinutes, setSnoozeMinutes] = useState(schedule?.snoozeMinutes ?? 10);
  const [quietEnabled, setQuietEnabled] = useState(Boolean(schedule?.quietHours));
  const [quietStart, setQuietStart] = useState(schedule?.quietHours?.start || '22:00');
  const [quietEnd, setQuietEnd] = useState(schedule?.quietHours?.end || '07:00');
  const [privacyMode, setPrivacyMode] = useState(schedule?.notificationPrivacyMode || 'generic');
  const [displayLabel, setDisplayLabel] = useState(schedule?.displayLabel || '');
  const [labelConsent, setLabelConsent] = useState(Boolean(schedule?.displayLabel));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const timezone = schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const runout = useMemo(() => {
    if (!refillEnabled || remainingUnits === '' || times.length === 0) return null;
    return estimateRunoutDate(Number(remainingUnits), {
      scheduleTimes: times, daysOfWeek: days, dosePerIntake: Number(dose),
    });
  }, [refillEnabled, remainingUnits, times, days, dose]);

  const toggleTime = (t) => {
    setTimes(prev => prev.includes(t)
      ? prev.filter(x => x !== t)
      : [...prev, t].sort().slice(0, SCHEDULE_LIMITS.maxTimes));
  };

  const addCustomTime = () => {
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(customTime)) {
      toggleTime(customTime);
      setCustomTime('');
      setError('');
    } else {
      setError('Saat biçimi geçersiz. Örnek: 08:30');
    }
  };

  const toggleDay = (d) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  };

  const handleSave = async () => {
    setError('');
    if (privacyMode === 'named' && !labelConsent) {
      setError('İsimli bildirim için onay kutusunu işaretlemeniz gerekir.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        medicineId: medicine.id,
        enabled,
        timezone,
        scheduleTimes: times,
        daysOfWeek: days,
        dosePerIntake: Number(dose) || 1,
        unitLabel,
        unitsPerPackage: unitsPerPackage === '' ? 0 : Number(unitsPerPackage),
        remainingUnits: remainingUnits === '' ? 0 : Number(remainingUnits),
        refillLeadDays: Number(refillLeadDays) || 7,
        refillReminderEnabled: refillEnabled,
        medicationReminderEnabled: medReminder,
        snoozeMinutes: Number(snoozeMinutes) || 10,
        quietHours: quietEnabled ? { start: quietStart, end: quietEnd } : null,
        notificationPrivacyMode: privacyMode,
        displayLabel: privacyMode === 'named' ? displayLabel : '',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Hatırlatıcı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} labelledBy="reminder-modal-title" maxWidth="max-w-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 id="reminder-modal-title" className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
          <Icon.Bell size={18} className="text-[var(--brand-600)] shrink-0"/>
          <span className="truncate">Hatırlatıcı — {medicine?.name}</span>
        </h2>
        <button onClick={onClose} aria-label="Hatırlatıcı ekranını kapat"
          className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <Icon.X size={16}/>
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-6">
        {notifPermission !== 'granted' && (
          <div role="note" className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-[13px] leading-relaxed flex gap-2.5">
            <Icon.Info size={16} className="shrink-0 mt-0.5"/>
            <span>
              Bildirim izni kapalı. Uygulama <strong>açıkken</strong> hatırlatıcılar ekranda gösterilir;
              uygulama kapalıyken bildirim alabilmek için üst menüden bildirimleri açın.
            </span>
          </div>
        )}

        <ToggleRow id="rem-enabled" label="Hatırlatıcı açık"
          hint="Kapatırsanız bu ilaç için hiçbir hatırlatma yapılmaz."
          checked={enabled} onChange={setEnabled}/>

        {enabled && (<>
        <ToggleRow id="rem-med" label="Kullanım saati hatırlatması"
          hint="Seçtiğiniz saatlerde size haber verilir."
          checked={medReminder} onChange={setMedReminder}/>

        {medReminder && (<>
        <Section title="Hangi saatlerde?" hint="Bir veya birden fazla saat seçin. Hazır saatlere dokunun ya da kendi saatinizi ekleyin.">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Hatırlatma saatleri">
            {[...new Set([...COMMON_TIMES, ...times])].sort().map(t => (
              <button key={t} type="button" onClick={() => toggleTime(t)}
                aria-pressed={times.includes(t)}
                className={`px-4 py-2.5 rounded-xl text-[15px] font-semibold tabular-nums min-h-[44px] min-w-[76px] border transition-colors ${
                  times.includes(t)
                    ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[var(--brand-400)]'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
              aria-label="Başka bir saat ekle"
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]"/>
            <button type="button" onClick={addCustomTime}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)] min-h-[44px] transition-colors">
              Saat ekle
            </button>
          </div>
          {times.length === 0 && (
            <p className="text-[12.5px] text-rose-600 dark:text-rose-400">En az bir saat seçin.</p>
          )}
        </Section>

        <Section title="Hangi günlerde?" hint="İlacı kullandığınız günlere dokunun. Tümü seçiliyse her gün hatırlatılır.">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kullanım günleri">
            {DAY_LABELS.map(({ d, l }) => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                aria-pressed={days.includes(d)}
                className={`w-[46px] h-[46px] rounded-xl text-[13px] font-semibold border transition-colors ${
                  days.includes(d)
                    ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                {l}
              </button>
            ))}
          </div>
          {days.length === 0 && (
            <p className="text-[12.5px] text-rose-600 dark:text-rose-400">En az bir gün seçin.</p>
          )}
        </Section>

        <Section title="Her seferde ne kadar?" hint="Bir kullanımda aldığınız miktar (örnek: 1 tablet, yarım için 0,5).">
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" min="0.25" max="20" step="0.25" value={dose}
              onChange={e => setDose(e.target.value)} aria-label="Kullanım başına doz"
              className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]"/>
            <select value={unitLabel} onChange={e => setUnitLabel(e.target.value)} aria-label="Birim"
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]">
              <option value="tablet">tablet</option>
              <option value="kapsül">kapsül</option>
              <option value="ölçek">ölçek</option>
              <option value="damla">damla</option>
              <option value="doz">doz</option>
            </select>
          </div>
        </Section>

        <Section title="Erteleme süresi" hint="Bildirimde 'Ertele' derseniz kaç dakika sonra tekrar hatırlatılsın?">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Erteleme süresi">
            {SNOOZE_OPTIONS.map(m => (
              <button key={m} type="button" onClick={() => setSnoozeMinutes(m)}
                aria-pressed={Number(snoozeMinutes) === m}
                className={`px-4 py-2.5 rounded-xl text-[14px] font-medium min-h-[44px] border transition-colors ${
                  Number(snoozeMinutes) === m
                    ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                {m} dk
              </button>
            ))}
          </div>
        </Section>

        <Section title="Sessiz saatler" hint="Bu aralıkta hatırlatma gönderilmez (örnek: gece 22:00 – sabah 07:00).">
          <ToggleRow id="rem-quiet" label="Sessiz saat kullan" checked={quietEnabled} onChange={setQuietEnabled}/>
          {quietEnabled && (
            <div className="flex items-center gap-2 text-[14px] text-slate-700 dark:text-slate-300">
              <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} aria-label="Sessiz saat başlangıcı"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[44px] text-slate-900 dark:text-slate-100"/>
              <span aria-hidden="true">→</span>
              <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} aria-label="Sessiz saat bitişi"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[44px] text-slate-900 dark:text-slate-100"/>
            </div>
          )}
        </Section>
        </>)}

        <Section title="Kutu bitiş uyarısı" hint="Kutudaki miktarı girerseniz, ilaç bitmeden önce size haber verilir.">
          <ToggleRow id="rem-refill" label="Bitmeden uyar"
            hint="Kalan miktar ve kullanım planınıza göre tahmini bitiş hesaplanır."
            checked={refillEnabled} onChange={setRefillEnabled}/>
          {refillEnabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[12.5px] text-slate-600 dark:text-slate-400">
                  Kutudaki toplam {unitLabel}
                  <input type="number" inputMode="numeric" min="1" max="500" value={unitsPerPackage}
                    onChange={e => setUnitsPerPackage(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]"/>
                </label>
                <label className="text-[12.5px] text-slate-600 dark:text-slate-400">
                  Şu an kalan {unitLabel}
                  <input type="number" inputMode="decimal" min="0" max="5000" value={remainingUnits}
                    onChange={e => setRemainingUnits(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]"/>
                </label>
              </div>
              <div>
                <div className="text-[12.5px] text-slate-600 dark:text-slate-400 mb-1.5">Bitmeden kaç gün önce uyarılmak istersiniz?</div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Uyarı öncesi gün sayısı">
                  {LEAD_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => setRefillLeadDays(d)}
                      aria-pressed={Number(refillLeadDays) === d}
                      className={`px-4 py-2.5 rounded-xl text-[14px] font-medium min-h-[44px] border transition-colors ${
                        Number(refillLeadDays) === d
                          ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                      {d} gün
                    </button>
                  ))}
                </div>
              </div>
              {runout && (
                <div className="p-3 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] text-[13px] flex items-center gap-2">
                  <Icon.CalendarClock size={15} className="shrink-0"/>
                  Tahmini bitiş: <strong>{runout.date.toLocaleDateString('tr-TR')}</strong> (~{runout.daysLeft} gün)
                </div>
              )}
              {refillEnabled && remainingUnits !== '' && !runout && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[13px]">
                  Tahmin için kullanım saati, gün ve doz bilgisi gerekir.
                </div>
              )}
            </div>
          )}
        </Section>

        <Section title="Bildirim gizliliği" hint="Bildirimler telefon kilit ekranında görünebilir.">
          <div className="space-y-2" role="radiogroup" aria-label="Bildirim gizliliği">
            <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${privacyMode === 'generic' ? 'border-[var(--brand-400)] bg-[var(--brand-50)]' : 'border-slate-200 dark:border-slate-700'}`}>
              <input type="radio" name="privacy" checked={privacyMode === 'generic'} onChange={() => setPrivacyMode('generic')} className="mt-1 accent-[var(--brand-600)] w-4 h-4"/>
              <span>
                <span className="block text-[14px] font-medium text-slate-900 dark:text-slate-100">Genel bildirim (önerilen)</span>
                <span className="block text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">"İlaç zamanınız geldi" — ilaç adı görünmez.</span>
              </span>
            </label>
            <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${privacyMode === 'named' ? 'border-[var(--brand-400)] bg-[var(--brand-50)]' : 'border-slate-200 dark:border-slate-700'}`}>
              <input type="radio" name="privacy" checked={privacyMode === 'named'} onChange={() => setPrivacyMode('named')} className="mt-1 accent-[var(--brand-600)] w-4 h-4"/>
              <span>
                <span className="block text-[14px] font-medium text-slate-900 dark:text-slate-100">İsimli bildirim</span>
                <span className="block text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Bildirimde sizin yazdığınız etiket görünür (örn. "Tansiyon ilacı").</span>
              </span>
            </label>
          </div>

          {privacyMode === 'named' && (
            <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
              <label className="block text-[12.5px] text-slate-600 dark:text-slate-400">
                Bildirimde görünecek etiket
                <input type="text" value={displayLabel} maxLength={SCHEDULE_LIMITS.displayLabel}
                  onChange={e => setDisplayLabel(e.target.value)}
                  placeholder="Örn. Tansiyon ilacı"
                  aria-describedby="label-privacy-note"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[15px] min-h-[44px]"/>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={labelConsent} onChange={e => setLabelConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[var(--brand-600)]"/>
                <span id="label-privacy-note" className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bu etiketin <strong>şifrelenmeden</strong> sunucuda saklanacağını ve bildirimlerde
                  görüneceğini anlıyorum. (İlaç adınız her zaman şifreli kalır; bu etiket ondan bağımsızdır.)
                </span>
              </label>
            </div>
          )}
        </Section>
        </>)}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[13px] font-medium">
            {error}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {schedule?.id ? (
          <button onClick={() => { onRemove?.(schedule.id); onClose(); }}
            className="px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors min-h-[44px]">
            Hatırlatıcıyı sil
          </button>
        ) : <span/>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]">
            Vazgeç
          </button>
          <button onClick={handleSave} disabled={saving || (enabled && medReminder && (times.length === 0 || days.length === 0))}
            className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 transition-colors min-h-[44px]">
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ReminderModal;
