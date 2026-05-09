#!/usr/bin/env node
// TITCK ilaç verisi çekme scripti
// tugcantopaloglu/turkish-medicine-api projesini referans alır
// TITCK'ın Excel dosyasını doğrudan indirir ve JSON'a çevirir

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'medicines.json');

// TITCK aktif ürünler Excel indirme adresi
const TITCK_URL = 'https://www.titck.gov.tr/storage/Archive/2024/dynamicPage/ilacListesi.xlsx';

async function fetchTitckData() {
  console.log('[TITCK] Veri indirme başlatıldı...');

  // xlsx paketini dinamik import et (CI ortamında kurulu olmalı)
  let xlsx;
  try {
    xlsx = await import('xlsx');
  } catch {
    console.error('[TITCK] xlsx paketi bulunamadı. npm install xlsx çalıştırın.');
    process.exit(1);
  }

  let buffer;
  try {
    const res = await fetch(TITCK_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ilac-stok-bot/1.0)' },
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
    console.log(`[TITCK] İndirildi: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error('[TITCK] İndirme hatası:', err.message);
    // Mevcut dosya varsa dokunma
    if (existsSync(OUTPUT_PATH)) {
      console.log('[TITCK] Mevcut veri korunuyor.');
      process.exit(0);
    }
    process.exit(1);
  }

  // Excel'i parse et
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const activeSheet = workbook.Sheets['AKTİF ÜRÜNLER LİSTESİ'] || workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(activeSheet, { defval: '' });

  // Sadece ihtiyaç duyulan alanları al ve optimize et
  const medicines = rows.map(row => ({
    Barkod: Number(row['Barkod'] || row['barkod'] || 0),
    name: String(row['İlaç Adı'] || row['la_ad'] || row['İLAÇ ADI'] || '').trim(),
    activeIngredient: String(row['ATC Adı'] || row['atc_ad'] || row['ATC ADI'] || '').trim(),
    atcCode: String(row['ATC Kodu'] || row['atc_kodu'] || '').trim(),
    company: String(row['Firma Adı'] || row['firma_ad'] || '').trim(),
    prescription: String(row['Reçete Türü'] || row['reete_tr'] || '').trim(),
  })).filter(m => m.Barkod && m.name);

  console.log(`[TITCK] ${medicines.length} aktif ürün işlendi`);

  // public klasörünü oluştur
  const publicDir = join(__dirname, '..', 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  const output = {
    updatedAt: new Date().toISOString(),
    count: medicines.length,
    medicines,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output), 'utf-8');
  console.log(`[TITCK] Kaydedildi: ${OUTPUT_PATH}`);
}

fetchTitckData();
