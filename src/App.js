// src/App.js
import React, { useState } from "react";
import Login from "./components/Login";
import FlappyGame from "./components/FlappyGame";
import Leaderboard from "./components/Leaderboard";
import { submitScore } from "./firebase";
import { getAuth, signOut } from "firebase/auth";

function handleLogout() {
  const auth = getAuth();
  signOut(auth).then(() => {
    window.location.reload(); // reload để quay lại form Login
  });
}

function App() {
  const [user, setUser] = useState(null);
  const [lastScore, setLastScore] = useState(null);

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
    // keep showing score; player can start again by reloading or you can implement restart.
    alert(`Game over! Điểm: ${score}`);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      {!user ? (
        <Login onLoggedIn={handleLoggedIn} />
      ) : (
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            <FlappyGame user={user} onGameOver={handleGameOver} />
            <Leaderboard currentUser={user} />
            <div style={{ position: "fixed", right: "10px", alignSelf: "start", textAlign: "center" }}>

              <button onClick={handleLogout}>🔁 Đăng xuất</button>
            </div>
          </div>
          {lastScore !== null && <p style={{ textAlign: "center" }}>Điểm lần chơi trước: {lastScore}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
