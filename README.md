# İlaç Stok Takip Sistemi

Modern, güvenli ve kullanıcı dostu bir web uygulaması. Evinizdeki ilaçları dijital ortamda takip edin, son kullanma tarihlerini kontrol edin ve stok yönetiminizi kolaylaştırın.

**Canlı Demo:** [https://ilac-stok-takip.web.app](https://ilac-stok-takip.web.app)

---

## Özellikler

### Güvenli Kullanıcı Yönetimi
- Firebase Authentication ile e-posta/şifre girişi
- Kullanıcı izolasyonu — her kullanıcı yalnızca kendi verilerine erişir
- E-posta ile şifre sıfırlama
- Firebase App Check + reCAPTCHA v3 ile bot koruması

### İlaç Yönetimi
- İlaç ekleme, düzenleme, silme ve listeleme (CRUD)
- Her ilaç için 3 farklı etken madde kaydı
- Akıllı gruplama: aynı bilgilere sahip ilaçlar otomatik gruplanır (x2, x3 gösterimi)
- Toplu ekleme: birden fazla ilacı tek seferde ekleyin
- Gelişmiş silme: gruptan istediğiniz kadar ilacı seçerek silin

### OCR ile İlaç Tanıma
- Kamera veya dosyadan ilaç ambalajını taratın
- Tesseract.js ile metin tanıma
- Google Gemini AI ile akıllı ilaç bilgisi çıkarımı

### Akıllı Arama ve Sıralama
- Fuzzy Search: yanlış yazımlara toleranslı arama (Levenshtein algoritması)
- İlaç adı ve tüm etken maddeler üzerinde arama
- 8 farklı sıralama seçeneği:
  - Tarih bazlı (en yeni / en eski)
  - Alfabetik (A–Z, Z–A)
  - Son kullanma tarihi (yakında bitecek / uzun süreliler)
  - Kopya sayısı (çok / az)
- Gerçek zamanlı filtreleme

### Son Kullanma Takibi
- Otomatik renk uyarıları:
  - Kırmızı — süresi geçmiş
  - Turuncu — 30 gün içinde bitiyor
  - Yeşil — iyi durumda
- Ay/Yıl formatında pratik tarih girişi
- Türkçe tarih gösterimi ("Aralık 2025" formatı)
- Yakında bitecek ilaçlar için kalan gün sayacı

### Bulut Senkronizasyonu
- Firebase Firestore ile gerçek zamanlı veri senkronizasyonu
- Çoklu cihaz desteği (telefon, tablet, bilgisayar)
- Kullanıcı bazlı veri izolasyonu
- LocalStorage yedekleme ile offline çalışma
- Bulut / yerel mod arası kolay geçiş

### Veri Yönetimi
- JSON ile dışa/içe aktarma (yedekleme ve geri yükleme)
- Firebase'e toplu JSON aktarımı
- Her değişiklik anında otomatik kaydedilir

### Progressive Web App (PWA)
- Ana ekrana eklenebilir — telefonda uygulama gibi çalışır
- Offline çalışma desteği
- Network-first caching stratejisi
- Responsive tasarım (mobil ve masaüstü)

---

## Hızlı Başlangıç

### Ön Gereksinimler
- Node.js 18+
- Firebase hesabı (ücretsiz)

### Kurulum

**1. Projeyi klonlayın**
```bash
git clone https://github.com/yusufkaramuk/ilacStokTakipSistemi.git
cd ilacStokTakipSistemi
```

**2. Bağımlılıkları yükleyin**
```bash
npm install
```

**3. Firebase yapılandırması**

`.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```

Firebase bilgilerinizi `.env` dosyasına girin:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Opsiyonel — Firebase App Check
VITE_RECAPTCHA_V3_SITE_KEY=your_recaptcha_key
VITE_ENABLE_APP_CHECK=true

# Opsiyonel — Google Gemini AI (OCR özelliği için)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Opsiyonel — Firebase Emulators (yerel geliştirme)
VITE_USE_FIREBASE_EMULATORS=false
```

**4. Kurulum kılavuzları**
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) — Firebase proje kurulumu
- [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) — Authentication aktifleştirme
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — Production deployment

**5. Uygulamayı başlatın**
```bash
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresini açın.

---

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy
```

---

## Teknolojiler

### Frontend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|-------|
| React | 18 | UI framework |
| Vite | 7 | Build tool |
| Tailwind CSS | 3 | Styling |
| Lucide React | latest | İkonlar |

### Backend & Veritabanı
| Teknoloji | Amaç |
|-----------|-------|
| Firebase Authentication | Kullanıcı yönetimi |
| Firebase Firestore | NoSQL bulut veritabanı |
| Firebase Hosting | Statik web hosting |
| Firebase App Check | Bot ve kötüye kullanım koruması |

### Yapay Zeka & OCR
| Teknoloji | Amaç |
|-----------|-------|
| Google Gemini AI | İlaç bilgisi çıkarımı |
| Tesseract.js | OCR metin tanıma |

### Algoritmalar
| Teknoloji | Amaç |
|-----------|-------|
| Levenshtein Distance | Fuzzy search |
| LocalStorage API | Offline storage |
| Service Workers | PWA caching |

---

## Proje Yapısı

```
ilacStokTakipSistemi/
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── BaseComponents.jsx   # Button, Input, Badge, Card
│   │   ├── AddMedicineModal.jsx     # Tek ilaç ekleme
│   │   ├── AuthModal.jsx            # Giriş/Kayıt modal
│   │   ├── BulkAddModal.jsx         # Toplu ilaç ekleme
│   │   ├── DeleteModal.jsx          # Silme onay modal
│   │   └── MedicineCard.jsx         # İlaç kartı bileşeni
│   ├── config/
│   │   └── firebase.js              # Firebase yapılandırması
│   ├── models/
│   │   └── Medicine.js              # İlaç veri modeli
│   ├── services/
│   │   ├── AuthService.js           # Firebase Auth işlemleri
│   │   ├── FirebaseClient.js        # Firebase başlatma & App Check
│   │   ├── FirebaseService.js       # Firestore CRUD
│   │   ├── FuzzySearch.js           # Levenshtein arama
│   │   ├── MedicineValidation.js    # Veri doğrulama & normalize
│   │   └── StorageManager.js        # LocalStorage yönetimi
│   ├── App.jsx                      # Ana uygulama bileşeni
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global stiller
├── tests/
│   └── firestore.rules.test.js      # Güvenlik kuralı testleri
├── .env.example                     # Ortam değişkeni şablonu
├── .gitignore
├── firebase.json
├── firestore.rules                  # Firestore güvenlik kuralları
├── index.html
├── package.json
├── AUTHENTICATION_SETUP.md
├── DEPLOYMENT_GUIDE.md
└── FIREBASE_SETUP.md
```

---

## Kullanım

### İlaç Ekleme
1. **"Tek İlaç Ekle"** veya **"Toplu Ekle"** butonuna tıklayın
2. Formu doldurun: ilaç adı, etken maddeler, miktar, son kullanma tarihi, notlar
3. **"Kaydet"**

### OCR ile Ekleme
1. İlaç ekleme modalında kamera simgesine tıklayın
2. İlaç ambalajını kameraya gösterin veya fotoğraf yükleyin
3. Sistem metni tanıyıp formu otomatik dolduracaktır

### Arama
```
"parol"       → Parol bulunur
"paral"       → Parol bulunur (fuzzy match)
"parasetamol" → Parasetamol içeren tüm ilaçlar
```

### Silme
1. İlaç kartındaki çöp kutusu simgesine tıklayın
2. **Tek ilaç**: "Silmek için Onayla"
3. **Gruplandırılmış**: kaç tane silmek istediğinizi girin veya "Tümünü Sil"

---

## Güvenlik

### Geliştirme
- `.env` dosyası `.gitignore` ile korunur, GitHub'a yüklenmez
- Her geliştirici kendi Firebase credentials'ını kullanır
- Firebase Emulator desteği ile yerel geliştirme

### Production
- **Firestore Security Rules** — kullanıcı bazlı veri izolasyonu
- **Firebase App Check** — reCAPTCHA v3 ile bot koruması
- **HTTPS** — Firebase Hosting tarafından otomatik sağlanır
- **Input Validation** — `MedicineValidation` servisi ile sunucu öncesi doğrulama

### Firestore Güvenlik Kuralları
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/medicines/{medicineId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### Güvenlik Testleri
```bash
npm run test:rules     # Firestore kural testlerini çalıştır
npm run test:security  # Tam güvenlik kontrolü (audit + rules + build)
```

---

## Browser Desteği

| Tarayıcı | Minimum Versiyon |
|----------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Chrome Android | 90+ |

---

## Performans

- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Bundle Size: ~520KB (gzipped: ~160KB)
- Service Worker ile network-first caching

---

## Changelog

### v2.1.1
- Firebase güvenlik tabanı sertleştirildi (App Check, geliştirilmiş Firestore kuralları)
- Güvenlik test altyapısı eklendi (`test:rules`, `test:security`)

### v2.1.0
- Firebase Authentication ile kullanıcı kayıt/giriş sistemi
- 8 farklı sıralama seçeneği
- Kullanıcı bazlı veri izolasyonu
- Gelişmiş silme modal (esnek seçenekler)
- Network-first Service Worker

### v2.0.1
- Firebase import hatası düzeltildi
- Build optimizasyonları
- PWA Service Worker cache iyileştirmeleri

### v2.0.0
- PWA desteği (Progressive Web App)
- Fuzzy Search (Levenshtein algoritması)
- 3 etken madde alanı
- Toplu ilaç ekleme
- Akıllı gruplama (x2, x3 gösterimi)
- Firebase Firestore entegrasyonu

### v1.3.0
- Fuzzy Search algoritması
- Çoklu alan araması (ilaç adı + etken maddeler)

### v1.2.0
- İlaç gruplama (Nx görünümü)
- Adetli silme özelliği

### v1.1.2
- Aramaya etken maddeler dahil edildi

### v1.1.1
- 3 etken madde ekleme özelliği

### v1.1.0
- Son kullanma tarihi format düzenlemesi (Ay/Yıl)
- Türkçe tarih gösterimi

### v1.0.0
- İlk sürüm
- Temel CRUD işlemleri
- LocalStorage ile yerel veri saklama
- Son kullanma tarihi takibi
- Arama ve filtreleme
- Tailwind CSS ile modern tasarım

---

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/ozellik-adi`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Özellik açıklaması'`)
4. Branch'inizi push edin (`git push origin feature/ozellik-adi`)
5. Pull Request açın

---

## Lisans

MIT License — ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

---

## İletişim

- **Geliştirici**: Yusuf Karamuk
- **Email**: yusufkaramuk10@gmail.com
- **GitHub**: [@yusufkaramuk](https://github.com/yusufkaramuk)

---

> Bu proje ev kullanımı ve eğitim amaçlıdır. Ticari kullanım veya hassas sağlık verileri için ek güvenlik önlemleri almanız önerilir.
