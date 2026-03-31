import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-screen">加载中...</div>;
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
