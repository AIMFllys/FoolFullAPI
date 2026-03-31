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
  1: [3000, 5000], 2: [2000, 3000], 3: [1000, 2000],
  4: [1000, 2000], 5: [4000, 6000], 6: [0, 0],
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(18);
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (user) setRemaining(Math.max(0, 18 - (user.askCount || 0)));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const typewriter = useCallback((id: string, text: string) => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, displayContent: text.slice(0, i) } : m));
      if (i >= text.length) clearInterval(interval);
    }, 25 + Math.random() * 20);
  }, []);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg, { id: 'thinking', role: 'ai', content: '', isTyping: true }]);

    try {
      const res = await sendMessage(text);
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

      // Step 6: show immediately, no typewriter
      if (res.step !== 6) {
        typewriter(aiId, res.reply);
      }

      if (res.isEasterEgg) triggerConfetti();
      setRemaining(res.remaining);
      refreshProfile();
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '发送失败';
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /** Render Step 5 content with the ⚠️ system interrupt styled differently */
  const renderStep5Content = (text: string) => {
    const markerIdx = text.indexOf('⚠️');
    if (markerIdx === -1) return <ReactMarkdown>{text}</ReactMarkdown>;
    const before = text.slice(0, markerIdx);
    const after = text.slice(markerIdx);
    return (
      <>
        <ReactMarkdown>{before}</ReactMarkdown>
        <div className="system-interrupt">{after}</div>
      </>
    );
  };

  const renderMessageContent = (msg: Message) => {
    const text = msg.displayContent ?? msg.content;
    if (!text) return null;

    // Step 5: split at ⚠️ marker for special styling
    if (msg.step === 5) return renderStep5Content(text);

    // All other steps: normal markdown
    return <ReactMarkdown>{text}</ReactMarkdown>;
  };

  return (
    <div className="chat-page">
      {showConfetti && <ConfettiOverlay />}

      <div className="chat-header">
        <span className="model-name">Claude Opos4 母4.6</span>
        <span className="remaining">剩余 {remaining} 次</span>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role} ${msg.isEasterEgg ? 'easter-egg' : ''} ${msg.step === 2 ? 'step-progress' : ''}`}>
            {msg.isTyping ? (
              <div className="typing-indicator"><span /><span /><span /></div>
            ) : (
              <div className="message-content">
                {renderMessageContent(msg)}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={remaining <= 0 ? '体验次数已用完' : '输入你的问题...'}
          disabled={isLoading || remaining <= 0}
          rows={2}
          aria-label="消息输入框"
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim() || remaining <= 0} className="btn-send">
          发送
        </button>
      </div>
    </div>
  );
}

/** Confetti overlay for Step 6 easter egg */
function ConfettiOverlay() {
  const colors = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#00bcd4','#4caf50','#ffeb3b','#ff9800'];
  const pieces = Array.from({ length: 60 }, (_, i) => {
    const color = colors[i % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 2 + Math.random() * 3;
    const size = 6 + Math.random() * 8;
    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          backgroundColor: color,
          width: `${size}px`,
          height: `${size * 0.6}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });
  return <div className="confetti-overlay">{pieces}</div>;
}
