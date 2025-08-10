import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthAPI } from '../../Utils/authClient';
import { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'unauth'>('checking');
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await AuthAPI.me();              // 會自動帶 cookie（withCredentials）
        if (alive) setStatus('ok');
      } catch {
        if (alive) setStatus('unauth');
      }
    })();
    return () => { alive = false; };
  }, []);

  if (status === 'checking') {
    // AA 友善：檢查中提示；避免未驗完就閃過畫面
    return <div role="status" aria-live="polite" style={{padding:16}}>驗證中…</div>;
  }
  if (status === 'unauth') {
    // 帶著原網址，登入成功後導回
    return <Navigate to="/Server/Login" replace state={{ from: loc }} />;
  }
  return <>{children}</>;
}