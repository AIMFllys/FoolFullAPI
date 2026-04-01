import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from "lucide-react";

/* ── Phase 2: 假进度条 ───────────────────────────────────────────────────── */

export function FakeProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [12, 28, 45, 58, 72, 81, 85, 87];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-950/20 px-4 py-3 backdrop-blur-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-blue-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          深度处理中
        </span>
        <span className="tabular-nums text-blue-400">{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-blue-950/50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-[11px] text-blue-400/60">
        预计剩余时间：{progress >= 87 ? "即将完成" : `${Math.max(2, 12 - Math.floor(progress / 8))} 秒`}
      </p>
    </motion.div>
  );
}

/* ── Phase 3: 中断警告横条 ───────────────────────────────────────────────── */

export function InterruptBanner() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 backdrop-blur-sm"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-300">连接异常</p>
        <p className="mt-0.5 text-xs leading-5 text-amber-400/70">
          推理服务集群出现网络抖动，任务进度已保存。正在尝试重新连接{dots}
        </p>
      </div>
      <span className="mt-0.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
        中断
      </span>
    </motion.div>
  );
}

/* ── Phase 4: 恢复横条 ───────────────────────────────────────────────────── */

export function RecoveryBanner() {
  return (
    <motion.div
      className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 backdrop-blur-sm"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-emerald-300">连接已恢复</p>
        <p className="mt-0.5 text-xs leading-5 text-emerald-400/70">
          服务已恢复正常，检测到之前的请求记录。建议重新生成以确保结果完整性。
        </p>
      </div>
      <span className="mt-0.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        已恢复
      </span>
    </motion.div>
  );
}

/* ── Phase 5: 进度到 95% 然后卡住 ────────────────────────────────────────── */

export function CliffProgress() {
  const [progress, setProgress] = useState(0);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const steps = [15, 35, 52, 68, 78, 85, 90, 93, 95];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i]);
        i++;
        if (i >= steps.length) {
          setFrozen(true);
        }
      }
    }, 350);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="mt-3 rounded-2xl border border-red-500/20 bg-red-950/15 px-4 py-3 backdrop-blur-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-neutral-300">
          {frozen ? (
            <AlertTriangle className="h-3 w-3 text-red-400" />
          ) : (
            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
          )}
          {frozen ? "响应链路中断" : "正在生成最终内容"}
        </span>
        <span className={`tabular-nums ${frozen ? "text-red-400" : "text-blue-400"}`}>
          {progress}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800/60">
        <motion.div
          className={`h-full rounded-full ${frozen ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      {frozen && (
        <motion.p
          className="mt-2 text-[11px] text-red-400/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ⚠️ 内容生成已暂停，链路出现不可恢复的中断
        </motion.p>
      )}
    </motion.div>
  );
}

/* ── Deep 模式中断横条 ───────────────────────────────────────────────────── */

export function DeepInterruptBanner() {
  return (
    <motion.div
      className="mt-3 flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-950/15 px-3.5 py-2 text-xs backdrop-blur-sm"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span className="text-amber-300/80">
        流式响应链路已中断，后续内容停止推送
      </span>
    </motion.div>
  );
}
