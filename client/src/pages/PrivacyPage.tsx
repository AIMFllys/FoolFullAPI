export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <h2>隐私政策</h2>
      <p className="legal-date">最后更新：2026年3月31日</p>

      <h3>1. 信息收集</h3>
      <p>我们仅收集：用户名、密码（加密存储）、对话内容、IP 地址。</p>

      <h3>2. 信息使用</h3>
      <p>仅用于本次活动交互和安全防护。</p>

      <h3>3. 信息存储</h3>
      <p>服务器本地 SQLite 数据库，密码使用 bcrypt 加密。</p>

      <h3>4. 数据删除</h3>
      <p>所有用户数据将在 2026 年 4 月 2 日 00:00 自动永久删除。</p>

      <h3>5. Cookie</h3>
      <p>仅使用 JWT Token 维持登录状态，无追踪或广告 Cookie。</p>

      <h3>6. 第三方服务</h3>
      <p>对话内容发送至七牛云 AI API 生成回复，不用于模型训练。</p>
    </div>
  );
}
