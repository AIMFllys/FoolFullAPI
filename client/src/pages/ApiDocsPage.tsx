import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Key, Fingerprint, MessageSquare, Zap, Radio, Ban, Timer, Puzzle,
  Info, AlertTriangle, Lightbulb, Hexagon, ArrowRight, Copy, Check, X, ShieldCheck
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "curl" | "python" | "js" | "typescript";
type Section =
  | "overview"
  | "authentication"
  | "session"
  | "chat"
  | "stream"
  | "sse-events"
  | "errors"
  | "limits"
  | "examples";

// ─── Code samples ─────────────────────────────────────────────────────────────
const SAMPLES: Record<"chat" | "stream", Record<Lang, string>> = {
  chat: {
    curl: `curl -X POST https://api.agentsnav.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Session-ID: $(uuidgen)" \\
  -d '{
    "message": "帮我调研 React 19 的新特性与迁移策略",
    "mode": "deep"
  }'`,
    python: `import httpx, uuid

CLIENT_URL = "https://api.agentsnav.com"

payload = {
    "message": "帮我调研 React 19 的新特性与迁移策略",
    "mode": "deep",        # "deep" | "normal"
}
headers = {
    "Content-Type": "application/json",
    "X-Session-ID": str(uuid.uuid4()),
    # "Authorization": "Bearer YOUR_API_KEY",  # 可选
}

resp = httpx.post(f"{CLIENT_URL}/api/v1/chat", json=payload, headers=headers)
data = resp.json()

if data.get("mode") == "deep":
    # 深度模式：data 中包含原始 XML，建议使用流式接口
    print(data)
else:
    # 普通模式
    print(data["reply"])`,
    js: `import { v4 as uuidv4 } from 'uuid';

const BASE = 'https://api.agentsnav.com';

const response = await fetch(\`\${BASE}/api/v1/chat\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': uuidv4(),
    // 'Authorization': 'Bearer YOUR_API_KEY', // 可选
  },
  body: JSON.stringify({
    message: '帮我调研 React 19 的新特性与迁移策略',
    mode: 'deep',   // "deep" | "normal"
  }),
});

const data = await response.json();
console.log(data);`,
    typescript: `import { v4 as uuidv4 } from 'uuid';

const BASE = 'https://api.agentsnav.com';

interface ChatRequest {
  message: string;
  mode: 'deep' | 'normal';
}

interface ChatResponse {
  reply?: string;
  step?: number;
  remaining: number | null;
  mode: 'deep' | 'normal';
  model: string;
}

async function chat(req: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(\`\${BASE}/api/v1/chat\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': uuidv4(),
      // 'Authorization': 'Bearer YOUR_API_KEY',
    },
    body: JSON.stringify(req),
  });
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

const data = await chat({ message: '分析 Vite 6 插件机制', mode: 'deep' });
console.log(data);`,
  },

  stream: {
    curl: `curl -X POST https://api.agentsnav.com/api/v1/chat/stream \\
  -H "Content-Type: application/json" \\
  -H "X-Session-ID: $(uuidgen)" \\
  -H "Accept: text/event-stream" \\
  -d '{
    "message": "深度分析 Next.js 15 App Router 缓存机制",
    "mode": "deep"
  }'`,
    python: `import httpx, uuid, json

BASE = "https://api.agentsnav.com"

headers = {
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
    "X-Session-ID": str(uuid.uuid4()),
}
payload = {
    "message": "深度分析 Next.js 15 App Router 缓存机制",
    "mode": "deep",
}

with httpx.stream("POST", f"{BASE}/api/v1/chat/stream",
                  json=payload, headers=headers, timeout=120) as r:
    event_type = None
    for line in r.iter_lines():
        if line.startswith("event:"):
            event_type = line[6:].strip()
        elif line.startswith("data:"):
            data = json.loads(line[5:].strip())
            if event_type == "meta":
                print(f"[Model] {data['model']}")
            elif event_type == "xml":
                print(data.get("chunk", ""), end="", flush=True)
            elif event_type == "done":
                print("\\n[Done]", data.get("mode"))
            elif event_type == "error":
                print(f"[Error] {data['message']}")`,
    js: `import { v4 as uuidv4 } from 'uuid';

const BASE = 'https://api.agentsnav.com';

const response = await fetch(\`\${BASE}/api/v1/chat/stream\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'X-Session-ID': uuidv4(),
  },
  body: JSON.stringify({
    message: '深度分析 Next.js 15 App Router 缓存机制',
    mode: 'deep',
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let eventType = '';
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const data = JSON.parse(line.slice(5).trim());
      if (eventType === 'meta') console.log('[Model]', data.model);
      if (eventType === 'xml')  process.stdout.write(data.chunk ?? '');
      if (eventType === 'done') console.log('\\n[Done]', data.mode);
      if (eventType === 'error') console.error('[Error]', data.message);
    }
  }
}`,
    typescript: `import { v4 as uuidv4 } from 'uuid';

const BASE = 'https://api.agentsnav.com';

type SseEvent =
  | { event: 'meta';   data: { model: string } }
  | { event: 'xml';    data: { chunk: string } }
  | { event: 'done';   data: { mode: string; model: string } }
  | { event: 'error';  data: { code: string; message: string } };

type Handler = (e: SseEvent) => void;

async function streamChat(message: string, onEvent: Handler): Promise<void> {
  const res = await fetch(\`\${BASE}/api/v1/chat/stream\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-Session-ID': uuidv4(),
    },
    body: JSON.stringify({ message, mode: 'deep' }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let eventType = '';
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(5).trim());
        onEvent({ event: eventType as SseEvent['event'], data });
      }
    }
  }
}

// 使用示例
await streamChat('分析 TypeScript 5.5 的新特性', (e) => {
  if (e.event === 'xml') process.stdout.write(e.data.chunk);
});`,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="api-copy-btn"
      title="复制代码"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
          <path d="M3 8.5l3 3 7-7" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
          <rect x="5" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <rect x="2" y="4" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "amber" | "red" | "purple" }) {
  return <span className={`api-badge api-badge-${color}`}>{children}</span>;
}

function MethodBadge({ method }: { method: string }) {
  const color = method === "POST" ? "blue" : method === "GET" ? "green" : "amber";
  return <span className={`api-method-badge api-method-${color}`}>{method}</span>;
}

function TableRow({ cells, header }: { cells: React.ReactNode[]; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return (
    <tr className={header ? "api-table-header" : "api-table-row"}>
      {cells.map((c, i) => <Tag key={i}>{c}</Tag>)}
    </tr>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="api-codeblock">
      {lang && <span className="api-codeblock-lang">{lang}</span>}
      <CopyButton text={code} />
      <pre><code>{code}</code></pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="api-inline-code">{children}</code>;
}

function SectionTitle({ id, children }: { id: Section; children: React.ReactNode }) {
  return (
    <h2 id={id} className="api-section-title">
      {children}
      <a href={`#${id}`} className="api-section-anchor">#</a>
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="api-subsection-title">{children}</h3>;
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const Icon = type === "info" ? Info : type === "warning" ? AlertTriangle : Lightbulb;
  return (
    <div className={`api-callout api-callout-${type}`}>
      <span className="api-callout-icon flex items-center justify-center mt-1">
        <Icon className="w-5 h-5 flex-shrink-0" />
      </span>
      <div>{children}</div>
    </div>
  );
}

function TabCodeBlock({ samples }: { samples: Record<Lang, string> }) {
  const tabs: { id: Lang; label: string }[] = [
    { id: "curl", label: "cURL" },
    { id: "python", label: "Python" },
    { id: "js", label: "JavaScript" },
    { id: "typescript", label: "TypeScript" },
  ];
  const [active, setActive] = useState<Lang>("curl");
  return (
    <div className="api-tab-codeblock">
      <div className="api-tab-header">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`api-tab-btn${active === t.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div className="api-tab-spacer" />
        <CopyButton text={samples[active]} />
      </div>
      <pre className="api-tab-pre"><code>{samples[active]}</code></pre>
    </div>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Section; label: string; icon: any }[] = [
  { id: "overview",        label: "概述",          icon: Compass },
  { id: "authentication",  label: "认证",          icon: Key },
  { id: "session",         label: "会话管理",       icon: Fingerprint },
  { id: "chat",            label: "非流式对话",     icon: MessageSquare },
  { id: "stream",          label: "流式对话 (SSE)", icon: Zap },
  { id: "sse-events",      label: "SSE 事件参考",   icon: Radio },
  { id: "errors",          label: "错误码",         icon: Ban },
  { id: "limits",          label: "频率限制",       icon: Timer },
  { id: "examples",        label: "完整示例",       icon: Puzzle },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem("agentsnav_api_key"));
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  function generateKey() {
    const newKey = `sk-agentsnav-${Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;
    localStorage.setItem("agentsnav_api_key", newKey);
    setApiKey(newKey);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Highlight active section while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveSection(e.target.id as Section);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: Section) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.innerWidth <= 860) setSidebarOpen(false);
  }

  return (
    <div className="api-docs-shell">
      {/* ── Ambient ── */}
      <div className="api-ambient-a" />
      <div className="api-ambient-b" />

      {/* ── Top bar ── */}
      <header className="api-topbar">
        <Link to="/" className="api-topbar-brand">
          <span className="api-topbar-logo"><Hexagon className="w-5 h-5" /></span>
          AgentsNav API
        </Link>
        <nav className="api-topbar-nav">
          <span className="api-topbar-base">https://api.agentsnav.com</span>
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-neutral-200"
          >
            <Key className="w-3.5 h-3.5" />
            获取 API Key
          </button>
          <Link to="/chat" className="api-topbar-cta flex items-center gap-2 hidden md:flex">体验 Chat <ArrowRight className="w-4 h-4" /></Link>
          <button
            className="md:hidden p-2 -mr-2 text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </nav>
      </header>

      <div className="api-layout">
        {/* ── Mobile Sidebar Overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className={`api-sidebar transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="api-sidebar-section-label">API 参考</div>
          <nav>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`api-sidebar-item${activeSection === item.id ? " active" : ""}`}
              >
                <span className="api-sidebar-icon">
                  <item.icon className="w-4 h-4" />
                </span>
                {item.label}
                {activeSection === item.id && (
                  <motion.div layoutId="sidebar-indicator" className="api-sidebar-indicator" />
                )}
              </button>
            ))}
          </nav>

          <div className="api-sidebar-divider" />
          <div className="api-sidebar-section-label">资源</div>
          <a href="https://agentsnav.com" target="_blank" rel="noreferrer" className="api-sidebar-link">平台主页 ↗</a>
          <Link to="/chat" className="api-sidebar-link">Chat 界面 ↗</Link>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="api-main" ref={contentRef}>

          {/* ══════════════ 1. OVERVIEW ══════════════ */}
          <section>
            <SectionTitle id="overview">概述</SectionTitle>
            <p className="api-lead">
              AgentsNav API 提供基于大型语言模型的对话能力，支持<strong>深度模式</strong>（真实联网搜索 + 思考链 + 流式输出）与<strong>普通模式</strong>（结构化标准对话流程）。
              所有请求均通过 HTTPS 发送，响应使用 UTF-8 编码的 JSON 或 XML。
            </p>

            <div className="api-info-grid">
              <div className="api-info-card">
                <div className="api-info-card-label">Base URL</div>
                <div className="api-info-card-value mono">https://api.agentsnav.com</div>
              </div>
              <div className="api-info-card">
                <div className="api-info-card-label">协议</div>
                <div className="api-info-card-value">HTTPS · REST · SSE</div>
              </div>
              <div className="api-info-card">
                <div className="api-info-card-label">编码</div>
                <div className="api-info-card-value">UTF-8 · JSON / XML</div>
              </div>
              <div className="api-info-card">
                <div className="api-info-card-label">认证</div>
                <div className="api-info-card-value">Bearer Token（可选）</div>
              </div>
            </div>

            <SubTitle>端点列表</SubTitle>
            <table className="api-table">
              <thead>
                <TableRow header cells={["方法", "路径", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={[<MethodBadge method="POST" />, <InlineCode>/api/v1/chat</InlineCode>, "非流式对话（返回 JSON 或 XML）"]} />
                <TableRow cells={[<MethodBadge method="POST" />, <InlineCode>/api/v1/chat/stream</InlineCode>, "流式对话（Server-Sent Events）"]} />
              </tbody>
            </table>
          </section>

          {/* ══════════════ 2. AUTHENTICATION ══════════════ */}
          <section>
            <SectionTitle id="authentication">认证</SectionTitle>
            <p className="api-para">
              API Key 认证为<strong>可选项</strong>。服务端在 <InlineCode>.env</InlineCode> 中配置 <InlineCode>MASTER_API_KEY</InlineCode> 后方启用鉴权；未配置时所有 <InlineCode>/api/v1</InlineCode> 端点均为公开访问。
            </p>

            <Callout type="info">
              当前部署的 API 端点<strong>默认开放访问</strong>，无需提供 API Key 也能正常调用。
              如需为私有部署启用 Key 鉴权，请在服务端环境变量中配置 <InlineCode>MASTER_API_KEY</InlineCode>。
            </Callout>

            <SubTitle>请求头格式</SubTitle>
            <CodeBlock lang="HTTP Header" code={`Authorization: Bearer YOUR_API_KEY`} />

            <SubTitle>认证错误</SubTitle>
            <p className="api-para">若已启用 Key 鉴权且请求未携带有效 Key，服务器返回：</p>
            <CodeBlock lang="JSON" code={`HTTP/1.1 401 Unauthorized\n\n{\n  "error": "Invalid or missing API Key"\n}`} />
          </section>

          {/* ══════════════ 3. SESSION ══════════════ */}
          <section>
            <SectionTitle id="session">会话管理</SectionTitle>
            <p className="api-para">
              API 使用基于 UUID 的无状态会话机制。会话 ID 通过请求头 <InlineCode>X-Session-ID</InlineCode> 传递，服务器会自动创建首次出现的 Session。
            </p>

            <SubTitle>X-Session-ID</SubTitle>
            <table className="api-table">
              <thead>
                <TableRow header cells={["属性", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={["格式", "标准 UUID v4（例：550e8400-e29b-41d4-a716-446655440000）"]} />
                <TableRow cells={["位置", "HTTP 请求头 X-Session-ID"]} />
                <TableRow cells={["必填", "可选。若未提供或格式无效，服务器将自动生成新 UUID"]} />
                <TableRow cells={["作用", "在深度模式下维持多轮对话上下文；在普通模式下追踪 6 步状态机"]} />
                <TableRow cells={["持久化", "存储在服务端 SQLite，记录对话步骤与使用次数"]} />
              </tbody>
            </table>

            <Callout type="tip">
              建议在客户端（如 <InlineCode>localStorage</InlineCode>）持久化同一个 UUID，以便在普通模式下保持分阶段流程的完整体验。
            </Callout>

            <SubTitle>生成 Session ID</SubTitle>
            <CodeBlock lang="Shell" code={`# Linux / macOS\nuuidgen\n\n# Node.js\nnode -e "const { v4 } = require('uuid'); console.log(v4())"\n\n# Python\npython3 -c "import uuid; print(uuid.uuid4())"`} />
          </section>

          {/* ══════════════ 4. CHAT (非流式) ══════════════ */}
          <section>
            <SectionTitle id="chat">非流式对话</SectionTitle>

            <div className="api-endpoint-row">
              <MethodBadge method="POST" />
              <code className="api-endpoint-path">/api/v1/chat</code>
            </div>

            <p className="api-para">
              发送单条消息，等待模型完整生成后以 JSON（普通模式）或 XML（深度模式）一次性返回。
              适用于不需要流式展示思考过程的场景；对于深度模式，推荐使用 <InlineCode>/api/v1/chat/stream</InlineCode>。
            </p>

            <SubTitle>请求头</SubTitle>
            <table className="api-table">
              <thead>
                <TableRow header cells={["Header", "类型", "必填", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={["Content-Type", <InlineCode>string</InlineCode>, <Badge color="red">required</Badge>, <>固定值 <InlineCode>application/json</InlineCode></>]} />
                <TableRow cells={["X-Session-ID", <InlineCode>uuid</InlineCode>, <Badge color="amber">optional</Badge>, "会话唯一标识符"]} />
                <TableRow cells={["Authorization", <InlineCode>string</InlineCode>, <Badge color="amber">optional</Badge>, <>格式：<InlineCode>Bearer YOUR_API_KEY</InlineCode></>]} />
              </tbody>
            </table>

            <SubTitle>请求体</SubTitle>
            <table className="api-table">
              <thead>
                <TableRow header cells={["字段", "类型", "必填", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={[<InlineCode>message</InlineCode>, <InlineCode>string</InlineCode>, <Badge color="red">required</Badge>, "用户消息内容，最大 4000 字符"]} />
                <TableRow cells={[<InlineCode>mode</InlineCode>, <InlineCode>"deep" | "normal"</InlineCode>, <Badge color="amber">optional</Badge>, <>默认 <InlineCode>"deep"</InlineCode>。<InlineCode>deep</InlineCode> 启用联网搜索，<InlineCode>normal</InlineCode> 使用 6 步交互流程</>]} />
              </tbody>
            </table>

            <SubTitle>代码示例</SubTitle>
            <TabCodeBlock samples={SAMPLES.chat} />

            <SubTitle>响应 — 普通模式</SubTitle>
            <CodeBlock lang="JSON" code={`{
  "reply": "让我先梳理一下这个问题的核心要素...",
  "step": 1,
  "remaining": null,
  "mode": "normal",
  "model": "moonshot-v1-auto"
}`} />
            <table className="api-table">
              <thead>
                <TableRow header cells={["字段", "类型", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={[<InlineCode>reply</InlineCode>, "string", "模型回复文本"]} />
                <TableRow cells={[<InlineCode>step</InlineCode>, "number (1–6)", "当前所处步骤（仅普通模式）"]} />
                <TableRow cells={[<InlineCode>remaining</InlineCode>, "number | null", "剩余可用次数（当前版本为 null）"]} />
                <TableRow cells={[<InlineCode>mode</InlineCode>, `"normal"`, "响应所用模式"]} />
                <TableRow cells={[<InlineCode>model</InlineCode>, "string", "实际使用的模型标识"]} />
              </tbody>
            </table>

            <SubTitle>响应 — 深度模式</SubTitle>
            <p className="api-para">深度模式的非流式端点直接返回原始结构化 XML：</p>
            <CodeBlock lang="XML" code={`Content-Type: application/xml; charset=utf-8

<root>
  <think>分析用户问题的核心维度，识别关键信息节点...</think>
  <plan>1. 检索相关资料 2. 评估信源可信度 3. 综合推导结论</plan>
  <review>验证逻辑自洽性，排查潜在偏差...</review>
  <answer>
    ## React 19 核心新特性

    React 19 引入了 Actions、Server Components 稳定版、新的 use() API...
  </answer>
</root>`} />
            <Callout type="warning">
              对于深度模式，建议使用流式接口 <InlineCode>/api/v1/chat/stream</InlineCode>，可实时展示思考链各阶段，显著改善用户体验。
            </Callout>
          </section>

          {/* ══════════════ 5. STREAM ══════════════ */}
          <section>
            <SectionTitle id="stream">流式对话 (SSE)</SectionTitle>

            <div className="api-endpoint-row">
              <MethodBadge method="POST" />
              <code className="api-endpoint-path">/api/v1/chat/stream</code>
            </div>

            <p className="api-para">
              通过 <strong>Server-Sent Events (SSE)</strong> 协议流式推送对话结果。客户端将按顺序接收 <InlineCode>meta</InlineCode>、<InlineCode>xml</InlineCode>（含思考链各段）、<InlineCode>done</InlineCode> 等事件。
            </p>

            <SubTitle>请求头</SubTitle>
            <table className="api-table">
              <thead>
                <TableRow header cells={["Header", "类型", "必填", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={["Content-Type", <InlineCode>string</InlineCode>, <Badge color="red">required</Badge>, <><InlineCode>application/json</InlineCode></>]} />
                <TableRow cells={["Accept", <InlineCode>string</InlineCode>, <Badge color="amber">optional</Badge>, <>建议设为 <InlineCode>text/event-stream</InlineCode></>]} />
                <TableRow cells={["X-Session-ID", <InlineCode>uuid</InlineCode>, <Badge color="amber">optional</Badge>, "会话唯一标识符"]} />
                <TableRow cells={["Authorization", <InlineCode>string</InlineCode>, <Badge color="amber">optional</Badge>, <>格式：<InlineCode>Bearer YOUR_API_KEY</InlineCode></>]} />
              </tbody>
            </table>

            <SubTitle>请求体</SubTitle>
            <p className="api-para">同 <InlineCode>/api/v1/chat</InlineCode>，请参见上方"请求体"说明。</p>

            <SubTitle>代码示例</SubTitle>
            <TabCodeBlock samples={SAMPLES.stream} />

            <SubTitle>SSE 流格式</SubTitle>
            <p className="api-para">响应遵循标准 SSE 格式，每条消息由 <InlineCode>event:</InlineCode> 行和 <InlineCode>data:</InlineCode> 行组成，以双空行分隔：</p>
            <CodeBlock lang="SSE" code={`event: meta\ndata: {"model":"moonshot-v1-auto"}\n\nevent: xml\ndata: {"chunk":"<think>"}  \n\nevent: xml\ndata: {"chunk":"正在分析问题的关键维度..."}\n\nevent: xml\ndata: {"chunk":"</think><plan>"}\n\nevent: xml\ndata: {"chunk":"1. 检索外部资源\\n2. 验证信源..."}\n\nevent: xml\ndata: {"chunk":"</plan><answer>"}\n\nevent: xml\ndata: {"chunk":"## 核心结论\\n\\n根据最新资料..."}\n\nevent: xml\ndata: {"chunk":"</answer>"}\n\nevent: done\ndata: {"mode":"deep","model":"moonshot-v1-auto"}`} />
          </section>

          {/* ══════════════ 6. SSE EVENTS ══════════════ */}
          <section>
            <SectionTitle id="sse-events">SSE 事件参考</SectionTitle>
            <p className="api-para">以下为 <InlineCode>/api/v1/chat/stream</InlineCode> 可能推送的所有事件类型：</p>

            {/* meta */}
            <div className="api-event-card">
              <div className="api-event-header">
                <span className="api-event-name">meta</span>
                <span className="api-event-desc">流开始时推送，包含模型元信息</span>
              </div>
              <CodeBlock lang="JSON" code={`{"model": "moonshot-v1-auto"}`} />
              <table className="api-table">
                <thead><TableRow header cells={["字段", "类型", "说明"]} /></thead>
                <tbody>
                  <TableRow cells={[<InlineCode>model</InlineCode>, "string", "实际使用的模型标识符"]} />
                </tbody>
              </table>
            </div>

            {/* xml */}
            <div className="api-event-card">
              <div className="api-event-header">
                <span className="api-event-name">xml</span>
                <span className="api-event-desc">原始 XML 片段，流式推送思考链各阶段</span>
              </div>
              <CodeBlock lang="JSON" code={`{"chunk": "<think>正在分析..."}`} />
              <table className="api-table">
                <thead><TableRow header cells={["字段", "类型", "说明"]} /></thead>
                <tbody>
                  <TableRow cells={[<InlineCode>chunk</InlineCode>, "string", "XML 内容片段，可能包含标签起止或文本内容"]} />
                </tbody>
              </table>
              <p className="api-para" style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" }}>
                <code className="api-inline-code">{"<think>"}</code>、<code className="api-inline-code">{"<plan>"}</code>、<code className="api-inline-code">{"<review>"}</code>、<code className="api-inline-code">{"<answer>"}</code>
                标签包裹各思考阶段。客户端需要解析 XML 流以分阶段展示。
              </p>
            </div>

            {/* message (normal mode) */}
            <div className="api-event-card">
              <div className="api-event-header">
                <span className="api-event-name">message</span>
                <span className="api-event-desc">普通模式专属，单次完整回复</span>
              </div>
              <CodeBlock lang="JSON" code={`{
  "reply": "让我先梳理一下这个问题...",
  "step": 1,
  "mode": "normal",
  "model": "moonshot-v1-auto"
}`} />
            </div>

            {/* done */}
            <div className="api-event-card">
              <div className="api-event-header">
                <span className="api-event-name">done</span>
                <span className="api-event-desc">流结束标志，必然出现</span>
              </div>
              <CodeBlock lang="JSON" code={`{
  "mode": "deep",
  "model": "moonshot-v1-auto"
}`} />
            </div>

            {/* error */}
            <div className="api-event-card">
              <div className="api-event-header">
                <span className="api-event-name">error</span>
                <span className="api-event-desc">流处理过程中发生错误</span>
              </div>
              <CodeBlock lang="JSON" code={`{
  "code": "DEEP_MODE_FAILED",
  "message": "深度模式流式调用失败，请稍后再试。"
}`} />
              <table className="api-table">
                <thead><TableRow header cells={["字段", "类型", "说明"]} /></thead>
                <tbody>
                  <TableRow cells={[<InlineCode>code</InlineCode>, "string", "内部错误码"]} />
                  <TableRow cells={[<InlineCode>message</InlineCode>, "string", "可读错误说明"]} />
                </tbody>
              </table>
            </div>
          </section>

          {/* ══════════════ 7. ERRORS ══════════════ */}
          <section>
            <SectionTitle id="errors">错误码</SectionTitle>
            <p className="api-para">
              API 使用标准 HTTP 状态码表示结果，错误响应体均为 JSON：
            </p>
            <CodeBlock lang="JSON" code={`{\n  "error": "错误的人类可读描述"\n}`} />

            <table className="api-table" style={{ marginTop: "1.25rem" }}>
              <thead>
                <TableRow header cells={["状态码", "含义", "常见原因"]} />
              </thead>
              <tbody>
                <TableRow cells={[<Badge color="green">200 OK</Badge>, "请求成功", "正常响应"]} />
                <TableRow cells={[<Badge color="amber">400 Bad Request</Badge>, "请求参数无效", "message 为空或超长；mode 值非法"]} />
                <TableRow cells={[<Badge color="red">401 Unauthorized</Badge>, "认证失败", "启用 Key 鉴权后 Authorization Header 缺失或错误"]} />
                <TableRow cells={[<Badge color="red">503 Service Unavailable</Badge>, "服务繁忙", "当日全局 API 调用次数已达上限（1000 次/天）"]} />
                <TableRow cells={[<Badge color="red">502 Bad Gateway</Badge>, "上游模型调用失败", "底层 AI 接口超时或返回错误"]} />
              </tbody>
            </table>

            <SubTitle>400 错误示例</SubTitle>
            <CodeBlock lang="JSON" code={`HTTP/1.1 400 Bad Request\n\n{\n  "error": "消息不能为空"\n}`} />

            <SubTitle>503 错误示例</SubTitle>
            <CodeBlock lang="JSON" code={`HTTP/1.1 503 Service Unavailable\n\n{\n  "error": "今日调用次数已用完，请明日再来。"\n}`} />
          </section>

          {/* ══════════════ 8. LIMITS ══════════════ */}
          <section>
            <SectionTitle id="limits">频率限制</SectionTitle>

            <table className="api-table">
              <thead>
                <TableRow header cells={["限制维度", "限额", "重置周期", "说明"]} />
              </thead>
              <tbody>
                <TableRow cells={["全局日调用量", "1,000 次", "每日 UTC 00:00", "所有用户/会话共享此上限"]} />
                <TableRow cells={["IP Ban 阈值", "50 次短时触发", "30 分钟", "异常高频请求将临时封禁 IP"]} />
                <TableRow cells={["每会话最大问题数", "18 条", "会话生命周期", "普通模式会话内最多可问 18 个问题"]} />
                <TableRow cells={["消息最大长度", "4,000 字符", "—", "单条 message 字段上限"]} />
              </tbody>
            </table>

            <Callout type="warning">
              当全局日调用量达到上限时，所有请求将返回 <InlineCode>503 Service Unavailable</InlineCode>，计数器将在下一个 UTC 日重置。
            </Callout>

            <Callout type="info">
              以上限额适用于当前公开部署版本。如需更高配额，请在私有部署时修改 <InlineCode>.env</InlineCode> 中的 <InlineCode>MAX_DAILY_API_CALLS</InlineCode> 与 <InlineCode>IP_BAN_THRESHOLD</InlineCode>。
            </Callout>
          </section>

          {/* ══════════════ 9. EXAMPLES ══════════════ */}
          <section>
            <SectionTitle id="examples">完整集成示例</SectionTitle>

            <SubTitle>TypeScript — 带 SSE 解析器的完整客户端</SubTitle>
            <CodeBlock lang="TypeScript" code={`// agentsnav-client.ts
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'https://api.agentsnav.com';

export type ChatMode = 'deep' | 'normal';

export interface DeepModeChunks {
  think: string;
  plan: string;
  review: string;
  answer: string;
}

export interface StreamCallbacks {
  onModel?: (model: string) => void;
  onChunk?: (chunk: string) => void;
  onDone?: (mode: ChatMode, model: string) => void;
  onError?: (code: string, message: string) => void;
}

export async function streamChat(
  message: string,
  mode: ChatMode = 'deep',
  callbacks: StreamCallbacks = {}
): Promise<void> {
  const sessionId = localStorage.getItem('session_id') ?? (() => {
    const id = uuidv4();
    localStorage.setItem('session_id', id);
    return id;
  })();

  const res = await fetch(\`\${BASE_URL}/api/v1/chat/stream\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ message, mode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? \`HTTP \${res.status}\`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let eventType = '';
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(5).trim());
        switch (eventType) {
          case 'meta':    callbacks.onModel?.(data.model); break;
          case 'xml':     callbacks.onChunk?.(data.chunk); break;
          case 'message': callbacks.onChunk?.(data.reply); break;
          case 'done':    callbacks.onDone?.(data.mode, data.model); break;
          case 'error':   callbacks.onError?.(data.code, data.message); break;
        }
      }
    }
  }
}

// ── 使用示例 ──────────────────────────────────────────────
import { streamChat } from './agentsnav-client';

let answer = '';
await streamChat(
  '分析 TypeScript 5.5 conditional types 的新能力',
  'deep',
  {
    onModel: (m)  => console.log('Model:', m),
    onChunk: (c)  => { answer += c; process.stdout.write(c); },
    onDone:  (mode, m) => console.log('\\n✓ Done', mode, m),
    onError: (code, msg) => console.error('✗', code, msg),
  }
);`} />

            <SubTitle>Python — 异步流式接收</SubTitle>
            <CodeBlock lang="Python" code={`# agentsnav_stream.py
import asyncio, json, uuid
import httpx

BASE = "https://api.agentsnav.com"


async def stream_chat(message: str, mode: str = "deep") -> None:
    session_id = str(uuid.uuid4())  # 建议从本地存储读取以保持会话

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{BASE}/api/v1/chat/stream",
            json={"message": message, "mode": mode},
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "X-Session-ID": session_id,
            },
        ) as resp:
            resp.raise_for_status()
            event_type = None
            async for line in resp.aiter_lines():
                if line.startswith("event:"):
                    event_type = line[6:].strip()
                elif line.startswith("data:"):
                    data = json.loads(line[5:].strip())
                    if event_type == "meta":
                        print(f"\\n[Model] {data['model']}")
                    elif event_type == "xml":
                        print(data.get("chunk", ""), end="", flush=True)
                    elif event_type == "done":
                        print(f"\\n✓ Done [{data['mode']}]")
                    elif event_type == "error":
                        print(f"\\n✗ Error: {data['message']}")


if __name__ == "__main__":
    asyncio.run(stream_chat("解析 Python 3.13 的 GIL 移除方案与性能影响"))`} />

            <div className="api-footer-note">
              <span>AgentsNav API Documentation</span>
              <span>·</span>
              <span>Base URL: <code>https://api.agentsnav.com</code></span>
              <span>·</span>
              <a href="https://agentsnav.com" target="_blank" rel="noreferrer">主平台</a>
            </div>
          </section>
        </main>
      </div>

      {/* ── API Key Modal ── */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-neutral-900 shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-white to-blue-500" />
              <button
                onClick={() => setShowKeyModal(false)}
                className="absolute right-4 top-4 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 pt-10">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <ShieldCheck className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">您的专用 API Key</h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    此 Key 已通过系统实时颁发，可立即用于生产环境。
                  </p>
                </div>

                {apiKey ? (
                  <div className="space-y-4">
                    <div className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-white/20">
                      <code className="text-sm font-mono text-neutral-300 break-all pr-8">
                        {apiKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 hover:bg-white/10 hover:text-white"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                       <p className="text-[11px] uppercase tracking-widest text-neutral-500 text-center">
                         KEY 状态：已激活 · 已记录会话 ID
                       </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateKey}
                    className="w-full rounded-2xl bg-white py-4 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    生成真实 API Key
                  </button>
                )}

                <div className="mt-8 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                    <p className="text-xs leading-relaxed text-yellow-500/90">
                      请妥善保管此 Key。当前系统已为您开启开发者绿色通道，所有利用此 Key 的请求将免除 3 小时内的 IP 高频限制。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
