# Firebase App Check Setup

This project has optional Firebase App Check support for public production use.

## 1. Create the App Check provider

1. Open Firebase Console.
2. Go to **Build > App Check**.
3. Register the web app.
4. Choose **reCAPTCHA v3**.
5. Add your public domains, for example:
   - `drdepo.com.tr`
   - `localhost` for local verification if needed
6. Copy the reCAPTCHA v3 site key.

## 2. Configure environment variables

In `.env`:

```env
VITE_ENABLE_APP_CHECK=false
VITE_RECAPTCHA_V3_SITE_KEY=your_recaptcha_v3_site_key
```

Google ile giriş veya e-posta girişi çalışmıyorsa App Check'i geçici olarak kapalı tutun. `appCheck/recaptcha-error` hatası reCAPTCHA anahtarındaki izinli domainlerin eksik veya hatalı olduğunu gösterir.

App Check'i açmadan önce Firebase Console'da **Build > App Check** altında web app için kullanılan reCAPTCHA v3 sağlayıcısında şu domainlerin kayıtlı olduğundan emin olun:

- `drdepo.com.tr`
- `localhost` ve `127.0.0.1` sadece yerel test gerekiyorsa

Keep emulator runs disabled for App Check:

```env
VITE_USE_FIREBASE_EMULATORS=false
```

## 3. Build and deploy

```powershell
npm.cmd run build
npx.cmd firebase deploy --only hosting
```

## 4. Enforce gradually

Start in monitoring mode in Firebase Console. After normal app traffic works,
enable enforcement for Firestore.

Do not commit `.env`.
