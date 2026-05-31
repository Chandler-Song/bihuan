import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export default function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const authed = useAuthStore((s) => !!s.token);
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
