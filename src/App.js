import React, { useMemo, useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const DIGIT_REGEX = /^\d{4}$/;
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

function uniqueDigits(s) {
  return new Set(s.split("")).size === s.length;
}

function validateNumber(s) {
  if (!DIGIT_REGEX.test(s)) return "4 haneli (0-9) bir sayı gir.";
  if (!uniqueDigits(s)) return "Tüm rakamlar farklı olmalı.";
  if (s[0] === "0") return "Sayı 0 ile başlayamaz.";
  return null;
}

function Pill({ children, variant = "default" }) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-100 text-green-700 border-green-300",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
    info: "bg-blue-100 text-blue-700 border-blue-300",
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

function Card({ title, children, right, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">{title}</div>
        </div>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FeedbackBadge({ plus, minus }) {
  if (plus === 0 && minus === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        0
      </span>
    );
  }
  
  return (
    <div className="flex gap-2 flex-wrap">
      {plus > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold text-sm">
          <span className="text-green-600">✓</span>
          +{plus}
        </span>
      )}
      {minus > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 font-semibold text-sm">
          <span className="text-yellow-600">↻</span>
          -{minus}
        </span>
      )}
    </div>
  );
}

function HistoryTable({ rows, playerNumber }) {
  const colors = {
    1: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    2: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  };
  const color = colors[playerNumber] || colors[1];
  
  return (
    <div className="overflow-hidden rounded-xl border-2 border-gray-200">
      <table className="w-full text-sm">
        <thead className={`${color.bg} ${color.border}`}>
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Tahmin</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Geri Dönüş</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-gray-400 italic" colSpan={3}>
                Henüz tahmin yapılmadı
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-lg font-bold text-gray-800 tracking-wider">
                    {r.guess}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FeedbackBadge plus={r.plus} minus={r.minus} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Leaderboard({ onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Leaderboard yüklenemedi:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">🏆 Liderlik Tablosu</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz oyun oynanmamış</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Sıra</th>
                  <th className="px-4 py-3 text-left font-semibold">Kullanıcı</th>
                  <th className="px-4 py-3 text-center font-semibold">Kazanma</th>
                  <th className="px-4 py-3 text-center font-semibold">Kayıp</th>
                  <th className="px-4 py-3 text-center font-semibold">Toplam</th>
                  <th className="px-4 py-3 text-center font-semibold">Kazanma %</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, idx) => (
                  <tr
                    key={user.username}
                    className={`border-b hover:bg-gray-50 ${
                      idx < 3 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {idx === 0 && "🥇"}
                      {idx === 1 && "🥈"}
                      {idx === 2 && "🥉"}
                      {idx >= 3 && `#${idx + 1}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">
                      {user.wins}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-semibold">
                      {user.losses}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">
                      {user.totalGames}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        parseFloat(user.winRate) >= 50 ? "text-green-600" : "text-orange-600"
                      }`}>
                        {user.winRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const socketRef = useRef(null);
  const myPlayerNumberRef = useRef(null); // Closure sorununu önlemek için
  
  // Connection state
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const [usernameMode, setUsernameMode] = useState(null); // "custom" | "random" | null
  const [userId, setUserId] = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  
  // Game state
  const [phase, setPhase] = useState("menu"); // menu | searching | setup | play | finished
  const [myPlayerNumber, setMyPlayerNumber] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [roomId, setRoomId] = useState(null);
  
  // Secrets
  const [mySecret, setMySecret] = useState("");
  const [opponentSecretSet, setOpponentSecretSet] = useState(false);
  
  // Gameplay
  const [turn, setTurn] = useState(1);
  const [currentGuess, setCurrentGuess] = useState("");
  const [myHistory, setMyHistory] = useState([]);
  const [opponentHistory, setOpponentHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [gameSecrets, setGameSecrets] = useState({ player1: null, player2: null });
  
  // UI
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const secretError = useMemo(() => (mySecret ? validateNumber(mySecret) : null), [mySecret]);
  const guessError = useMemo(() => {
    if (!currentGuess) return null;
    return validateNumber(currentGuess);
  }, [currentGuess]);

  const canSetSecret = mySecret.length === 4 && !secretError;

  // Socket connection - sadece bir kez oluştur
  useEffect(() => {
    console.log("Socket bağlantısı başlatılıyor:", SERVER_URL);
    
    // Önce backend'in çalışıp çalışmadığını test et
    fetch(`${SERVER_URL}/api/test`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ Backend test başarılı:", data);
      })
      .catch(err => {
        console.error("❌ Backend test başarısız:", err);
        console.error("Backend sunucusunun çalıştığından emin olun:", SERVER_URL);
      });

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Sunucuya bağlandı:", SERVER_URL);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Sunucudan ayrıldı:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Bağlantı hatası:", error.message);
      console.error("Sunucu URL:", SERVER_URL);
      setConnected(false);
    });

    socket.on("joined", ({ username: serverUsername }) => {
      console.log("Sunucudan username alındı:", serverUsername);
      setUsername(serverUsername);
      setShowUsernameModal(false);
    });

    socket.on("joinError", ({ error }) => {
      console.error("Join hatası:", error);
      alert(error);
    });

    socket.on("searching", () => {
      console.log("Eşleşme aranıyor...");
      setPhase("searching");
    });

    socket.on("matchFound", ({ roomId: newRoomId, players, yourPlayerNumber }) => {
      console.log("Eşleşme bulundu!", { roomId: newRoomId, players, yourPlayerNumber, currentUsername: username });
      setRoomId(newRoomId);
      setMyPlayerNumber(yourPlayerNumber);
      myPlayerNumberRef.current = yourPlayerNumber; // Ref'i de güncelle
      // username'e göre rakip bul (username state'i güncel olmayabilir, bu yüzden players array'inden bul)
      const myPlayer = players.find((p, idx) => idx + 1 === yourPlayerNumber);
      const opponentPlayer = players.find((p, idx) => idx + 1 !== yourPlayerNumber);
      setOpponent(opponentPlayer);
      setPhase("setup");
      setOpponentDisconnected(false);
    });

    socket.on("matchCancelled", () => {
      console.log("Eşleşme iptal edildi");
      setPhase("menu");
    });

    socket.on("opponentSecretSet", () => {
      console.log("Rakip sayısını belirledi");
      setOpponentSecretSet(true);
    });

    socket.on("gameStarted", ({ gameState, yourPlayerNumber }) => {
      console.log("🎮 Oyun başladı event alındı!", { 
        gameState, 
        yourPlayerNumber, 
        currentMyPlayerNumber: myPlayerNumber,
        phase: gameState?.phase,
        turn: gameState?.turn
      });
      
      // Backend'den gelen yourPlayerNumber'ı mutlaka kullan
      if (yourPlayerNumber) {
        console.log("Player number backend'den alındı:", yourPlayerNumber);
        setMyPlayerNumber(yourPlayerNumber);
        myPlayerNumberRef.current = yourPlayerNumber; // Ref'i de güncelle
      }
      
      // yourPlayerNumber'ı kullan (myPlayerNumber closure sorunu olabilir)
      const currentPlayerNumber = yourPlayerNumber || myPlayerNumber;
      
      if (!currentPlayerNumber) {
        console.error("❌ Player number bulunamadı!", { yourPlayerNumber, myPlayerNumber });
        return;
      }
      
      console.log("✅ Oyun state güncelleniyor:", {
        phase: "play",
        turn: gameState?.turn || 1,
        currentPlayerNumber,
        myHistory: gameState?.[`player${currentPlayerNumber}History`] || [],
        opponentHistory: gameState?.[`player${currentPlayerNumber === 1 ? 2 : 1}History`] || []
      });
      
      // State'leri güncelle
      setPhase("play");
      setTurn(gameState?.turn || 1);
      setMyHistory(gameState?.[`player${currentPlayerNumber}History`] || []);
      setOpponentHistory(gameState?.[`player${currentPlayerNumber === 1 ? 2 : 1}History`] || []);
      
      console.log("✅ Phase 'play' olarak set edildi");
    });

    socket.on("guessSubmitted", ({ gameState, playerNumber }) => {
      // Ref'ten güncel player number'ı al (closure sorununu önler)
      const currentMyNumber = myPlayerNumberRef.current;
      
      console.log("📥 Tahmin gönderildi event alındı", { 
        gameState, 
        playerNumber,
        myPlayerNumber: currentMyNumber,
        player1History: gameState.player1History?.length || 0,
        player2History: gameState.player2History?.length || 0
      });
      
      if (!currentMyNumber) {
        console.error("❌ myPlayerNumber bulunamadı!");
        return;
      }
      
      // History'leri güncelle
      const myHistory = gameState[`player${currentMyNumber}History`] || [];
      const opponentNumber = currentMyNumber === 1 ? 2 : 1;
      const opponentHistory = gameState[`player${opponentNumber}History`] || [];
      
      console.log(`✅ History'ler güncelleniyor:`, {
        myNumber: currentMyNumber,
        opponentNumber: opponentNumber,
        myHistoryCount: myHistory.length,
        opponentHistoryCount: opponentHistory.length
      });
      
      setMyHistory(myHistory);
      setOpponentHistory(opponentHistory);
      setTurn(gameState.turn);
    });

    socket.on("gameFinished", ({ gameState, winner: gameWinner, secrets }) => {
      console.log("Oyun bitti!", { gameState, winner: gameWinner, secrets });
      setPhase("finished");
      setWinner(gameWinner);
      setGameSecrets(secrets);
      setMyHistory(gameState[`player${myPlayerNumber}History`] || []);
      setOpponentHistory(gameState[`player${myPlayerNumber === 1 ? 2 : 1}History`] || []);
    });

    socket.on("opponentDisconnected", () => {
      console.log("Rakip bağlantısını kesti");
      setOpponentDisconnected(true);
      setPhase("menu");
    });

    return () => {
      console.log("Socket bağlantısı kapatılıyor");
      socket.disconnect();
    };
  }, []); // Sadece component mount olduğunda çalış

  function generateRandomUsername() {
    const adjectives = ['Hızlı', 'Akıllı', 'Cesur', 'Güçlü', 'Şanslı', 'Zeki', 'Yenilmez', 'Usta', 'Kahraman', 'Efsane'];
    const nouns = ['Oyuncu', 'Şampiyon', 'Uzman', 'Aslan', 'Kaplan', 'Kartal', 'Yıldız', 'Ejder', 'Savaşçı', 'Büyücü'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdj}${randomNoun}${randomNum}`;
  }

  function handleJoin() {
    if (!socketRef.current) {
      console.log("Socket yok");
      return;
    }

    let finalUsername = "";
    
    if (usernameMode === "custom") {
      if (!customUsername.trim()) {
        alert("Lütfen kullanıcı adınızı girin");
        return;
      }
      finalUsername = customUsername.trim();
    } else if (usernameMode === "random") {
      finalUsername = generateRandomUsername();
      console.log("Random kullanıcı adı oluşturuldu:", finalUsername);
    } else {
      alert("Lütfen bir seçenek seçin");
      return;
    }

    console.log("Join event gönderiliyor:", { username: finalUsername });
    socketRef.current.emit("join", { username: finalUsername });
  }

  function findMatch() {
    if (!connected) return;
    socketRef.current?.emit("findMatch");
  }

  function cancelMatch() {
    socketRef.current?.emit("cancelMatch");
    setPhase("menu");
  }

  function setSecret() {
    if (!canSetSecret || !socketRef.current || !myPlayerNumber) {
      console.log("setSecret: Koşullar sağlanmadı", { canSetSecret, socket: !!socketRef.current, myPlayerNumber });
      return;
    }
    console.log("Gizli sayı gönderiliyor", { secret: mySecret, playerNumber: myPlayerNumber });
    socketRef.current.emit("setSecret", {
      secret: mySecret,
      playerNumber: myPlayerNumber
    });
  }

  function submitGuess() {
    if (phase !== "play" || !socketRef.current) return;
    const err = validateNumber(currentGuess);
    if (err) return;

    socketRef.current.emit("submitGuess", {
      guess: currentGuess,
      playerNumber: myPlayerNumber
    });
    setCurrentGuess("");
  }

  function resetGame() {
    setPhase("menu");
    setMySecret("");
    setOpponentSecretSet(false);
    setCurrentGuess("");
    setMyHistory([]);
    setOpponentHistory([]);
    setWinner(null);
    setTurn(1);
    setRoomId(null);
    setOpponent(null);
    setMyPlayerNumber(null);
    setOpponentDisconnected(false);
    socketRef.current?.emit("cancelMatch");
  }

  const isMyTurn = turn === myPlayerNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                4 Haneli Tahmin Oyunu
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Online oyun! Gerçek oyuncularla eşleş ve kazanma oranını artır.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap items-center">
                <Pill variant={connected ? "success" : "warning"}>
                  {connected ? "🟢 Bağlı" : "🔴 Bağlantı yok"}
                </Pill>
                <Pill variant="info">Online</Pill>
                {username && (
                  <Pill variant="info">👤 {username}</Pill>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-gray-50 hover:shadow-lg transition-all text-gray-700"
              >
                🏆 Liderlik
              </button>
              {phase !== "menu" && (
                <button
                  onClick={resetGame}
                  className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-gray-50 hover:shadow-lg transition-all text-gray-700"
                >
                  🔄 Çıkış
                </button>
              )}
            </div>
          </div>

          {/* Status Banner */}
          {phase !== "menu" && (
            <div className={`rounded-2xl border-2 p-4 shadow-md transition-all ${
              phase === "searching"
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 border-yellow-300"
                : phase === "setup"
                ? "bg-white border-gray-300"
                : phase === "play"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400"
                : "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400"
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-white/90">
                  {phase === "searching" && "🔍 Eşleşme aranıyor..."}
                  {phase === "setup" && "🎯 Gizli sayınızı belirleyin"}
                  {phase === "play" && `🎮 ${isMyTurn ? "Sıra sizde!" : "Rakibiniz oynuyor..."}`}
                  {phase === "finished" && `🏆 ${winner === myPlayerNumber ? "Kazandınız!" : "Kaybettiniz"}`}
                </div>
                {opponent && (
                  <div className={`text-lg font-bold ${
                    phase === "setup" ? "text-gray-800" : "text-white"
                  }`}>
                    vs {opponent.username}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Username Modal */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Kullanıcı Adı Seçin</h2>
              <p className="text-sm text-gray-600 mb-4">
                Aynı kullanıcı adıyla tekrar giriş yaptığınızda istatistikleriniz korunur.
              </p>
              
              <div className="space-y-3 mb-4">
                <button
                  onClick={() => {
                    setUsernameMode("custom");
                    setCustomUsername("");
                  }}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    usernameMode === "custom"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✏️</span>
                    <div>
                      <div className="font-semibold">Kendi Kullanıcı Adım</div>
                      <div className="text-xs text-gray-500">Kullanıcı adınızı girin</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setUsernameMode("random");
                    setCustomUsername("");
                  }}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    usernameMode === "random"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎲</span>
                    <div>
                      <div className="font-semibold">Rastgele Kullanıcı Adı</div>
                      <div className="text-xs text-gray-500">Otomatik oluşturulsun</div>
                    </div>
                  </div>
                </button>
              </div>

              {usernameMode === "custom" && (
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="w-full rounded-xl border-2 px-4 py-3 text-lg outline-none focus:border-blue-500 mb-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                  autoFocus
                />
              )}

              {usernameMode === "random" && (
                <div className="mb-4 p-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <p className="text-sm text-purple-700">
                    🎲 Rastgele bir kullanıcı adı oluşturulacak (örn: HızlıAslan123)
                  </p>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!usernameMode || (usernameMode === "custom" && !customUsername.trim())}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {usernameMode === "random" ? "🎲 Rastgele Ad ile Giriş Yap" : "✏️ Giriş Yap"}
              </button>
            </Card>
          </div>
        )}

        {/* Menu */}
        {phase === "menu" && !showUsernameModal && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <Card className="max-w-md w-full text-center">
              <h2 className="text-2xl font-bold mb-4">Oyun Modu</h2>
              <button
                onClick={findMatch}
                disabled={!connected}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                🎮 Oyun Ara
              </button>
              {!connected && (
                <p className="mt-3 text-sm text-red-600">
                  Sunucuya bağlanılamıyor. Lütfen backend sunucusunun çalıştığından emin olun.
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Searching */}
        {phase === "searching" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <Card className="max-w-md w-full text-center">
              <div className="animate-pulse text-4xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-4">Eşleşme Aranıyor...</h2>
              <p className="text-gray-600 mb-4">Rakip oyuncu bulunuyor...</p>
              <button
                onClick={cancelMatch}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-lg font-semibold hover:bg-gray-50"
              >
                İptal
              </button>
            </Card>
          </div>
        )}

        {/* Setup */}
        {phase === "setup" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              title={
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {myPlayerNumber}
                  </span>
                  Sizin Gizli Sayınız
                </span>
              }
              className="border-blue-200"
            >
              <div className="relative">
                <input
                  value={mySecret}
                  onChange={(e) => setMySecret(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Örn: 1453"
                  className={`w-full rounded-xl border-2 px-5 py-4 font-mono text-2xl text-center tracking-widest outline-none transition-all ${
                    secretError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : mySecret.length === 4 && !secretError
                      ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {mySecret.length === 4 && !secretError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">✓</span>
                )}
              </div>
              <div className="mt-3 text-sm min-h-[20px]">
                {secretError ? (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <span>⚠️</span> {secretError}
                  </span>
                ) : mySecret.length === 4 ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <span>✓</span> Geçerli sayı!
                  </span>
                ) : (
                  <span className="text-gray-500">4 farklı rakam girin (0 ile başlayamaz)</span>
                )}
              </div>
              <button
                onClick={setSecret}
                disabled={!canSetSecret}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {opponentSecretSet ? "✅ Hazır!" : "Sayıyı Belirle"}
              </button>
              {opponentSecretSet && (
                <p className="mt-2 text-sm text-green-600 text-center">
                  ✓ Rakibiniz hazır! Oyun başlamak üzere...
                </p>
              )}
            </Card>

            <Card
              title={
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    {myPlayerNumber === 1 ? 2 : 1}
                  </span>
                  Rakip: {opponent?.username || "Bekleniyor..."}
                </span>
              }
              className="border-purple-200"
            >
              <div className="flex items-center justify-center h-32">
                {opponentSecretSet ? (
                  <div className="text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-green-600 font-semibold">Rakip hazır!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="animate-pulse text-3xl mb-2">⏳</div>
                    <p className="text-gray-500">Rakip sayısını belirliyor...</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Game */}
        {phase === "play" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    Tahmin Yap
                  </span>
                }
                className={isMyTurn ? "border-blue-300 ring-2 ring-blue-200" : "border-gray-200"}
              >
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      isMyTurn ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {turn}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {isMyTurn ? "Sıra sizde!" : "Rakibiniz oynuyor"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={!isMyTurn || phase === "finished"}
                    placeholder="4 haneli tahmin"
                    className={`flex-1 rounded-xl border-2 px-4 py-3 font-mono text-xl text-center tracking-widest outline-none transition-all ${
                      guessError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !guessError && currentGuess.length === 4 && isMyTurn) submitGuess();
                    }}
                  />
                  <button
                    onClick={submitGuess}
                    disabled={!isMyTurn || phase === "finished" || !!guessError || currentGuess.length !== 4}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                  >
                    Gönder
                  </button>
                </div>

                <div className="mt-3 text-sm min-h-[20px]">
                  {guessError ? (
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <span>⚠️</span> {guessError}
                    </span>
                  ) : !isMyTurn ? (
                    <span className="text-gray-400">Rakibinizin tahminini bekleyin...</span>
                  ) : currentGuess.length > 0 ? (
                    <span className="text-gray-500">
                      💡 İpucu: <span className="text-green-600 font-semibold">+</span> doğru yerde doğru rakam, 
                      <span className="text-yellow-600 font-semibold"> -</span> doğru rakam yanlış yerde
                    </span>
                  ) : (
                    <span className="text-gray-400">4 haneli tahmin girin</span>
                  )}
                </div>
              </Card>

              <Card title="📖 Kurallar" className="border-gray-200">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Gizli sayı ve tahminler <strong>4 hane</strong> olmalı</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Tüm rakamlar <strong>farklı</strong> olmalı</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>
                      Geri dönüş: <span className="text-green-600 font-bold">+X</span> (doğru rakam, doğru yer) ve 
                      <span className="text-yellow-600 font-bold"> -Y</span> (doğru rakam, yanlış yer)
                    </span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      {myPlayerNumber}
                    </span>
                    Sizin Tahminleriniz
                  </span>
                }
                right={<Pill variant="info">{myHistory.length} tahmin</Pill>}
                className="border-blue-200"
              >
                <HistoryTable rows={myHistory} playerNumber={myPlayerNumber} />
              </Card>

              <Card
                title={
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                      {myPlayerNumber === 1 ? 2 : 1}
                    </span>
                    {opponent?.username || "Rakip"} — Tahminler
                  </span>
                }
                right={<Pill variant="info">{opponentHistory.length} tahmin</Pill>}
                className="border-purple-200"
              >
                <HistoryTable rows={opponentHistory} playerNumber={myPlayerNumber === 1 ? 2 : 1} />
              </Card>
            </div>
          </div>
        )}

        {/* Finished */}
        {phase === "finished" && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Card className="max-w-2xl w-full text-center border-green-300">
              <div className="text-6xl mb-4">
                {winner === myPlayerNumber ? "🏆" : "😔"}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {winner === myPlayerNumber ? "Kazandınız!" : "Kaybettiniz"}
              </h2>
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <div>Gizli Sayılar:</div>
                <div className="font-mono text-lg">
                  <div>Oyuncu 1: <strong>{gameSecrets.player1}</strong></div>
                  <div className="mt-1">Oyuncu 2: <strong>{gameSecrets.player2}</strong></div>
                </div>
              </div>
              <button
                onClick={resetGame}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Yeni Oyun Ara
              </button>
            </Card>
          </div>
        )}

        {opponentDisconnected && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg">
            Rakip bağlantısını kesti. Ana menüye dönülüyor...
          </div>
        )}
      </div>

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
