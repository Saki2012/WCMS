import axios from 'axios';
import * as qs from 'qs';
import { ZodError } from 'zod';
import type { ZodType } from 'zod'

const backendServer = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7030';

const client = axios.create({
  baseURL: `${backendServer}/Service`,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) =>
      qs.stringify(params, { arrayFormat: 'repeat' }), // ✅ 關鍵：pk=a&pk=b
  },
});

client.interceptors.request.use((config) => {
  console.log('[API CALL]', config.method?.toUpperCase(), config.url, config.params);
  return config;
});

const genericApi = {
  create: <T>(module: string, data: T) => client.post(`/${module}/Create`, data),
  update: <T>(module: string, data: T) => client.put(`/${module}/Update`, data),
  delete: <T>(module: string, data: T) => client.delete(`/${module}/Delete`, { data }),
  queryData: <T>(module: string, params?: T) => client.get(`/${module}/QueryData`, { params }),
  queryList: <T>(module: string, data: T) => client.post(`/${module}/QueryList`, data),
  getModelDisplayName:(module: string) => client.get(`/${module}/GetModelDisplayName`),
};


export class BaseApiService<T> {
  private module: string;
  private schema?: ZodType<T>;

  constructor(module: string, schema?: ZodType<T>) {
    this.module = module;
    this.schema = schema;
  }

  create(data: T) {
    return genericApi.create(this.module, data);
  }

  update(data: T) {
    return genericApi.update(this.module, data);
  }

  delete(data: T) {
    return genericApi.delete(this.module, data);
  }

  async queryData(params?: any): Promise<T> {
    const res = await genericApi.queryData(this.module, params);
    return this.parseResult(res.data);
  }

  async queryList(params: any): Promise<T[]> {
    const res = await genericApi.queryList(this.module, params);
    return this.parseResultArray(res.data);
  }

  async getModelDisplayName(): Promise<T[]> {
    const res = await genericApi.getModelDisplayName(this.module);
    return this.parseResultArray(res.data);
  }

  private parseResult(data: unknown): T {
    if (!this.schema) return data as T;

    const result = this.schema.safeParse(data);
    if (!result.success) {
      console.error(`❌ Zod 解析失敗 @ ${this.module}`, result.error);
      throw new ZodError(result.error.issues);
    }
    return result.data;
  }

  private parseResultArray(data: unknown): T[] {
    if (!this.schema) return data as T[];

    const result = this.schema.array().safeParse(data);
    if (!result.success) {
      console.error(`❌ Zod 陣列解析失敗 @ ${this.module}`, result.error);
      throw new ZodError(result.error.issues);
    }
    return result.data;
  }
}
