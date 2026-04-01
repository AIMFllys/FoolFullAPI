"use client";

import { Button } from "@/components/ui/button";

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

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const repeatedIcons = (icons: string[], repeat = 4) => Array.from({ length: repeat }).flatMap(() => icons);

export default function IntegrationHero() {
  return (
    <section className="relative py-24 overflow-hidden bg-black min-h-[calc(100vh-76px)] flex flex-col justify-center">
      {/* 
        The "Black Hole" Aesthetic 
        Zero purple/blue. Pure abyss black with intense, high-contrast event horizon glow.
      */}
      
      {/* Outer Accretion Disk Glow (Tilted, Wide) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] max-w-[1400px] h-[70vw] max-h-[700px] rounded-[50%] bg-transparent shadow-[0_0_120px_40px_rgba(255,255,255,0.08),inset_0_0_80px_30px_rgba(255,255,255,0.03)] border border-white/5 pointer-events-none transform -rotate-[15deg] blur-[8px] z-0"></div>
      
      {/* Intense Event Horizon Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-transparent shadow-[0_0_100px_30px_rgba(255,255,255,0.2),inset_0_0_60px_20px_rgba(255,255,255,0.1)] pointer-events-none z-0"></div>
      
      {/* Pure Absolute Zero Singularity */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-black shadow-[inset_0_0_40px_20px_rgba(0,0,0,1)] pointer-events-none z-0"></div>

      {/* Light grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-white/20 bg-white/5 text-gray-200 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            🌌 The Event Horizon
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl lg:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
          Integrate with favorite tools
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          250+ top apps are available to integrate seamlessly with your workflow. 
          Experience the singularity of intelligence.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button asChild variant="default" className="mt-10 px-8 py-6 rounded-full bg-white text-black font-bold text-lg hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] border border-transparent hover:border-white cursor-pointer relative z-20 overflow-hidden group">
            <Link to="/chat">
              <span className="relative z-10">开启AI对话</span>
              {/* Sweep animation overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-[100%] group-hover:animate-[sweep_1.5s_ease-in-out_infinite] z-0" />
            </Link>
          </Button>
        </motion.div>

        {/* Carousel */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="mt-16 overflow-hidden relative pb-4 w-full max-w-full mix-blend-screen"
        >
          {/* Row 1 */}
          <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
            {repeatedIcons(ICONS_ROW1, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center p-3 opacity-90 transition-transform hover:scale-110 hover:opacity-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                <img src={src} alt="icon" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-10 whitespace-nowrap mt-8 animate-scroll-right">
            {repeatedIcons(ICONS_ROW2, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center p-3 opacity-90 transition-transform hover:scale-110 hover:opacity-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                <img src={src} alt="icon" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>

          {/* Fade overlays - perfectly matching black background */}
          <div className="absolute left-0 top-0 h-full w-40 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none" />
        </motion.div>
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
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scroll-left {
          animation: scroll-left 35s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 35s linear infinite;
        }
      ` }} />
    </section>
  );
}
