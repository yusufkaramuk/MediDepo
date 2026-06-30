import React from 'react';

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);

const Icon = {
  CheckCircle: (p) => <Ic {...p} extra={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}/>,
  AlertTri: (p) => <Ic {...p} extra={<><path d="m10.3 3.86-8.79 15A2 2 0 0 0 3.24 22h17.5a2 2 0 0 0 1.74-3.14l-8.78-15a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}/>,
  Calendar: (p) => <Ic {...p} extra={<><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>,
  Box:      (p) => <Ic {...p} extra={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>}/>,
  Tag:      (p) => <Ic {...p} extra={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>}/>,
};

// İsim temizleme (tekrarlanan kelimeleri kaldırma vb.)
const cleanMedicineName = (name) => {
  if (!name) return 'Bilinmeyen İlaç';
  // İsim içindeki fazla boşlukları temizle ve parçalara ayır
  const words = name.trim().replace(/\s+/g, ' ').split(' ');
  const uniqueWords = [];
  words.forEach(w => {
    // Büyük küçük harf duyarsız kontrol için
    if (!uniqueWords.some(uw => uw.toLowerCase() === w.toLowerCase())) {
      uniqueWords.push(w);
    }
  });
  return uniqueWords.join(' ');
};

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const formatExpiry = (s) => {
  if (!s) return 'Belirtilmemiş';
  const [y, m] = s.split('-');
  return `${TR_MONTHS[+m - 1]} ${y}`;
};

export function AddedMedicineSuccessModal({ medicineData, onConfirm, onCancel }) {
  if (!medicineData) return null;

  const cleanedName = cleanMedicineName(medicineData.name);
  
  // Aktif maddeleri birleştir
  const activeIngredients = [
    medicineData.activeIngredient1,
    medicineData.activeIngredient2,
    medicineData.activeIngredient3
  ].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
        
        {/* Header - Success Icon */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 py-6 px-6 border-b border-emerald-100 dark:border-emerald-800 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center mb-3">
            <Icon.CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            İlaç Başarıyla Kaydedildi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">
            İlaç arka planda veritabanınıza eklendi.
          </p>
        </div>

        {/* Content - Summary */}
        <div className="p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{cleanedName}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Icon.Box size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 w-24">Stok / Miktar:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{medicineData.stockCount || 1} Adet {medicineData.quantity ? `(${medicineData.quantity})` : ''}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Icon.Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 w-24">SKT:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatExpiry(medicineData.expiryDate)}</span>
              </div>

              {activeIngredients && (
                <div className="flex items-start gap-3 text-sm">
                  <Icon.Tag size={16} className="text-slate-400 dark:text-slate-500 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 w-24 shrink-0">Etken Madde:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{activeIngredients}</span>
                </div>
              )}

              {medicineData.tags && medicineData.tags.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Icon.Tag size={16} className="text-slate-400 dark:text-slate-500 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 w-24 shrink-0">Etiketler:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {medicineData.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 transition-colors"
          >
            İptal Et (Geri Al)
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
