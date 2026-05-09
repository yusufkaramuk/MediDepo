const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmtExpiry(s) {
  if (!s) return '';
  const [y, m] = s.split('-');
  return `${TR_MONTHS[+m - 1]} ${y}`;
}

function statusLabel(med) {
  if (!med.expiryDate) return 'Tarih Yok';
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [y, m] = med.expiryDate.split('-').map(Number);
  const exp = new Date(y, m, 0); exp.setHours(23, 59, 59, 999);
  const d = Math.ceil((exp - now) / 86400000);
  if (d < 0)   return 'Süresi Dolmuş';
  if (d <= 30) return 'Yakında Bitiyor';
  if (d <= 90) return 'Yaklaşıyor';
  return 'Güvenli';
}

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportMedicinesToCsv(medicines) {
  const headers = [
    'İlaç Adı', 'Miktar', 'Son Kullanma Tarihi', 'Durum',
    'Etken Madde 1', 'Etken Madde 2', 'Etken Madde 3', 'Notlar', 'Eklenme Tarihi'
  ];

  const rows = medicines.map(m => [
    m.name,
    m.quantity,
    fmtExpiry(m.expiryDate),
    statusLabel(m),
    m.activeIngredient1,
    m.activeIngredient2,
    m.activeIngredient3,
    m.notes,
    m.createdAt ? new Date(m.createdAt).toLocaleDateString('tr-TR') : '',
  ].map(escapeCsv).join(','));

  const csv = '﻿' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ilac-listesi-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
