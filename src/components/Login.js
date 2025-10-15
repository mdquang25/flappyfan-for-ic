// src/components/Login.js
import React, { useState } from "react";
import { signInAnon, registerUsername } from "../firebase";

export default function Login({ onLoggedIn }) {
    const [username, setUsername] = useState("");
    const [className, setClassName] = useState(""); // 👈 thêm state lớp
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
            await registerUsername(user.uid, name, cls); // 👈 truyền thêm lớp
            onLoggedIn({ uid: user.uid, username: name, className: cls });
        } catch (e) {
            if (e.message === "USERNAME_TAKEN")
                setErr("Tên đã có người dùng, hãy chọn tên khác.");
            else setErr("Lỗi khi đăng ký: " + e.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: "center", padding: 20 }}>
            <h2>🔐 Đăng nhập / Tạo tên chơi</h2>
            <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Chọn tên (unique)"
                style={{ padding: 8, fontSize: 16, marginBottom: 8 }}
            />
            <br />
            <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Nhập lớp (VD: 12A1)"
                style={{ padding: 8, fontSize: 16 }}
            />
            <div style={{ marginTop: 12 }}>
                <button
                    onClick={handleStart}
                    disabled={loading}
                    style={{ padding: "8px 16px", fontSize: 16 }}
                >
                    {loading ? "Đang tạo..." : "Bắt đầu chơi"}
                </button>
            </div>
            {err && <p style={{ color: "red" }}>{err}</p>}
            <p style={{ marginTop: 8, color: "#555" }}>
                Lưu ý: tên chỉ được sử dụng 1 lần, nếu trùng bạn phải chọn tên khác.
            </p>
        </div>
    );
}
