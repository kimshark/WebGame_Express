import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobileFS, setIsMobileFS] = useState(false);
  // ⌨️ 모바일 키보드 해결을 위한 리액트 이름 상태 (기본값: 모바일랭커)
  const [reactPlayerName, setReactPlayerName] = useState('모바일랭커');
  
  // 유니티 전역 함수가 리액트의 최신 이름 상태를 실시간으로 참조할 수 있도록 Ref 사용
  const nameRef = useRef(reactPlayerName);

  useEffect(() => {
    nameRef.current = reactPlayerName;
  }, [reactPlayerName]);

  // 1. 실시간 랭킹 가져오기
  const fetchLeaderboard = () => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((err) => console.error('❌ 랭킹 로딩 실패:', err));
  };

  // 2. 관리자용 리더보드 초기화
  const handleReset = () => {
    const password = prompt('🔑 초기화 비밀번호를 입력하세요:');
    if (!password) return;

    fetch('/api/leaderboard/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        fetchLeaderboard();
      })
      .catch((err) => console.error('❌ 초기화 실패:', err));
  };

  useEffect(() => {
    fetchLeaderboard();

    // 🚀 [★핵심 패치] 유니티가 점수를 보낼 때, 리액트 입력창의 이름을 가로채서 서버로 전송
    window.SendScoreToReact = function (param1, param2) {
      let finalName = nameRef.current || '무명랭커';
      let finalScore = 0;

      // 인자 값 판별 (유니티 빌드 구조에 맞춤)
      if (param2 !== undefined) {
        finalScore = Number(param2);
      } else {
        finalScore = Number(param1);
      }

      console.log(`📡 [모바일 패치 가동] 이름: ${finalName} | 점수: ${finalScore} -> 서버 전송 시작`);

      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, score: finalScore })
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('✅ 랭킹 등록 성공:', data);
          fetchLeaderboard(); // 등록 후 리더보드 즉시 새로고침
        })
        .catch((err) => console.error('❌ 랭킹 전송 실패:', err));
    };
  }, []);

  return (
    <div className="app-container">
      {/* 상단 헤더 */}
      <header className="app-header">
        <h1 className="app-logo">EXPRESS GAME</h1>
        <div className="server-status">
          <span className="status-dot"></span>SERVER LIVE
        </div>
      </header>

      {/* 메인 콘텐츠 (위아래 세로 직렬 배치) */}
      <main className="main-content">
        
        {/* 🎮 1층: 플레이 존 판넬 */}
        <section className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">🎮 PLAY ZONE</h2>
            <div className="controls-group">
              
              {/* ⌨️ 모바일 전용 이름 입력창 (터치 시 키보드가 무조건 정상 작동합니다) */}
              <div className="react-input-box">
                <label>📝 랭킹 등록 이름 :</label>
                <input 
                  type="text" 
                  value={reactPlayerName}
                  onChange={(e) => setReactPlayerName(e.target.value)}
                  maxLength={10}
                  placeholder="이름 입력"
                />
              </div>

              {/* 📱 모바일 화면 전환 버튼 */}
              <button 
                className="btn btn-primary mobile-fs-btn"
                onClick={() => setIsMobileFS(!isMobileFS)}
              >
                {isMobileFS ? "✕ 화면 축소" : "📱 모바일 전체화면"}
              </button>
            </div>
          </div>

          {/* 유니티 게임 배치 상자 */}
          <div className={`game-wrapper ${isMobileFS ? 'mobile-fullscreen' : ''}`}>
            <iframe 
              src="/game/index.html" 
              title="Unity Game" 
              className="game-canvas"
              allow="autoplay; fullscreen"
              scrolling="no"
            />
          </div>
        </section>

        {/* 🏆 2층: 리더보드 판넬 (가로로 꽉 차게 확장) */}
        <section className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">🏆 LEADERBOARD</h2>
            <div className="btn-group">
              <button className="btn btn-primary" onClick={fetchLeaderboard}>🔄 갱신</button>
              <button className="btn btn-secondary" onClick={handleReset}>🗑️ 초기화</button>
            </div>
          </div>

          <div className="table-container">
            {leaderboard.length === 0 ? (
              <p className="empty-state">아직 등록된 기록이 없습니다.<br />첫 번째 랭커가 되어보세요!</p>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>순위</th>
                    <th>플레이어 ID</th>
                    <th style={{ textAlign: 'right' }}>점수 (PTS)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => {
                    const rank = index + 1;
                    let rankClass = '';
                    if (rank === 1) rankClass = 'rank-1';
                    else if (rank === 2) rankClass = 'rank-2';
                    else if (rank === 3) rankClass = 'rank-3';

                    return (
                      <tr key={index}>
                        <td className={rankClass}>{rank}위</td>
                        <td style={{ fontWeight: '500' }}>{player.name}</td>
                        <td className="score-text">{player.score.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;