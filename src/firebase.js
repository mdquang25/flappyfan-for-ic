// src/firebase.js
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    runTransaction,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";

// --- CẤU HÌNH DỰ ÁN CỦA BẠN ---
const firebaseConfig = {
    apiKey: "AIzaSyCVs2Zs5X0Q9WZgFdZTNrpnJYdqGJmrF-M",
    authDomain: "flappybird-for-ic.firebaseapp.com",
    projectId: "flappybird-for-ic",
    storageBucket: "flappybird-for-ic.firebasestorage.app",
    messagingSenderId: "258814265837",
    appId: "1:258814265837:web:87df80eb5b6938e0e8bfe4",
    measurementId: "G-DE0RGS4658"
};

// --- KHỞI TẠO ỨNG DỤNG FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HÀM TIỆN ÍCH ---

// Đăng nhập ẩn danh
export async function signInAnon() {
    const result = await signInAnonymously(auth);
    return result.user;
}

// Đăng ký username duy nhất (transaction tránh trùng tên)
// src/firebase.js
export async function registerUsername(uid, username, className) {
    const usernameRef = doc(db, "usernames", username);
    const playerRef = doc(db, "players", uid);

    try {
        await runTransaction(db, async (t) => {
            const uSnap = await t.get(usernameRef);
            if (uSnap.exists()) {
                throw new Error("USERNAME_TAKEN");
            }
            t.set(usernameRef, { uid, createdAt: Date.now() });
            t.set(playerRef, {
                uid,
                username,
                className, // 👈 thêm lớp
                bestScore: 0,
                createdAt: Date.now(),
            });
        });
        return true;
    } catch (err) {
        if (err.message === "USERNAME_TAKEN") throw err;
        throw err;
    }
}

// Cập nhật điểm cao nếu cao hơn
export async function submitScore(uid, newScore) {
    const playerRef = doc(db, "players", uid);
    const snap = await getDoc(playerRef);
    if (!snap.exists()) return;
    const old = snap.data().bestScore || 0;
    if (newScore > old) {
        await updateDoc(playerRef, { bestScore: newScore, lastPlayed: Date.now() });
        return true;
    }
    return false;
}

// Lắng nghe bảng xếp hạng realtime
export function listenTopPlayers(callback, topN = 10) {
    const q = query(collection(db, "players"), orderBy("bestScore", "desc"), limit(topN));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => d.data());
        callback(data);
    });
}

// Lắng nghe trạng thái đăng nhập
export function onAuth(cb) {
    return onAuthStateChanged(auth, cb);
}

// --- EXPORT FIREBASE INSTANCE (để dùng nơi khác) ---
export { auth, db };
