import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  displayContent?: string;
  isEasterEgg?: boolean;
  isTyping?: boolean;
  step?: number;
}

const STEP_DELAYS: Record<number, [number, number]> = {
  1: [2000, 4000], 2: [1500, 2500], 3: [1000, 2000],
  4: [1000, 2000], 5: [3000, 5000], 6: [0, 0],
};

const QUICK_ACTIONS = [
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, label: '生成架构代码' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: '一键部署配置' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, label: 'UI 玻璃效组件' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.836-.437-1.124-.298-.328-.485-.75-.485-1.188C12.726 17 13.5 16.274 14.5 16.274H17c3.314 0 6-2.686 6-6C23 6.477 18.075 2 12 2z"/></svg>, label: '色彩与主题' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label: '分析与预测' },
];

const HISTORY_ITEMS = [
  'React 19 渲染并发剖析',
  'Next.js 边缘计算优化',
  '高级泛型约束范例',
  '基于 CSS 的景深模糊动画',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(18);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, refreshProfile } = useAuth();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (user) setRemaining(Math.max(0, 18 - (user.askCount || 0)));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '48px';
    ta.style.height = `${Math.max(48, Math.min(ta.scrollHeight, 180))}px`;
  }, []);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) textareaRef.current.style.height = '48px';
  }, []);

  const typewriter = useCallback((id: string, text: string) => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, displayContent: text.slice(0, i) } : m
      ));
      if (i >= text.length) clearInterval(interval);
    }, 15 + Math.random() * 10);
  }, []);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    resetHeight();
    setIsLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg, { id: 'thinking', role: 'ai', content: '', isTyping: true }]);

    try {
      const res = await sendMessage(msg);
      const [min, max] = STEP_DELAYS[res.step] || [1000, 2000];
      await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

      const aiId = crypto.randomUUID();
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'thinking');
        return [...filtered, {
          id: aiId, role: 'ai', content: res.reply,
          displayContent: res.step === 6 ? res.reply : '',
          isEasterEgg: res.isEasterEgg, step: res.step,
        }];
      });

      if (res.step !== 6) typewriter(aiId, res.reply);
      if (res.isEasterEgg) triggerConfetti();
      setRemaining(res.remaining);
      refreshProfile();
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '网络或服务器错误';
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const renderStep5Content = (text: string) => {
    const idx = text.indexOf('⚠️');
    if (idx === -1) return <ReactMarkdown>{text}</ReactMarkdown>;
    const beforeWarning = text.slice(0, idx);
    const warningText = text.slice(idx + 2).trim(); // Skip emoji
    return (
      <>
        <ReactMarkdown>{beforeWarning}</ReactMarkdown>
        <div className="gm-system-interrupt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{verticalAlign: 'middle'}}>{warningText}</span>
        </div>
      </>
    );
  };

  const renderContent = (msg: Message) => {
    const text = msg.displayContent ?? msg.content;
    if (!text) return null;
    if (msg.step === 5) return renderStep5Content(text);
    return <ReactMarkdown>{text}</ReactMarkdown>;
  };

  /* ── Sidebar ── */
  const sidebar = (
    <aside className={`gm-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="gm-sidebar-top">
        {/* New chat */}
        <button className="gm-sidebar-new" onClick={() => { setMessages([]); setInput(''); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5V19M5 12H19" />
          </svg>
          <span>开启新对话</span>
        </button>
      </div>

      {/* History */}
      <div className="gm-sidebar-section">
        {HISTORY_ITEMS.map((item, i) => (
          <button key={i} className="gm-sidebar-item">{item}</button>
        ))}
      </div>

      {/* User info at bottom */}
      <div className="gm-sidebar-bottom">
        <div className="gm-sidebar-user">
          <div className="gm-user-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="gm-sidebar-name" style={{fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)'}}>{user?.username || '用户'}</span>
        </div>
      </div>
    </aside>
  );

  /* ── Bottom input bar (shared) ── */
  const inputBar = (
    <div className="gm-input-wrap">
      <div className="gm-input-box">
        <button className="gm-input-icon" aria-label="附件" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          placeholder={remaining <= 0 ? '额度已用尽' : '提出你的复杂问题...'}
          disabled={isLoading || remaining <= 0}
          rows={1}
          className="gm-textarea"
          aria-label="消息发出区域"
        />
        <div className="gm-input-actions">
          <span className="gm-remaining-badge">{remaining}</span>
          <button className="gm-input-icon" aria-label="语音" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim() || remaining <= 0}
            className="gm-send-btn"
            aria-label="发送"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Welcome (no messages) ── */
  if (!hasMessages) {
    return (
      <div className="gm-layout">
        {sidebar}
        <div className="gm-main">
          {showConfetti && <ConfettiOverlay />}
          
          <div className="ambient-background" style={{position: 'absolute'}}>
            <div className="ambient-glow-1"></div>
            <div className="ambient-glow-2"></div>
          </div>

          <div className="gm-topbar">
            <button className="gm-topbar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="侧边栏开关">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>
            <span className="gm-topbar-model">FoolFullAPI 极致模型</span>
            <div style={{ flex: 1 }} />
          </div>

          <div className="gm-welcome-center">
            <h1 className="gm-welcome-title">在此探索深度思考的边界。</h1>
            <p className="gm-welcome-sub">强大的上下文处理、代码解构与无限多步逻辑推理。</p>
          </div>

          <div className="gm-welcome-input-area" style={{width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 5% 3rem'}}>
            {inputBar}
            <div className="gm-quick-actions">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} className="gm-quick-btn" onClick={() => handleSend(a.label)} disabled={isLoading || remaining <= 0}>
                  <span style={{opacity: 0.6}}>{a.icon}</span> <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Conversation ── */
  return (
    <div className="gm-layout">
      {sidebar}
      <div className="gm-main">
        {showConfetti && <ConfettiOverlay />}

        <div className="ambient-background" style={{position: 'absolute'}}>
          <div className="ambient-glow-1" style={{opacity: 0.05}}></div>
        </div>

        {/* Top bar */}
        <div className="gm-topbar" style={{background: 'rgba(0,0,0,0.7)'}}>
          <button className="gm-topbar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="侧边栏开关">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <span className="gm-topbar-model">FoolFullAPI 对话视窗</span>
          <div style={{ flex: 1 }} />
          <button className="gm-topbar-action" aria-label="分享" style={{padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{fontWeight: 600}}>导出</span>
          </button>
        </div>

        {/* Messages */}
        <div className="gm-messages" role="log" aria-label="上下文记录">
          {messages.map(msg => (
            <div key={msg.id} className={`gm-msg ${msg.role}${msg.isEasterEgg ? ' easter-egg' : ''}${msg.step === 2 ? ' step-progress' : ''}`}>
              {msg.role === 'user' ? (
                /* User message: glass background */
                <div className="gm-user-msg">
                  <div className="gm-user-msg-content">{msg.content}</div>
                </div>
              ) : msg.isTyping ? (
                /* Typing indicator */
                <div className="gm-ai-msg">
                  <div className="gm-ai-icon thinking-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="gm-typing"><span /><span /><span /></div>
                </div>
              ) : (
                /* AI message */
                <div className="gm-ai-msg">
                  <div className="gm-ai-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="gm-ai-content" style={{flex: 1, minWidth: 0}}>
                    <div className={`gm-ai-text${msg.step === 2 ? ' mono' : ''}`}>
                      {renderContent(msg)}
                    </div>
                    {/* Action bar under AI message */}
                    <div className="gm-action-bar" style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                      <button className="gm-action-btn" title="喜欢">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                      </button>
                      <button className="gm-action-btn" title="不符">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
                      </button>
                      <button className="gm-action-btn" title="拷贝" onClick={() => navigator.clipboard.writeText(msg.content)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      </button>
                      <button className="gm-action-btn" title="重试">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom input */}
        {inputBar}
      </div>
    </div>
  );
}

/* ── Confetti ── */
function ConfettiOverlay() {
  const colors = ['#ff375f','#ff9f0a','#ffd60a','#30d158','#5ac8fa','#bf5af2','#5e5ce6','#ff6482'];
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 3,
    size: 5 + Math.random() * 7,
  }));
  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map((p, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${p.left}%`, backgroundColor: p.color,
          width: `${p.size}px`, height: `${p.size * 0.5}px`,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}
    </div>
  );
}
