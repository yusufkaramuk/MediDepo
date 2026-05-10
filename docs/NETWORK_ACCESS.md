# Ağ Erişimi - Nasıl Kullanılır

## ✅ Vite Config Güncellendi

Artık aynı WiFi ağındaki diğer cihazlar sisteme erişebilir.

## 🚀 Kullanım Adımları:

### 1️⃣ Dev Sunucusunu Yeniden Başlatın
```powershell
npm run dev
```

Sunucu başladığında şuna benzer bir çıktı göreceksiniz:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.0.174:5173/
```

### 2️⃣ IP Adresinizi Bulun
Sizin IP adresiniz: **192.168.0.174**

### 3️⃣ Diğer Cihazlardan Erişin

Aynı WiFi ağındaki **telefon, tablet, başka bilgisayar** vb. cihazlardan:

**Tarayıcıya girin:**
```
http://192.168.0.174:5173
```

## 📱 Mobil Test İçin:
1. Telefonunuzun WiFi'sinin **aynı ağa** (modem/router) bağlı olduğundan emin olun
2. Telefonda tarayıcıyı açın
3. Adres çubuğuna `http://192.168.0.174:5173` yazın
4. Firebase bulut modu aktif olduğu için telefon ve bilgisayar aynı verileri görecek!

## 🔥 Firewall Uyarısı
Windows Firewall izin isterse **"İzin Ver"** seçin.

## ⚠️ Önemli Not
Bu sadece **aynı WiFi ağındaki** cihazlar için çalışır. İnternetten erişim için deployment (Firebase Hosting, Vercel, Netlify vb.) yapmanız gerekir.
