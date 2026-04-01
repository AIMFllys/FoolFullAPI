"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpIcon,
  Bot,
  ChevronDown,
  CircleUserRound,
  Code2,
  Compass,
  FileUp,
  FolderOpen,
  Home,
  ImageIcon,
  Layers,
  MessageSquare,
  MonitorIcon,
  MonitorPlay,
  Palette,
  Paperclip,
  PlusIcon,
  Rocket,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  User,
} from "lucide-react";
import { sendMessage, streamMessage, type ChatMode, type SearchSourceItem } from "@/api/chat";
import { ThoughtChain } from "@/components/chat/ThoughtChain";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      mode: ChatMode;
      content: string;
      model: string | null;
      rawXml?: string;
      sourceItems: SearchSourceItem[];
      think: string;
      plan: string;
      review: string;
      isStreaming: boolean;
      isEasterEgg?: boolean;
      step?: number | null;
      error?: string | null;
    };

const FRONTEND_MODELS = [
  "OpenAI GPT-5.4",
  "Anthropic Claude Opus 4.6",
  "Google Gemini 2.5 Pro",
  "xAI Grok 4",
  "DeepSeek-R1-0528",
  "Qwen 3.5 Plus",
  "Kimi K2.5",
] as const;

const QUICK_PROMPTS: Array<{ label: string; icon: ReactNode; prompt: string }> = [
  { label: "生成代码", icon: <Code2 className="h-4 w-4" />, prompt: "帮我生成一个现代化登录页的 React 代码" },
  { label: "发布应用", icon: <Rocket className="h-4 w-4" />, prompt: "演示如何部署一个 React + Express 应用" },
  { label: "UI 组件", icon: <Layers className="h-4 w-4" />, prompt: "给组件库设计一套深色主题方案" },
  { label: "主题构思", icon: <Palette className="h-4 w-4" />, prompt: "为空间黑配色整理一套页面视觉方向" },
  { label: "用户仪表盘", icon: <CircleUserRound className="h-4 w-4" />, prompt: "写一个用户仪表盘布局方案" },
  { label: "网页设计", icon: <MonitorIcon className="h-4 w-4" />, prompt: "设计一个高级感很强的 SaaS 落地页" },
  { label: "上传文档", icon: <FileUp className="h-4 w-4" />, prompt: "帮我总结一份技术文档的核心重点" },
  { label: "图像灵感", icon: <ImageIcon className="h-4 w-4" />, prompt: "给我一组适合深色科技页面的视觉灵感" },
];

function ModeChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-all duration-200",
        active
          ? "scale-105 bg-white/90 text-black shadow-sm"
          : "bg-neutral-800/70 text-neutral-400 hover:bg-neutral-700/80 hover:text-white",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("deep");
  const [selectedFrontendModel, setSelectedFrontendModel] = useState<(typeof FRONTEND_MODELS)[number]>(
    "OpenAI GPT-5.4",
  );
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    }

    if (modelMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [modelMenuOpen]);

  async function handleSend(preset?: string): Promise<void> {
    const rawMessage = (preset || input).trim();
    if (!rawMessage || isLoading) return;

    setInput("");
    setError(null);
    setIsLoading(true);
    resetTextareaHeight();

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: rawMessage };
    const assistantId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      mode,
      content: "",
      model: null,
      sourceItems: [],
      think: "",
      plan: "",
      review: "",
      isStreaming: mode === "deep",
      error: null,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

    try {
      if (mode === "deep") {
        await streamMessage({ message: rawMessage, mode }, (event) => {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id !== assistantId || message.role !== "assistant") return message;

              switch (event.event) {
                case "meta":
                  return { ...message, model: event.data.model };
                case "source":
                  return { ...message, sourceItems: event.data.items };
                case "think":
                  return { ...message, think: cleanSection(event.data.content, message.think) };
                case "plan":
                  return { ...message, plan: cleanSection(event.data.content, message.plan) };
                case "review":
                  return { ...message, review: cleanSection(event.data.content, message.review) };
                case "answer_delta":
                  return { ...message, content: `${message.content}${event.data.delta}` };
                case "done":
                  return {
                    ...message,
                    model: event.data.model || message.model,
                    content: chooseFinalAnswer(event.data.sections?.answer, message.content),
                    rawXml: event.data.rawXml,
                    sourceItems: event.data.sourceItems || message.sourceItems,
                    think: cleanSection(event.data.sections?.think, message.think),
                    plan: cleanSection(event.data.sections?.plan, message.plan),
                    review: cleanSection(event.data.sections?.review, message.review),
                    isStreaming: false,
                  };
                case "error":
                  return { ...message, isStreaming: false, error: event.data.message };
                default:
                  return message;
              }
            }),
          );
        });
      } else {
        const response = await sendMessage({ message: rawMessage, mode });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId && message.role === "assistant"
              ? {
                  ...message,
                  content: response.reply,
                  model: response.model || null,
                  isStreaming: false,
                  isEasterEgg: response.isEasterEgg,
                  step: response.step,
                }
              : message,
          ),
        );
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "请求失败，请稍后再试。";
      setError(message);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId && item.role === "assistant"
            ? { ...item, isStreaming: false, error: message }
            : item,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  function handleTextareaChange(value: string): void {
    setInput(value);
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "48px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }

  function resetTextareaHeight(): void {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }
  }

  return (
    <div className="chat-shell relative flex h-screen w-full overflow-hidden text-neutral-100">
      <div className="chat-ambient chat-ambient-one" />
      <div className="chat-ambient chat-ambient-two" />
      <div className="chat-grid-overlay" />

      <aside
        className={cn(
          "relative z-20 flex h-full shrink-0 flex-col overflow-hidden border-r border-neutral-800 bg-[#0a0a0a] shadow-2xl transition-all duration-300",
          sidebarOpen ? "w-60" : "w-0",
        )}
      >
        <div className="flex h-full w-60 flex-col">
          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-3 text-sm text-neutral-200 hover:bg-neutral-900"
              onClick={() => {
                setMessages([]);
                setInput("");
                setError(null);
              }}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              新对话
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 shrink-0 rounded-md text-neutral-500 hover:bg-neutral-900 hover:text-white"
              title="收起侧边栏"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
          </div>

          <div className="mx-3 h-px bg-neutral-800" />

          <div className="flex flex-1 flex-col gap-0.5 p-2">
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <Search className="h-4 w-4" />
              搜索对话
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <Bot className="h-4 w-4" />
              智能体
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <FolderOpen className="h-4 w-4" />
              项目
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <UploadCloud className="h-4 w-4" />
              文件上传
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <MonitorPlay className="h-4 w-4" />
              模型预览
            </Button>
          </div>

          <div className="border-t border-neutral-800 p-2">
            <motion.div
              className="mb-2 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-neutral-500">Mode</p>
              <div className="flex flex-wrap gap-2">
                <ModeChip
                  active={mode === "deep"}
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  label="深度"
                  onClick={() => setMode("deep")}
                />
                <ModeChip
                  active={mode === "normal"}
                  icon={<Compass className="h-3.5 w-3.5" />}
                  label="普通"
                  onClick={() => setMode("normal")}
                />
              </div>
              <p className="mt-3 text-xs leading-6 text-neutral-500">
                {mode === "deep"
                  ? "真实联网搜索与分步思考链"
                  : "经典流程对话视图"}
              </p>
            </motion.div>

            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200">
              <Settings className="h-4 w-4" />
              API 接入
            </Button>
            <div className="flex cursor-default items-center gap-3 px-4 py-2 text-sm text-neutral-500">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">访客</span>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="relative flex h-full flex-1 flex-col overflow-hidden"
        style={{
          backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!sidebarOpen ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-20 h-8 w-8 rounded-md border border-neutral-800/50 bg-black/40 text-neutral-400 shadow-sm backdrop-blur-md hover:bg-black/60 hover:text-white"
            title="展开侧边栏"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </Button>
        ) : null}

        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-xs text-neutral-300 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            <span className="hidden tracking-[0.18em] text-neutral-500 md:inline">FRONTEND MODEL</span>
            <div ref={modelMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setModelMenuOpen((value) => !value)}
                className={cn(
                  "flex min-w-[280px] items-center justify-between rounded-xl border border-white/12 bg-white/10 py-2 pl-3 pr-3 text-xs text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none backdrop-blur-xl transition hover:border-white/20 hover:bg-white/12",
                  modelMenuOpen ? "border-violet-400/70 bg-white/12" : "",
                )}
              >
                <span>{selectedFrontendModel}</span>
                <ChevronDown
                  className={cn(
                    "ml-3 h-3.5 w-3.5 text-neutral-500 transition-transform duration-200",
                    modelMenuOpen ? "rotate-180" : "",
                  )}
                />
              </button>

              <AnimatePresence>
                {modelMenuOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/12 bg-black/35 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]" />
                    <div className="relative p-2">
                      {FRONTEND_MODELS.map((modelName) => (
                        <button
                          key={modelName}
                          type="button"
                          onClick={() => {
                            setSelectedFrontendModel(modelName);
                            setModelMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-neutral-100 transition",
                            selectedFrontendModel === modelName
                              ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                              : "hover:bg-white/8 hover:text-white",
                          )}
                        >
                          {modelName}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-lg border border-neutral-800/50 bg-black/40 px-3 py-1.5 text-xs text-neutral-400 shadow-sm backdrop-blur-md transition-all hover:bg-black/60 hover:text-white"
          title="返回首页"
        >
          <Home className="h-3.5 w-3.5" />
          首页
        </Link>

        {!hasMessages ? (
          <motion.div
            className="flex flex-1 flex-col items-center justify-center -mt-[8vh]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <h1 className="mb-4 text-5xl font-semibold tracking-tight text-white drop-shadow-xl md:text-6xl">
                1037Solo AI
              </h1>
              <p className="text-sm font-medium tracking-wide text-neutral-300/90 md:text-base">
                延续原有界面风格，深度模式已接入真实联网搜索与分步思考链。
              </p>
            </motion.div>
            <motion.div
              className="mb-4 mt-14 w-full max-w-4xl px-4"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
            >
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {QUICK_PROMPTS.map((item, index) => (
                  <motion.button
                    key={item.label}
                    type="button"
                    onClick={() => void handleSend(item.prompt)}
                    className="chat-quick-action flex items-center gap-2 rounded-full border border-neutral-700 bg-black/50 px-4 py-2 text-xs text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.22 + index * 0.03 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto scroll-smooth px-4 pb-36 pt-24 md:px-10">
            <div className="flex w-full max-w-4xl flex-col gap-8">
              <AnimatePresence initial={false}>
                {messages.map((message, index) =>
                  message.role === "user" ? (
                    <motion.div
                      key={message.id}
                      className="flex w-full justify-end"
                      initial={{ opacity: 0, y: 14, x: 12 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, delay: index * 0.02 }}
                    >
                      <div className="chat-user-bubble max-w-[80%] rounded-[24px] rounded-br-sm bg-neutral-800/80 px-5 py-3.5 text-[15px] leading-relaxed text-neutral-50 shadow-sm backdrop-blur-md">
                        {message.content}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={message.id}
                      className="flex w-full justify-start"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, delay: index * 0.02 }}
                    >
                      <div className="group relative z-10 flex w-full gap-5 py-4 md:py-6">
                        <div className="pointer-events-none absolute -inset-x-4 -inset-y-0 rounded-3xl bg-black/10 opacity-80 backdrop-blur-xl" />
                        <motion.div
                          className="relative mt-0.5 shrink-0 text-blue-400 drop-shadow-md"
                          animate={message.isStreaming ? { rotate: [0, 4, -4, 0] } : { rotate: 0 }}
                          transition={{
                            duration: 1.8,
                            repeat: message.isStreaming ? Infinity : 0,
                            ease: "easeInOut",
                          }}
                        >
                          <Bot className="h-6 w-6" />
                        </motion.div>
                        <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-[15px] leading-relaxed text-neutral-200">
                          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                            <span className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-3 py-1">
                              {message.mode === "deep" ? "Deep Mode" : "Standard Mode"}
                            </span>
                            {message.step ? (
                              <span className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-3 py-1">
                                Step {message.step}
                              </span>
                            ) : null}
                          </div>

                          {message.mode === "deep" && hasThoughtChainContent(message) ? (
                            <motion.div
                              className="mb-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.24 }}
                            >
                              <ThoughtChain
                                sourceItems={message.sourceItems}
                                think={message.think}
                                plan={message.plan}
                                review={message.review}
                                isStreaming={message.isStreaming}
                              />
                            </motion.div>
                          ) : null}

                          <motion.div
                            className="relative mt-1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: 0.04 }}
                          >
                            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                              <Sparkles className="h-4 w-4" />
                              正式回答
                              {message.isStreaming ? (
                                <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] tracking-[0.18em] text-neutral-400">
                                  Streaming
                                </span>
                              ) : null}
                            </div>

                            {message.error ? (
                              <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-7 text-red-200">
                                {message.error}
                              </p>
                            ) : message.content ? (
                              <div className="prose prose-invert prose-neutral max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-neutral-700/50 prose-pre:bg-neutral-900/80 prose-pre:backdrop-blur-sm">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 py-2 opacity-70">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300" />
                              </div>
                            )}
                          </motion.div>

                          <div className="mt-5 flex items-center gap-4 border-t border-neutral-800/60 pt-3 text-neutral-500 opacity-60 transition-opacity group-hover:opacity-100">
                            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" title="来源">
                              <Search className="h-3.5 w-3.5" />
                              来源
                            </button>
                            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" title="赞同">
                              <PlusIcon className="h-3.5 w-3.5" />
                              赞同
                            </button>
                            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" title="反馈">
                              <MessageSquare className="h-3.5 w-3.5" />
                              反馈
                            </button>
                            <button
                              className="flex items-center gap-1.5 text-xs transition-colors hover:text-white"
                              title="复制"
                              onClick={() => navigator.clipboard.writeText(message.content)}
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              复制
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ),
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}

        <motion.div
          className={cn(
            "z-10 flex w-full shrink-0 justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            hasMessages ? "absolute bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-6 pt-12" : "mb-[20vh]",
          )}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="chat-input-shell relative mx-auto w-full max-w-4xl rounded-3xl border border-neutral-700/50 bg-black/50 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl">
            <div className="flex flex-wrap gap-1 px-3 pb-1 pt-2.5">
              <ModeChip
                active={mode === "deep"}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="深度模式"
                onClick={() => setMode("deep")}
              />
              <ModeChip
                active={mode === "normal"}
                icon={<Compass className="h-3.5 w-3.5" />}
                label="普通模式"
                onClick={() => setMode("normal")}
              />
            </div>
            <div className="mx-3 h-px bg-neutral-700/40" />

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => handleTextareaChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "deep"
                  ? "输入你需要联网搜索和深度分析的请求...（Enter 发送）"
                  : "输入你的请求...（Enter 发送）"
              }
              disabled={isLoading}
              className="textarea-scroll-hidden min-h-[56px] max-h-[250px] w-full resize-none border-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-white placeholder:text-neutral-500/80 focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <div className="flex items-center justify-between p-2 pb-3 pl-3">
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-neutral-400 transition-colors hover:bg-neutral-700/60 hover:text-white">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="mx-1 h-4 w-px bg-neutral-700/60" />
                <span className="rounded-lg border border-neutral-700/30 bg-neutral-800/40 px-3 py-1.5 text-xs font-medium text-neutral-400">
                  {mode === "deep" ? "深度模式：联网搜索 + 思考链" : "普通模式：标准对话流程"}
                </span>
              </div>

              <div className="flex items-center gap-3 pr-2">
                {error ? <span className="text-xs text-red-300">{error}</span> : null}
                <Button
                  onClick={() => void handleSend()}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full p-0 transition-all duration-300 shadow-none",
                    input.trim()
                      ? "bg-white text-black hover:scale-105 hover:bg-neutral-200 active:scale-95"
                      : "cursor-not-allowed bg-neutral-800 text-neutral-500",
                  )}
                >
                  <ArrowUpIcon className="mb-px ml-px h-4 w-4" strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function hasThoughtChainContent(message: Extract<Message, { role: "assistant" }>): boolean {
  return (
    message.isStreaming ||
    message.sourceItems.length > 0 ||
    Boolean(message.think.trim()) ||
    Boolean(message.plan.trim()) ||
    Boolean(message.review.trim())
  );
}

function cleanSection(nextValue: string | undefined, fallback: string): string {
  if (!nextValue?.trim()) return fallback;
  return containsMarkerSyntax(nextValue) ? fallback : nextValue.trim();
}

function chooseFinalAnswer(nextValue: string | undefined, fallback: string): string {
  if (!nextValue?.trim()) return fallback;
  return containsMarkerSyntax(nextValue) ? fallback : nextValue.trim();
}

function containsMarkerSyntax(value: string): boolean {
  return /<<\/?(THINK|PLAN|REVIEW|ANSWER)>>/i.test(value);
}
