import axios from 'axios';
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

export const AuthAPI = {
  me: () => authClient.get('/Me'),
  login: (p: { account: string; password: string }) => authClient.post('/Login', p),
  logout: () => authClient.post('/Logout'),
  refresh:(xsrf?: string) => authClient.post('/Refresh', null, {
    headers: xsrf ? { 'X-CSRF-Token': xsrf } : {}
  }),
};

const getXsrf = () =>
  typeof document === 'undefined'
    ? null
    : document.cookie
        .split('; ')
        .find(x => x.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] ?? null;

let isRefreshing = false;
let waitQueue: Array<() => void> = [];

authClient.interceptors.response.use(
  r => r,
  async (err) => {
    if (err?.response?.status !== 401) throw err;

    // 避免並發多次 refresh
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const xsrf = getXsrf() ?? '';
        await AuthAPI.refresh(xsrf);               // 後端會旋轉 rtid 並重發 access cookie
        waitQueue.forEach(fn => fn());
        waitQueue = [];
        return authClient(err.config);             // 重送原請求
      } catch (e) {
        // 續期也失敗 → 視為未登入
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // 其他 401 請求排隊等 refresh 完成後重送
    return new Promise((resolve) => waitQueue.push(() => resolve(authClient(err.config))));
  }
);