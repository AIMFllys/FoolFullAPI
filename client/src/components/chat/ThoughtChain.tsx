"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { SearchSourceItem } from "@/api/chat";

type StepId = "source" | "think" | "plan" | "review";
type StepStatus = "completed" | "in-progress" | "pending" | "need-help" | "failed";

interface ThoughtChainProps {
  sourceItems: SearchSourceItem[];
  think: string;
  plan: string;
  review: string;
  isStreaming: boolean;
}

interface StepItem {
  id: StepId;
  title: string;
  description: string;
  status: StepStatus;
  detail: string;
  countLabel?: string;
  sources?: SearchSourceItem[];
}

export function ThoughtChain({
  sourceItems,
  think,
  plan,
  review,
  isStreaming,
}: ThoughtChainProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sourceReady = sourceItems.length > 0;
  const thinkReady = Boolean(think.trim());
  const planReady = Boolean(plan.trim());
  const reviewReady = Boolean(review.trim());

  const steps = useMemo<StepItem[]>(() => {
    const allSteps: StepItem[] = [
      {
        id: "source",
        title: "联网来源采集",
        description: sourceReady
          ? `已接入 ${sourceItems.length} 个来源节点`
          : "正在检索网页与站点来源",
        status: resolveStatus({ ready: sourceReady, streaming: isStreaming, unlocked: true }),
        detail: sourceItems
          .map((item) => `${item.source || safeHostname(item.url)} · ${item.title}`)
          .join("\n"),
        countLabel: sourceReady ? `${sourceItems.length} sources` : undefined,
        sources: sourceItems,
      },
      {
        id: "think",
        title: "问题拆解",
        description: thinkReady ? "已完成问题结构分析" : "正在拆解用户诉求与边界条件",
        status: resolveStatus({ ready: thinkReady, streaming: isStreaming, unlocked: sourceReady }),
        detail: think,
      },
      {
        id: "plan",
        title: "回答规划",
        description: planReady ? "已生成回答框架与策略" : "正在规划回答路径与组织结构",
        status: resolveStatus({ ready: planReady, streaming: isStreaming, unlocked: thinkReady }),
        detail: plan,
      },
      {
        id: "review",
        title: "资料复核",
        description: reviewReady ? "已复核资料一致性与可信度" : "正在复核来源冲突与有效性",
        status: resolveStatus({ ready: reviewReady, streaming: isStreaming, unlocked: planReady }),
        detail: review,
      },
    ];

    const visibleCount = getVisibleStepCount({
      sourceReady,
      thinkReady,
      planReady,
      reviewReady,
      isStreaming,
    });

    return allSteps.slice(0, visibleCount);
  }, [sourceItems, think, plan, review, sourceReady, thinkReady, planReady, reviewReady, isStreaming]);

  const [expandedStep, setExpandedStep] = useState<StepId | null>(steps[0]?.id ?? null);

  useEffect(() => {
    const latestVisibleStep = steps[steps.length - 1]?.id ?? null;
    if (!latestVisibleStep) {
      setExpandedStep(null);
      return;
    }

    setExpandedStep((current) => (current === latestVisibleStep ? current : latestVisibleStep));
  }, [steps]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-neutral-700/60 bg-neutral-950/35 px-3 py-3 shadow-inner shadow-black/20">
      <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        Thought Chain
      </div>
      <motion.div
        className="overflow-hidden rounded-2xl border border-white/8 bg-black/25"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <LayoutGroup>
          <div className="overflow-hidden p-3">
            <ul className="space-y-1 overflow-hidden">
              <AnimatePresence initial={false}>
                {steps.map((step, index) => {
                  const isExpanded = expandedStep === step.id;
                  const isCompleted = step.status === "completed";

                  return (
                    <motion.li
                      key={step.id}
                      className={index !== 0 ? "mt-1 pt-2" : ""}
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      transition={{ duration: 0.24 }}
                      layout
                    >
                      <motion.div
                        className="group flex items-center rounded-md px-3 py-1.5"
                        whileHover={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          transition: { duration: 0.2 },
                        }}
                      >
                        <motion.div
                          className="mr-2 flex-shrink-0 cursor-pointer"
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.08 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={step.status}
                              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                              transition={{ duration: 0.18 }}
                            >
                              {renderStatusIcon(step.status)}
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>

                        <motion.button
                          type="button"
                          className="flex min-w-0 flex-grow items-center justify-between text-left"
                          onClick={() => setExpandedStep((current) => (current === step.id ? null : step.id))}
                        >
                          <div className="mr-2 flex-1 truncate">
                            <span className={isCompleted ? "text-neutral-400 line-through" : "text-white"}>
                              {step.title}
                            </span>
                            <p className="truncate text-[11px] text-neutral-500">{step.description}</p>
                          </div>

                          <div className="flex flex-shrink-0 items-center space-x-2 text-xs">
                            {step.countLabel ? (
                              <motion.span
                                className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 shadow-sm"
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.18 }}
                              >
                                {step.countLabel}
                              </motion.span>
                            ) : null}

                            <motion.span
                              className={badgeClassName(step.status)}
                              initial={{ scale: 1 }}
                              animate={{ scale: prefersReducedMotion ? 1 : [1, 1.08, 1] }}
                              transition={{ duration: 0.3 }}
                              key={step.status}
                            >
                              {step.status}
                            </motion.span>
                          </div>
                        </motion.button>
                      </motion.div>

                      <AnimatePresence initial={false} mode="wait">
                        {isExpanded ? (
                          <motion.div
                            className="relative overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            layout
                          >
                            <div className="absolute bottom-0 left-[20px] top-0 border-l-2 border-dashed border-neutral-700/50" />
                            <div className="mt-1 mb-1.5 mr-2 ml-3 space-y-1 pl-6">
                              {step.id === "source" ? (
                                <div className="space-y-2 pl-1 text-xs text-neutral-300">
                                  {step.sources && step.sources.length > 0 ? (
                                    step.sources.map((item, sourceIndex) => (
                                      <motion.a
                                        key={`${item.id}-${item.url}`}
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 transition hover:border-white/15 hover:bg-white/[0.05]"
                                        initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.18, delay: sourceIndex * 0.03 }}
                                      >
                                        <div className="font-medium text-neutral-100">
                                          {item.source || safeHostname(item.url)}
                                        </div>
                                        <div className="mt-1 line-clamp-2 leading-6 text-neutral-400">
                                          {item.title}
                                        </div>
                                      </motion.a>
                                    ))
                                  ) : (
                                    <p className="py-1 text-neutral-500">正在抓取搜索来源...</p>
                                  )}
                                </div>
                              ) : (
                                <div className="ml-1.5 border-l border-dashed border-white/10 pl-5 text-xs text-neutral-400">
                                  <p className="py-1 whitespace-pre-wrap leading-7">
                                    {step.detail || "正在生成..."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}

function getVisibleStepCount({
  sourceReady,
  thinkReady,
  planReady,
  reviewReady,
  isStreaming,
}: {
  sourceReady: boolean;
  thinkReady: boolean;
  planReady: boolean;
  reviewReady: boolean;
  isStreaming: boolean;
}): number {
  if (!sourceReady) return isStreaming ? 1 : 0;
  if (!thinkReady) return isStreaming ? 2 : 1;
  if (!planReady) return isStreaming ? 3 : 2;
  if (!reviewReady) return isStreaming ? 4 : 3;
  return 4;
}

function resolveStatus({
  ready,
  streaming,
  unlocked,
}: {
  ready: boolean;
  streaming: boolean;
  unlocked: boolean;
}): StepStatus {
  if (ready) return "completed";
  if (!unlocked) return "pending";
  return streaming ? "in-progress" : "need-help";
}

function renderStatusIcon(status: StepStatus) {
  if (status === "completed") {
    return <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />;
  }
  if (status === "in-progress") {
    return <CircleDotDashed className="h-4.5 w-4.5 text-blue-500" />;
  }
  if (status === "need-help") {
    return <CircleAlert className="h-4.5 w-4.5 text-yellow-500" />;
  }
  if (status === "failed") {
    return <CircleX className="h-4.5 w-4.5 text-red-500" />;
  }
  return <Circle className="h-4.5 w-4.5 text-neutral-500" />;
}

function badgeClassName(status: StepStatus): string {
  if (status === "completed") {
    return "rounded px-1.5 py-0.5 bg-green-500/15 text-green-300";
  }
  if (status === "in-progress") {
    return "rounded px-1.5 py-0.5 bg-blue-500/15 text-blue-300";
  }
  if (status === "need-help") {
    return "rounded px-1.5 py-0.5 bg-yellow-500/15 text-yellow-300";
  }
  if (status === "failed") {
    return "rounded px-1.5 py-0.5 bg-red-500/15 text-red-300";
  }
  return "rounded px-1.5 py-0.5 bg-white/8 text-neutral-400";
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "未知来源";
  }
}
