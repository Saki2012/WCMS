import axios from 'axios';
import * as qs from 'qs';
import { ZodError } from 'zod';
import type { ZodType } from 'zod'
import type { QueryListCondition,ApiResponse } from '../Interface/IApiProvider';
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
  create: <T>(module: string, data: T) => client.post<ApiResponse<T>>(`/${module}/Create`, data),
  update: <T>(module: string, internalId: string, data: T) => client.put<ApiResponse<T>>(`/${module}/Update`, { internalId, data }),
  delete: <T>(module: string, internalId: string) => client.delete<ApiResponse<T>>(`/${module}/Delete`, { params:{ internalId } }),
  invalid: <T>(module: string, internalId: string, isInvalid: boolean) => client.delete<ApiResponse<T>>(`/${module}/Invalid`, { data: { internalId, isInvalid }}),
  queryData: <T>(module: string, internalId: string) => client.get<ApiResponse<T>>(`/${module}/QueryData`, { params: internalId  }),
  queryList: <T>(module: string, condition: QueryListCondition) => client.post<ApiResponse<T>>(`/${module}/QueryList`, condition), 
  getModelDisplayName: (module: string) => client.get(`/${module}/GetModelDisplayName`),
};

export class BaseApiService<T> {
  private module: string;
  private schema?: ZodType<T>;
  constructor(module: string, schema?: ZodType<T>) {
    this.module = module;
    this.schema = schema;
  }

  async create(data: T) {
    return await genericApi.create(this.module, data);
  }

  async update(internaId:string, data: T) {
    return await genericApi.update(this.module, internaId, data);
  }

  async delete(internaId:string) {
    return await genericApi.delete<T>(this.module, internaId);
  }

  async invalid(internaId:string, isInvalid:boolean) {
    return await genericApi.invalid<T>(this.module, internaId,isInvalid);
  }

  async queryData(internaId: string) {
    return await genericApi.queryData<T>(this.module, internaId);
  }

  async queryList(condition: QueryListCondition) {
    return await genericApi.queryList<T>(this.module, condition);
  }

  async getModelDisplayName(): Promise<T[]> {
    const res = await genericApi.getModelDisplayName(this.module);
    return this.parseResultArray(res.data);
  }

  private parseResultArray(data: unknown): T[] {
    if (!this.schema) return data as T[];
    const result = this.schema.array().safeParse(data);
    if (!result.success) {
      throw new ZodError(result.error.issues);
    }
    return result.data;
  }
}
