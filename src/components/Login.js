import React, { useState } from "react";
import { signInAnon, registerUsername } from "../firebase";

export default function Login({ onLoggedIn }) {
    const [username, setUsername] = useState("");
    const [className, setClassName] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleStart = async () => {
        setErr("");
        const name = username.trim();
        const cls = className.trim();
        if (!name) return setErr("Vui lòng nhập tên.");
        if (name.length < 3) return setErr("Tên tối thiểu 3 ký tự.");
        if (!cls) return setErr("Vui lòng nhập lớp.");

        setLoading(true);
        try {
            const user = await signInAnon();
            await registerUsername(user.uid, name, cls);
            onLoggedIn({ uid: user.uid, username: name, className: cls });
        } catch (e) {
            if (e.message === "USERNAME_TAKEN")
                setErr("Tên đã có người dùng, hãy chọn tên khác.");
            else setErr("Lỗi khi đăng ký: " + e.message);
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color: "#fff",
                position: "relative",
                fontFamily: "Orbitron, sans-serif",
            }}
        >
            {/* Hiệu ứng nền di chuyển */}
            <div
                style={{
                    position: "absolute",
                    width: "200%",
                    height: "200%",
                    background:
                        "linear-gradient(45deg, rgba(0,255,255,0.2), rgba(255,0,255,0.15))",
                    animation: "moveBg 8s linear infinite",
                    zIndex: 0,
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "30px 40px",
                    background: "rgba(0,0,0,0.65)",
                    border: "2px solid #00ffff",
                    borderRadius: 12,
                    boxShadow: "0 0 20px rgba(0,255,255,0.3)",
                    width: "90%",
                    maxWidth: 360,
                    textAlign: "center",
                }}
            >
                <h1
                    style={{
                        fontSize: "1.8rem",
                        marginBottom: 20,
                        color: "#00ffff",
                        textShadow: "0 0 10px #00ffff, 0 0 20px #00cccc",
                        letterSpacing: "2px",
                    }}
                >
                    FLAPPYBIRD from IC club
                </h1>

                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên (duy nhất)"
                    style={{
                        padding: "10px 14px",
                        fontSize: 16,
                        marginBottom: 10,
                        width: "100%",
                        borderRadius: 6,
                        border: "1px solid #00ffff",
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        outline: "none",
                        textAlign: "center",
                    }}
                />
                <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Nhập lớp (VD: 12A1)"
                    style={{
                        padding: "10px 14px",
                        fontSize: 16,
                        width: "100%",
                        borderRadius: 6,
                        border: "1px solid #00ffff",
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        outline: "none",
                        textAlign: "center",
                    }}
                />

                <button
                    onClick={handleStart}
                    disabled={loading}
                    style={{
                        marginTop: 16,
                        padding: "10px 24px",
                        fontSize: 18,
                        fontWeight: "bold",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: loading
                            ? "linear-gradient(90deg,#555,#444)"
                            : "linear-gradient(90deg,#00ffff,#00ccff)",
                        color: "#000",
                        textShadow: "0 0 4px #fff",
                        transition: "all 0.2s ease",
                        boxShadow: "0 0 10px rgba(0,255,255,0.6)",
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) e.target.style.boxShadow = "0 0 20px #00ffff";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.boxShadow = "0 0 10px rgba(0,255,255,0.6)";
                    }}
                >
                    {loading ? "Đang tạo..." : "🚀 BẮT ĐẦU CHƠI"}
                </button>

                {err && (
                    <p style={{ color: "#ff5555", marginTop: 12, fontWeight: "bold" }}>
                        {err}
                    </p>
                )}

                <p style={{ marginTop: 16, fontSize: 14, color: "#aaa" }}>
                    ⚠️ Tên chỉ được dùng một lần. Nếu trùng, hãy chọn tên khác.
                </p>
            </div>

            {/* CSS động nền */}
            <style>
                {`
        @keyframes moveBg {
          0% { transform: translate(0,0); }
          50% { transform: translate(-25%, -25%); }
          100% { transform: translate(0,0); }
        }
      `}
            </style>
        </div>
    );
}
