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
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Claude Opos4 母4.6</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/select">控制台</Link>
            <button onClick={handleLogout} className="btn-text">退出</button>
          </>
        ) : (
          <Link to="/auth" className="btn-primary-sm">登录</Link>
        )}
      </div>
    </nav>
  );
}
