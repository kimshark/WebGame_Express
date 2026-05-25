const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 5000;

// 2. 미들웨어 설정 (JSON 및 유니티 WWWForm 모두 해석 가능)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. SQLite 데이터베이스 연결
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite DB 연결 실패:', err.message);
  } else {
    console.log('📦 database.sqlite 연결 성공!');
    db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL
    )`);
  }
});

// 4. API 라우트 영역
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 🚀 [CSI 과학수사 존] 점수 등록 API 블랙박스 보강
app.post('/api/leaderboard', (req, res) => {
  console.log('--------------------------------------------------');
  console.log('📥 [🚨 알림] 유니티로부터 점수 등록 요청이 들어왔습니다!');
  console.log('📦 서버가 수신한 원래 데이터(req.body):', req.body);
  console.log('--------------------------------------------------');

  const { name, score } = req.body;
  
  // 데이터 검증 실패 시 로그 상세 출력
  if (!name || score === undefined) {
    console.log('❌ [유효성 검사 실패] name 또는 score 누락됨!');
    console.log(`-> name 상태: ${name}, score 상태: ${score}`);
    return res.status(400).json({ 
      success: false, 
      message: '이름과 점수가 누락되었습니다.',
      received: req.body 
    });
  }

  db.run('INSERT INTO leaderboard (name, score) VALUES (?, ?)', [name, score], function(err) {
    if (err) {
      console.log('❌ [DB 저장 에러]:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log(`🏆 [DB 저장 성공] 이름: ${name} | 점수: ${score} (ID: ${this.lastID})`);
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/leaderboard/reset', (req, res) => {
  const { password } = req.body;
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

// 6. 무한 루프 방지용 가드 문법
app.get(/^\/.*$/, (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send(`🚫 파일 실종 상태: ${req.path}`);
  }
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// 7. 서버 기동
app.listen(PORT, () => {
  console.log('🚀 백엔드 매니저가 출근 완료했습니다!');
});