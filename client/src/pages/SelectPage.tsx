import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SelectPage() {
  const { user } = useAuth();
  const remaining = Math.max(0, 18 - (user?.askCount || 0));

  return (
    <div className="select-page">
      <div className="ambient-background">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
      </div>

      <h2>欢迎，{user?.username}</h2>
      <p className="usage-info">
        剩余交互额度：<strong>{remaining}</strong> / 18
      </p>

      {user?.isBanned ? (
        <div className="banned-notice">您的体验次数已用尽。感谢参与内测，期待未来再会。</div >
      ) : (
        <div className="select-cards">
          <Link to="/chat" className="select-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>在线对话</h3>
            <p>基于顶级云端算力的网页直连，零感延迟、极高上下文的沉浸式对话体验。</p>
          </Link>
          <Link to="/api-docs" className="select-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3>无感 API 接入</h3>
            <p>获取极简调用的 API Key，与现有架构完美契合，将极致推理能力赋予你的所有应用。</p>
          </Link>
        </div>
      )}
    </div>
  );
}
