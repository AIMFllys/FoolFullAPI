import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="hero">
        <h1>Claude Opos4 母4.6</h1>
        <p className="hero-subtitle">地表最强对话式 AI — 超越一切已知模型，为你而来</p>
        <Link to="/auth" className="btn-primary">立即免费体验</Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>超强推理能力</h3>
          <p>多步推理、逻辑分析、复杂问题一步到位</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>百万级上下文</h3>
          <p>支持超长文本输入，完整理解你的需求</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>极速响应</h3>
          <p>毫秒级推理速度，流畅无等待</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔗</div>
          <h3>API 接入</h3>
          <p>一行代码接入你的 IDE 或应用</p>
        </div>
      </section>

      <footer className="footer">
        <Link to="/terms">服务条款</Link>
        <span>·</span>
        <Link to="/privacy">隐私政策</Link>
        <span>·</span>
        <span>© 2026 Claude Opos4</span>
      </footer>
    </div>
  );
}
