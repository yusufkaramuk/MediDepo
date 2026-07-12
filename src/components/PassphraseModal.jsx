import React, { useState } from 'react';
import { Lock, Shield, KeyRound, AlertCircle, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { resolvePassphraseRequest, rejectPassphraseRequest } from '../services/EncryptionService';

export function PassphraseModal({ isNew, isRetry, onClose }) {
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(isRetry ? 'Girdiğiniz şifre hatalı, lütfen tekrar deneyin.' : '');

  const rules = [
    { label: 'En az 8 karakter', ok: passphrase.length >= 8 },
    { label: 'En az 1 büyük harf (A–Z)', ok: /[A-Z]/.test(passphrase) },
    { label: 'En az 1 rakam (0–9)', ok: /[0-9]/.test(passphrase) },
    { label: 'En az 1 sembol (!@#$ vb.)', ok: /[!@#$%^&*(),.?":{}|<>]/.test(passphrase) },
  ];
  const allRulesMet = rules.every(r => r.ok);

  const validatePassphrase = (pwd) => {
    if (pwd.length < 8) return 'Şifre en az 8 karakter olmalıdır.';
    if (!/[A-Z]/.test(pwd)) return 'Şifrede en az 1 büyük harf bulunmalıdır.';
    if (!/[0-9]/.test(pwd)) return 'Şifrede en az 1 rakam bulunmalıdır.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Şifrede en az 1 özel karakter (sembol) bulunmalıdır.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = passphrase.trim();
    if (!trimmed) { setError('Şifre boş bırakılamaz.'); return; }
    if (isNew) {
      const ve = validatePassphrase(trimmed);
      if (ve) { setError(ve); return; }
    }
    resolvePassphraseRequest(trimmed);
    onClose();
  };

  const handleCancel = () => {
    if (isNew) return;
    rejectPassphraseRequest('CANCELLED');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">

        {/* Top colored banner - only on isNew */}
        {isNew && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-6 pb-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <TriangleAlert size={22} />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">Önemli Bilgi</div>
            </div>
            <p className="text-[14px] leading-relaxed font-medium">
              Bu şifre, bilgilerinizi koruyan <span className="underline decoration-wavy decoration-white/50">gizli kilittir</span>.
              Unutulursa verilerinize bir daha ulaşmak <span className="font-bold">mümkün olmaz</span>.
              Lütfen güvenli bir yere not alın.
            </p>
          </div>
        )}

        <div className="p-7">
          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isNew ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
              {isNew ? <Shield size={26} /> : <KeyRound size={26} />}
            </div>
            <div>
              <h2 className="text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {isNew ? 'Kilit Şifrenizi Belirleyin' : 'Kilit Şifrenizi Girin'}
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isNew
                  ? 'Bilgilerinizin güvenliği için size özel bir şifre oluşturun.'
                  : 'Bu cihazda bilgilerinize erişmek için şifrenizi girin.'}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="text-[13px] font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Password input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={17} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                autoFocus
                placeholder="Kilit şifreniz…"
                value={passphrase}
                onChange={(e) => { setPassphrase(e.target.value); if (error) setError(''); }}
                className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none text-[15px] text-slate-900 dark:text-slate-100 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Rules checklist - only for new */}
            {isNew && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Şifre Gereksinimleri</div>
                {rules.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2.5 text-[12.5px] transition-colors ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${r.ok ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {r.ok && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            {/* Warning note for new users */}
            {isNew && (
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <TriangleAlert size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Bu şifreyi not alın veya şifre yöneticinize kaydedin. Sistem şifrenizi hiçbir yerde saklamaz, kaybolursa verilerinize erişmek kalıcı olarak mümkün olmaz.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-1">
              {!isNew && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                İptal
              </button>
              )}
              <button
                type="submit"
                disabled={isNew && !allRulesMet}
                className={`flex-1 px-5 py-3.5 rounded-xl font-semibold text-white transition-all ${isNew ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_8px_20px_-8px_rgba(245,158,11,0.6)] disabled:opacity-40 disabled:cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.5)]'}`}
              >
                {isNew ? 'Kilit Şifremi Kaydet' : 'Devam Et'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
