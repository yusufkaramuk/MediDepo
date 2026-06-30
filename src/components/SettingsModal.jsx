import React, { useState } from 'react';
import * as Icon from 'lucide-react';
import { AuthService } from '../services/AuthService';

const FONT_SIZES = [
  { label: 'Küçük', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Büyük', value: '18px' },
  { label: 'Çok Büyük', value: '20px' }
];

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

    if (newPassword.length < 6) {
      return setError('Yeni şifre en az 6 karakter olmalıdır.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Yeni şifreler eşleşmiyor.');
    }

    try {
      setLoading(true);
      await AuthService.changePassword(currentPassword, newPassword);
      setSuccess('Şifreniz başarıyla güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-colors">
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
                <div className="text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
          </section>

          {/* Görünüm Ayarları */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Erişilebilirlik</h3>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100">Yazı Boyutu</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  Önizleme: A a
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {FONT_SIZES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFontSizeChange(opt.value)}
                    className={`flex-1 min-w-[70px] py-2 rounded-xl text-[13px] font-medium transition-colors border ${
                      fontSize === opt.value
                        ? 'bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-700)]'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
                Yazı boyutu değiştiğinde tüm uygulama arayüzü (kutular, boşluklar ve metinler) birbirinin üstüne binmeden dinamik olarak ölçeklenir.
              </p>
            </div>
          </section>

          {/* Şifre Değiştirme */}
          {isPasswordUser && (
            <section>
              <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Güvenlik</h3>
              <form onSubmit={handleChangePassword} className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100 mb-1">Şifre Değiştir</div>
                
                {error && <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[12.5px] font-medium">{error}</div>}
                {success && <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[12.5px] font-medium">{success}</div>}

                <div>
                  <input
                    type="password"
                    placeholder="Mevcut Şifre"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Yeni Şifre"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Yeni Şifre (Tekrar)"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)] dark:focus:ring-[var(--brand-900)]/30"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[var(--brand-600)] text-white text-[13.5px] font-medium hover:bg-[var(--brand-700)] transition-colors disabled:opacity-50 mt-1"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
