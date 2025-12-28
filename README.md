# 🎮 4 Haneli Tahmin Oyunu - Online Multiplayer

Online çok oyunculu sayı tahmin oyunu. Gerçek zamanlı eşleşme, Socket.io ile anlık iletişim ve liderlik tablosu özellikleriyle modern bir oyun deneyimi.

## ✨ Özellikler

- 🌐 **Online Multiplayer**: Gerçek zamanlı oyuncu eşleştirme
- 🏆 **Leaderboard**: Kazanma oranları ve istatistikler
- ⚡ **Real-time**: Socket.io ile anlık güncellemeler
- 🎯 **2 Kişilik Oyunlar**: Otomatik eşleştirme sistemi
- 📊 **İstatistikler**: Kazanma/kayıp oranları ve toplam oyun sayısı

## 🚀 Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın veya indirin**

2. **Frontend bağımlılıklarını yükleyin:**
   ```bash
   npm install
   ```

3. **Backend bağımlılıklarını yükleyin:**
   ```bash
   cd server
   npm install
   cd ..
   ```

## 🎯 Çalıştırma

### Geliştirme Modu

1. **Backend sunucusunu başlatın:**
   ```bash
   cd server
   npm start
   ```
   Sunucu `http://localhost:3001` adresinde çalışacak.

2. **Frontend'i başlatın (yeni bir terminal penceresinde):**
   ```bash
   npm start
   ```
   Uygulama `http://localhost:3000` adresinde açılacak.

### Production Build

```bash
# Frontend build
npm run build

# Backend (sunucu zaten production için hazır)
cd server
npm start
```

## 📁 Proje Yapısı

```
sayi_tahmin/
├── server/                 # Backend sunucu
│   ├── index.js           # Socket.io server ve API
│   ├── package.json       # Backend bağımlılıkları
│   └── database.json      # Veritabanı (otomatik oluşturulur)
├── src/
│   └── App.js             # Ana React komponenti
├── public/
└── package.json           # Frontend bağımlılıkları
```

## 🎮 Nasıl Oynanır?

1. **Giriş Yap**: Kullanıcı adınızı girin
2. **Oyun Ara**: "Oyun Ara" butonuna tıklayın
3. **Eşleşme Bekle**: Sistem sizin için bir rakip bulacak
4. **Gizli Sayı Belirle**: 4 haneli, rakamları farklı bir sayı girin (0 ile başlayamaz)
5. **Tahmin Yap**: Rakibinizin sayısını bulmaya çalışın
6. **Kazan**: İlk doğru tahmini yapan kazanır!

### Oyun Kuralları

- ✅ **+X**: Doğru rakam, doğru yerde
- ↻ **-Y**: Doğru rakam, yanlış yerde
- ❌ **0**: Hiç ortak rakam yok

## 🏆 Leaderboard

Liderlik tablosunda şunları görebilirsiniz:
- Kazanma sayısı
- Kayıp sayısı
- Toplam oyun sayısı
- Kazanma yüzdesi

## 🔧 Yapılandırma

### Sunucu URL'si

Frontend'de sunucu URL'sini değiştirmek için `.env` dosyası oluşturun:

```env
REACT_APP_SERVER_URL=http://localhost:3001
```

Veya `src/App.js` dosyasındaki `SERVER_URL` değişkenini düzenleyin.

### Port Ayarları

Backend portu değiştirmek için `server/index.js` dosyasındaki `PORT` değişkenini düzenleyin veya environment variable kullanın:

```bash
PORT=3001 node server/index.js
```

## 🛠️ Teknolojiler

### Frontend
- React 19
- Socket.io Client
- Tailwind CSS

### Backend
- Node.js
- Express
- Socket.io
- UUID (oda ID'leri için)

## 📝 Notlar

- Veritabanı `server/database.json` dosyasında saklanır
- Sunucu yeniden başlatıldığında aktif oyunlar kaybolur (oda verileri memory'de tutulur)
- Production için veritabanı olarak MongoDB veya PostgreSQL kullanılabilir

## 🐛 Sorun Giderme

### "Sunucuya bağlanılamıyor" hatası
- Backend sunucusunun çalıştığından emin olun
- Port 3001'in kullanılabilir olduğunu kontrol edin
- CORS ayarlarını kontrol edin

### Eşleşme bulunamıyor
- Başka bir oyuncunun da arama yaptığından emin olun
- Sunucunun çalıştığını kontrol edin

## 📄 Lisans

Bu proje eğitim amaçlıdır.
