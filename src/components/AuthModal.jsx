import React, { useEffect, useState } from 'react';
import { Mail, Lock, User, AlertCircle, CheckCircle, Shield, Bell, Cloud, Camera } from 'lucide-react';
import appLogo from '../assets/logo.png';

const AUTH_COOLDOWN_MS = 5000;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.4 4 9.8 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.3l-6.4-5.2C29.4 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.4 5.2C40.6 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (now >= cooldownUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil, now]);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const isCooldownActive = cooldownRemaining > 0;

  const startCooldown = () => { const next = Date.now() + AUTH_COOLDOWN_MS; setNow(Date.now()); setCooldownUntil(next); };

  const resetForm = () => { setFormData({ email: '', password: '', displayName: '', confirmPassword: '' }); setError(''); setInfo(''); };

  const handleGoogleSignIn = async () => {
    setError(''); setLoading(true);
    try { await onAuth('google', {}); onClose(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResendVerification = async () => {
    if (!formData.email || !formData.password) { setError('Dogrulama mailini tekrar gondermek icin e-posta ve sifrenizi girin'); return; }
    setError(''); setLoading(true);
    try { await onAuth('resend', { email: formData.email, password: formData.password }); setInfo('Dogrulama maili tekrar gonderildi.'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if ((resetMode || !isSignUp) && isCooldownActive) { setError(`Lutfen ${cooldownRemaining} saniye sonra tekrar deneyin`); return; }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Gecerli bir e-posta adresi girin'); return; }

    if (resetMode) {
      try { setLoading(true); await onAuth('reset', { email: formData.email }); setInfo('Sifre sifirlama baglantisi gonderildi.'); setResetMode(false); resetForm(); }
      catch (err) { setError(err.message); }
      finally { startCooldown(); setLoading(false); }
      return;
    }

    if (!formData.password || formData.password.length < 6) { setError('Sifre en az 6 karakter olmalidir'); return; }
    if (isSignUp) {
      if (!formData.displayName.trim()) { setError('Isim soyisim gereklidir'); return; }
      if (formData.password !== formData.confirmPassword) { setError('Sifreler eslesmiyor'); return; }
    }

    try {
      setLoading(true);
      const result = await onAuth(isSignUp ? 'signup' : 'signin', formData);
      if (result?.needsVerification) { setVerificationSent(true); } else { onClose(); }
    } catch (err) { setError(err.message); }
    finally { if (!isSignUp) startCooldown(); setLoading(false); }
  };

  const toggleMode = () => { setIsSignUp(!isSignUp); setError(''); setInfo(''); setResetMode(false); setVerificationSent(false); };

  if (!isOpen) return null;

  // E-posta doğrulama bekliyor ekranı
  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] border border-slate-200 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 grid place-items-center">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">E-postanızı Doğrulayın</h2>
            <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">
              <span className="font-medium text-slate-900">{formData.email}</span> adresine doğrulama maili gönderdik. Linke tıklayıp giriş yapın.
            </p>
            <p className="mt-1 text-[12px] text-slate-400">Mail gelmediyse spam klasörünü kontrol edin.</p>
          </div>
          <button onClick={() => { setVerificationSent(false); setIsSignUp(false); resetForm(); }}
            className="w-full px-4 py-3 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_8px_20px_-8px_var(--brand-shadow)]">
            Giriş Ekranına Dön
          </button>
          <button onClick={onClose} className="text-[12.5px] text-slate-400 hover:text-slate-700">Kapat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[460px] h-[460px] rounded-full blur-3xl opacity-40" style={{background:'radial-gradient(closest-side, var(--brand-500), transparent)'}}></div>
        <div className="absolute top-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-20" style={{background:'radial-gradient(closest-side, #14b8a6, transparent)'}}></div>
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.04) 1px, transparent 0)', backgroundSize:'24px 24px'}}></div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16 grid lg:grid-cols-2 gap-10 items-center min-h-screen">
        {/* Left: brand */}
        <div className="space-y-7 hidden lg:block">
          <div className="inline-flex items-center gap-2.5">
            <img src={appLogo} alt="İlaç Takip" className="w-16 h-16 object-contain rounded-2xl bg-[var(--brand-50)] p-1"/>
            <div>
              <div className="text-[15px] font-semibold text-slate-900 tracking-tight">İlaç Takip Sistemi</div>
              <div className="text-[11px] text-slate-500 -mt-0.5">v2 · 2026</div>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[12px] font-medium text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sağlığınız için sade ve güvenli
            </span>
            <h1 className="mt-4 text-[38px] leading-[1.05] font-semibold tracking-tight text-slate-900">
              Evdeki ilaçlar için <span className="text-[var(--brand-600)]">temiz, sezgisel</span> bir kontrol paneli.
            </h1>
            <p className="mt-4 text-[15px] text-slate-600 leading-relaxed max-w-lg">
              Stoğunuzu görün, son kullanma tarihlerini takip edin, israfı azaltın. Yerel veya bulutta — siz seçin.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-lg">
            {[
              { ic: <Bell size={16} />, t: 'Akıllı uyarılar', s: '30 / 90 gün eşiği' },
              { ic: <Cloud size={16} />, t: 'Bulut & yerel', s: 'Otomatik yedekleme' },
              { ic: <Camera size={16} />, t: 'OCR ile ekle', s: 'Kutudan tarayın' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center mb-2">{f.ic}</div>
                <div className="text-[13px] font-semibold text-slate-900">{f.t}</div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">{f.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="absolute inset-0 -m-3 rounded-[28px] bg-gradient-to-br from-[var(--brand-500)]/10 via-transparent to-emerald-500/10 blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-5 lg:hidden">
              <img src={appLogo} alt="İlaç Takip" className="w-12 h-12 object-contain rounded-xl bg-[var(--brand-50)] p-1"/>
              <span className="text-[15px] font-semibold text-slate-900">İlaç Takip Sistemi</span>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">
                  {resetMode ? 'Şifremi Unuttum' : isSignUp ? 'Hesap oluşturun' : 'Tekrar hoşgeldiniz'}
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {resetMode ? 'E-postanıza sıfırlama bağlantısı gönderelim'
                    : isSignUp ? 'Birkaç saniyede başlayın — ücretsiz'
                    : 'E-posta ile giriş yapın'}
                </p>
              </div>
              {!resetMode && (
                <div className="inline-flex bg-slate-100 rounded-xl p-1 text-[12.5px] font-medium shrink-0">
                  <button type="button" onClick={() => { setIsSignUp(false); setError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${!isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Giriş</button>
                  <button type="button" onClick={() => { setIsSignUp(true); setError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Kayıt</button>
                </div>
              )}
            </div>

            {/* Error / info */}
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="text-[13px]">{error}</span>
                </div>
                {error.includes('dogrulanmamis') && (
                  <button type="button" onClick={handleResendVerification}
                    className="text-[12.5px] text-rose-600 font-medium hover:underline text-left pl-6">
                    Doğrulama mailini tekrar gönder
                  </button>
                )}
              </div>
            )}
            {info && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-2">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-[13px]">{info}</span>
              </div>
            )}

            {/* Google */}
            {!resetMode && (
              <>
                <button type="button" onClick={handleGoogleSignIn} disabled={loading}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[14px] font-medium text-slate-800 transition-colors disabled:opacity-50">
                  <GoogleIcon /> Google ile {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center text-[11.5px]"><span className="bg-white px-2 text-slate-400 uppercase tracking-wider">veya e-posta ile</span></div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!resetMode && isSignUp && (
                <FieldWrap label="İsim Soyisim" icon={<User size={15} />}>
                  <input type="text" placeholder="Örn: Yusuf Karamuk" value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })} required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px]" />
                </FieldWrap>
              )}

              <FieldWrap label="E-posta" icon={<Mail size={15} />}>
                <input type="email" placeholder="ad@ornek.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px]" />
              </FieldWrap>

              {!resetMode && (
                <>
                  <FieldWrap label="Şifre" icon={<Lock size={15} />}>
                    <input type="password" placeholder="••••••••" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })} required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px]" />
                  </FieldWrap>
                  {isSignUp && (
                    <FieldWrap label="Şifre Tekrar" icon={<Lock size={15} />}>
                      <input type="password" placeholder="••••••••" value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] outline-none text-[14px]" />
                    </FieldWrap>
                  )}
                </>
              )}

              <button type="submit" disabled={loading || isCooldownActive}
                className="w-full px-4 py-3 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_10px_30px_-12px_var(--brand-shadow)] flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Bekleniyor…</>
                ) : isCooldownActive ? `Tekrar dene (${cooldownRemaining}s)` : (
                  <><Shield size={15} /> {resetMode ? 'Bağlantı Gönder' : isSignUp ? 'Hesabı Oluştur' : 'Güvenli Giriş'}</>
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-4 flex flex-col items-center gap-2 text-[12.5px]">
              {!resetMode && (
                <button type="button" onClick={toggleMode} className="text-[var(--brand-600)] hover:underline font-medium">
                  {isSignUp ? 'Zaten hesabım var, giriş yap' : 'Hesabın yok mu? Kayıt ol'}
                </button>
              )}
              {!isSignUp && (
                <button type="button" onClick={() => { setResetMode(!resetMode); setError(''); setInfo(''); }}
                  className="text-slate-500 hover:text-slate-800">
                  {resetMode ? '← Giriş ekranına dön' : 'Şifremi unuttum'}
                </button>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-dashed border-slate-200 text-[11.5px] text-slate-500 text-center">
              Verileriniz cihazınızda şifrelenir, yalnızca sizin hesabınızla senkronize olur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldWrap = ({ label, icon, children }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>
    {children}
  </div>
);
