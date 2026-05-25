import React, { useState, useEffect, useCallback } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

function App() {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/MyGameBuild/Build/MyGameBuild.loader.js",
    dataUrl: "/MyGameBuild/Build/MyGameBuild.data",
    frameworkUrl: "/MyGameBuild/Build/MyGameBuild.framework.js",
    codeUrl: "/MyGameBuild/Build/MyGameBuild.wasm",
  });

  const fetchLeaderboard = () => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((err) => console.error("랭킹 로드 실패:", err));
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleGameEnd = useCallback((name, finalScore) => {
    setScore(finalScore);
    setIsGameOver(true);

    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, score: finalScore }),
    })
    .then((res) => res.json())
    .then(() => {
      fetchLeaderboard(); 
    })
    .catch((err) => console.error("전송 실패:", err));
  }, []);

  useEffect(() => {
    window.SendScoreToReact = (name, finalScore) => { handleGameEnd(name, finalScore); };
    return () => { delete window.SendScoreToReact; };
  }, [handleGameEnd]);

  // 🗑️ [추가] 초기화 버튼 클릭 시 비밀번호 체크 및 서버 전송 함수
  const handleResetLeaderboard = () => {
    const password = prompt("🚨 랭킹 기록을 초기화하려면 관리자 비밀번호를 입력하세요:");
    
    // 취소를 누르거나 빈값인 경우 중단
    if (password === null || password.trim() === "") return;

    fetch("/api/leaderboard/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert(`✅ 성공: ${data.message}`);
        fetchLeaderboard(); // 비워진 진짜 최신 랭킹판을 다시 새로고침
      } else {
        alert(`❌ 실패: ${data.message}`);
      }
    })
    .catch((err) => {
      console.error("초기화 요청 실패:", err);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    });
  };

  return (
    <div style={{
      backgroundColor: "#050507",
      color: "#f3f4f6",
      fontFamily: "'Inter', sans-serif",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* 🌐 1. 상단 내비게이션 바 */}
      <header style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 40px",
        backgroundColor: "#0b0c10",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", color: "#00ffcc" }}>🎮</span>
          <span style={{
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "1px",
            color: "#fff"
          }}>
            EXPRESS<span style={{ color: "#00ffcc" }}>GAME</span>
          </span>
        </div>
      </header>

      {/* 🌌 메인 대시보드 콘텐츠 영역 */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        gap: "35px"
      }}>

        {/* 📺 2. 유니티 게임 스크린 */}
        <div style={{
          width: "800px",
          height: "450px",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: "0 0 35px rgba(0, 255, 204, 0.25), 0 20px 40px rgba(0,0,0,0.5)",
          border: "2px solid #00ffcc",
          position: "relative"
        }}>
          {!isLoaded && (
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "#0b0c10", display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center", zIndex: 5
            }}>
              <span style={{ fontSize: "28px", marginBottom: "10px" }}>🕹️</span>
              <div style={{ fontSize: "15px", color: "#00ffcc", fontWeight: "600", marginBottom: "12px", letterSpacing: "2px" }}>
                GAME LOADING
              </div>
              <div style={{ fontSize: "11px", color: "#4b5563", marginBottom: "20px" }}>Unity WebGL Canvas</div>
              <div style={{ width: "200px", height: "3px", backgroundColor: "#1f2937", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${loadingProgression * 100}%`, height: "100%", backgroundColor: "#00ffcc", transition: "width 0.2s" }} />
              </div>
            </div>
          )}
          <Unity unityProvider={unityProvider} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* 🏆 3. 하단 통합 리더보드 패널 */}
        <div style={{
          width: "800px",
          backgroundColor: "#0b0c10",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.03)",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#a855f7" }}>🏆</span> LEADERBOARD
              </h2>
              <p style={{ fontSize: "12px", color: "#4b5563", margin: "4px 0 0 0" }}>Top 5 Players</p>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={fetchLeaderboard}
                style={{
                  backgroundColor: "rgba(0, 255, 204, 0.1)",
                  border: "1px solid #00ffcc",
                  color: "#00ffcc",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}>
                🔄 로딩
              </button>
              {/* 🔥 초기화 버튼에 함수를 바인딩하여 작동시킵니다. */}
              <button 
                onClick={handleResetLeaderboard}
                style={{
                  backgroundColor: "rgba(236, 72, 153, 0.1)",
                  border: "1px solid #ec4899",
                  color: "#ec4899",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}>
                🗑️ 초기화
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f2937", color: "#4b5563", textAlign: "left" }}>
                <th style={{ padding: "10px", width: "80px" }}>#</th>
                <th style={{ padding: "10px" }}>PLAYER ID</th>
                <th style={{ padding: "10px", textAlign: "right" }}>SCORE (PTS)</th>
                <th style={{ padding: "10px", textAlign: "right", width: "100px" }}>RANK</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={index} style={{ 
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  backgroundColor: index === 0 ? "rgba(0, 255, 204, 0.02)" : "transparent"
                }}>
                  <td style={{ padding: "14px 10px", color: "#4b5563", fontWeight: "bold" }}>{index + 1}</td>
                  <td style={{ padding: "14px 10px", fontWeight: "600", color: "#e5e7eb" }}>{user.name}</td>
                  <td style={{ padding: "14px 10px", textAlign: "right", color: "#00ffcc", fontWeight: "bold" }}>{user.score}</td>
                  <td style={{ padding: "14px 10px", textAlign: "right" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: index === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
                      color: index === 0 ? "#ffd700" : "#9ca3af",
                      border: index === 0 ? "1px solid #ffd700" : "1px solid #333"
                    }}>
                      {index + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leaderboard.length === 0 && (
            <div style={{ textAlign: "center", color: "#4b5563", padding: "30px 0" }}>
              데이터가 없습니다. 게임을 완료하여 랭킹을 등록하세요!
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;