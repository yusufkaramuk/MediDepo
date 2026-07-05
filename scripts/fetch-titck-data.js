#!/usr/bin/env node
// TITCK ilaç verisi çekme scripti
// tugcantopaloglu/turkish-medicine-api projesini referans alır
// TITCK'ın Excel dosyasını doğrudan indirir ve JSON'a çevirir

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'medicines.json');

// TİTCK ruhsatlı ürünler sayfası — URL her güncellemede değiştiği için dinamik bulunur
const TITCK_PAGE_URL = 'https://www.titck.gov.tr/dinamikmodul/85';
const TITCK_FALLBACK_URL = 'https://titck.gov.tr/storage/Archive/2026/dynamicModulesAttachment/RuhsatlBeeriTbbirnlerListesi08.05.2026_e3963db4-c158-4353-aa3b-fcec018ee8c8.xlsx';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; drdepo-bot/1.0)' };

async function findLatestXlsxUrl() {
  try {
    const res = await fetch(TITCK_PAGE_URL, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const html = await res.text();
    // storage/Archive altındaki .xlsx linklerini bul
    const matches = [...html.matchAll(/https?:\/\/[^"'\s]*\.xlsx/gi)];
    if (matches.length === 0) return null;
    const urls = matches.map(m => m[0]);
    // Yıl bilgisi içeren URL'leri tercih et, en büyük yıl = en güncel
    const withYear = urls.map(u => {
      const m = u.match(/\/(\d{4})\//);
      return { url: u, year: m ? Number(m[1]) : 0 };
    });
    withYear.sort((a, b) => b.year - a.year || b.url.length - a.url.length);
    return withYear[0].url;
  } catch {
    return null;
  }
}

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

  // Güncel URL'yi sayfadan bul, bulamazsa fallback kullan
  const dynamicUrl = await findLatestXlsxUrl();
  const TITCK_URL = dynamicUrl || TITCK_FALLBACK_URL;
  console.log(`[TITCK] URL: ${TITCK_URL}`);

  let buffer;
  try {
    const res = await fetch(TITCK_URL, {
      headers: HEADERS,
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
  // "Ruhsatlı Beşeri Tıbbi Ürünler" formatı: 1. satır başlık, 2. satırdan veri
  // Sütun sırası: SIRA NO | BARKOD | ÜRÜN ADI | ETKİN MADDE | ATC KODU | RUHSAT SAHİBİ | ...
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const activeSheet = workbook.Sheets['RUHSATLI ÜRÜNLER LİSTESİ'] || workbook.Sheets['AKTİF ÜRÜNLER LİSTESİ'] || workbook.Sheets[workbook.SheetNames[0]];
  const allRows = xlsx.utils.sheet_to_json(activeSheet, { defval: '', header: 1 });

  // İlk satırda "SIRA NO" olan satırı bul (başlık satırı)
  let headerIdx = allRows.findIndex(r => String(r[0]).includes('SIRA') || String(r[1]).includes('BARKOD'));
  if (headerIdx < 0) headerIdx = 0;
  const dataRows = allRows.slice(headerIdx + 1);

  // Sütun pozisyonları: 0=SIRA NO, 1=BARKOD, 2=ÜRÜN ADI, 3=ETKİN MADDE, 4=ATC KODU, 5=RUHSAT SAHİBİ
  const medicines = dataRows.map(row => ({
    Barkod: Number(row[1] || 0),
    name: String(row[2] || '').trim(),
    activeIngredient: String(row[3] || '').trim(),
    atcCode: String(row[4] || '').trim(),
    company: String(row[5] || '').trim(),
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
