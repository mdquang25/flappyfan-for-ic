import React, { useEffect, useRef, useState } from "react";
import { submitScore } from "../firebase";

const ASSET_BASE = process.env.PUBLIC_URL + "/assets";

// ===============================
// 🔧 CÁC GIÁ TRỊ TÙY CHỈNH
// ===============================

// 👉 Khoảng cách giữa các cặp ống (px)
const PIPE_SPACING = 120;

// 👉 Tốc độ di chuyển ống & nền (px / frame)
const PIPE_SPEED = 2.2;

// 👉 Khoảng trống giữa ống trên & ống dưới (px)
const PIPE_GAP = 140;

// 👉 Độ rơi và lực nhảy
const GRAVITY = 0.45;
const JUMP_POWER = -8;

// ===============================
// 🔧 HÀM HỖ TRỢ TẢI ASSET
// ===============================

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });
}

function loadAudio(src) {
    const a = new Audio(src);
    a.preload = "auto";
    return a;
}

// ===============================
// 🕹️ COMPONENT CHÍNH
// ===============================

export default function FlappyGameSprites({ user }) {
    const canvasRef = useRef(null);
    const assetsRef = useRef({ imgs: {}, aud: {} });
    const rafRef = useRef(null);

    const [ready, setReady] = useState(false);
    const [state, setState] = useState("GET_READY"); // GET_READY, PLAYING, GAMEOVER
    const stateRef = useRef(state);
    const [score, setScore] = useState(0);
    const [loadingText, setLoadingText] = useState("Loading assets...");

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ===============================
    // 📦 TẢI ASSET
    // ===============================
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingText("Đang tải hình ảnh...");
                const imgs = {};
                const base = ASSET_BASE + "/sprites";
                imgs.background = await loadImage(`${base}/background-day.png`);
                imgs.base = await loadImage(`${base}/base.png`);
                imgs.pipe = await loadImage(`${base}/pipe-green.png`);
                imgs.birdUp = await loadImage(`${base}/bluebird-upflap.png`);
                imgs.birdMid = await loadImage(`${base}/bluebird-midflap.png`);
                imgs.birdDown = await loadImage(`${base}/bluebird-downflap.png`);
                imgs.message = await loadImage(`${base}/message.png`);
                imgs.gameover = await loadImage(`${base}/gameover.png`);

                const aud = {};
                const aBase = ASSET_BASE + "/audio";
                aud.wing = loadAudio(`${aBase}/wing.wav`);
                aud.point = loadAudio(`${aBase}/point.wav`);
                aud.hit = loadAudio(`${aBase}/hit.wav`);
                aud.die = loadAudio(`${aBase}/die.wav`);
                aud.swoosh = loadAudio(`${aBase}/swoosh.wav`);

                assetsRef.current = { imgs, aud };
                if (mounted) {
                    setReady(true);
                    setLoadingText("");
                }
            } catch (e) {
                console.error("Asset load error:", e);
                setLoadingText("Tải asset thất bại!");
            }
        })();
        return () => (mounted = false);
    }, []);

    // ===============================
    // 🎮 GAME LOOP CHÍNH
    // ===============================
    useEffect(() => {
        if (!ready) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const DPR = window.devicePixelRatio || 1;
        const W = 400,
            H = 520;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const { imgs, aud } = assetsRef.current;

        // khi tạo bird
        let bird = {
            x: 80,
            y: H / 2,
            displayY: H / 2, // dùng cho hiển thị khi GET_READY
            w: 34,
            h: 24,
            vy: 0,
            frame: 0,
            frameTick: 0
        };
        let pipes = [];
        let baseX = 0;
        let frame = 0;
        let scoreLocal = 0;
        let dead = false;

        const resetGame = () => {
            bird = { x: 80, y: H / 2, displayY: H / 2, w: 34, h: 24, vy: 0, frame: 1, frameTick: 0 };
            pipes = [
                { x: 400 + 120, gapY: 220 },
                { x: 400 + 120 + PIPE_SPACING, gapY: 200 + Math.random() * 150 },
            ];
            frame = 0;
            baseX = 0;
            scoreLocal = 0;
            setScore(0);
            setState("GET_READY");
            stateRef.current = "GET_READY";
            dead = false;
        };

        const spawnPipe = () => {
            const gapY = 120 + Math.random() * 240;
            pipes.push({ x: W + 40, gapY });
        };

        const draw = () => {
            ctx.drawImage(imgs.background, 0, 0, W, H - 80);

            // Vẽ ống
            const pipeW = 52;
            pipes.forEach((p) => {
                const topY = p.gapY - PIPE_GAP / 2;
                const bottomY = p.gapY + PIPE_GAP / 2;

                // Ống trên (lật ngược)
                ctx.save();
                ctx.translate(p.x + pipeW / 2, topY);
                ctx.rotate(Math.PI);
                ctx.drawImage(imgs.pipe, -pipeW / 2, 0, pipeW, imgs.pipe.height);
                ctx.restore();

                // Ống dưới
                const bottomHeight = Math.min(imgs.pipe.height, H - 80 - bottomY);
                ctx.drawImage(
                    imgs.pipe,
                    0,
                    0,
                    pipeW,
                    bottomHeight,
                    p.x,
                    bottomY,
                    pipeW,
                    bottomHeight
                );
            });

            // Mặt đất
            const baseH = 80;
            const bImg = imgs.base;
            const repeat = Math.ceil(W / bImg.width) + 1;
            for (let i = -1; i < repeat; i++) {
                ctx.drawImage(
                    bImg,
                    i * bImg.width + (baseX % bImg.width),
                    H - baseH,
                    bImg.width,
                    baseH
                );
            }

            // Bird
            let birdImg = imgs.birdMid;
            if (bird.frame === 0) birdImg = imgs.birdUp;
            else if (bird.frame === 2) birdImg = imgs.birdDown;
            ctx.save();
            const rot = Math.max(-0.6, Math.min(0.8, bird.vy * 0.06));
            ctx.translate(bird.x, bird.y);
            ctx.rotate(rot);
            ctx.drawImage(birdImg, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
            ctx.restore();

            // Score
            ctx.fillStyle = "#fff";
            ctx.font = "36px Arial";
            ctx.textAlign = "center";
            ctx.fillText(scoreLocal, W / 2, 60);

            const current = stateRef.current;
            if (current === "GET_READY") {
                ctx.drawImage(imgs.message, (W - imgs.message.width) / 2, 140);
            } else if (current === "GAMEOVER") {
                ctx.drawImage(imgs.gameover, (W - imgs.gameover.width) / 2, 140);
            }
        };

        const update = (delta = 1) => {
            const current = stateRef.current;

            if (current === "PLAYING") {
                // Thay đổi có delta
                bird.vy += GRAVITY * delta;
                bird.y += bird.vy * delta;
                bird.frameTick++;
                if (bird.frameTick % 6 === 0) bird.frame = (bird.frame + 1) % 3;

                pipes.forEach((p) => (p.x -= PIPE_SPEED * delta));

                if (pipes.length > 0) {
                    const last = pipes[pipes.length - 1];
                    if (W - (last.x + 52) >= PIPE_SPACING) spawnPipe();
                }
                if (pipes.length && pipes[0].x + 52 < 0) pipes.shift();

                for (let p of pipes) {
                    if (!p.scored && p.x + 52 < bird.x) {
                        p.scored = true;
                        scoreLocal++;
                        setScore(scoreLocal);
                        aud.point?.play?.();
                    }
                }

                baseX -= PIPE_SPEED * delta;

                if (bird.y + bird.h / 2 >= H - 80) die();

                for (let p of pipes) {
                    if (
                        bird.x + bird.w / 2 > p.x &&
                        bird.x - bird.w / 2 < p.x + 52 &&
                        (bird.y - bird.h / 2 < p.gapY - PIPE_GAP / 2 ||
                            bird.y + bird.h / 2 > p.gapY + PIPE_GAP / 2)
                    ) {
                        die();
                    }
                }
            } else if (current === "GET_READY") {
                bird.frameTick++;
                // chỉ cập nhật displayY để hiển thị; không đụng bird.y vật lý
                bird.displayY = H / 2 + Math.sin(bird.frameTick / 15) * 5;
                if (bird.frameTick % 12 === 0) bird.frame = (bird.frame + 1) % 3;
            }

        };


        const die = async () => {
            if (dead) return;
            dead = true;
            stateRef.current = "GAMEOVER";
            setState("GAMEOVER");
            aud.hit?.play();
            aud.die?.play();
            cancelAnimationFrame(rafRef.current);
            try {
                if (user?.uid) await submitScore(user.uid, scoreLocal);
            } catch (e) {
                console.warn("Không thể lưu điểm:", e);
            }
        };

        const jump = () => {
            const current = stateRef.current;
            if (current === "GET_READY") {
                // Bắt đầu + nhảy ngay: copy displayY -> bird.y, sau đó set vy
                stateRef.current = "PLAYING";
                setState("PLAYING");
                assetsRef.current.aud.swoosh?.play();

                // set bird.y từ displayY để vật lý bắt đầu đúng vị trí hiển thị
                bird.y = bird.displayY ?? (H / 2);
                bird.vy = JUMP_POWER;
                aud.wing?.play();
            } else if (current === "PLAYING") {
                bird.vy = JUMP_POWER;
                aud.wing?.play();
            }
        };



        let lastTime = 0;

        const loop = (time) => {
            if (!lastTime) lastTime = time;
            const delta = (time - lastTime) / (1000 / 60); // chuẩn hoá theo 60fps
            lastTime = time;

            update(delta);
            draw();
            rafRef.current = requestAnimationFrame(loop);
        };

        // Setup game
        resetGame();
        rafRef.current = requestAnimationFrame(loop);
        loop();

        // Controls
        const handleKey = (e) => {
            if (e.code === "Space" || e.key === " ") {
                e.preventDefault();
                const current = stateRef.current;
                if (current === "GAMEOVER") {
                    handleRestart();
                } else {
                    jump();
                }
            }
        };
        canvas.addEventListener("click", jump);
        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            jump();
        });
        window.addEventListener("keydown", handleKey);

        return () => {
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener("click", jump);
            window.removeEventListener("keydown", handleKey);
        };
    }, [ready, user]);

    // ===============================
    // 🔁 RESTART
    // ===============================
    const handleRestart = () => {
        setState("GET_READY");
        stateRef.current = "GET_READY";
        setScore(0);
        setReady(false);
        setTimeout(() => setReady(true), 30);
    };

    // ===============================
    // 🧩 RENDER UI
    // ===============================
    return (
        <div style={{ textAlign: "center", userSelect: "none" }}>
            <h3>🐦 FlappyBird from IC — {user?.username || "Khách"}</h3>
            {!ready ? (
                <div style={{ padding: 40 }}>
                    <p>{loadingText}</p>
                </div>
            ) : (
                <>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <canvas
                            ref={canvasRef}
                            style={{ border: "1px solid #333", borderRadius: 6 }}
                        />
                        {state === "GAMEOVER" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    background: "rgba(0,0,0,0.5)",
                                    color: "white",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 6,
                                }}
                            >
                                <h2>💀 Game Over</h2>
                                <p>
                                    Điểm của bạn: <b>{score}</b>
                                </p>
                                <button
                                    onClick={handleRestart}
                                    style={{
                                        background: "#ffcb05",
                                        border: "none",
                                        padding: "10px 20px",
                                        borderRadius: 6,
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                    }}
                                >
                                    🔄 Chơi lại
                                </button>
                            </div>
                        )}
                    </div>
                    {state === "GET_READY" && (
                        <p style={{ color: "#666" }}>Nhấn Space / Click / Tap để bắt đầu</p>
                    )}
                    {state === "PLAYING" && <p>Điểm: {score}</p>}
                </>
            )}
        </div>
    );
}
