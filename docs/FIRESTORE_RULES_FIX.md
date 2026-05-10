# Firebase Firestore Güvenlik Kurallarını Güncelleme

## ⚠️ ÖNEMLİ: Yazma İzni Hatası

Firestore Database'iniz şu an **okuma/yazma izinlerini** vermemiş olabilir.

## Adımlar:

1. **[Firebase Console](https://console.firebase.google.com/)** açın
2. Projenizi seçin: **ilac-stok-takip**
3. Sol menüden **"Firestore Database"** seçin
4. Üstteki **"Rules"** (Kurallar) sekmesine tıklayın

5. Şu kuralları kopyalayın ve yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. **"Publish"** (Yayınla) butonuna tıklayın

## Not:
Bu kural **herkese** okuma/yazma izni verir (test amaçlı). Gerçek bir projede daha güvenli kurallar kullanmalısınız. Şimdilik testler için bu yeterli.

## Kurallar Güncellendikten Sonra:
- Sayfayı yenileyin (F5)
- Tekrar ilaç eklemeyi deneyin
- Console'da **"[Firebase] Medicine added with ID: ..."** mesajını görmelisiniz
