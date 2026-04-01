import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: '首页', path: '/', icon: Home },
    { name: 'AI对话', path: '/chat', icon: MessageSquare },
    { name: 'API文档', path: '/api-docs', icon: BookText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around border-t border-white/10 bg-black/40 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/30">
      {tabs.map((tab) => {
        const isActive = tab.path === '/' ? path === '/' : path.startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 transition-colors",
              isActive ? "text-white" : "text-neutral-500 hover:text-neutral-200"
            )}
          >
            <tab.icon className={cn("h-[18px] w-[18px]", isActive && "text-white")} />
            <span className="text-[9.5px] font-medium tracking-wider">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
