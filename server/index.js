const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// CORS ayarları - Production için güncellenmiş
const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }));
app.use(express.json());

// Ana sayfa (bilgilendirme)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend sunucusu çalışıyor!',
    endpoints: {
      test: '/api/test',
      leaderboard: '/api/leaderboard',
      stats: '/api/stats/:userId'
    },
    socket: 'Socket.io bağlantısı için ws://localhost:3001 kullanın'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Backend çalışıyor!' });
});

// Veritabanı dosyası yolu
const DB_PATH = path.join(__dirname, 'database.json');

// Veritabanını yükle veya oluştur
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Dosya yoksa varsayılan veritabanı oluştur
    const defaultDb = {
      users: {},
      games: {},
      leaderboard: []
    };
    await saveDatabase(defaultDb);
    return defaultDb;
  }
}

// Veritabanını kaydet
async function saveDatabase(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

// Oda yönetimi
const rooms = new Map(); // roomId -> { players: [], gameState: {...} }
const waitingQueue = []; // Eşleşme bekleyen oyuncular

// Oyun durumu yönetimi
const gameStates = new Map(); // roomId -> gameState

// Random kullanıcı adı oluştur
function generateRandomUsername() {
  const adjectives = ['Hızlı', 'Akıllı', 'Cesur', 'Güçlü', 'Şanslı', 'Zeki', 'Yenilmez', 'Usta', 'Kahraman', 'Efsane'];
  const nouns = ['Oyuncu', 'Şampiyon', 'Uzman', 'Aslan', 'Kaplan', 'Kartal', 'Yıldız', 'Ejder', 'Savaşçı', 'Büyücü'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomAdj}${randomNoun}${randomNum}`;
}

// Leaderboard hesapla
function calculateWinRate(username, db) {
  const user = db.users[username];
  if (!user || user.totalGames === 0) return 0;
  return ((user.wins / user.totalGames) * 100).toFixed(1);
}

// API: Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const db = await loadDatabase();
    const leaderboard = Object.values(db.users)
      .map(user => ({
        username: user.username,
        wins: user.wins || 0,
        losses: user.losses || 0,
        totalGames: user.totalGames || 0,
        winRate: calculateWinRate(user.username, db)
      }))
      .sort((a, b) => {
        // Önce kazanma oranına göre, sonra toplam oyuna göre
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        }
        return b.totalGames - a.totalGames;
      })
      .slice(0, 100); // İlk 100 kişi

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard hatası:', error);
    res.status(500).json({ error: 'Leaderboard yüklenemedi' });
  }
});

// API: Kullanıcı istatistikleri
app.get('/api/stats/:username', async (req, res) => {
  try {
    const db = await loadDatabase();
    const user = db.users[req.params.username];
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    res.json({
      ...user,
      winRate: calculateWinRate(req.params.username, db)
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  // Kullanıcı girişi
  socket.on('join', async ({ username }) => {
    if (!username || !username.trim()) {
      socket.emit('joinError', { error: 'Kullanıcı adı gerekli' });
      return;
    }

    const cleanUsername = username.trim();
    socket.username = cleanUsername;
    socket.userId = socket.id; // Socket ID'yi session için kullan
    
    // Kullanıcıyı veritabanına ekle/güncelle (username'e göre unique)
    const db = await loadDatabase();
    if (!db.users[cleanUsername]) {
      // Yeni kullanıcı
      db.users[cleanUsername] = {
        username: cleanUsername,
        wins: 0,
        losses: 0,
        totalGames: 0
      };
      await saveDatabase(db);
      console.log(`✅ Yeni kullanıcı oluşturuldu: ${cleanUsername}`);
    } else {
      // Mevcut kullanıcı - istatistikler korunur
      console.log(`✅ Mevcut kullanıcı giriş yaptı: ${cleanUsername} (${db.users[cleanUsername].wins}W/${db.users[cleanUsername].losses}L)`);
    }

    socket.emit('joined', { username: cleanUsername });
    console.log(`${cleanUsername} giriş yaptı`);
  });

  // Oyun arama
  socket.on('findMatch', async () => {
    if (waitingQueue.length === 0) {
      // Sırada kimse yok, kuyruğa ekle
      waitingQueue.push(socket);
      socket.emit('searching');
      console.log(`${socket.username} eşleşme arıyor...`);
    } else {
      // Eşleşme bulundu!
      const opponent = waitingQueue.shift();
      const roomId = uuidv4();
      
      // Odayı oluştur
      const room = {
        id: roomId,
        players: [
          { socketId: socket.id, userId: socket.id, username: socket.username },
          { socketId: opponent.id, userId: opponent.id, username: opponent.username }
        ],
        gameState: {
          phase: 'setup',
          player1Secret: null,
          player2Secret: null,
          player1History: [],
          player2History: [],
          turn: 1,
          winner: null
        }
      };

      rooms.set(roomId, room);
      gameStates.set(roomId, room.gameState);

      // Her iki oyuncuyu da odaya ekle
      socket.join(roomId);
      opponent.join(roomId);
      socket.roomId = roomId;
      opponent.roomId = roomId;

      // Her oyuncuya kendi player number'ını gönder
      room.players.forEach((player, index) => {
        const playerNumber = index + 1;
        const playerSocket = player.socketId === socket.id ? socket : opponent;
        
        console.log(`📤 matchFound event gönderiliyor:`, {
          socketId: player.socketId,
          username: player.username,
          playerNumber: playerNumber
        });
        
        playerSocket.emit('matchFound', {
          roomId,
          players: room.players,
          yourPlayerNumber: playerNumber
        });
      });

      console.log(`Eşleşme bulundu: ${socket.username} vs ${opponent.username} (Oda: ${roomId})`);
    }
  });

  // Eşleşme aramayı iptal et
  socket.on('cancelMatch', () => {
    const index = waitingQueue.findIndex(s => s.id === socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      socket.emit('matchCancelled');
    }
  });

  // Gizli sayı gönder
  socket.on('setSecret', async ({ secret, playerNumber }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) {
      console.log('setSecret: Oda bulunamadı', { roomId, socketId: socket.id });
      return;
    }

    const room = rooms.get(roomId);
    const gameState = gameStates.get(roomId);

    console.log('Gizli sayı alındı', { roomId, playerNumber, secret: '****' });

    if (playerNumber === 1) {
      gameState.player1Secret = secret;
    } else {
      gameState.player2Secret = secret;
    }

    // Her iki oyuncu da sayısını belirlediyse oyunu başlat
    if (gameState.player1Secret && gameState.player2Secret) {
      gameState.phase = 'play';
      gameState.turn = 1;
      // History'leri başlat (eğer yoksa)
      if (!gameState.player1History) gameState.player1History = [];
      if (!gameState.player2History) gameState.player2History = [];
      
      console.log('🎮 Oyun başlatılıyor!', { 
        roomId, 
        player1Secret: '****', 
        player2Secret: '****',
        turn: gameState.turn,
        phase: gameState.phase
      });
      
      // Her oyuncuya kendi player number'ını da gönder
      room.players.forEach((player, index) => {
        const playerNumber = index + 1;
        const eventData = { 
          gameState: {
            phase: gameState.phase,
            turn: gameState.turn,
            player1History: gameState.player1History || [],
            player2History: gameState.player2History || []
          },
          yourPlayerNumber: playerNumber
        };
        
        console.log(`📤 gameStarted event gönderiliyor:`, {
          socketId: player.socketId,
          playerNumber: playerNumber,
          username: player.username,
          eventData: {
            phase: eventData.gameState.phase,
            turn: eventData.gameState.turn,
            yourPlayerNumber: eventData.yourPlayerNumber
          }
        });
        
        // Event'i gönder
        io.to(player.socketId).emit('gameStarted', eventData);
        
        // Event'in gönderildiğini doğrula
        console.log(`✅ gameStarted event gönderildi: ${player.username} (Player ${playerNumber})`);
      });
    } else {
      // Diğer oyuncuya bildir
      console.log('⏳ Rakip sayısını bekliyor...', { 
        player1Secret: !!gameState.player1Secret,
        player2Secret: !!gameState.player2Secret 
      });
      socket.to(roomId).emit('opponentSecretSet', { playerNumber });
    }
  });

  // Tahmin gönder
  socket.on('submitGuess', async ({ guess, playerNumber }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    const gameState = gameStates.get(roomId);
    const opponentSecret = playerNumber === 1 ? gameState.player2Secret : gameState.player1Secret;

    // Tahmin skorunu hesapla
    const { plus, minus } = scoreGuess(opponentSecret, guess);
    const historyEntry = { guess, plus, minus };

    // Geçmişe ekle
    if (playerNumber === 1) {
      gameState.player1History.unshift(historyEntry);
    } else {
      gameState.player2History.unshift(historyEntry);
    }

    // Kazanan var mı?
    if (plus === 4) {
      gameState.phase = 'finished';
      gameState.winner = playerNumber;
      
      // Veritabanını güncelle (username'e göre)
      const db = await loadDatabase();
      const winnerUsername = playerNumber === 1 
        ? room.players[0].username 
        : room.players[1].username;
      const loserUsername = playerNumber === 1 
        ? room.players[1].username 
        : room.players[0].username;

      if (!db.users[winnerUsername]) {
        db.users[winnerUsername] = { username: winnerUsername, wins: 0, losses: 0, totalGames: 0 };
      }
      if (!db.users[loserUsername]) {
        db.users[loserUsername] = { username: loserUsername, wins: 0, losses: 0, totalGames: 0 };
      }

      db.users[winnerUsername].wins = (db.users[winnerUsername].wins || 0) + 1;
      db.users[loserUsername].losses = (db.users[loserUsername].losses || 0) + 1;
      db.users[winnerUsername].totalGames = (db.users[winnerUsername].totalGames || 0) + 1;
      db.users[loserUsername].totalGames = (db.users[loserUsername].totalGames || 0) + 1;

      await saveDatabase(db);

      io.to(roomId).emit('gameFinished', {
        gameState,
        winner: playerNumber,
        secrets: {
          player1: gameState.player1Secret,
          player2: gameState.player2Secret
        }
      });
    } else {
      // Sırayı değiştir
      gameState.turn = gameState.turn === 1 ? 2 : 1;
      
      console.log('📤 guessSubmitted event gönderiliyor:', {
        roomId,
        playerNumber,
        turn: gameState.turn,
        player1HistoryCount: gameState.player1History?.length || 0,
        player2HistoryCount: gameState.player2History?.length || 0
      });
      
      io.to(roomId).emit('guessSubmitted', {
        gameState: {
          phase: gameState.phase,
          turn: gameState.turn,
          player1History: gameState.player1History || [],
          player2History: gameState.player2History || []
        },
        historyEntry,
        playerNumber
      });
    }
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);

    // Kuyruktan çıkar
    const queueIndex = waitingQueue.findIndex(s => s.id === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
    }

    // Odadan çıkar
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        // Diğer oyuncuya bildir
        socket.to(socket.roomId).emit('opponentDisconnected');
        rooms.delete(socket.roomId);
        gameStates.delete(socket.roomId);
      }
    }
  });
});

// Tahmin skorlama fonksiyonu
function scoreGuess(secret, guess) {
  let plus = 0;
  let minus = 0;
  const s = secret.split("");
  const g = guess.split("");

  for (let i = 0; i < 4; i++) {
    if (g[i] === s[i]) plus++;
  }

  const secretSet = new Set(s);
  let anyMatch = 0;
  for (let i = 0; i < 4; i++) {
    if (secretSet.has(g[i])) anyMatch++;
  }
  minus = anyMatch - plus;

  return { plus, minus };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});

