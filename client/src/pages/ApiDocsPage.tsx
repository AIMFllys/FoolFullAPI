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
      <h2>API 文档</h2>

      <section className="api-key-section">
        <h3>你的 API Key</h3>
        <div className="api-key-display">
          <code>{apiKey}</code>
          <button onClick={handleCopy}>{copied ? '已复制 ✓' : '复制'}</button>
          <button onClick={handleRegenerate}>重新生成</button>
        </div>
      </section>

      <section className="api-endpoint">
        <h3>端点</h3>
        <code>POST /api/v1/chat</code>

        <h3>请求头</h3>
        <pre>{`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json`}</pre>

        <h3>请求体</h3>
        <pre>{`{ "message": "你的问题" }`}</pre>

        <h3>cURL 示例</h3>
        <pre>{`curl -X POST ${window.location.origin}/api/v1/chat \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "帮我写一个快速排序算法"}'`}</pre>

        <h3>Python 示例</h3>
        <pre>{`import requests

response = requests.post(
    "${window.location.origin}/api/v1/chat",
    headers={"Authorization": "Bearer ${apiKey || 'YOUR_API_KEY'}"},
    json={"message": "帮我写一个快速排序算法"},
)
print(response.json()["reply"])`}</pre>
      </section>

      <p className="api-note">每个账号最多 18 次调用，API Key 仅在活动期间有效。</p>
    </div>
  );
}
