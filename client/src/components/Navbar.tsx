import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="主导航">
      <Link to="/" className="navbar-brand">FoolFullAPI</Link>
      <div className="flex items-center gap-4">
        <Link to="/api-docs" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          API
        </Link>
        <Button asChild variant="default" className="bg-white text-black hover:bg-gray-200 transition-all">
          <Link to="/chat">开始体验</Link>
        </Button>
      </div>
    </nav>
  );
}
