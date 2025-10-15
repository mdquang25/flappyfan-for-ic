import React, { useEffect, useState } from "react";
import { listenTopPlayers } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function Leaderboard({ currentUser }) {
    const [leaders, setLeaders] = useState([]);
    const [userRank, setUserRank] = useState(null);

    // Lắng nghe bảng xếp hạng realtime
    useEffect(() => {
        const unsub = listenTopPlayers((data) => {
            data.sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
            setLeaders(data);
        }, 200);
        return () => unsub();
    }, []);

    // Tính vị trí của người chơi hiện tại
    useEffect(() => {
        if (!currentUser) return;
        const idx = leaders.findIndex((p) => p.uid === currentUser.uid);
        if (idx >= 0) {
            setUserRank({
                rank: idx + 1,
                username: leaders[idx].username,
                bestScore: leaders[idx].bestScore || 0,
            });
        } else {
            setUserRank({
                rank: ">200",
                username: currentUser.username,
                bestScore: 0,
            });
        }
    }, [leaders, currentUser]);

    // Trả về icon cho top 3
    const crownIcon = (rank) => {
        switch (rank) {
            case 1:
                return <span style={{ fontSize: 20 }}>👑</span>;
            case 2:
                return <span style={{ fontSize: 18 }}>🥈</span>;
            case 3:
                return <span style={{ fontSize: 18 }}>🥉</span>;
            default:
                return null;
        }
    };

    return (
        <div
            style={{
                maxWidth: 400,
                margin: "20px auto",
                background: "linear-gradient(180deg,#1e1e1e,#0d0d0d)",
                padding: 16,
                borderRadius: 12,
                color: "#fff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                fontFamily: "sans-serif",
            }}
        >
            <h3
                style={{
                    textAlign: "center",
                    marginBottom: 12,
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    color: "#ffcb05",
                    letterSpacing: "1px",
                }}
            >
                🏆 BẢNG XẾP HẠNG
            </h3>

            {/* Danh sách có thể cuộn */}
            <div
                style={{
                    maxHeight: 480,
                    overflowY: "auto",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#555 transparent",
                    paddingRight: 4,
                }}
            >
                <AnimatePresence>
                    // src/components/Leaderboard.js (phần hiển thị map)
                    {leaders.map((p, i) => (
                        <motion.div
                            key={p.uid}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                margin: "6px 0",
                                borderRadius: 8,
                                background:
                                    i === 0
                                        ? "linear-gradient(90deg,#ffd700,#ffcb05)"
                                        : i === 1
                                            ? "linear-gradient(90deg,#c0c0c0,#bbb)"
                                            : i === 2
                                                ? "linear-gradient(90deg,#cd7f32,#a85)"
                                                : "rgba(255,255,255,0.1)",
                                color: i <= 2 ? "#000" : "#fff",
                                fontWeight: i <= 2 ? "bold" : "normal",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                <span style={{ width: 26, textAlign: "center", fontWeight: "bold" }}>
                                    {i + 1}
                                </span>
                                {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""}
                                <span
                                    style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 200,
                                    }}
                                >
                                    {p.username}
                                </span>
                                <span
                                    style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 200,

                                        color: "#ffcb05",
                                        fontSize: "0.85em",
                                        marginLeft: 6,
                                        marginRight: 6,
                                    }}
                                >
                                    ({p.className || "?"})
                                </span>
                            </div>
                            <span>{p.bestScore || 0}</span>
                        </motion.div>
                    ))}

                </AnimatePresence>
            </div>

            {/* Hiển thị người chơi hiện tại cố định phía dưới */}
            {userRank && (
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background:
                            "linear-gradient(90deg,rgba(255,203,5,0.15),rgba(255,203,5,0.05))",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #ffcb05",
                        position: "sticky",
                        bottom: 0,
                        color: "#ffcb05",
                        fontWeight: "bold",
                        boxShadow: "0 0 10px rgba(255,203,5,0.3)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 32, textAlign: "center" }}>
                            {userRank.rank}
                        </span>
                        <span>{userRank.username}</span>
                    </div>
                    <span>{userRank.bestScore}</span>
                </motion.div>
            )}
        </div>
    );
}
