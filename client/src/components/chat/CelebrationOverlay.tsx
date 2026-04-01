import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── AI Logo 图片列表 ──────────────────────────────────────────────────────
const AI_LOGOS = [
  "http://husteread.com/wp-content/uploads/2026/01/豆包.png",
  "http://husteread.com/wp-content/uploads/2026/01/kimi2.png",
  "http://husteread.com/wp-content/uploads/2026/01/deepseek-e1767380863995.png",
  "http://husteread.com/wp-content/uploads/2026/01/Tongyi-Qianwen.png",
  "http://husteread.com/wp-content/uploads/2026/01/文心一言.png",
  "http://husteread.com/wp-content/uploads/2026/01/chatgpt.png",
  "http://husteread.com/wp-content/uploads/2026/01/Grok.png",
  "http://husteread.com/wp-content/uploads/2026/01/gemini-ai.png",
  "http://husteread.com/wp-content/uploads/2026/01/Claude.png",
  "http://husteread.com/wp-content/uploads/2026/01/perplexity101.png",
  "http://husteread.com/wp-content/uploads/2026/01/即梦图标.png",
  "http://husteread.com/wp-content/uploads/2026/01/智谱_AI.png",
];

// ── 庆祝 Emoji 列表 ──────────────────────────────────────────────────────
const CELEBRATION_EMOJIS = [
  "🎉", "🎊", "🥳", "🤡", "🎪", "🎭", "🎈", "🎁", "🏆", "⭐",
  "🌟", "✨", "💫", "🔥", "💥", "🎯", "🃏", "👻", "😈", "🤖",
  "🎃", "🦄", "🐸", "🤹", "🎆", "🎇", "🪅", "🧨", "💎", "👑",
];

// ── 掉落物数据 ─────────────────────────────────────────────────────────
interface FallingItem {
  id: number;
  type: "emoji" | "logo";
  content: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  startRot: number;
  endRot: number;
  wobbleX: number;
  opacity: number;
}

function generateItems(count: number): FallingItem[] {
  const items: FallingItem[] = [];
  for (let i = 0; i < count; i++) {
    const isLogo = Math.random() < 0.35;
    const spinDir = Math.random() > 0.5 ? 1 : -1;
    items.push({
      id: i,
      type: isLogo ? "logo" : "emoji",
      content: isLogo
        ? AI_LOGOS[Math.floor(Math.random() * AI_LOGOS.length)]
        : CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)],
      left: Math.random() * 96 + 2,             // 2-98 vw
      size: isLogo ? 30 + Math.random() * 28 : 22 + Math.random() * 26,
      delay: Math.random() * 3.5,                // stagger 0-3.5s
      duration: 3 + Math.random() * 3.5,         // 3-6.5s fall
      startRot: Math.random() * 360,
      endRot: spinDir * (180 + Math.random() * 540),
      wobbleX: (Math.random() - 0.5) * 120,      // -60 to +60
      opacity: 0.75 + Math.random() * 0.25,
    });
  }
  return items;
}

// ── 单个掉落物组件（framer-motion 驱动）────────────────────────────────
function FallingPiece({ item }: { item: FallingItem }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${item.left}%`, top: -80 }}
      initial={{
        y: 0,
        x: 0,
        rotate: item.startRot,
        opacity: item.opacity,
      }}
      animate={{
        y: "120vh",
        x: [0, item.wobbleX * 0.6, -item.wobbleX * 0.4, item.wobbleX * 0.2, 0],
        rotate: item.startRot + item.endRot,
        opacity: [item.opacity, item.opacity, item.opacity * 0.8, 0],
      }}
      transition={{
        duration: item.duration,
        delay: item.delay,
        ease: "easeIn",
        x: {
          duration: item.duration,
          delay: item.delay,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        },
        opacity: {
          duration: item.duration,
          delay: item.delay,
          times: [0, 0.4, 0.7, 1],
        },
      }}
    >
      {item.type === "emoji" ? (
        <span
          style={{
            fontSize: `${item.size}px`,
            display: "block",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            lineHeight: 1,
          }}
        >
          {item.content}
        </span>
      ) : (
        <img
          src={item.content}
          alt=""
          draggable={false}
          style={{
            width: `${item.size}px`,
            height: `${item.size}px`,
            objectFit: "contain",
            borderRadius: "8px",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
          }}
        />
      )}
    </motion.div>
  );
}

// ── 主组件 ─────────────────────────────────────────────────────────────
export function CelebrationOverlay({ show }: { show: boolean }) {
  const [showTitle, setShowTitle] = useState(false);

  const items = useMemo(() => (show ? generateItems(60) : []), [show]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShowTitle(true), 500);
      return () => clearTimeout(timer);
    }
    setShowTitle(false);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* 半透明遮罩 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* ── 掉落物 ── */}
          {items.map((item) => (
            <FallingPiece key={item.id} item={item} />
          ))}

          {/* ── 中央标题 ── */}
          <AnimatePresence>
            {showTitle && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative text-center">
                  {/* 光晕背景 */}
                  <div className="absolute -inset-20 rounded-full bg-gradient-to-br from-purple-500/20 via-amber-500/15 to-purple-600/20 blur-3xl" />
                  <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-amber-400/10 to-purple-500/10 blur-2xl animate-pulse" />

                  {/* 主标题 */}
                  <motion.h1
                    className="relative text-6xl sm:text-7xl md:text-8xl font-black tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #c084fc 0%, #fbbf24 25%, #e879f9 50%, #f59e0b 75%, #a855f7 100%)",
                      backgroundSize: "300% 300%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "celebGradient 3s ease infinite",
                      filter: "drop-shadow(0 0 40px rgba(168,85,247,0.4)) drop-shadow(0 0 80px rgba(245,158,11,0.2))",
                    }}
                    initial={{ y: 30, rotateX: 45 }}
                    animate={{ y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    愚人节快乐
                  </motion.h1>

                  {/* 副标题 */}
                  <motion.p
                    className="relative mt-3 text-lg sm:text-xl font-medium tracking-widest"
                    style={{
                      background: "linear-gradient(90deg, #d8b4fe, #fde68a, #d8b4fe)",
                      backgroundSize: "200% 100%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "celebGradient 4s ease infinite reverse",
                    }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    🃏 April Fools&apos; Day 2026 🃏
                  </motion.p>

                  {/* 品牌 */}
                  <motion.p
                    className="relative mt-2 text-xs tracking-[0.3em] text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                  >
                    AgentsNav · FoolFullAPI
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
