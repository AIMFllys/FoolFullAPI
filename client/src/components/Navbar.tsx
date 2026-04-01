import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 bg-black/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 text-white" role="navigation" aria-label="主导航">
      <Link to="/" className="text-lg md:text-xl font-bold tracking-tight text-white hover:text-gray-300 transition-colors">AgentsNav FoolFullAPI</Link>
      <div className="hidden md:flex items-center gap-6">
        <Link to="/api-docs" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          API
        </Link>
        <Button asChild variant="default" className="bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-full px-6 py-2 h-auto">
          <Link to="/chat">开启体验</Link>
        </Button>
      </div>
    </nav>
  );
}
