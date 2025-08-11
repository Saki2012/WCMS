import axios from 'axios';
import type{ AxiosRequestConfig } from 'axios';
type AnyConfig = import('axios').InternalAxiosRequestConfig & { _retry?: boolean };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7030';
const AUTH_BASE = `${API_BASE}/Service/Auth`;

export const authClient = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true,              // Cookie 流程（HttpOnly）
  headers: { 'Content-Type': 'application/json' },
});

// 兼容暫時使用 Bearer 的情境（可留空）
authClient.interceptors.request.use((cfg) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const getXsrf = () => {
  if (typeof document === 'undefined') return null;
  const hit = document.cookie.split('; ').find(x => x.startsWith('XSRF-TOKEN='));
  return hit ? decodeURIComponent(hit.split('=')[1]) : null;
};

// 單例刷新鎖＋排隊
let isRefreshing = false;
let waitQueue: Array<() => void> = [];
// 幫忙把 axios config 重送（保留原本設定）
const replay = (cfg: AnyConfig) => authClient({ ...(cfg as AxiosRequestConfig), _retry: true } as AxiosRequestConfig);
// --- 🚦 重點：401 自動 refresh + 重送 ---
authClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const cfg: AnyConfig = err?.config ?? {};

    // 不是 401 或者已重送過，就直接丟出去
    if (status !== 401 || cfg._retry) throw err;

    // 自己打 refresh / login / logout 失敗不重試，避免循環
    const url = (cfg.url || '').toLowerCase();
    if (url.endsWith('/refresh') || url.endsWith('/login') || url.endsWith('/logout')) {
      throw err;
    }

    // 並發控制：第一個觸發 refresh，其他排隊
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const xsrf = getXsrf();
        await authClient.post('/Refresh', null, {
          headers: xsrf ? { 'X-CSRF-Token': xsrf } : undefined,
        }); // 這次會更新 access/rtid/XSRF Cookie
        // 喚醒佇列
        waitQueue.forEach(fn => fn());
        waitQueue = [];
        return replay(cfg); // 重送原請求
      } catch (e) {
        // 續期失敗：視為未登入，讓呼叫端去處理（通常會被 RequireAuth 踢回登入）
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // 其他 401 先排隊，等 refresh 完成後重送
    return new Promise((resolve, reject) => {
      waitQueue.push(() => {
        replay(cfg).then(resolve).catch(reject);
      });
    });
  }
);

export const AuthAPI = {
  me: () => authClient.get('/Me'),
  login: (p: { account: string; password: string }) => authClient.post('/Login', p),
  logout: () => authClient.post('/Logout'),
  refresh: () => authClient.post('/Refresh'),
};