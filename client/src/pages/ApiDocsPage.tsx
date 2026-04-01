import { useState, useEffect } from 'react';
import { getApiKey, regenerateApiKey } from '../api/auth';

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { getApiKey().then(setApiKey); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    const newKey = await regenerateApiKey();
    setApiKey(newKey);
  };

  return (
    <div className="api-docs-page">
      <div className="ambient-background">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
      </div>

      <h2>API 开发指南</h2>

      <section className="api-key-section">
        <h3>鉴权令牌 (API Key)</h3>
        <div className="api-key-display">
          <code>{apiKey || '正在获取...'}</code>
          <button onClick={handleCopy} className={copied ? 'copied' : ''}>
            {copied ? (
              <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                已复制
              </span>
            ) : '拷贝'}
          </button>
          <button onClick={handleRegenerate} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>重置</button>
        </div>
      </section>

      <section className="api-endpoint">
        <h3>基本端点</h3>
        <code>POST /api/v1/chat</code>

        <h3>请求标头</h3>
        <pre>{`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json`}</pre>

        <h3>载荷参数</h3>
        <pre>{`{\n  "message": "描述你的需求..."\n}`}</pre>

        <h3>调用实例 - cURL</h3>
        <pre>{`curl -X POST ${window.location.origin}/api/v1/chat \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "为我实现一段支持多并发的高阶快速排序算法"}'`}</pre>

        <h3>调用实例 - Python</h3>
        <pre>{`import requests

url = "${window.location.origin}/api/v1/chat"
headers = {
    "Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
}
data = {
    "message": "为我实现一段支持多并发的高阶快速排序算法"
}

response = requests.post(url, headers=headers, json=data)
print(response.json().get("reply", "无响应"))`}</pre>
      </section>

      <p className="api-note">为保障最佳体验与系统稳定性，每位测验者享有最高 18 次极速交互权限。请于配额内尽情探索深度推理的魅力。</p>
    </div>
  );
}
