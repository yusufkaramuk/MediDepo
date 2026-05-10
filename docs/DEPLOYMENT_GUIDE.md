# 📱 Telefonda Kullanım Rehberi

## 🚀 Deployment (İnternete Yükleme)

### Seçenek 1: Firebase Hosting (Önerilen)

#### 1️⃣ Firebase CLI Kurulumu
```powershell
npm install -g firebase-tools
```

#### 2️⃣ Firebase'e Giriş
```powershell
firebase login
```

#### 3️⃣ Firebase Projesini Başlat
```powershell
firebase init
```

Sorulara şu şekilde cevap verin:
- **Which features?** → Hosting, Firestore seçin (boşluk ile işaretleyin)
- **Use existing project?** → Yes
- **Select project** → ilac-stok-takip (oluşturduğunuz proje)
- **Public directory?** → `dist`
- **Single-page app?** → Yes
- **Overwrite index.html?** → No

#### 4️⃣ Build ve Deploy
```powershell
npm run build
firebase deploy
```

Deployment tamamlandığında size bir URL verilecek:
```
https://ilac-stok-takip.web.app
```

Bu URL'yi **telefon ve bilgisayardan** açabilirsiniz!

---

### Seçenek 2: Vercel (Hızlı Alternatif)

#### 1️⃣ Vercel CLI Kurulumu
```powershell
npm install -g vercel
```

#### 2️⃣ Deploy
```powershell
vercel
```

İlk kez kullanıyorsanız e-posta ile giriş yapın, sonra:
- Project name onaylayın
- Deploy'a devam edin

---

## 📱 PWA Özellikleri (Şimdiden Hazır!)

### ✅ Ana Ekrana Ekleme (iOS & Android)

**Android (Chrome):**
1. Siteyi açın
2. Menü (⋮) → **"Ana ekrana ekle"**
3. İsim: "İlaç Stok"
4. Ekle

**iPhone (Safari):**
1. Siteyi açın
2. Paylaş butonu → **"Ana Ekrana Ekle"**
3. İsim: "İlaç Stok"
4. Ekle

### ✅ Özellikler:
- 📴 **Offline çalışır** (Service Worker sayesinde)
- 📱 **Uygulama gibi açılır** (tam ekran, üst bar yok)
- 💾 **Firebase ile senkronize** (veriler bulutta)
- 🎨 **Mor tema** (uygulama simgesi ve splash screen)

---

## 🔒 Güvenlik (Opsiyonel)

Deploy ettikten sonra Firestore güvenlik kurallarını güncelleyin:

Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /medicines/{document} {
      allow read, write: if true;  // Herkes erişebilir (basit)
    }
  }
}
```

**Not:** İsterseniz daha sonra kullanıcı girişi ekleyip kuralları sıkılaştırabiliriz.

---

## 🌐 Yerel Ağda Kullanım (Deploy Etmeden)

Eğer sadece aynı WiFi'deki cihazlardan erişmek istiyorsanız:

1. Bilgisayarda:
```powershell
npm run dev
```

2. Network URL'yi telefona yazın:
```
http://192.168.0.174:5173
```

**Not:** Bu yöntemde bilgisayar kapalıyken çalışmaz!

---

## 📊 Önerilen: Firebase Hosting

- ✅ Ücretsiz (10 GB/ay)
- ✅ Hızlı ve güvenilir
- ✅ HTTPS otomatik
- ✅ Her yerden erişim
- ✅ Firebase entegrasyonu kolay

Deploy ettikten sonra hem telefondan hem bilgisayardan aynı URL ile erişebilirsiniz! 🎯
