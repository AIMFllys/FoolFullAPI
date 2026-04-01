export default function ApiDocsPage() {
  const origin = window.location.origin;

  return (
    <div className="api-docs-page">
      <h2>API 接入说明</h2>

      <section className="api-key-section">
        <h3>认证方式</h3>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', marginBottom: '12px' }}>
          在服务端 <code>.env</code> 中配置 <code>MASTER_API_KEY</code> 后即可为 <code>/api/v1</code> 启用鉴权。
          未配置时，API 端点默认开放访问。
        </p>
        <div className="api-key-display">
          <code>Authorization: Bearer YOUR_MASTER_API_KEY</code>
        </div>
      </section>

      <section className="api-endpoint">
        <h3>非流式接口</h3>
        <code>POST /api/v1/chat</code>

        <h3>流式接口</h3>
        <code>POST /api/v1/chat/stream</code>

        <h3>请求头</h3>
        <pre>{`Authorization: Bearer YOUR_MASTER_API_KEY
Content-Type: application/json
X-Session-ID: <uuid>`}</pre>

        <h3>请求体</h3>
        <pre>{`{
  "message": "帮我调研 React Server Components 的边界条件",
  "mode": "deep"
}`}</pre>

        <h3>说明</h3>
        <pre>{`mode 可选值：
- deep：默认值，返回深度模式结果
- normal：保留愚人节 6 步普通模式

深度模式：
- /api/v1/chat 返回原始 XML
- /api/v1/chat/stream 返回 SSE，其中 xml 事件为原始 XML 片段`}</pre>

        <h3>cURL 示例</h3>
        <pre>{`curl -X POST ${origin}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Session-ID: $(uuidgen)" \\
  -d '{"message":"帮我总结 Vite 6 与 React 19 的集成注意点","mode":"deep"}'`}</pre>
      </section>

      <p className="api-note">
        深度模式默认启用联网搜索，并返回严格结构化的 XML 思考链内容；普通模式则保留原有的愚人节流程。
      </p>
    </div>
  );
}
