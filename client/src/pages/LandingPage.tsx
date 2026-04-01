import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Ambient glass background glows for Apple-like depth */}
      <div className="ambient-background">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
      </div>

      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          全新发布 — 免费开放体验
        </div>
        <h1>
          FoolFullAPI<br/>
          <span>极致推理，为你而来。</span>
        </h1>
        <p className="hero-subtitle">
          无限次免费特定 API 统一调用。在此感受毫秒级响应、超强多步推理与百万级上下文记忆的深度融合。
        </p>
        <div className="hero-actions">
          <Link to="/auth" className="btn-primary">立即免费体验</Link>
          <a href="#features" className="btn-secondary">了解更多功能</a>
        </div>
      </section>

      <section id="features" className="features">
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3>超强推理引擎</h3>
          <p>突破以往模型瓶颈，执行多步推理、逻辑拆解与复杂分析。你的难题，一步到位解决。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <h3>百万级上下文</h3>
          <p>海量信息同步注入，无论长文档、厚代码还是大型数据集，均能轻松理解，不错失任何细节。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3>丝滑极速响应</h3>
          <p>基于顶级云端算力调度架构，提供行云流水般的交互。毫秒级推流，思维不再卡顿。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <h3>无缝 API 接入</h3>
          <p>遵循业界标准的接口规范，只需修改域名与密钥，即可将极致能力赋予你的每一款应用。</p>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-links">
          <Link to="/terms">服务条款</Link>
          <Link to="/privacy">隐私政策</Link>
        </div>
        <p>© 2026 FoolFullAPI. 改变认知，拥抱无限可能。</p>
      </footer>
    </div>
  );
}
