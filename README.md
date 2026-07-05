# DrDepo

Modern, güvenli ve kullanıcı dostu bir web uygulaması. Evinizdeki ilaçları dijital ortamda takip edin, son kullanma tarihlerini kontrol edin ve aile üyeleriyle paylaşın.

**Canlı Demo:** [https://drdepo.com.tr](https://drdepo.com.tr)

**GitHub:** [yusufkaramuk/DrDepo](https://github.com/yusufkaramuk/DrDepo)
---

## Ã–zellikler

### KullanÄ±cÄ± YÃ¶netimi
- Firebase Authentication ile e-posta/ÅŸifre ve Google giriÅŸi
- KullanÄ±cÄ± izolasyonu â€” her kullanÄ±cÄ± yalnÄ±zca kendi verilerine eriÅŸir
- E-posta doÄŸrulama ve ÅŸifre sÄ±fÄ±rlama
- Firebase App Check + reCAPTCHA v3 ile bot korumasÄ±

### Ä°laÃ§ YÃ¶netimi
- Ä°laÃ§ ekleme, dÃ¼zenleme, silme ve listeleme (CRUD)
- Her ilaÃ§ iÃ§in 3 farklÄ± etken madde kaydÄ±
- AkÄ±llÄ± gruplama: aynÄ± bilgilere sahip ilaÃ§lar otomatik gruplanÄ±r (Ã—2, Ã—3 gÃ¶sterimi)
- Toplu ekleme: birden fazla ilacÄ± tek seferde JSON ile iÃ§e aktarÄ±n
- GeliÅŸmiÅŸ silme: gruptan istediÄŸiniz kadar ilacÄ± seÃ§erek silin
- Etiket sistemi: ilaÃ§lara Ã¶zel etiket ekleyin ve etiketle filtreleyin

### Karekod (QR) & Barkod Tarama ve TÄ°TCK Entegrasyonu
- Ä°laÃ§ ekleme ve Toplu Ekleme ekranlarÄ±nda Karekod (QR) ve normal Barkod okuma seÃ§eneÄŸi
- 22.000+ ilaÃ§ kaydÄ± iÃ§eren TÄ°TCK veritabanÄ± ile otomatik eÅŸleÅŸtirme
- Barkod/Karekod okunduÄŸunda ticari ad, doz, form ve etken maddeler otomatik doldurulur
- Karekod okunduÄŸunda Son KullanÄ±m Tarihi otomatik ayÄ±klanÄ±r
- Veriler IndexedDB'de Ã¶nbelleÄŸe alÄ±nÄ±r â€” offline Ã§alÄ±ÅŸÄ±r

### Aile Modu
- E-posta ile aile Ã¼yesi daveti (7 gÃ¼nlÃ¼k geÃ§erlilik)
- Aile Ã¼yeleri birbirinin ilaÃ§ stoÄŸunu gÃ¶rebilir
- **Ã–zel Ä°laÃ§** seÃ§eneÄŸi â€” iÅŸaretlenen ilaÃ§lar aile Ã¼yelerine gizlenir
- Admin/Ã¼ye rol sistemi: sadece admin yeni Ã¼ye davet edebilir

### AkÄ±llÄ± Arama ve SÄ±ralama
- Fuzzy Search: yanlÄ±ÅŸ yazÄ±mlara toleranslÄ± arama (Levenshtein algoritmasÄ±)
- Ä°laÃ§ adÄ± ve tÃ¼m etken maddeler Ã¼zerinde anlÄ±k arama
- 8 farklÄ± sÄ±ralama seÃ§eneÄŸi (tarih, alfabetik, son kullanma, kopya sayÄ±sÄ±)
- Durum filtresi: TÃ¼mÃ¼ / SÃ¼resi GeÃ§miÅŸ / YakÄ±nda Bitiyor / GÃ¼venli

### Son Kullanma Takibi
- Otomatik renk uyarÄ±larÄ±: KÄ±rmÄ±zÄ± (geÃ§miÅŸ) Â· Turuncu (30 gÃ¼n) Â· YeÅŸil (gÃ¼venli)
- Ay/YÄ±l formatÄ±nda sayÄ±sal (Ã–rn: 05 / 2026) pratik tarih giriÅŸi
- TÃ¼rkÃ§e metin tarih gÃ¶sterimi ve kalan gÃ¼n sayacÄ±

### Push Bildirimleri
- Son kullanma tarihi yaklaÅŸan ilaÃ§lar iÃ§in otomatik bildirim
- Web Push (VAPID) ile tarayÄ±cÄ± bildirimi desteÄŸi
- GitHub Actions ile zamanlanmÄ±ÅŸ gÃ¼nlÃ¼k kontrol

### Salt Okunur PaylaÅŸÄ±m Linki
- SeÃ§ili bir ilacÄ± ÅŸifre gerektirmeden paylaÅŸÄ±n
- 7 gÃ¼nlÃ¼k geÃ§erlilik sÃ¼resi olan benzersiz token
- PaylaÅŸÄ±lan ilaÃ§ verisi Firestore'da saklanÄ±r, okuyan kullanÄ±cÄ± hesabÄ± gerektirmez

### Veri YÃ¶netimi
- CSV ve JSON ile dÄ±ÅŸa aktarma
- JSON ile toplu iÃ§e aktarma (yedek geri yÃ¼kleme)
- Her deÄŸiÅŸiklik anÄ±nda otomatik kaydedilir

### Progressive Web App (PWA)
- Ana ekrana eklenebilir â€” telefonda uygulama gibi Ã§alÄ±ÅŸÄ±r
- Offline Ã§alÄ±ÅŸma desteÄŸi (IndexedDB + Service Worker)
- Responsive tasarÄ±m (mobil ve masaÃ¼stÃ¼)

### ArayÃ¼z ve KiÅŸiselleÅŸtirme
- GeliÅŸmiÅŸ KaranlÄ±k Mod (Dark Mode) / AÃ§Ä±k Mod
- KullanÄ±cÄ± AyarlarÄ± paneli (Åifre deÄŸiÅŸtirme)
- Dinamik YazÄ± Boyutu ayarÄ± (Responsive tipografi)
- Liste ve grid gÃ¶rÃ¼nÃ¼mÃ¼
- TÃ¼rkÃ§e arayÃ¼z

---

## HÄ±zlÄ± BaÅŸlangÄ±Ã§

### Ã–n Gereksinimler
- Node.js 18+
- Firebase hesabÄ± (Ã¼cretsiz)

### Kurulum

**1. Projeyi klonlayÄ±n**
```bash
git clone https://github.com/yusufkaramuk/DrDepo.git
cd DrDepo
```

Eski repo adÄ±yla klonlanmÄ±ÅŸ mevcut bir klasÃ¶rde Ã§alÄ±ÅŸÄ±yorsanÄ±z, `git pull` Ã¶ncesi remote adresini gÃ¼ncelleyin:
```bash
git remote set-url origin https://github.com/yusufkaramuk/DrDepo.git
git pull origin main
```

**2. BaÄŸÄ±mlÄ±lÄ±klarÄ± yÃ¼kleyin**
```bash
npm install
```

**3. Firebase yapÄ±landÄ±rmasÄ±**

`.env.example` dosyasÄ±nÄ± `.env` olarak kopyalayÄ±n:
```bash
cp .env.example .env
```

Firebase bilgilerinizi `.env` dosyasÄ±na girin:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Opsiyonel â€” Firebase App Check
VITE_RECAPTCHA_V3_SITE_KEY=your_recaptcha_key
VITE_ENABLE_APP_CHECK=true

# Opsiyonel â€” Web Push bildirimleri (VAPID)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# Opsiyonel â€” Firebase Emulators (yerel geliÅŸtirme)
VITE_USE_FIREBASE_EMULATORS=false
```

**4. Kurulum kÄ±lavuzlarÄ±**
- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) â€” Firebase proje kurulumu
- [docs/AUTHENTICATION_SETUP.md](docs/AUTHENTICATION_SETUP.md) â€” Authentication aktifleÅŸtirme
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) â€” Production deployment

**5. UygulamayÄ± baÅŸlatÄ±n**
```bash
npm run dev
```

TarayÄ±cÄ±nÄ±zda `http://localhost:5173` adresini aÃ§Ä±n.

---

## Deployment

```bash
npm run build
npx firebase deploy
```

TÄ°TCK ilaÃ§ veritabanÄ±nÄ± gÃ¼ncellemek iÃ§in:
```bash
node scripts/fetch-titck-data.js
```

---

## Teknolojiler

### Frontend
| Teknoloji | Versiyon | AmaÃ§ |
|-----------|----------|-------|
| React | 18 | UI framework |
| Vite | 7 | Build tool |
| Tailwind CSS | 3 | Styling |
| Lucide React | latest | Ä°konlar |

### Backend & VeritabanÄ±
| Teknoloji | AmaÃ§ |
|-----------|-------|
| Firebase Authentication | KullanÄ±cÄ± yÃ¶netimi |
| Firebase Firestore | NoSQL bulut veritabanÄ± |
| Firebase Hosting | Statik web hosting |
| Firebase App Check | Bot ve kÃ¶tÃ¼ye kullanÄ±m korumasÄ± |

### PWA & Offline
| Teknoloji | AmaÃ§ |
|-----------|-------|
| Service Worker | Offline caching |
| IndexedDB | TÄ°TCK ilaÃ§ veritabanÄ± Ã¶nbelleÄŸi |
| Web Push (VAPID) | Push bildirimleri |

### Algoritmalar
| Teknoloji | AmaÃ§ |
|-----------|-------|
| Levenshtein Distance | Fuzzy search |
| ExcelJS | TÄ°TCK Excel ayrÄ±ÅŸtÄ±rma |

---

## Proje YapÄ±sÄ±

```
DrDepo/
â”œâ”€â”€ docs/                            # Kurulum ve deployment kÄ±lavuzlarÄ±
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ manifest.json                # PWA manifest
â”‚   â””â”€â”€ sw.js                        # Service Worker
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ fetch-titck-data.js          # TÄ°TCK Excel â†’ medicines.json
â”‚   â””â”€â”€ send-notifications.js        # Push bildirim gÃ¶nderici
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ AddMedicineModal.jsx     # Ä°laÃ§ ekleme/dÃ¼zenleme
â”‚   â”‚   â”œâ”€â”€ AddedMedicineSuccessModal.jsx # BaÅŸarÄ±lÄ± ekleme uyarÄ±sÄ±
â”‚   â”‚   â”œâ”€â”€ AuthModal.jsx            # GiriÅŸ/KayÄ±t
â”‚   â”‚   â”œâ”€â”€ BarcodeScanner.jsx       # Kamera barkod okuyucu
â”‚   â”‚   â”œâ”€â”€ BulkAddModal.jsx         # Toplu JSON import ve barkod ekleme
â”‚   â”‚   â”œâ”€â”€ DeleteModal.jsx          # Silme onay
â”‚   â”‚   â”œâ”€â”€ FamilyModal.jsx          # Aile modu yÃ¶netimi
â”‚   â”‚   â”œâ”€â”€ MedicineCard.jsx         # Ä°laÃ§ kartÄ±
â”‚   â”‚   â”œâ”€â”€ MonthYearPicker.jsx      # SayÄ±sal ay ve yÄ±l seÃ§ici
â”‚   â”‚   â”œâ”€â”€ SettingsModal.jsx        # KullanÄ±cÄ± ayarlarÄ± (YazÄ± boyutu, ÅŸifre)
â”‚   â”‚   â”œâ”€â”€ ShareView.jsx            # PaylaÅŸÄ±m link gÃ¶rÃ¼nÃ¼mÃ¼
â”‚   â”‚   â””â”€â”€ ui/
â”‚   â”‚       â””â”€â”€ BaseComponents.jsx   # Ortak UI bileÅŸenleri
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ firebase.js              # Firebase yapÄ±landÄ±rmasÄ±
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ AuthService.js           # Firebase Auth iÅŸlemleri
â”‚   â”‚   â”œâ”€â”€ CsvExport.js             # CSV dÄ±ÅŸa aktarma
â”‚   â”‚   â”œâ”€â”€ FamilyService.js         # Aile modu iÅŸlemleri
â”‚   â”‚   â”œâ”€â”€ FirebaseClient.js        # Firebase baÅŸlatma & App Check
â”‚   â”‚   â”œâ”€â”€ FirebaseService.js       # Firestore CRUD
â”‚   â”‚   â”œâ”€â”€ FuzzySearch.js           # Levenshtein arama
â”‚   â”‚   â”œâ”€â”€ MedicineDatabase.js      # TÄ°TCK IndexedDB yÃ¶netimi
â”‚   â”‚   â”œâ”€â”€ MedicineValidation.js    # Veri doÄŸrulama & normalize
â”‚   â”‚   â”œâ”€â”€ NotificationService.js   # Web Push yÃ¶netimi
â”‚   â”‚   â””â”€â”€ StorageManager.js        # LocalStorage yÃ¶netimi
â”‚   â”œâ”€â”€ App.jsx                      # Ana uygulama bileÅŸeni
â”‚   â”œâ”€â”€ main.jsx                     # Entry point
â”‚   â””â”€â”€ index.css                    # Global stiller
â”œâ”€â”€ tests/
â”‚   â””â”€â”€ firestore.rules.test.js      # GÃ¼venlik kuralÄ± testleri
â”œâ”€â”€ .env.example
â”œâ”€â”€ firebase.json
â”œâ”€â”€ firestore.indexes.json
â”œâ”€â”€ firestore.rules
â”œâ”€â”€ index.html
â””â”€â”€ package.json
```

---

## GÃ¼venlik

- **Firestore Security Rules** â€” kullanÄ±cÄ± ve aile bazlÄ± veri izolasyonu
- **Firebase App Check** â€” reCAPTCHA v3 ile bot korumasÄ±
- **HTTPS** â€” Firebase Hosting tarafÄ±ndan otomatik
- **Input Validation** â€” `MedicineValidation` servisi ile her yazma Ã¶ncesi doÄŸrulama
- `.env` dosyasÄ± `.gitignore` ile korunur

### GÃ¼venlik Testleri
```bash
npm run test:rules     # Firestore kural testlerini Ã§alÄ±ÅŸtÄ±r
npm run test:security  # Tam gÃ¼venlik kontrolÃ¼
```

---

## Changelog

### v2.6.0
- **Karekod (QR) DesteÄŸi**: Ä°laÃ§ ekleme ve Toplu Ekleme ekranlarÄ±na QR (Karekod) okuma desteÄŸi eklendi. Barkod ile kullanÄ±m akÄ±ÅŸÄ± sadeleÅŸtirildi ve QR bilgilendirme ekranÄ± oluÅŸturuldu. QR Ã¼zerinden son kullanma tarihi otomatik ayÄ±klanÄ±yor.
- **KullanÄ±cÄ± AyarlarÄ±**: Åifre deÄŸiÅŸtirme alanÄ± ayarlar iÃ§erisine taÅŸÄ±ndÄ± (Google giriÅŸi yapanlar iÃ§in gizlendi).
- **EriÅŸilebilirlik**: Dinamik REM tabanlÄ± Ã¶lÃ§eklendirme ile YazÄ± Boyutu ayarÄ± eklendi, taÅŸma ve hizalama sorunlarÄ± giderildi.
- **KaranlÄ±k Tema (Dark Mode)**: TÃ¼m popup pencereleri, form elemanlarÄ± ve butonlar karanlÄ±k tema ile tam uyumlu hale getirildi. Beyaz arkaplan patlamalarÄ± dÃ¼zeltildi.
- **Son Kullanma Tarihi**: Ay seÃ§imi sayÄ±sal (01-12) formata (MonthYearPicker) geÃ§irildi. Ana ekranda kullanÄ±cÄ± dostu ay adÄ± gÃ¶sterimi korundu.
- **SadeleÅŸtirme**: KullanÄ±m geÃ§miÅŸi Ã¶zellikleri sistemden Ã§Ä±karÄ±larak arayÃ¼z temizlendi.
- **DÃ¼zeltmeler**: Toplu ilaÃ§ ekleme ekranÄ±ndaki QR ayrÄ±ÅŸtÄ±rma ve barkod sorgulama hatalarÄ± dÃ¼zeltildi.

### v2.5.0 â€” KiÅŸisel/Aile Depo AyrÄ±mÄ± & QR Davet DÃ¼zeltmeleri
- **KiÅŸisel & Aile Deposu**: Modern geÃ§iÅŸ butonu (Segmented Control) ile depolar tamamen ayrÄ±ldÄ±. Ä°laÃ§ listesi, filtreler ve istatistikler dinamik olarak gÃ¼ncelleniyor.
- **Aile Modu DÃ¼zeltmeleri**: QR kod ile aileye katÄ±l ekranÄ±nda kameranÄ±n yanlÄ±ÅŸ aÃ§Ä±lmasÄ± engellendi ve Firestore yetkilendirme (permission-denied) hatalarÄ± dÃ¼zeltildi.
- **Ä°yileÅŸtirmeler**: KiÅŸisel ve aile ilaÃ§larÄ±nÄ±n birbirine karÄ±ÅŸmasÄ±na neden olan sorunlar giderildi; depolar arasÄ± geÃ§iÅŸ Ã§ok daha gÃ¼venli ve hÄ±zlÄ± hale getirildi.

### v2.4.0 â€” QR Davetleri, GS1 Barkod & E2EE GÃ¼venlik Pre-release
- **Barkod**: GS1 DataMatrix desteÄŸi eklendi. Barkod ile mevcut ilaÃ§ arama, manuel giriÅŸ alanÄ± ve ayrÄ±ÅŸtÄ±rÄ±cÄ± (GTIN-14, EAN-13, Seri No vb.) eklendi. Leading zero (baÅŸtaki sÄ±fÄ±r) kaybÄ± sorunu Ã§Ã¶zÃ¼ldÃ¼.
- **Aile Modu**: QR Kod ile tek kullanÄ±mlÄ±k gÃ¼venli aile daveti ve QR okutarak aileye katÄ±lma eklendi.
- **Kimlik DoÄŸrulama**: Manuel kayÄ±t iÃ§in zorunlu e-posta doÄŸrulama eklendi. DoÄŸrulanmamÄ±ÅŸ kullanÄ±cÄ± sorunlarÄ± giderildi.
- **GÃ¼venlik (E2EE)**: UÃ§tan Uca Åifreleme (E2EE) altyapÄ±sÄ±na geÃ§ildi. Åifreleme anahtarlarÄ± gÃ¼venli kasaya taÅŸÄ±ndÄ±, Recovery Passphrase altyapÄ±sÄ± eklendi.
- **Firestore GÃ¼venliÄŸi**: Aile bilgileri sadece Ã¼yelere okunabilir hale getirildi, QR davetleri transaction tabanlÄ± tek kullanÄ±mlÄ±k yapÄ±ldÄ± ve sÄ±zÄ±ntÄ±lar kapatÄ±ldÄ±.


### v2.3.0
- **Aile Modu**: e-posta daveti, aile Ã¼yesi ilaÃ§ gÃ¶rÃ¼ntÃ¼leme, Ã–zel Ä°laÃ§ gizleme
- **Barkod dÃ¼zeltmeleri**: TÄ°TCK 2026 URL dinamik keÅŸif, mobil IndexedDB timeout Ã§Ã¶zÃ¼mÃ¼
- **Firestore**: cross-user okuma kurallarÄ±, davet kabul izni, `persistentLocalCache` geÃ§iÅŸi
- Proje dosya yapÄ±sÄ± temizlendi (`docs/` klasÃ¶rÃ¼, gereksiz dosyalar silindi)

### v2.2.0
- **Barkod Tarama**: kamera ile barkod okuma, TÄ°TCK veritabanÄ± entegrasyonu (22.000+ ilaÃ§)
- **KullanÄ±m GeÃ§miÅŸi**: ilaÃ§ bazlÄ± kayÄ±t (kullanÄ±ldÄ±, bitti, eklendi, dÃ¼zenlendi)
- **Push Bildirimleri**: Web Push VAPID ile son kullanma tarihi uyarÄ±larÄ±
- **PaylaÅŸÄ±m Linki**: salt okunur, 7 gÃ¼nlÃ¼k token bazlÄ± paylaÅŸÄ±m
- Offline-First PWA: IndexedDB chunked yazma, Service Worker v5

### v2.1.1
- Firebase gÃ¼venlik tabanÄ± sertleÅŸtirildi (App Check, geliÅŸmiÅŸ Firestore kurallarÄ±)
- GÃ¼venlik test altyapÄ±sÄ± eklendi

### v2.1.0
- Firebase Authentication ile kullanÄ±cÄ± kayÄ±t/giriÅŸ sistemi
- Google ile giriÅŸ
- Etiket sistemi ve geliÅŸmiÅŸ filtreleme
- KaranlÄ±k mod
- CSV dÄ±ÅŸa aktarma
- 8 farklÄ± sÄ±ralama seÃ§eneÄŸi

### v2.0.0
- PWA desteÄŸi (Progressive Web App)
- Fuzzy Search (Levenshtein algoritmasÄ±)
- Firebase Firestore entegrasyonu
- Toplu ilaÃ§ ekleme, akÄ±llÄ± gruplama

### v1.0.0
- Ä°lk sÃ¼rÃ¼m: temel CRUD, LocalStorage, son kullanma takibi

---

## KatkÄ±da Bulunma

1. Fork yapÄ±n
2. Feature branch oluÅŸturun (`git checkout -b feature/ozellik-adi`)
3. DeÄŸiÅŸikliklerinizi commit edin (`git commit -m 'feat: Ã–zellik aÃ§Ä±klamasÄ±'`)
4. Branch'inizi push edin (`git push origin feature/ozellik-adi`)
5. Pull Request aÃ§Ä±n

---

## Lisans

MIT License â€” ayrÄ±ntÄ±lar iÃ§in [LICENSE](LICENSE) dosyasÄ±na bakÄ±n.

---

## Ä°letiÅŸim

- **GeliÅŸtirici**: Yusuf Karamuk
- **GitHub**: [@yusufkaramuk](https://github.com/yusufkaramuk)

---

> Bu proje ev kullanÄ±mÄ± ve eÄŸitim amaÃ§lÄ±dÄ±r.
