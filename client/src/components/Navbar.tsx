import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="主导航">
      <Link to="/" className="navbar-brand">FoolFullAPI</Link>
      <div className="navbar-links">
        <Link to="/chat">开始体验</Link>
        <Link to="/api-docs">API</Link>
      </div>
    </nav>
  );
}
