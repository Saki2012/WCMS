import axios from 'axios';
import type { AxiosInstance } from 'axios';

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7030';
export const SERVICE_BASE: string = `${API_BASE}/Service`;

export const serviceClient: AxiosInstance = axios.create({
  baseURL: SERVICE_BASE,
  withCredentials: true, // 同源 cookie
  headers: { 'Content-Type': 'application/json' },
});

export interface ICreateUserDto {
  UserId: string;     // 帳號
  UserName: string;   // 使用者名稱
  Email: string;      // Email
  Password: string;   // 密碼（後端會做 Hash/Salt）
}

export interface ICreateUserResult {
  ok?: boolean;       // 你若有回應格式可補強；先保留最小回傳
}

export const UserAPI = {
  create: (dto: ICreateUserDto) =>
    serviceClient.post<ICreateUserResult>('/User/Create', dto).then(r => r.data),
} as const;
