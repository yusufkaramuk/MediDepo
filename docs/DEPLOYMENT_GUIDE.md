#  Telefonda KullanÄ±m Rehberi

##  Deployment (Ä°nternete YÃ¼kleme)

### SeÃ§enek 1: Firebase Hosting (Ã–nerilen)

#### 1ï¸âƒ£ Firebase CLI Kurulumu
```powershell
npm install -g firebase-tools
```

#### 2ï¸âƒ£ Firebase'e GiriÅŸ
```powershell
firebase login
```

#### 3ï¸âƒ£ Firebase Projesini BaÅŸlat
```powershell
firebase init
```

Sorulara ÅŸu ÅŸekilde cevap verin:
- **Which features?** â†’ Hosting, Firestore seÃ§in (boÅŸluk ile iÅŸaretleyin)
- **Use existing project?** â†’ Yes
- **Select project** â†’ drdepo (oluÅŸturduÄŸunuz proje)
- **Public directory?** â†’ `dist`
- **Single-page app?** â†’ Yes
- **Overwrite index.html?** â†’ No

#### 4ï¸âƒ£ Build ve Deploy
```powershell
npm run build
firebase deploy
```

Deployment tamamlandÄ±ÄŸÄ±nda size bir URL verilecek:
```
https://drdepo.com.tr
```

Bu URL'yi **telefon ve bilgisayardan** aÃ§abilirsiniz!

---

### DrDepo'ya TaÅŸÄ±ma ve Eski Adresleri YÃ¶nlendirme

Yeni uygulama DrDepo Firebase projesinde yayÄ±nlanÄ±r. `.firebaserc` dosyasÄ±nÄ±n `default`
projesi `drdepo-18481` olmalÄ±dÄ±r.

```powershell
npm run build
firebase deploy --project drdepo-18481
```

Eski `drdepo` olmayan Firebase Hosting adresleri yeni projeye taÅŸÄ±namaz. Eski
MediDepo Firebase projesinde sadece 301 yÃ¶nlendirme bÄ±rakmak iÃ§in bu repo iÃ§indeki
`firebase-old.json` kullanÄ±lÄ±r:

```powershell
firebase deploy --only hosting --project medidepo --config firebase-old.json
```

Bu deploy eski Hosting tarafÄ±na gelen trafiÄŸi `https://drdepo.com.tr` adresine
301 ile yÃ¶nlendirir. Eski Ã¶zel alan adÄ±nÄ±n da yÃ¶nlenmesi iÃ§in o domain eski
Firebase Hosting sitesinde baÄŸlÄ± kalmalÄ± veya DNS tarafÄ±nda ayrÄ±ca
`drdepo.com.tr` adresine yÃ¶nlendirilmelidir.

---

### SeÃ§enek 2: Vercel (HÄ±zlÄ± Alternatif)

#### 1ï¸âƒ£ Vercel CLI Kurulumu
```powershell
npm install -g vercel
```

#### 2ï¸âƒ£ Deploy
```powershell
vercel
```

Ä°lk kez kullanÄ±yorsanÄ±z e-posta ile giriÅŸ yapÄ±n, sonra:
- Project name onaylayÄ±n
- Deploy'a devam edin

---

##  PWA Ã–zellikleri (Åimdiden HazÄ±r!)

### âœ… Ana Ekrana Ekleme (iOS & Android)

**Android (Chrome):**
1. Siteyi aÃ§Ä±n
2. MenÃ¼ (â‹®) â†’ **"Ana ekrana ekle"**
3. Ä°sim: "DrDepo"
4. Ekle

**iPhone (Safari):**
1. Siteyi aÃ§Ä±n
2. PaylaÅŸ butonu â†’ **"Ana Ekrana Ekle"**
3. Ä°sim: "DrDepo"
4. Ekle

### âœ… Ã–zellikler:
-  **Offline Ã§alÄ±ÅŸÄ±r** (Service Worker sayesinde)
-  **Uygulama gibi aÃ§Ä±lÄ±r** (tam ekran, Ã¼st bar yok)
-  **Firebase ile senkronize** (veriler bulutta)
- **Mor tema** (uygulama simgesi ve splash screen)

---

##  GÃ¼venlik (Opsiyonel)

Deploy ettikten sonra Firestore gÃ¼venlik kurallarÄ±nÄ± gÃ¼ncelleyin:

Firebase Console â†’ Firestore Database â†’ Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /medicines/{document} {
      allow read, write: if true;  // Herkes eriÅŸebilir (basit)
    }
  }
}
```

**Not:** Ä°sterseniz daha sonra kullanÄ±cÄ± giriÅŸi ekleyip kurallarÄ± sÄ±kÄ±laÅŸtÄ±rabiliriz.

---

##  Yerel AÄŸda KullanÄ±m (Deploy Etmeden)

EÄŸer sadece aynÄ± WiFi'deki cihazlardan eriÅŸmek istiyorsanÄ±z:

1. Bilgisayarda:
```powershell
npm run dev
```

2. Network URL'yi telefona yazÄ±n:
```
http://192.168.0.174:5173
```

**Not:** Bu yÃ¶ntemde bilgisayar kapalÄ±yken Ã§alÄ±ÅŸmaz!

---

##  Ã–nerilen: Firebase Hosting

- âœ… Ãœcretsiz (10 GB/ay)
- âœ… HÄ±zlÄ± ve gÃ¼venilir
- âœ… HTTPS otomatik
- âœ… Her yerden eriÅŸim
- âœ… Firebase entegrasyonu kolay

Deploy ettikten sonra hem telefondan hem bilgisayardan aynÄ± URL ile eriÅŸebilirsiniz!
