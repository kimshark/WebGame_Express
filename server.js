const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
const PORT = 5000;

// 🔒 관리자용 비밀번호 설정
const ADMIN_PASSWORD = "admin1234";

// 📦 기본 미들웨어 세팅
app.use(cors());
app.use(express.json());
// 📡 [CSI 탐지기] 서버로 들어오는 모든 전화를 터미널에 실시간으로 중계합니다!
app.use((req, res, next) => {
  console.log(`📡 [요청 감지] 메서드: ${req.method} | 주소: ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

let db;

// 💾 데이터베이스 파일 연결 및 테이블 초기화
async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      score INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("💾 [DB 성공] SQLite 데이터베이스 파일이 안전하게 연결되었습니다.");
}

initializeDatabase().catch(err => {
  console.error("❌ DB 초기화 실패:", err);
});

// 📭 1. 연결 테스트용 API 주소
app.get('/api/hello', (req, res) => {
  res.json({ message: "연결 성공!" });
});

// 🏆 2. 리액트에게 최신 랭킹 목록 보내주기
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topScores = await db.all(
      'SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 5'
    );
    res.json(topScores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎰 3. 유저의 진짜 이름과 점수를 DB 금고에 영구 기록하기
app.post('/api/leaderboard', async (req, res) => {
  const { name, score } = req.body;
  const userName = name || 'Guest';

  try {
    await db.run(
      'INSERT INTO leaderboard (name, score) VALUES (?, ?)',
      [userName, Number(score)]
    );
    console.log(`🎰 [DB 저장 완료] ID: ${userName}, 점수: ${score}점`);
    res.json({ success: true, message: "DB에 점수가 안전하게 기록되었습니다!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑 {추가됨} 4. 비밀번호 인증 후 DB 내역 완전히 지우기
app.post('/api/leaderboard/reset', async (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "비밀번호가 일치하지 않습니다!" });
  }

  try {
    await db.run('DELETE FROM leaderboard');
    console.log("🗑️ [DB 초기화 완료] 관리자 인증에 의해 모든 랭킹 기록이 완전히 삭제되었습니다.");
    res.json({ success: true, message: "모든 랭킹 기록이 완벽하게 초기화되었습니다!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 ★ 초중요: 리액트 화면 전달 미들웨어는 반드시 모든 API(/api/...)들보다 맨 아래에 있어야 합니다!
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// 🖥️ 서버 시동
app.listen(PORT, () => {
  console.log(`🚀 백엔드 매니저가 ${PORT}번 포트에서 출근 완료했습니다!`);
});