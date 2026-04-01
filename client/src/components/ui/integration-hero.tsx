"use client";

import { Button } from "@/components/ui/button";
import React from "react";

const ICONS_ROW1 = [
  "http://husteread.com/wp-content/uploads/2026/01/豆包.png",
  "http://husteread.com/wp-content/uploads/2026/01/kimi2.png",
  "http://husteread.com/wp-content/uploads/2026/01/deepseek-e1767380863995.png",
  "http://husteread.com/wp-content/uploads/2026/01/Tongyi-Qianwen.png",
  "http://husteread.com/wp-content/uploads/2026/01/文心一言.png",
  "http://husteread.com/wp-content/uploads/2026/01/chatgpt.png",
];

const ICONS_ROW2 = [
  "http://husteread.com/wp-content/uploads/2026/01/Grok.png",
  "http://husteread.com/wp-content/uploads/2026/01/gemini-ai.png",
  "http://husteread.com/wp-content/uploads/2026/01/Claude.png",
  "http://husteread.com/wp-content/uploads/2026/01/perplexity101.png",
  "http://husteread.com/wp-content/uploads/2026/01/即梦图标.png",
  "http://husteread.com/wp-content/uploads/2026/01/智谱_AI.png",
];

// Utility to repeat icons enough times
const repeatedIcons = (icons: string[], repeat = 4) => Array.from({ length: repeat }).flatMap(() => icons);

export default function IntegrationHero() {
  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-[#0a0a1a] min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Light grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <span className="inline-block px-3 py-1 mb-4 text-sm rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white">
          ⚡ Integrations
        </span>
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-black dark:text-white">
          Integrate with favorite tools
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          250+ top apps are available to integrate seamlessly with your workflow.
        </p>
        <Button variant="default" className="mt-8 px-6 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">
          Get started
        </Button>

        {/* Carousel */}
        <div className="mt-12 overflow-hidden relative pb-2 w-full max-w-full">
          {/* Row 1 */}
          <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
            {repeatedIcons(ICONS_ROW1, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center p-2.5">
                <img src={src} alt="icon" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-10 whitespace-nowrap mt-6 animate-scroll-right">
            {repeatedIcons(ICONS_ROW2, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center p-2.5">
                <img src={src} alt="icon" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>

          {/* Fade overlays */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      ` }} />
    </section>
  );
}
