import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SelectPage() {
  const { user } = useAuth();

  return (
    <div className="select-page">
      <h2>欢迎回来，{user?.username}！</h2>
      <p className="usage-info">剩余交互次数：{Math.max(0, 18 - (user?.askCount || 0))} / 18</p>

      {user?.isBanned ? (
        <div className="banned-notice">您的体验次数已用完，感谢参与！</div>
      ) : (
        <div className="select-cards">
          <Link to="/chat" className="select-card">
            <div className="card-icon">💬</div>
            <h3>在线对话</h3>
            <p>直接在浏览器中与 AI 对话</p>
          </Link>
          <Link to="/api-docs" className="select-card">
            <div className="card-icon">🔌</div>
            <h3>API 接入</h3>
            <p>获取 API Key，接入你的 IDE 或应用</p>
          </Link>
        </div>
      )}
    </div>
  );
}
