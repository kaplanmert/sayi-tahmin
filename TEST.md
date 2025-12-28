# 🎮 Oyunu Test Etme Rehberi

## Adım Adım Test

### 1. Backend Sunucusunu Başlatın

**Yeni bir terminal/komut penceresi açın** ve şu komutları çalıştırın:

```bash
cd server
npm start
```

Sunucu başarıyla başladığında şunu göreceksiniz:
```
🚀 Server çalışıyor: http://localhost:3001
```

**Bu terminali açık tutun!** (Sunucu çalışmaya devam etmeli)

### 2. Frontend'i Başlatın

**Başka bir terminal/komut penceresi açın** ve şu komutları çalıştırın:

```bash
npm start
```

Tarayıcı otomatik açılacak: `http://localhost:3000`

### 3. İki Oyuncu ile Test Edin

**İki farklı tarayıcı penceresi/sekmesi açın:**

#### Tarayıcı 1:
1. `http://localhost:3000` adresine gidin
2. Kullanıcı adı girin (örn: "Oyuncu1")
3. "Giriş Yap" butonuna tıklayın
4. "🎮 Oyun Ara" butonuna tıklayın
5. "Eşleşme Aranıyor..." mesajını göreceksiniz

#### Tarayıcı 2:
1. `http://localhost:3000` adresine gidin (veya farklı bir tarayıcı kullanın)
2. Farklı bir kullanıcı adı girin (örn: "Oyuncu2")
3. "Giriş Yap" butonuna tıklayın
4. "🎮 Oyun Ara" butonuna tıklayın

### 4. Oyun Başlar!

Her iki oyuncu da "Oyun Ara" butonuna tıkladığında:
- Otomatik olarak eşleşecekler
- Her oyuncu gizli sayısını belirleyecek
- Oyun başlayacak ve sırayla tahmin yapacaklar

## 🔍 Sorun Giderme

### "Bağlantı yok" hatası görüyorsanız:
- Backend sunucusunun çalıştığından emin olun
- Terminal'de hata var mı kontrol edin
- Port 3001'in başka bir uygulama tarafından kullanılmadığından emin olun

### Kullanıcı adı girdikten sonra bir şey olmuyorsa:
- Tarayıcı konsolunu açın (F12) ve hataları kontrol edin
- Backend sunucusunun çalıştığından emin olun
- Sayfayı yenileyin (F5)

### Eşleşme bulunamıyorsa:
- Her iki tarayıcıda da "Oyun Ara" butonuna tıklandığından emin olun
- Backend sunucusunun çalıştığından emin olun
- Her iki oyuncunun da farklı kullanıcı adları kullandığından emin olun

## 📊 Test Senaryoları

1. **Normal Oyun:**
   - İki oyuncu eşleşir
   - Gizli sayılar belirlenir
   - Sırayla tahmin yapılır
   - İlk doğru tahmini yapan kazanır

2. **Leaderboard:**
   - Oyun bittikten sonra "🏆 Liderlik" butonuna tıklayın
   - Kazanma/kayıp istatistiklerini görün

3. **Bağlantı Kesilmesi:**
   - Bir oyuncu sayfayı kapatırsa, diğer oyuncuya bildirim gösterilir

## ✅ Başarılı Test İşaretleri

- ✅ Backend sunucusu çalışıyor (terminal'de log görünüyor)
- ✅ Frontend'de "🟢 Bağlı" yazıyor
- ✅ Kullanıcı adı girildikten sonra modal kapanıyor
- ✅ "Oyun Ara" butonu aktif
- ✅ İki oyuncu eşleşiyor
- ✅ Oyun normal şekilde ilerliyor

