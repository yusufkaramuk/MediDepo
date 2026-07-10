# DrDepo

Modern, güvenli ve kullanıcı dostu bir web uygulaması. Evinizdeki ilaçları dijital ortamda takip edin, son kullanma tarihlerini kontrol edin ve aile üyeleriyle paylaşın.

**Canlı Demo:** [https://drdepo.com.tr](https://drdepo.com.tr)

**GitHub:** [yusufkaramuk/DrDepo](https://github.com/yusufkaramuk/DrDepo)

---

## Özellikler

### Kullanıcı Yönetimi
- Firebase Authentication ile e-posta/şifre ve Google girişi
- Kullanıcı izolasyonu — her kullanıcı yalnızca kendi verilerine erişir
- E-posta doğrulama ve şifre sıfırlama
- Firebase App Check + reCAPTCHA v3 ile bot koruması

### İlaç Yönetimi
- İlaç ekleme, düzenleme, silme ve listeleme (CRUD)
- Her ilaç için 3 farklı etken madde kaydı
- Akıllı gruplama: aynı bilgilere sahip ilaçlar otomatik gruplanır (×2, ×3 gösterimi)
- Toplu ekleme: birden fazla ilacı tek seferde JSON ile içe aktarın
- Etiket sistemi: ilaçlara özel etiket ekleyin ve etiketle filtreleyin

### Karekod (QR) & Barkod Tarama ve TİTCK Entegrasyonu
- İlaç ekleme ve Toplu Ekleme ekranlarında Karekod (QR) ve normal Barkod okuma seçeneği
- 22.000+ ilaç kaydı içeren TİTCK veritabanı ile otomatik eşleştirme
- Barkod/Karekod okunduğunda ticari ad, doz, form ve etken maddeler otomatik doldurulur
- Karekod okunduğunda Son Kullanım Tarihi otomatik ayıklanır
- Veriler IndexedDB'de önbelleğe alınır — offline çalışır

### Aile Modu
- E-posta ile aile üyesi daveti (7 günlük geçerlilik)
- Aile üyeleri birbirinin ilaç stoğunu görebilir
- **Özel İlaç** seçeneği — işaretlenen ilaçlar aile üyelerine gizlenir
- Admin/üye rol sistemi: sadece admin yeni üye davet edebilir

### Akıllı Arama ve Sıralama
- Fuzzy Search: yanlış yazımlara toleranslı arama (Levenshtein algoritması)
- İlaç adı ve tüm etken maddeler üzerinde anlık arama
- 8 farklı sıralama seçeneği (tarih, alfabetik, son kullanma, kopya sayısı)
- Durum filtresi: Tümü / Süresi Geçmiş / Yakında Bitiyor / Güvenli

### Son Kullanma Takibi
- Otomatik renk uyarıları: Kırmızı (geçmiş) · Turuncu (30 gün) · Yeşil (güvenli)
- Ay/Yıl formatında sayısal (Örn: 05 / 2026) pratik tarih girişi
- Türkçe metin tarih gösterimi ve kalan gün sayacı

### Push Bildirimleri
- Son kullanma tarihi yaklaşan ilaçlar için otomatik bildirim
- Web Push (VAPID) ile tarayıcı bildirimi desteği
- GitHub Actions ile zamanlanmış günlük kontrol

### Salt Okunur Paylaşım Linki
- Seçili bir ilacı şifre gerektirmeden paylaşın
- 7 günlük geçerlilik süresi olan benzersiz token
- Paylaşılan ilaç verisi Firestore'da saklanır, okuyan kullanıcı hesabı gerektirmez

### Veri Yönetimi
- CSV ve JSON ile dışa aktarma
- JSON ile toplu içe aktarma (yedek geri yükleme)
- Her değişiklik anında otomatik kaydedilir

### Progressive Web App (PWA)
- Ana ekrana eklenebilir — telefonda uygulama gibi çalışır
- Offline çalışma desteği (IndexedDB + Service Worker)
- Responsive tasarım (mobil ve masaüstü)

### Arayüz ve Kişiselleştirme
- Gelişmiş Karanlık Mod (Dark Mode) / Açık Mod
- Kullanıcı Ayarları paneli (Şifre değiştirme)
- Dinamik Yazı Boyutu ayarı (Responsive tipografi)
- Liste ve grid görünümü
- Türkçe arayüz

---

## Kaynak Kod ve Kullanım Şartları

DrDepo, kaynak kodu görüntülenebilir özel mülkiyetli (source-available proprietary) bir yazılımdır ve açık kaynak değildir.

Kaynak kodu; teknik inceleme, şeffaflık ve portföy/referans amaçlarıyla GitHub üzerinde herkese açık olarak görüntülenebilir.

GitHub'ın veya kullanılan barındırma platformunun işlevleri ve şartları kapsamında zorunlu olarak sağlanan sınırlı haklar dışında, kaynak kodunun herkese açık olması; kodu kopyalama, değiştirme, uyarlama, deploy etme, barındırma, dağıtma, yeniden yayınlama, yeniden markalama, ticari olarak kullanma veya Yazılımı ya da esaslı bir bölümünü başka bir uygulama, servis, yazılım ürünü veya türev çalışmanın temeli olarak kullanma izni vermez.

Yeniden kullanım veya ticari lisanslama talepleri için proje sahibinden önceden yazılı izin alınmalıdır. Geliştirme ve production deployment dokümantasyonu herkese açık olarak sunulmamaktadır.

Geçerli kullanım şartları için [LICENSE.md](LICENSE.md) dosyasını inceleyin.

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

### PWA & Offline
| Teknoloji | Amaç |
|-----------|-------|
| Service Worker | Offline caching |
| IndexedDB | TİTCK ilaç veritabanı önbelleği |
| Web Push (VAPID) | Push bildirimleri |

### Algoritmalar
| Teknoloji | Amaç |
|-----------|-------|
| Levenshtein Distance | Fuzzy search |
| ExcelJS | TİTCK Excel ayrıştırma |

---

## Yüksek Seviyeli Mimari

DrDepo, React tabanlı bir PWA mimarisi kullanır.

- **UI Katmanı** — responsive ve mobil öncelikli React arayüzü
- **Kimlik ve Veri Katmanı** — Firebase Authentication ve Firestore
- **Offline Katman** — IndexedDB ve Service Worker
- **İlaç Veri Katmanı** — TİTCK verilerinin yerel önbellekleme ve eşleştirme akışı
- **Bildirim Katmanı** — Web Push ve zamanlanmış kontroller
- **Güvenlik Katmanı** — App Check, Firestore Security Rules ve doğrulama testleri

---

## İlaç Verisi Kaynağı

DrDepo, ilaç adı, barkod/karekod eşleştirme ve ilgili yardımcı bilgiler için Türkiye İlaç ve Tıbbi Cihaz Kurumu (TİTCK) tarafından yayımlanan ilaç verilerini referans veri kaynağı olarak kullanır.

TİTCK ilaç verisinin işlenmesi ve uygulama içinde kullanılabilir hale getirilmesi sürecinde [tugcantopaloglu/turkish-medicine-api](https://github.com/tugcantopaloglu/turkish-medicine-api) projesinden teknik referans olarak yararlanılmıştır.

TİTCK verileri; kullanıcıya ilaç kaydı sırasında kolaylık sağlamak, barkod/karekoddan temel ilaç bilgilerini eşleştirmek ve yerel önbellekleme ile hızlı arama deneyimi sunmak amacıyla işlenir. DrDepo, TİTCK ile bağlantılı, onaylı veya resmi bir TİTCK uygulaması değildir.

TİTCK kaynaklı veriler ve üçüncü taraf veri kaynakları kendi yayımlanma koşullarına, güncellik durumlarına ve ilgili mevzuata tabidir. DrDepo bu verileri tıbbi tavsiye, teşhis veya tedavi amacıyla sunmaz; ilaç kullanımıyla ilgili kararlar için yetkili bir sağlık profesyoneline danışılmalıdır.

---

## Güvenlik

- **Firestore Security Rules** — kullanıcı ve aile bazlı veri izolasyonu
- **Firebase App Check** — reCAPTCHA v3 ile bot koruması
- **HTTPS** — Firebase Hosting tarafından otomatik
- **Input Validation** — `MedicineValidation` servisi ile her yazma öncesi doğrulama
- `.env` dosyası `.gitignore` ile korunur

### Güvenlik Testleri
```bash
npm run test:rules     # Firestore kural testlerini çalıştır
npm run test:security  # Tam güvenlik kontrolü
```

---

## Changelog

### v2.6.1
- **Güvenlik (Dependabot)**: `uuid` paketindeki "Missing buffer bounds check" zafiyeti giderildi ve `firebase-tools` alt bağımlılıkları güvenli sürüme güncellendi.
- **Statik Kod Analizi (CodeQL)**: Veritabanı aktarım scriptlerinde (`verify-migration.cjs`, `migrate_db.cjs`) hassas bilgilerin konsola sızmasına yol açan "Clear-text logging" uyarısı çözüldü; hata fırlatma (throw) mantığı güvenli ve statik metinlerle yeniden yazıldı.
- **CI/CD İzinleri**: GitHub Actions iş akışlarındaki (`security-checks.yml`, `send-notifications.yml`) GITHUB_TOKEN yetkileri, "en az yetki prensibi" doğrultusunda salt okunur (`contents: read`) olarak sınırlandırıldı.
- **Düzeltmeler**: `README.md` dosyasındaki Türkçe karakter bozulmaları ve format hataları giderildi.
- **İsimlendirme**: Proje adı tüm sistemde, kaynak kodlarda ve belgelerde resmi olarak **DrDepo** olarak güncellendi.

### v2.6.0
- **Karekod (QR) Desteği**: İlaç ekleme ve Toplu Ekleme ekranlarına QR (Karekod) okuma desteği eklendi. Barkod ile kullanım akışı sadeleştirildi ve QR bilgilendirme ekranı oluşturuldu. QR üzerinden son kullanma tarihi otomatik ayıklanıyor.
- **Kullanıcı Ayarları**: Şifre değiştirme alanı ayarlar içerisine taşındı (Google girişi yapanlar için gizlendi).
- **Erişilebilirlik**: Dinamik REM tabanlı ölçeklendirme ile Yazı Boyutu ayarı eklendi, taşma ve hizalama sorunları giderildi.
- **Karanlık Tema (Dark Mode)**: Tüm popup pencereleri, form elemanları ve butonlar karanlık tema ile tam uyumlu hale getirildi. Beyaz arkaplan patlamaları düzeltildi.
- **Son Kullanma Tarihi**: Ay seçimi sayısal (01-12) formata (MonthYearPicker) geçirildi. Ana ekranda kullanıcı dostu ay adı gösterimi korundu.
- **Sadeleştirme**: Kullanım geçmişi özellikleri sistemden çıkarılarak arayüz temizlendi.
- **Düzeltmeler**: Toplu ilaç ekleme ekranındaki QR ayrıştırma ve barkod sorgulama hataları düzeltildi.

### v2.5.0 — Kişisel/Aile Depo Ayrımı & QR Davet Düzeltmeleri
- **Kişisel & Aile Deposu**: Modern geçiş butonu (Segmented Control) ile depolar tamamen ayrıldı. İlaç listesi, filtreler ve istatistikler dinamik olarak güncelleniyor.
- **Aile Modu Düzeltmeleri**: QR kod ile aileye katıl ekranında kameranın yanlış açılması engellendi ve Firestore yetkilendirme (permission-denied) hataları düzeltildi.
- **İyileştirmeler**: Kişisel ve aile ilaçlarının birbirine karışmasına neden olan sorunlar giderildi; depolar arası geçiş çok daha güvenli ve hızlı hale getirildi.

### v2.4.0 — QR Davetleri, GS1 Barkod & E2EE Güvenlik Pre-release
- **Barkod**: GS1 DataMatrix desteği eklendi. Barkod ile mevcut ilaç arama, manuel giriş alanı ve ayrıştırıcı (GTIN-14, EAN-13, Seri No vb.) eklendi. Leading zero (baştaki sıfır) kaybı sorunu çözüldü.
- **Aile Modu**: QR Kod ile tek kullanımlık güvenli aile daveti ve QR okutarak aileye katılma eklendi.
- **Kimlik Doğrulama**: Manuel kayıt için zorunlu e-posta doğrulama eklendi. Doğrulanmamış kullanıcı sorunları giderildi.
- **Güvenlik (E2EE)**: Uçtan Uca Şifreleme (E2EE) altyapısına geçildi. Şifreleme anahtarları güvenli kasaya taşındı, Recovery Passphrase altyapısı eklendi.
- **Firestore Güvenliği**: Aile bilgileri sadece üyelere okunabilir hale getirildi, QR davetleri transaction tabanlı tek kullanımlık yapıldı ve sızıntılar kapatıldı.


### v2.3.0
- **Aile Modu**: e-posta daveti, aile üyesi ilaç görüntüleme, Özel İlaç gizleme
- **Barkod düzeltmeleri**: TİTCK 2026 URL dinamik keşif, mobil IndexedDB timeout çözümü
- **Firestore**: cross-user okuma kuralları, davet kabul izni, `persistentLocalCache` geçişi
- Proje dosya yapısı temizlendi (`docs/` klasörü, gereksiz dosyalar silindi)

### v2.2.0
- **Barkod Tarama**: kamera ile barkod okuma, TİTCK veritabanı entegrasyonu (22.000+ ilaç)
- **Kullanım Geçmişi**: ilaç bazlı kayıt (kullanıldı, bitti, eklendi, düzenlendi)
- **Push Bildirimleri**: Web Push VAPID ile son kullanma tarihi uyarıları
- **Paylaşım Linki**: salt okunur, 7 günlük token bazlı paylaşım
- Offline-First PWA: IndexedDB chunked yazma, Service Worker v5

### v2.1.1
- Firebase güvenlik tabanı sertleştirildi (App Check, gelişmiş Firestore kuralları)
- Güvenlik test altyapısı eklendi

### v2.1.0
- Firebase Authentication ile kullanıcı kayıt/giriş sistemi
- Google ile giriş
- Etiket sistemi ve gelişmiş filtreleme
- Karanlık mod
- CSV dışa aktarma
- 8 farklı sıralama seçeneği

### v2.0.0
- PWA desteği (Progressive Web App)
- Fuzzy Search (Levenshtein algoritması)
- Firebase Firestore entegrasyonu
- Toplu ilaç ekleme, akıllı gruplama

### v1.0.0
- İlk sürüm: temel CRUD, LocalStorage, son kullanma takibi

---

## Katkıda Bulunma

Hata bildirimi, öneri ve güvenlik geri bildirimleri issue üzerinden kabul edilir.

Yeniden kullanım veya lisanslama talepleri için önceden yazılı izin gereklidir. Geçerli kullanım şartları için [LICENSE.md](LICENSE.md) dosyasını inceleyin.

---

## İletişim

- **Geliştirici**: Yusuf Karamuk
- **GitHub**: [@yusufkaramuk](https://github.com/yusufkaramuk)
- **E-posta**: [info@yusufkaramuk.com.tr](mailto:info@yusufkaramuk.com.tr?cc=yusufkaramuk10@gmail.com)

---

> DrDepo, kişisel ilaç envanteri ve son kullanma tarihi takibini kolaylaştırmak amacıyla geliştirilmiştir. Tıbbi tavsiye, teşhis veya tedavi hizmeti sunmaz. İlaç kullanımıyla ilgili kararlar için yetkili bir sağlık profesyoneline danışılmalıdır.
