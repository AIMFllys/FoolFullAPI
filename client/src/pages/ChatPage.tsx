"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { sendMessage } from "../api/chat";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon, FileUp, MonitorIcon, CircleUserRound, ArrowUpIcon, Paperclip, PlusIcon, Code2, Palette, Layers, Rocket, MessageSquare, Search, Bot, FolderOpen, UploadCloud, MonitorPlay, Settings, User
} from "lucide-react";

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

const MODELS = [
  { id: 'gpt-5-turbo', name: 'GPT-5 Turbo (2026)' },
  { id: 'claude-3.5-opus', name: 'Claude 3.5 Opus' },
  { id: 'claude-code', name: 'Claude-Code' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (High)' },
  { id: 'openai-o1', name: 'OpenAI o1' },
];

const TOP_TOOLS = [
  '联网搜索', '深度思考', '深度研究', '信息差同步', 'Claude-Code'
];

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border-neutral-700 bg-black/50 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(18);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const toggleTool = (tool: string) => {
    setActiveTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const handleSend = async (text?: string) => {
    const rawMsg = (text || input).trim();
    if (!rawMsg || isLoading) return;
    setInput('');
    adjustHeight(true);
    setIsLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: rawMsg };
    setMessages(prev => [...prev, userMsg, { id: 'thinking', role: 'ai', content: '', isTyping: true }]);

    try {
      const modelName = MODELS.find(m => m.id === selectedModel)?.name || selectedModel;
      const toolsCtx = activeTools.length > 0 ? ` [Active Tools: ${activeTools.join(', ')}] ` : '';
      const payloadString = `[System: You are ${modelName}.${toolsCtx}]\n\nUser: ${rawMsg}`;

      const res = await sendMessage(payloadString);
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
      setRemaining(res.remaining);
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '网络或服务器错误';
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-row overflow-hidden text-neutral-100">
      {/* Sidebar Navigation - Pure solid black */}
      <aside
        className={cn(
          "flex flex-col h-full bg-[#0a0a0a] border-r border-neutral-800 transition-all duration-300 relative z-20 shadow-2xl shrink-0 overflow-hidden",
          sidebarOpen ? "w-60" : "w-0"
        )}
      >
        <div className="w-60 flex flex-col h-full">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <Button variant="ghost" className="justify-start gap-3 flex-1 hover:bg-neutral-900 text-neutral-200 text-sm" onClick={() => { setMessages([]); setInput(''); }}>
              <MessageSquare className="w-4 h-4 shrink-0"/> 新对话
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-md w-8 h-8 shrink-0"
              title="收起侧边栏"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
          </div>

          <div className="h-px bg-neutral-800 mx-3" />

          <div className="flex flex-col gap-0.5 p-2 flex-1">
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <Search className="w-4 h-4" /> 搜索对话
            </Button>
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <Bot className="w-4 h-4" /> 智能体
            </Button>
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <FolderOpen className="w-4 h-4" /> 项目
            </Button>
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <UploadCloud className="w-4 h-4" /> 文件上传
            </Button>
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <MonitorPlay className="w-4 h-4" /> 模型预览
            </Button>
          </div>

          <div className="p-2 flex flex-col gap-0.5 border-t border-neutral-800">
            <Button variant="ghost" className="justify-start gap-3 w-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200">
              <Settings className="w-4 h-4" /> API 接入
            </Button>
            <div className="flex items-center gap-3 w-full px-4 py-2 text-neutral-500 cursor-default text-sm">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">访客</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container - background lives here so it aligns with the content area */}
      <div
        className="flex-1 flex flex-col h-full relative overflow-hidden"
        style={{
          backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Sidebar expand button - shown only when sidebar is collapsed */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 text-neutral-400 hover:text-white hover:bg-black/60 rounded-md w-8 h-8 bg-black/40 backdrop-blur-md border border-neutral-800/50 shadow-sm"
            title="展开侧边栏"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </Button>
        )}

        {/* Home button - always top right */}
        <Link
          to="/"
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-black/40 backdrop-blur-md border border-neutral-800/50 shadow-sm hover:bg-black/60 transition-all"
          title="返回主页"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          主页
        </Link>

        {/* Dynamic Center Title & History */}
        {!hasMessages ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center -mt-[8vh]">
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <h1 className="text-5xl md:text-6xl font-semibold text-white drop-shadow-xl mb-4 tracking-tight">
                1037Solo AI
              </h1>
              <p className="text-neutral-300/90 text-sm md:text-base font-medium tracking-wide">
                重塑工作流边界 — 从下方开始输入指令。
              </p>
            </div>
            {/* Quick Actions Array */}
            <div className="w-full max-w-3xl mt-14 mb-4 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-center flex-wrap gap-2.5">
                <QuickAction onClick={() => handleSend("帮我生成一份登录页面代码")} icon={<Code2 className="w-4 h-4" />} label="生成代码" />
                <QuickAction onClick={() => handleSend("演示如何部署应用")} icon={<Rocket className="w-4 h-4" />} label="发布应用" />
                <QuickAction onClick={() => handleSend("给组件库设计提供灵感")} icon={<Layers className="w-4 h-4" />} label="UI 组件" />
                <QuickAction onClick={() => handleSend("为空间黑配色搭建设计指南")} icon={<Palette className="w-4 h-4" />} label="主题构思" />
                <QuickAction onClick={() => handleSend("写一个用户仪表盘布局")} icon={<CircleUserRound className="w-4 h-4" />} label="用户仪表盘" />
                <QuickAction onClick={() => handleSend("设计一个现代网页")} icon={<MonitorIcon className="w-4 h-4" />} label="落地页" />
                <QuickAction onClick={() => handleSend("上传并解析这本文档")} icon={<FileUp className="w-4 h-4" />} label="上传文档" />
                <QuickAction onClick={() => handleSend("生成所需的设计素材图片")} icon={<ImageIcon className="w-4 h-4" />} label="图像素材" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full overflow-y-auto scroll-smooth pt-24 pb-36 px-4 md:px-10 flex flex-col items-center custom-scrollbar">
            <div className="w-full max-w-3xl flex flex-col gap-6">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex w-full animate-in fade-in duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'user' ? (
                     <div className="bg-neutral-800/90 backdrop-blur-md border border-neutral-700/80 px-5 py-3.5 rounded-[22px] rounded-br-sm max-w-[85%] text-[15px] leading-relaxed break-words text-neutral-100 shadow-sm">
                       {msg.content}
                     </div>
                  ) : msg.isTyping ? (
                     <div className="flex gap-4 max-w-[85%] bg-black/50 backdrop-blur-xl border border-neutral-700/60 p-5 rounded-[22px] rounded-tl-sm shadow-xl">
                       <Bot className="w-6 h-6 mt-0.5 text-blue-400 shrink-0 drop-shadow-md" />
                       <div className="flex items-center gap-1.5 h-6 opacity-70">
                         <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" />
                       </div>
                     </div>
                  ) : (
                     <div className="group flex gap-4 w-full bg-black/50 backdrop-blur-xl border border-neutral-700/60 p-5 md:p-6 rounded-[22px] rounded-tl-sm shadow-xl transition-colors hover:bg-black/60 hover:border-neutral-600/60">
                       <Bot className="w-6 h-6 mt-1 text-blue-400 shrink-0 drop-shadow-md" />
                       <div className="flex-1 text-[15px] leading-relaxed text-neutral-200 break-words flex flex-col w-full overflow-hidden">
                         <div className="prose prose-invert prose-neutral max-w-none prose-pre:bg-neutral-900/80 prose-pre:border prose-pre:border-neutral-700/50 prose-pre:backdrop-blur-sm prose-p:leading-relaxed">
                           <ReactMarkdown>{msg.displayContent ?? msg.content}</ReactMarkdown>
                         </div>
                         
                         {/* Action Bar */}
                         <div className="flex items-center gap-4 mt-5 pt-3 border-t border-neutral-800/60 text-neutral-500 opacity-60 group-hover:opacity-100 transition-opacity">
                           <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" title="来源"><Search className="w-3.5 h-3.5" /> 来源</button>
                           <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" title="喜欢"><PlusIcon className="w-3.5 h-3.5" /> 赞</button>
                           <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" title="反对"><MessageSquare className="w-3.5 h-3.5" /> 踩</button>
                           <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" title="复制" onClick={() => navigator.clipboard.writeText(msg.content)}><Paperclip className="w-3.5 h-3.5" /> 复制</button>
                         </div>
                       </div>
                     </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}

        {/* Input Box Section */}
        <div className={cn(
          "w-full flex justify-center px-4 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-10", 
          hasMessages ? "absolute bottom-0 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12" : "mb-[20vh]"
        )}>
          <div className="w-full max-w-3xl relative bg-black/60 backdrop-blur-2xl rounded-2xl border border-neutral-700/80 shadow-2xl ring-1 ring-white/5 mx-auto">
            {/* Tools row inside input card */}
            <div className="flex gap-1 px-3 pt-2.5 pb-1 flex-wrap">
              {TOP_TOOLS.map(tool => (
                <button
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all duration-200",
                    activeTools.includes(tool)
                      ? "bg-white/90 text-black shadow-sm scale-105"
                      : "bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-700/80"
                  )}
                >
                  {tool}
                </button>
              ))}
            </div>
            <div className="h-px bg-neutral-700/40 mx-3" />
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={remaining <= 0 ? "⚠️ 访问配额已用完，请稍后再试" : "输入你需要探索的任何请求... (Enter 发送)"}
              disabled={isLoading || remaining <= 0}
              className={cn(
                "w-full px-5 py-4 resize-none border-none",
                "bg-transparent text-white text-[15px] leading-relaxed",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-neutral-500/80 min-h-[56px] max-h-[250px] custom-scrollbar"
              )}
            />

            {/* Footer Formatter & Buttons */}
            <div className="flex items-center justify-between p-2 pl-3 pb-3">
              <div className="flex gap-1.5 items-center">
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-700/60 rounded-full w-9 h-9 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="h-4 w-px bg-neutral-700/60 mx-1" />
                {/* Custom Model Dropdown Selector overlay on native select */}
                <div className="relative flex items-center bg-transparent">
                  <select 
                    className="appearance-none bg-transparent hover:bg-neutral-800/50 py-1.5 pl-3 pr-8 rounded-lg text-xs text-neutral-400 font-medium hover:text-neutral-200 outline-none cursor-pointer transition-colors z-10"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={isLoading}
                  >
                    {MODELS.map(m => <option key={m.id} value={m.id} className="bg-neutral-900 text-white font-sans">{m.name}</option>)}
                  </select>
                  {/* Custom Arrow Icon for select */}
                  <div className="absolute right-2.5 pointer-events-none text-neutral-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pr-2">
                <span className="text-[11px] font-mono tracking-wider text-neutral-500 bg-neutral-800/40 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-700/30">
                  REMAINING: {remaining}
                </span>
                <Button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim() || remaining <= 0}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-none p-0",
                    input.trim() 
                      ? "bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95" 
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  )}
                >
                  <ArrowUpIcon className="w-4 h-4 ml-px mb-px" strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
