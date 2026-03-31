import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (password !== confirmPwd) { setError('两次密码不一致'); return; }
      if (!agreed) { setError('请先同意服务条款和隐私政策'); return; }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/select');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isLogin ? '登录' : '注册'}</h2>
        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setError(''); }}>登录</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setError(''); }}>注册</button>
        </div>

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="用户名 (4~20位)" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="密码 (6~32位)" value={password} onChange={e => setPassword(e.target.value)} required />
          {!isLogin && (
            <>
              <input type="password" placeholder="确认密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
              <label className="checkbox-label">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                我已阅读并同意 <Link to="/terms" target="_blank">服务条款</Link> 和 <Link to="/privacy" target="_blank">隐私政策</Link>
              </label>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
