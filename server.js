const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Express 앱 초기화 (가장 먼저 실행되어야 에러가 안 납니다!)
const app = express();
const PORT = process.env.PORT || 5000;

// 2. 미들웨어 설정 (프론트엔드에서 보내는 JSON 데이터 해석)
app.use(express.json());

// 3. SQLite 데이터베이스 연결 및 테이블 자동 생성
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite DB 연결 실패:', err.message);
  } else {
    console.log('📦 database.sqlite 연결 성공!');
    // 테이블이 없다면 최고 점수 순으로 정렬할 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL
    )`);
  }
});

// 4. API 라우트 영역 (반드시 정적 파일 서빙보다 위에 있어야 합니다)

// [GET] 실시간 랭킹 Top 10 가져오기
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// [POST] 유니티 게임 종료 시 점수 등록하기
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ success: false, message: '이름과 점수가 누락되었습니다.' });
  }

  db.run('INSERT INTO leaderboard (name, score) VALUES (?, ?)', [name, score], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// [POST] 관리자용 리더보드 초기화 (비밀번호 검증)
app.post('/api/leaderboard/reset', (req, res) => {
  const { password } = req.body;
  
  // 💡 원하시는 비밀번호로 자유롭게 변경하세요!
  if (password === 'admin1234') { 
    db.run('DELETE FROM leaderboard', [], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: '초기화 중 오류 발생' });
      }
      res.json({ success: true, message: '🏆 리더보드가 깔끔하게 초기화되었습니다!' });
    });
  } else {
    res.status(401).json({ success: false, message: '❌ 비밀번호가 올바르지 않습니다.' });
  }
});

// 5. 리액트 빌드 파일(dist) 정적 서빙 설정
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// 6. [Catch-All] 주소가 일치하지 않는 모든 요청은 리액트 화면으로 토스
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// 7. 서버 기동
app.listen(PORT, () => {
  console.log(`🚀 백엔드 매니저가 ${PORT}번 포트에서 출근 완료했습니다!`);
});