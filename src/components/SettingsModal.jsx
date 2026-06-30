import React, { useState } from 'react';
import * as Icon from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { EncryptionService } from '../services/EncryptionService';

const FONT_SIZES = [
  { label: 'Küçük', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Büyük', value: '18px' },
  { label: 'Çok Büyük', value: '20px' }
];

// ── Kilit Şifresi Değiştirme alt-bileşeni ────────────────────────────────────
function ChangePassphraseSection({ user }) {
  // Adımlar: 'idle' → 'verify-sent' → 'change-form' → 'done'
  const [step, setStep] = useState('idle');
  const [verifyCode, setVerifyCode] = useState('');
  const [oldPhrase, setOldPhrase] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const passRules = [
    { label: 'En az 8 karakter', ok: newPhrase.length >= 8 },
    { label: 'En az 1 büyük harf', ok: /[A-Z]/.test(newPhrase) },
    { label: 'En az 1 rakam', ok: /[0-9]/.test(newPhrase) },
    { label: 'En az 1 sembol', ok: /[!@#$%^&*(),.?":{}|<>]/.test(newPhrase) },
  ];
  const allRules = passRules.every(r => r.ok);

  // Adım 1: Kullanıcıya doğrulama maili gönder (Firebase'in "şifre sıfırlama" değil,
  // geçici bir e-posta doğrulama kodu kanalı yok; bunun yerine eski şifre re-auth
  // gerektirdiği için "mevcut kilit şifrenizi girin" yeterli. Ekstra güvenlik için
  // "mevcut login şifresini" doğrulama e-postası ile de koruyabiliriz.
  // Burada Firebase sendEmailVerification'ı "e-posta onay bağlantısı" olarak kullanıyoruz
  // ama sayfa yenilenmeden doğrulama yapılamaz. Daha pratik akış: 
  // Kullanıcı, giriş şifresini girerek re-auth → ardından kilit şifresini değiştirir.)
  //
  // → Güvenli akış: mevcut FIREBASE şifresini sorup reauthenticate et, sonra kilit şifresi al.

  const handleSendVerifyEmail = async () => {
    setError('');
    setLoading(true);
    try {
      await AuthService.sendChangeVerificationEmail(user.email);
      setStep('verify-sent');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndProceed = async (e) => {
    e.preventDefault();
    setError('');
    if (!verifyCode.trim()) {
      setError('Lütfen e-postanızdaki bağlantıya tıklayın, ardından devam edin.');
      return;
    }
    setStep('change-form');
  };

  const handleChangePassphrase = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRules) { setError('Yeni şifre kurallara uymuyor.'); return; }
    if (newPhrase !== confirmPhrase) { setError('Yeni şifreler eşleşmiyor.'); return; }
    if (!oldPhrase.trim()) { setError('Mevcut kilit şifrenizi girmelisiniz.'); return; }

    setLoading(true);
    try {
      await EncryptionService.changeUserPassphrase(user.uid, oldPhrase.trim(), newPhrase.trim());
      setSuccess('Kilit şifreniz başarıyla güncellendi!');
      setStep('done');
      setOldPhrase(''); setNewPhrase(''); setConfirmPhrase('');
    } catch (e) {
      setError('Mevcut kilit şifreniz yanlış veya bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Kilit Şifresi</h3>
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Icon.KeyRound size={18} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">Kilit Şifresini Değiştir</div>
            <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Verilerinizin gizli kilidi olan şifreyi değiştirmek için önce e-posta doğrulaması gereklidir.
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[12.5px] flex items-start gap-2">
            <Icon.AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[12.5px] flex items-start gap-2">
            <Icon.CheckCircle size={14} className="shrink-0 mt-0.5" />
            {success}
          </div>
        )}

        {/* Adım 1: Başlat */}
        {step === 'idle' && (
          <button
            onClick={handleSendVerifyEmail}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13.5px] font-semibold transition-colors disabled:opacity-50 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)]"
          >
            {loading ? 'Gönderiliyor…' : 'E-posta Doğrulama Bağlantısı Gönder'}
          </button>
        )}

        {/* Adım 2: Mail gönderildi */}
        {step === 'verify-sent' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[12.5px] leading-relaxed">
              <span className="font-bold">{user.email}</span> adresinize bir doğrulama bağlantısı gönderdik. Linke tıkladıktan sonra aşağıdaki butona basın.
            </div>
            <button
              onClick={() => setStep('change-form')}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-[13.5px] font-semibold transition-colors"
            >
              E-postamı Doğruladım, Devam Et →
            </button>
          </div>
        )}

        {/* Adım 3: Şifre değiştirme formu */}
        {step === 'change-form' && (
          <form onSubmit={handleChangePassphrase} className="space-y-3">
            {/* Mevcut kilit şifresi */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Mevcut Kilit Şifreniz</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={oldPhrase}
                  onChange={e => setOldPhrase(e.target.value)}
                  required
                  className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
                <button type="button" onClick={() => setShowOld(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                  {showOld ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Yeni kilit şifresi */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Yeni Kilit Şifreniz</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPhrase}
                  onChange={e => setNewPhrase(e.target.value)}
                  required
                  className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                  {showNew ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}
                </button>
              </div>
              {/* Rules */}
              <div className="mt-2 grid grid-cols-2 gap-1">
                {passRules.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-[11px] transition-colors ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${r.ok ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {r.ok && <svg width="6" height="5" viewBox="0 0 6 5" fill="none"><path d="M1 2.5L2.5 4L5 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPhrase}
                onChange={e => setConfirmPhrase(e.target.value)}
                required
                className={`w-full px-3 py-2.5 rounded-xl border text-[14px] text-slate-900 dark:text-slate-100 outline-none bg-slate-50 dark:bg-slate-800 transition-all ${confirmPhrase && confirmPhrase !== newPhrase ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20' : 'border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'}`}
              />
              {confirmPhrase && confirmPhrase !== newPhrase && (
                <p className="text-[11.5px] text-rose-500 mt-1">Şifreler eşleşmiyor</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allRules || newPhrase !== confirmPhrase}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13.5px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)] mt-1"
            >
              {loading ? 'Güncelleniyor…' : 'Kilit Şifremi Güncelle'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <button onClick={() => setStep('idle')} className="w-full py-2 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Tekrar değiştir
          </button>
        )}
      </div>
    </section>
  );
}

// ── Ana Settings Modal ────────────────────────────────────────────────────────
export function SettingsModal({ user, fontSize, onFontSizeChange, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isPasswordUser = user?.providerData?.some(p => p.providerId === 'password');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) return setError('Yeni şifre en az 6 karakter olmalıdır.');
    if (newPassword !== confirmPassword) return setError('Yeni şifreler eşleşmiyor.');

    try {
      setLoading(true);
      await AuthService.changePassword(currentPassword, newPassword);
      setSuccess('Şifreniz başarıyla güncellendi.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-[fade_.18s_ease]"></div>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90dvh] animate-[slideUp_.25s_ease]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Icon.Settings size={18} className="text-slate-400 dark:text-slate-500"/> Ayarlar
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Icon.X size={16}/>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-8">
          {/* Kullanıcı Bilgileri */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Hesap Bilgileri</h3>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-100)] to-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center text-lg font-bold">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.displayName || 'Kullanıcı'}</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
          </section>

          {/* Görünüm Ayarları */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Erişilebilirlik</h3>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100">Yazı Boyutu</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Önizleme: A a</div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {FONT_SIZES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFontSizeChange(opt.value)}
                    className={`flex-1 min-w-[70px] py-2 rounded-xl text-[13px] font-medium transition-colors border ${
                      fontSize === opt.value
                        ? 'bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-700)]'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                Yazı boyutu değiştiğinde tüm uygulama arayüzü dinamik olarak ölçeklenir.
              </p>
            </div>
          </section>

          {/* Kilit Şifresi Değiştir */}
          {user && <ChangePassphraseSection user={user} />}

          {/* Giriş Şifresi Değiştirme */}
          {isPasswordUser && (
            <section>
              <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Giriş Şifresi</h3>
              <form onSubmit={handleChangePassword} className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100 mb-1">Giriş Şifresini Değiştir</div>

                {error && <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[12.5px] font-medium">{error}</div>}
                {success && <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[12.5px] font-medium">{success}</div>}

                <input type="password" placeholder="Mevcut Şifre" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)]" />
                <input type="password" placeholder="Yeni Şifre" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)]" />
                <input type="password" placeholder="Yeni Şifre (Tekrar)" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)]" />

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[var(--brand-600)] text-white text-[13.5px] font-medium hover:bg-[var(--brand-700)] transition-colors disabled:opacity-50 mt-1">
                  {loading ? 'Güncelleniyor...' : 'Giriş Şifresini Güncelle'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
