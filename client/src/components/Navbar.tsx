import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="主导航">
      <Link to="/" className="navbar-brand">FoolFullAPI</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/select">控制台</Link>
            <Link to="/api-docs">API</Link>
            <button onClick={handleLogout} className="btn-text">退出</button>
          </>
        ) : (
          <Link to="/auth" className="btn-primary">开始使用</Link>
        )}
      </div>
    </nav>
  );
}
