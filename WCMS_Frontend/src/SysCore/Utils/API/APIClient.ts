import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { ApiResponse, QueryListCondition } from "../../Interface/IApiProvider";

const isServer = typeof window === "undefined";
const isDev = import.meta.env.NODE_ENV !== "production";
let browserApiSingleton: AxiosInstance | null = null;

/** 建立 API Client 的可選參數（僅 SSR 需要 serverOrigin） */
export interface ApiClientOptions
{
    serverOrigin?: string; /** 只在 SSR 傳入：例如 `${req.protocol}://${req.get("host")}` */
    config?: AxiosRequestConfig; /** 額外的 axios 設定（選用） */
}
// --- SSR Cookie 透傳（每請求設定/清除；由 dev-server 呼叫）---
let SSR_COOKIE = "";
export const __setSsrCookie = (cookie?: string) =>
{
    SSR_COOKIE = cookie ?? "";
};

export const createApiClient = (options?: ApiClientOptions): AxiosInstance =>
{
    const SERVICE_PREFIX = "/Service";
    if (!isServer)
    {
        if (!browserApiSingleton)
        {
            browserApiSingleton = axios.create({
                baseURL: SERVICE_PREFIX, // ★ CSR 用相對路徑，避免 node:https 進瀏覽器
                withCredentials: true,
                ...(options?.config ?? {}),
            });
        }
        console.log(options);
        return browserApiSingleton;
    }

    const origin: string = options?.serverOrigin ?? process.env.VITE_API_BASE_URL ?? "https://localhost:7030";
    console.log(`${origin}${SERVICE_PREFIX}`);
    const serverApi: AxiosInstance = axios.create({
        baseURL: `${origin}${SERVICE_PREFIX}`, // ★ 讓 `/Service` 指向本機 SSR-Server，再由它 proxy 到 7030
        withCredentials: true,
        ...(options?.config ?? {}),
    });

    return serverApi;
};

export const client = createApiClient();

const genericApi = {
    create: <T>(module: string, data: T) => client.post<ApiResponse<T>>(`${module}/Create`, data),
    update: <T>(module: string, internalId: string, data: T) =>
        client.put<ApiResponse<T>>(`${module}/Update`, { InternalId: internalId, Data: data }),
    delete: <T>(module: string, internalId: string) =>
        client.delete<ApiResponse<T>>(`${module}/Delete`, { params: { internalId } }),
    invalid: <T>(module: string, internalId: string, isInvalid: boolean) =>
        client.delete<ApiResponse<T>>(`${module}/Invalid`, { data: { internalId, isInvalid } }),
    queryData: <T>(module: string, internalId: string) =>
        client.get<ApiResponse<T>>(`${module}/QueryData`, { params: { internalId: internalId } }),
    queryList: <T>(module: string, condition: QueryListCondition) =>
        client.post<ApiResponse<T[]>>(`${module}/QueryList`, condition),
    queryListCount: (module: string, condition: QueryListCondition) =>
        client.post<ApiResponse<number>>(`${module}/GetTotalCounts`, condition),
    getModelDisplayName: (module: string) => client.get(`${module}/GetModelDisplayName`),
};

export class BaseApiService<T>
{
    private module: string;
    constructor(module: string)
    {
        this.module = module;
    }

    async create(data: T)
    {
        return await genericApi.create(this.module, data);
    }

    async update(internaId: string, data: T)
    {
        return await genericApi.update(this.module, internaId, data);
    }

    async delete(internaId: string)
    {
        return await genericApi.delete<T>(this.module, internaId);
    }

    async invalid(internaId: string, isInvalid: boolean)
    {
        return await genericApi.invalid<T>(this.module, internaId, isInvalid);
    }

    async queryData(internaId: string)
    {
        return await genericApi.queryData<T>(this.module, internaId);
    }

    async queryList(condition: QueryListCondition)
    {
        return await genericApi.queryList<T>(this.module, condition);
    }

    async queryCount(condition: QueryListCondition)
    {
        return await genericApi.queryListCount(this.module, condition);
    }

    async getModelDisplayName(): Promise<ModelDisplaySchema>
    {
        const res = await genericApi.getModelDisplayName(this.module);
        return res.data;
    }
}

class systemAPI
{
    private module: string;
    constructor()
    {
        this.module = "SystemAPI";
    }
    async getEnumOptions(enumName: string)
    {
        return await client.get(`/${this.module}/GetEnumOptions`, {
            params: { enumName }, // 傳入 query string 參數
        });
    }
}

export const SystemAPI = new systemAPI();
