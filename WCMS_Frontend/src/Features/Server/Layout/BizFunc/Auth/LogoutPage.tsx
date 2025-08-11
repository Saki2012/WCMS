import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthAPI } from '../../../../../SysCore/Utils/AuthClient';
import { resetAuthProbe } from '../../../../../SysCore/Components/Auth/RequireAuth';

export default function LogoutPage() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await AuthAPI.logout();        // 後端會清除 HttpOnly cookies
      } catch {
        // 後端失敗就算了，前端仍視為已登出
      } finally {
        resetAuthProbe();              // 清掉 RequireAuth 的 5 分鐘快取
        if (!alive) return;
        nav('/Server/Login', { replace: true, state: { from: loc } });
      }
    })();
    return () => { alive = false; };
  }, [nav, loc]);

  // AA：可讀的狀態提示
  return <div role="status" aria-live="polite" style={{ padding: 16 }}>登出中…</div>;
}