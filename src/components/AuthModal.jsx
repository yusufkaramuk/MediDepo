import React, { useEffect, useState } from 'react';
import { Mail, Lock, User, AlertCircle, CheckCircle, Shield, Bell, Cloud, Camera } from 'lucide-react';
import appLogoName from '../assets/drdepo-logo-name.svg';

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
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (now >= cooldownUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil, now]);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const isCooldownActive = cooldownRemaining > 0;

  const startCooldown = () => { const next = Date.now() + AUTH_COOLDOWN_MS; setNow(Date.now()); setCooldownUntil(next); };

  const resetForm = () => { setFormData({ email: '', password: '', displayName: '', confirmPassword: '' }); setError(''); setInfo(''); setConsentAccepted(false); };

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
      if (!consentAccepted) { setError('Devam edebilmek için Kullanım Koşulları ve Sorumluluk Reddi metnini kabul etmelisiniz.'); return; }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-alt dark:bg-surface-alt">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 grid place-items-center">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">E-postanızı Doğrulayın</h2>
            <p className="mt-2 text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-medium text-slate-900 dark:text-slate-100">{formData.email}</span> adresine doğrulama maili gönderdik. Linke tıklayıp giriş yapın.
            </p>
            <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">Mail gelmediyse spam klasörünü kontrol edin.</p>
          </div>
          <button onClick={() => { setVerificationSent(false); setIsSignUp(false); resetForm(); }}
            className="w-full px-4 py-3 rounded-xl text-[14px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] shadow-[0_8px_20px_-8px_var(--brand-shadow)]">
            Giriş Ekranına Dön
          </button>
          <button onClick={onClose} className="text-[12.5px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300">Kapat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-alt dark:bg-surface-alt">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[460px] h-[460px] rounded-full blur-3xl opacity-30" style={{background:'radial-gradient(closest-side, var(--brand-500), transparent)'}}></div>
        <div className="absolute top-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-20" style={{background:'radial-gradient(closest-side, var(--brand-300), transparent)'}}></div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16 grid lg:grid-cols-2 gap-10 items-center min-h-screen">
        {/* Left: brand */}
        <div className="space-y-7 hidden lg:block">
          <img src={appLogoName} alt="DrDepo" className="h-20 w-auto max-w-[300px] object-contain"/>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 text-[12px] font-medium text-slate-600 dark:text-slate-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sağlığınız için sade ve güvenli
            </span>
            <h1 className="mt-4 text-[38px] leading-[1.1] font-bold tracking-tight text-slate-900 dark:text-slate-100">
              İlaçlarını takip et,<br/><span className="text-[var(--brand-600)]">sağlığını güvende tut.</span>
            </h1>
            <p className="mt-4 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Stoğunuzu görün ve son kullanma tarihlerini takip edin. Yerel veya bulutta — siz seçin.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-lg">
            {[
              { ic: <Bell size={16} />, t: 'Akıllı uyarılar', s: '30 / 90 gün eşiği' },
              { ic: <Cloud size={16} />, t: 'Bulut & yerel', s: 'Otomatik yedekleme' },
              { ic: <Camera size={16} />, t: 'OCR ile ekle', s: 'Kutudan tarayın' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center mb-2">{f.ic}</div>
                <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{f.t}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">{f.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="absolute inset-0 -m-3 rounded-[28px] bg-gradient-to-br from-[var(--brand-500)]/10 via-transparent to-emerald-500/10 blur-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-5 lg:hidden">
              <img src={appLogoName} alt="DrDepo" className="h-12 w-auto max-w-[180px] object-contain"/>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  {resetMode ? 'Şifremi Unuttum' : isSignUp ? 'Hesap oluşturun' : 'Tekrar hoşgeldiniz'}
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  {resetMode ? 'E-postanıza sıfırlama bağlantısı gönderelim'
                    : isSignUp ? 'Birkaç saniyede başlayın — ücretsiz'
                    : 'E-posta ile giriş yapın'}
                </p>
              </div>
              {!resetMode && (
                <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[12.5px] font-medium shrink-0">
                  <button type="button" onClick={() => { setIsSignUp(false); setError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${!isSignUp ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>Giriş</button>
                  <button type="button" onClick={() => { setIsSignUp(true); setError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${isSignUp ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>Kayıt</button>
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
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800 text-[14px] font-medium text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50">
                  <GoogleIcon /> Google ile {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                  <div className="relative flex justify-center text-[11.5px]"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500 uppercase tracking-wider">veya e-posta ile</span></div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!resetMode && isSignUp && (
                <FieldWrap label="İsim Soyisim" icon={<User size={15} />}>
                  <input type="text" placeholder="Örn: Yusuf Karamuk" value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })} required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </FieldWrap>
              )}

              <FieldWrap label="E-posta" icon={<Mail size={15} />}>
                <input type="email" placeholder="ad@ornek.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </FieldWrap>

              {!resetMode && (
                <>
                  <FieldWrap label="Şifre" icon={<Lock size={15} />}>
                    <input type="password" placeholder="••••••••" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })} required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                  </FieldWrap>
                  {isSignUp && (
                    <FieldWrap label="Şifre Tekrar" icon={<Lock size={15} />}>
                      <input type="password" placeholder="••••••••" value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                    </FieldWrap>
                  )}
                </>
              )}

              {/* Sorumluluk Reddi & KVKK onay kutusu - yalnızca kayıt ekranında */}
              {isSignUp && !resetMode && (
                <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={e => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
                    />
                    <span className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <button type="button" onClick={() => setShowDisclaimer(v => !v)} className="font-semibold text-[var(--brand-600)] hover:underline">
                        Kullanım Koşulları ve Sorumluluk Reddi Beyanı
                      </button>'nı okudum ve kabul ediyorum.
                      <span className="block mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">KVKK kapsamında kişisel sağlık verilerimin işlenmesine onay veriyorum.</span>
                    </span>
                  </label>

                  {showDisclaimer && (
                    <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 max-h-48 overflow-y-auto">
                      <p className="font-semibold text-slate-800 dark:text-slate-100"> Sorumluluk Reddi & Kullanım Koşulları</p>
                      <p><strong>1. Amaç ve Kapsam:</strong> Bu uygulama, kişisel ilaç stoğunuzu takip etmenize yardımcı olmak amacıyla tasarlanmış bir <strong>ev kullanımı ve eğitim amaçlı</strong> bireysel organizasyon aracıdır.</p>
                      <p><strong>2. Tıbbi Tavsiye Değildir:</strong> Bu uygulama bir sağlık hizmeti ya da tıbbi cihaz değildir. Sunulan hiçbir bilgi, tıbbi tanı, tedavi tavsiyesi veya ilaç reçetesi yerine geçmez. Her türlü sağlık kararı için mutlaka bir hekim veya eczacıya danışınız.</p>
                      <p><strong>3. Sorumluluk Reddi:</strong> Geliştirici(ler), uygulamanın kullanımından kaynaklanabilecek geç alınan ilaç, yanlış doz, son kullanma tarihi hatası veya başka herhangi bir sağlık sorununa dair hiçbir hukuki sorumluluk kabul etmez.</p>
                      <p><strong>4. Kişisel Veri (KVKK):</strong> Kayıt sırasında toplanan ad-soyad ve e-posta adresi ile girdiğiniz ilaç bilgileri 6698 sayılı KVKK kapsamında işlenmektedir. Verileriniz yalnızca uygulamanın çalışması amacıyla kullanılır, üçüncü taraflarla paylaşılmaz ve uçtan uca şifreleme (AES-256) ile korunur.</p>
                      <p><strong>5. Veri Silme:</strong> Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir.</p>
                      <p><strong>6. Yaş Sınırı:</strong> Bu uygulamayı kullanmak için 18 yaşında veya daha büyük olmanız gerekmektedir.</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 pt-1">Son güncelleme: Haziran 2026</p>
                    </div>
                  )}
                </div>
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
                  className="text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-200">
                  {resetMode ? '← Giriş ekranına dön' : 'Şifremi unuttum'}
                </button>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-dashed border-slate-200 dark:border-slate-700 text-[11.5px] text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center">
              <p>Verileriniz cihazınızda şifrelenir, yalnızca sizin hesabınızla senkronize olur.</p>
              <div className="mt-2 flex justify-center gap-3">
                <a href="/privacy" className="hover:underline hover:text-slate-700 dark:hover:text-slate-300">Gizlilik Sözleşmesi</a>
                <span className="opacity-50">•</span>
                <a href="/terms" className="hover:underline hover:text-slate-700 dark:hover:text-slate-300">Kullanım Koşulları</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldWrap = ({ label, icon, children }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">{icon}</div>
    {children}
  </div>
);
