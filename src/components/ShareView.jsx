import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseClient';
import { deriveKeyFromToken, decryptShareData } from '../services/ShareLinkCrypto';
import appLogoName from '../assets/drdepo-logo-name.svg';

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function fmtExpiry(s) { if (!s) return '—'; const [y, m] = s.split('-'); return `${TR_MONTHS[+m - 1]} ${y}`; }
function statusOf(expiryDate) {
  if (!expiryDate) return { key: 'unknown', label: 'Tarih Yok' };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [y, m] = expiryDate.split('-').map(Number);
  const exp = new Date(y, m, 0); exp.setHours(23, 59, 59, 999);
  const d = Math.ceil((exp - now) / 86400000);
  if (d < 0)   return { key: 'expired', label: 'Süresi Dolmuş' };
  if (d <= 30) return { key: 'warning', label: `${d} gün kaldı` };
  if (d <= 90) return { key: 'soon',    label: 'Yaklaşıyor' };
  return { key: 'good', label: 'Güvenli' };
}

const STATUS_STYLE = {
  expired: 'bg-rose-50 text-rose-700 ring-rose-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  soon:    'bg-sky-50 text-sky-700 ring-sky-200',
  good:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  unknown: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200',
};
const DOT = { expired: 'bg-rose-500', warning: 'bg-amber-500', soon: 'bg-sky-500', good: 'bg-emerald-500', unknown: 'bg-slate-400' };

export function ShareView({ token, encKey }) {
  const [state, setState] = useState('loading'); // loading | found | expired | invalid | nokey
  const [medicine, setMedicine] = useState(null);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    const load = async () => {
      try {
        const linkDoc = await getDoc(doc(db, `sharedLinks/${token}`));
        if (!linkDoc.exists()) { setState('invalid'); return; }
        const { expiresAt, encryptedMedicine, medicine: legacyMedicine, medicineId } = linkDoc.data();

        if (expiresAt && new Date(expiresAt) < new Date()) { setState('expired'); return; }

        if (encryptedMedicine) {
          // Yeni format: şifreli veri — URL #fragment'taki token ile çöz
          const keyToken = encKey || token; // fragment yoksa token'ı dene
          if (!keyToken) { setState('nokey'); return; }
          const cryptoKey = await deriveKeyFromToken(keyToken);
          const decrypted = await decryptShareData(encryptedMedicine, cryptoKey);
          setMedicine({ id: medicineId, ...decrypted });
        } else if (legacyMedicine) {
          // Eski format: şifresiz (geriye dönük uyumluluk)
          setMedicine({ id: medicineId, ...legacyMedicine });
        } else {
          setState('invalid');
          return;
        }
        setState('found');
      } catch { setState('invalid'); }
    };
    load();
  }, [token, encKey]);


  const st = medicine ? statusOf(medicine.expiryDate) : null;
  const ingredients = medicine ? [medicine.activeIngredient1, medicine.activeIngredient2, medicine.activeIngredient3].filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <img src={appLogoName} alt="DrDepo" className="h-11 w-auto max-w-[180px] object-contain"/>
        </div>

        {state === 'loading' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
            <div className="w-8 h-8 border-2 border-[var(--brand-200)] border-t-[var(--brand-600)] rounded-full animate-spin mx-auto mb-3"/>
            <div className="text-[14px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Yükleniyor…</div>
          </div>
        )}

        {state === 'invalid' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
            <div className="text-[40px] mb-3"></div>
            <div className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">Link bulunamadı</div>
            <div className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-2">Bu paylaşım linki geçersiz veya silinmiş.</div>
          </div>
        )}

        {state === 'nokey' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800 p-8 text-center shadow-sm">
            <div className="text-[40px] mb-3"></div>
            <div className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">Veri şifrelenmiş</div>
            <div className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-2">Tam linki kullanın — paylaşım linki kesilmiş veya eksik.</div>
          </div>
        )}

        {state === 'expired' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
            <div className="text-[40px] mb-3">⏱️</div>
            <div className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">Link süresi dolmuş</div>
            <div className="text-[13.5px] text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2">Bu paylaşım linki artık geçerli değil.</div>
          </div>
        )}

        {state === 'found' && medicine && st && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ring-1 ${STATUS_STYLE[st.key]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${DOT[st.key]}`}></span>
                  {st.label}
                </span>
              </div>

              <h2 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{medicine.name}</h2>
              {medicine.quantity && <div className="mt-1 text-[14px] text-slate-500 dark:text-slate-400 dark:text-slate-500">{medicine.quantity}</div>}

              {ingredients.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="text-[12px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg ring-1 ring-slate-200">
                      {ing}
                    </span>
                  ))}
                </div>
              )}

              {medicine.tags && medicine.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {medicine.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-100)]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {medicine.notes && (
                <div className="mt-4 text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-500 italic">"{medicine.notes}"</div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-[13px] text-slate-600 dark:text-slate-300">
                <span>Son Kullanma Tarihi</span>
                <span className={`font-semibold ${st.key === 'expired' ? 'text-rose-700' : 'text-slate-900 dark:text-slate-100'}`}>
                  {fmtExpiry(medicine.expiryDate)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-[12px] text-slate-400 dark:text-slate-500">
          DrDepo · Salt okunur paylaşım
        </div>
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <a href="/gizlilik" className="hover:underline hover:text-slate-600 dark:hover:text-slate-300">Gizlilik Politikası ve Aydınlatma Metni</a>
          <a href="/kosullar" className="hover:underline hover:text-slate-600 dark:hover:text-slate-300">Kullanım Koşulları</a>
        </div>
      </div>
    </div>
  );
}
