# Firebase Authentication Kurulumu

Bu doküman Firebase Authentication ve Firestore Rules yayınlama adımlarını açıklar.

## 1. Firebase Console'da Authentication'ı Aktifleştirin

1. Firebase Console'da projenizi açın.
2. Sol menüden **Authentication** bölümüne girin.
3. **Get Started** butonuna tıklayın.
4. **Sign-in method** sekmesine geçin.
5. **Email/Password** sağlayıcısını etkinleştirin.
6. **Password-less sign-in** seçeneğini kapalı bırakın.
7. Google ile giriş kullanılacaksa **Google** sağlayıcısını da etkinleştirin.

## 2. Firestore Rules'u Güncelleyin

Aktif uygulama artık yalnızca `users/{userId}/medicines` koleksiyonundan oluşmuyor. Aile modu, davetler, QR ile katılma, paylaşım linkleri, push abonelikleri, barkod alanı ve E2EE anahtar zarfları için ek kurallar var.

Bu yüzden aşağıdaki minimal örnek kullanılmamalıdır:

```javascript
// Eski örnek. Bu projede kullanmayın.
match /users/{userId}/medicines/{medicineId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Doğru kaynak repodaki `firestore.rules` dosyasıdır. Yayınlamak için:

```bash
firebase deploy --only firestore:rules
```

Yerelde doğrulamak için:

```bash
npm run test:rules
```

Mevcut `firestore.rules` şu akışları bozmadan korur:

- Kullanıcılar kendi ilaçlarını okuyup yazabilir.
- Aile üyeleri aynı ailedeki gizli olmayan ilaçları okuyabilir.
- Aile dokümanlarındaki PII sadece aile üyelerine açıktır.
- E-posta davetleri sadece davet edilen e-posta tarafından okunabilir.
- QR davetleri tek kullanımlık `pending -> accepted` geçişiyle kabul edilir.
- Davetler herkes tarafından silinemez.
- Paylaşım linkleri yalnızca oluşturan kullanıcı tarafından yazılır/silinir.
- Push abonelikleri yalnızca ilgili kullanıcı tarafından yönetilir.

## 3. Deployment

```bash
npm run build
firebase deploy
```

Sadece kuralları yayınlamak için:

```bash
firebase deploy --only firestore:rules
```

## Kullanım

### İlk Kullanım

1. Uygulamayı açın.
2. **Giriş Yap / Kayıt Ol** ekranında **Kayıt** sekmesine geçin.
3. İsim, e-posta ve şifre girin.
4. Kayıt işleminden sonra e-postanıza gelen doğrulama bağlantısına tıklayın.
5. Doğrulama tamamlandıktan sonra giriş yapın.

### Sonraki Kullanımlar

1. Uygulamayı açın.
2. E-posta ve şifrenizi girin.
3. Giriş yapın.

### Şifremi Unuttum

1. Giriş ekranında **Şifremi unuttum** bağlantısına tıklayın.
2. E-postanızı girin.
3. Şifre sıfırlama bağlantısı e-postanıza gönderilir.

## Güvenlik

- Şifreler Firebase tarafından hash'lenerek saklanır.
- Manuel e-posta/şifre kayıtlarında e-posta doğrulaması zorunludur.
- Doğrulanmamış e-posta/şifre kullanıcıları uygulamaya alınmaz.
- Firestore Rules kullanıcı, aile, davet ve paylaşım verilerini ayrı güvenlik sınırlarıyla korur.
- E2EE anahtarları düz metin olarak Firestore'a yazılmamalıdır; mevcut uygulama kurtarma parolası ve anahtar zarfı modelini kullanır.
