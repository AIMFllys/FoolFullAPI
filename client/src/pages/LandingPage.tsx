import IntegrationHero from '@/components/ui/integration-hero';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Zap, Shield, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function FeatureCard({ title, desc, icon: Icon, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative group p-8 rounded-3xl bg-white/5 border border-white/10 overflow-hidden"
    >
      {/* Dynamic Hover Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Ambient background blur inside card */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors duration-700 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm">{title}</h3>
        <p className="text-gray-400 leading-relaxed font-medium flex-grow">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <div ref={ref} className="relative py-40 overflow-hidden bg-black border-y border-white/5">
      {/* Subtle parallax background galaxy effect */}
      <motion.div style={{ y }} className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-6 text-center">
          {[
            { label: "Request Latency", value: "<15ms" },
            { label: "Uptime SLA", value: "99.99%" },
            { label: "Global Edge", value: "250+" },
            { label: "AI Models", value: "Infinite" },
          ].map((stat, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
               whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               viewport={{ once: true }}
               transition={{ duration: 1, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
               className="flex flex-col"
             >
               <span className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{stat.value}</span>
               <span className="text-gray-500 font-bold tracking-widest uppercase text-xs md:text-sm">{stat.label}</span>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page-container bg-black min-h-screen selection:bg-white/20">
      <IntegrationHero />
      
      {/* High-end Features Section */}
      <section className="py-40 bg-black relative z-10 overflow-hidden">
        {/* Ambient side blurs */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-white/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-white/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 drop-shadow-md">
              超越感官，重塑边界
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              体验黑洞级吸引力的极简界面。一个 API 极速调度全球顶级大模型，重新定义下一代 AI 基础设施标准。
            </p>
          </motion.div>

          {/* Bento Box Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              delay={0.1}
              icon={Zap}
              title="极光级低延迟"
              desc="依托全球分散部署的边缘计算节点，通过最优路由算法缩减每一跳网络，让您的每一次 Token 流式响应都如闪电般迅捷无感。"
            />
            <FeatureCard 
              delay={0.2}
              icon={Cpu}
              title="多维模型聚合"
              desc="打破技术壁垒，通过统一的全能端点将 GPT-4、Claude 3、DeepSeek 与开源巨星编织在一起，一次接入，即刻驾驭。"
            />
            <FeatureCard 
              delay={0.3}
              icon={Shield}
              title="军工级绝对隐私"
              desc="每一个发起的会话都在零信任的安全沙箱中即焚执行。完全无状态的数据链路保证所有的企业私密信息不留一丝痕迹。"
            />
          </div>
        </div>
      </section>

      {/* Parallax Data Stats */}
      <StatsSection />

      {/* Footer CTA */}
      <section className="py-48 bg-black text-center relative overflow-hidden">
        {/* Massive bottom glow to imply infinite depth */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-white/10 blur-[150px] rounded-[100%] pointer-events-none" />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 30 }}
           whileInView={{ opacity: 1, scale: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
           className="relative z-10 max-w-4xl mx-auto px-6"
        >
          <Sparkles className="w-16 h-16 text-white mx-auto mb-10 opacity-90 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
          <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            准备好进入奇点了吗？
          </h2>
          <Button asChild variant="default" className="px-14 py-8 rounded-full bg-white text-black font-extrabold text-2xl hover:scale-110 hover:bg-gray-100 transition-all duration-500 shadow-[0_0_60px_rgba(255,255,255,0.3)]">
            <Link to="/chat">
              立刻对话
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
