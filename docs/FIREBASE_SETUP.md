# Firebase Kurulum Talimatları

## Adım 1: Firebase Projesi Oluşturun

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" veya "Proje Ekle" butonuna tıklayın
3. Proje adı: `ilac-stok-takip` (veya istediğiniz bir isim)
4. Google Analytics'i kapatabilirsiniz (opsiyonel)
5. "Create project" tıklayın

## Adım 2: Web Uygulaması Ekleyin

1. Firebase Console'da projenize girin
2. Web ikonu (</>) tıklayın
3. App nickname: `ilac-web`
4. Firebase Hosting'i şimdilik işaretlemeyin
5. "Register app" tıklayın

## Adım 3: Yapılandırma Bilgilerini Kopyalayın

Ekranda şuna benzer bir kod bloğu göreceksiniz:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ilac-stok-takip.firebaseapp.com",
  projectId: "ilac-stok-takip",
  storageBucket: "ilac-stok-takip.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Bu bilgileri kopyalayın ve bana gönderin!**

## Adım 4: Firestore Database Aktifleştirin

1. Sol menüden "Firestore Database" seçin
2. "Create database" tıklayın
3. **"Start in test mode"** seçin (şimdilik test modu, sonra güvenlik kuralları ayarlayacağız)
4. Location: europe-west (veya size en yakın)
5. "Enable" tıklayın

## Adım 5: Authentication Aktifleştirin (Opsiyonel - Giriş sistemi için)

1. Sol menüden "Authentication" seçin
2. "Get started" tıklayın
3. "Email/Password" seçin ve aktifleştirin

---

Yukarıdaki adımları tamamlayın ve **firebaseConfig** bilgilerini bana gönderin, backend'i kodlara entegre edeceğim! 🚀
