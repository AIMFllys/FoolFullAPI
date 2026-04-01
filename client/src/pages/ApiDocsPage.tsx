export default function ApiDocsPage() {
  const origin = window.location.origin;

  return (
    <div className="api-docs-page">
      <div className="ambient-background">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
      </div>

      <h2>API 开发指南</h2>

      <section className="api-key-section">
        <h3>鉴权令牌 (API Key)</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '12px' }}>
          在服务端 <code>.env</code> 文件中配置 <code>MASTER_API_KEY</code> 即可启用鉴权；<br/>
          未配置时 API 端点为开放访问。
        </p>
        <div className="api-key-display">
          <code>Authorization: Bearer YOUR_MASTER_API_KEY</code>
        </div>
      </section>

      <section className="api-endpoint">
        <h3>基本端点</h3>
        <code>POST /api/v1/chat</code>

        <h3>请求标头</h3>
        <pre>{`Authorization: Bearer YOUR_MASTER_API_KEY\nContent-Type: application/json\nX-Session-ID: <uuid>`}</pre>

        <h3>载荷参数</h3>
        <pre>{`{\n  "message": "描述你的需求..."\n}`}</pre>

        <h3>调用实例 - cURL</h3>
        <pre>{`curl -X POST ${origin}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Session-ID: $(uuidgen)" \\
  -d '{"message": "为我实现一段支持多并发的高阶快速排序算法"}'`}</pre>

        <h3>调用实例 - Python</h3>
        <pre>{`import requests, uuid

url = "${origin}/api/v1/chat"
headers = {
    "Content-Type": "application/json",
    "X-Session-ID": str(uuid.uuid4()),
}
data = {
    "message": "为我实现一段支持多并发的高阶快速排序算法"
}

response = requests.post(url, headers=headers, json=data)
print(response.json().get("reply", "无响应"))`}</pre>
      </section>

      <p className="api-note">为保障最佳体验与系统稳定性，每个会话享有最高 18 次极速交互权限。请于配额内尽情探索深度推理的魅力。</p>
    </div>
  );
}
