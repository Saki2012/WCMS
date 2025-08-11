import { useEffect, useState, useRef} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthAPI } from '../../Utils/AuthClient';
/**
 * 輕量節流策略：
 * - 預設 300s 內同來源的路由切換不重打 /Me（除非是第一次或上次結果是 unauth）
 * - 視窗重新獲得焦點、頁籤從隱藏回可見時，會再檢查一次（忽略節流）
 * - 交給 axios 攔截器負責 401 -> /Refresh -> 重送
 */
const THROTTLE_MS = 300_000;

// 模組級快取：在 SPA 生命週期內可共享（避免每個頁面都重新打）
let lastCheckAt = 0;
let lastOK = false;

export function resetAuthProbe() {
  lastOK = false;
  lastCheckAt = 0;
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'unauth'>('checking');
  const loc = useLocation();
  const mounted = useRef(true);

  // 核心檢查函式
  const checkAuth = async (opts?: { force?: boolean }) => {
    const force = !!opts?.force;
    const now = Date.now();

    // 節流條件：非強制、且上一次是 OK、且在節流時間內 → 直接沿用 OK
    if (!force && lastOK && now - lastCheckAt < THROTTLE_MS) {
      setStatus('ok');
      return;
    }

    setStatus('checking');
    try {
      await AuthAPI.me();      // 401 會由攔截器自動 refresh，再重送 /Me
      lastOK = true;
      lastCheckAt = now;
      if (mounted.current) setStatus('ok');
    } catch {
      lastOK = false;
      lastCheckAt = now;
      if (mounted.current) setStatus('unauth');
    }
  };

  // A) 路由切換：節流檢查
  useEffect(() => {
    mounted.current = true;
    checkAuth({ force: false });
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  // B) 頁籤從背景回來/視窗獲得焦點：強制檢查（忽略節流）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAuth({ force: true });
    };
    const onFocus = () => checkAuth({ force: true });

    // SSR 安全檢查
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('focus', onFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') {
    // AA：提供可讀取的狀態提示；不要渲染 Dashboard layout 以免閃爍
    return <div role="status" aria-live="polite" style={{ padding: 16 }}>驗證中…</div>;
  }

  if (status === 'unauth') {
    // 帶回原網址，登入後可導回
    return <Navigate to="/Server/Login" replace state={{ from: loc }} />;
  }

  return <>{children}</>;
}