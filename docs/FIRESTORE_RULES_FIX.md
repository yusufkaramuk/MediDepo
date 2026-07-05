# Firebase Firestore GÃ¼venlik KurallarÄ±nÄ± GÃ¼ncelleme

## âš ï¸ Ã–NEMLÄ°: Yazma Ä°zni HatasÄ±

Firestore Database'iniz ÅŸu an **okuma/yazma izinlerini** vermemiÅŸ olabilir.

## AdÄ±mlar:

1. **[Firebase Console](https://console.firebase.google.com/)** aÃ§Ä±n
2. Projenizi seÃ§in: **drdepo-18481** (DrDepo Firebase projesi)
3. Sol menÃ¼den **"Firestore Database"** seÃ§in
4. Ãœstteki **"Rules"** (Kurallar) sekmesine tÄ±klayÄ±n

5. Åu kurallarÄ± kopyalayÄ±n ve yapÄ±ÅŸtÄ±rÄ±n:

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

6. **"Publish"** (YayÄ±nla) butonuna tÄ±klayÄ±n

## Not:
Bu kural **herkese** okuma/yazma izni verir (test amaÃ§lÄ±). GerÃ§ek bir projede daha gÃ¼venli kurallar kullanmalÄ±sÄ±nÄ±z. Åimdilik testler iÃ§in bu yeterli.

## Kurallar GÃ¼ncellendikten Sonra:
- SayfayÄ± yenileyin (F5)
- Tekrar ilaÃ§ eklemeyi deneyin
- Console'da **"[Firebase] Medicine added with ID: ..."** mesajÄ±nÄ± gÃ¶rmelisiniz
