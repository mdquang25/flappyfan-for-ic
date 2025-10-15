import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import FlappyGame from "./components/FlappyGame";
import Leaderboard from "./components/Leaderboard";
import { submitScore, onAuth } from "./firebase";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lastScore, setLastScore] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const db = getFirestore();
        const snap = await getDoc(doc(db, "players", firebaseUser.uid));
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() });
        }
      }
      setCheckingAuth(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLoggedIn = (u) => setUser(u);

  const handleGameOver = async (score) => {
    setLastScore(score);
    if (user) {
      try {
        await submitScore(user.uid, score);
      } catch (e) {
        console.error("Lưu điểm lỗi:", e);
      }
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => window.location.reload());
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          height: "100vh",
          background: "radial-gradient(circle at top, #0f2027, #203a43, #2c5364)",
          color: "#00ffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Orbitron, sans-serif",
        }}
      >
        <h2>Đang kiểm tra đăng nhập...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login onLoggedIn={handleLoggedIn} />;
  }

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          background: "#000",
          position: "relative",
        }}
      >
        <FlappyGame user={user} onGameOver={handleGameOver} />

        <button
          onClick={() => setShowLeaderboard(true)}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            background: "#ffcb05",
            border: "none",
            borderRadius: 50,
            width: 56,
            height: 56,
            fontSize: 24,
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          🏆
        </button>

        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          🔁 Thoát
        </button>

        {showLeaderboard && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: "80%",
              background: "rgba(20,20,20,0.95)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflowY: "auto",
              animation: "slideUp 0.3s ease-out",
              zIndex: 100,
            }}
          >
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <button
                onClick={() => setShowLeaderboard(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  position: "absolute",
                  top: 8,
                  right: 20,
                }}
              >
                ❌
              </button>
              <Leaderboard currentUser={user} />
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}
        </style>
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div
      className="container"
      style={{
        padding: 20,
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <FlappyGame user={user} onGameOver={handleGameOver} />
        <Leaderboard currentUser={user} />
        <div style={{ position: "fixed", top: 10, right: 10 }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              background: "#ffcb05",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🔁 Đăng xuất
          </button>
        </div>
      </div>

      {lastScore !== null && (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          Điểm lần chơi trước: {lastScore}
        </p>
      )}
    </div>
  );
}
