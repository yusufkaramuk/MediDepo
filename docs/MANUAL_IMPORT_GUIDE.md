# 📦 Manuel İçe Aktarma Rehberi

İçe aktar butonu çalışmıyorsa, bu manuel yöntemi kullan.

## 🔧 Yöntem: Browser Console

### 1️⃣ Tarayıcı Console'u Aç
- **Windows:** `F12` veya `Ctrl+Shift+J`
- **Mac:** `Cmd+Option+J`

### 2️⃣ LocalStorage İlaçlarını Kontrol Et

Console'a yapıştır:
```javascript
const localMedicines = JSON.parse(localStorage.getItem('medicines') || '[]');
console.table(localMedicines);
console.log('Toplam:', localMedicines.length, 'ilaç');
```

**Kaç ilaç göründü?**

### 3️⃣ Firebase'e Yükle

**ÖNEMLİ:** Önce **giriş yapmış** olman gerekiyor!

Console'a bu kodu **TAM OLARAK** yapıştır ve Enter'a bas:

```javascript
(async () => {
  try {
    // Firebase modüllerini import et
    const { getAuth } = await import('firebase/auth');
    const { getFirestore, collection, addDoc } = await import('firebase/firestore');
    
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    
    if (!user) {
      alert('❌ Önce giriş yapmalısın!');
      return;
    }
    
    const localMedicines = JSON.parse(localStorage.getItem('medicines') || '[]');
    
    if (localMedicines.length === 0) {
      alert('❌ LocalStorage\'da ilaç yok!');
      return;
    }
    
    console.log(`🔄 ${localMedicines.length} ilaç yüklenecek...`);
    
    let count = 0;
    for (const medicine of localMedicines) {
      await addDoc(collection(db, `users/${user.uid}/medicines`), {
        name: medicine.name || '',
        quantity: medicine.quantity || '',
        expiryDate: medicine.expiryDate || '',
        activeIngredient1: medicine.activeIngredient1 || '',
        activeIngredient2: medicine.activeIngredient2 || '',
        activeIngredient3: medicine.activeIngredient3 || '',
        notes: medicine.notes || '',
        createdAt: medicine.createdAt || new Date().toISOString()
      });
      count++;
      console.log(`✅ ${count}/${localMedicines.length} yüklendi`);
    }
    
    alert(`✅ ${count} ilaç başarıyla Firebase'e yüklendi!\n\nSayfayı yenileyin (F5)`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
    alert('❌ Hata: ' + error.message);
  }
})();
```

### 4️⃣ Sayfayı Yenile
- `F5` veya `Ctrl+R`
- İlaçlar görünmeli!

---

## ⚠️ Sorun Giderme

### "Önce giriş yapmalısın" Hatası:
- Giriş yaptığından emin ol
- Header'da e-posta adresin görünüyor mu?

### "LocalStorage'da ilaç yok" Hatası:
1. Yerel moda geç (HardDrive ikonu)
2. İlaçlar görünüyor mu kontrol et
3. Tekrar console komutunu çalıştır

### Import Hatası:
Console'da kırmızı hata varsa bana göster!

---

## 📋 Alternatif: JSON Dosyasından

Eğer JSON dosyası export ettiysen:

1. JSON dosyasını bir text editörde aç
2. İçeriği **tamamen** kopyala
3. Console'a yapıştır:

```javascript
const importedData = BURAYA_JSON_YAPISTIR;

(async () => {
  const { getAuth } = await import('firebase/auth');
  const { getFirestore, collection, addDoc } = await import('firebase/firestore');
  
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  if (!user) {
    alert('Giriş yap!');
    return;
  }
  
  for (const medicine of importedData) {
    await addDoc(collection(db, `users/${user.uid}/medicines`), medicine);
  }
  
  alert('✅ Yüklendi!');
})();
```

---

**Hangi yöntemi denedin? Ne göründü?** 🔍
