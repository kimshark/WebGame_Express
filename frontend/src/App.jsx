import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  // 랭킹 불러오기 함수
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("랭킹 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // 관리자용 초기화 함수
  const handleReset = async () => {
    const password = prompt("관리자 비밀번호를 입력하세요:");
    if (!password) return;

    try {
      const response = await fetch('/api/leaderboard/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchLeaderboard();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("초기화 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="app-container">
      {/* 🚀 상단 헤더 영역 */}
      <header className="app-header">
        <h1 className="app-logo">EXPRESS GAME</h1>
        <span className="btn btn-secondary" style={{ cursor: 'default', fontSize: '0.8rem' }}>
          🟢 SERVER LIVE
        </span>
      </header>

      {/* 🎮 메인 콘텐츠 반응형 그리드 */}
      <main className="main-content">
        
        {/* 왼쪽 섹션: 유니티 웹뷰 포트 */}
        <section className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">🎮 PLAY ZONE</h2>
          </div>
          <div className="game-wrapper">
            {/* 💡 유니티 게임 파일들이 위치한 /game/index.html 주소로 정확히 지정했습니다. */}
            <iframe 
              src="/game/index.html"  // 👈 기존 '/game/index.html'에서 'MyGameBuild'로 변경!
              title="Unity Game" 
              className="game-canvas"
              allow="autoplay; fullscreen"
              scrolling="no" /* 👈 웹브라우저에게 스크롤바를 절대 만들지 말라고 쐐기를 박는 속성 */
            />
          </div>
        </section>

        {/* 오른쪽 섹션: 실시간 리더보드 */}
        <section className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">🏆 LEADERBOARD</h2>
            <div className="btn-group">
              <button onClick={fetchLeaderboard} className="btn btn-primary" disabled={loading}>
                {loading ? "로딩..." : "🔄 갱신"}
              </button>
              <button onClick={handleReset} className="btn btn-secondary">
                🗑️ 초기화
              </button>
            </div>
          </div>

          <div className="table-container">
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <p>아직 등록된 기록이 없습니다.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>첫 번째 랭커가 되어보세요!</p>
              </div>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>순위</th>
                    <th>플레이어 ID</th>
                    <th style={{ textAlign: 'right' }}>점수 (PTS)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => {
                    const rank = index + 1;
                    let rankClass = "";
                    if (rank === 1) rankClass = "rank-1";
                    else if (rank === 2) rankClass = "rank-2";
                    else if (rank === 3) rankClass = "rank-3";

                    return (
                      <tr key={index}>
                        <td className={rankClass}>{rank}</td>
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