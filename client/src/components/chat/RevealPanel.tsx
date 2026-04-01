import { motion } from "framer-motion";
import { PartyPopper, RotateCcw } from "lucide-react";

interface RevealPanelProps {
  message: string;
  onReset?: () => void;
}

const STEPS = [
  { num: 1, text: "认真分析你的问题", emoji: "🔍" },
  { num: 2, text: "假装在深度处理", emoji: "⏳" },
  { num: 3, text: "假装系统中断", emoji: "⚠️" },
  { num: 4, text: "假装连接恢复", emoji: "🔄" },
  { num: 5, text: "快给答案了——又断了", emoji: "💥" },
  { num: 6, text: "你正在看的这一条", emoji: "🎯" },
];

export function RevealPanel({ message, onReset }: RevealPanelProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-red-950/20 p-6 shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* 背景光效 */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      {/* 标题区 */}
      <motion.div
        className="mb-5 flex items-center gap-3"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 shadow-inner">
          <PartyPopper className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-amber-200">
            🎉 愚人节快乐！
          </h3>
          <p className="text-xs tracking-wide text-amber-400/70">
            April Fools&apos; Day · AgentsNav FoolFullAPI
          </p>
        </div>
      </motion.div>

      {/* 6 步流程回顾 */}
      <motion.div
        className="mb-5 space-y-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-1.5 text-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.25 }}
          >
            <span className="text-sm">{step.emoji}</span>
            <span className="flex-1 text-neutral-300">
              第 {step.num} 轮：{step.text}
            </span>
            <span className="text-xs text-green-400">✅</span>
          </motion.div>
        ))}
      </motion.div>

      {/* 正文说明 */}
      <motion.p
        className="mb-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-neutral-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.35 }}
      >
        {message}
      </motion.p>

      {/* 重来按钮 */}
      {onReset && (
        <motion.button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          再来一轮
        </motion.button>
      )}
    </motion.div>
  );
}
