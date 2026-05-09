# Firebase App Check Setup

This project has optional Firebase App Check support for public production use.

## 1. Create the App Check provider

1. Open Firebase Console.
2. Go to **Build > App Check**.
3. Register the web app.
4. Choose **reCAPTCHA v3**.
5. Add your public domains, for example:
   - `ilac-stok-takip.web.app`
   - `localhost` for local verification if needed
6. Copy the reCAPTCHA v3 site key.

## 2. Configure environment variables

In `.env`:

```env
VITE_ENABLE_APP_CHECK=true
VITE_RECAPTCHA_V3_SITE_KEY=your_recaptcha_v3_site_key
```

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
