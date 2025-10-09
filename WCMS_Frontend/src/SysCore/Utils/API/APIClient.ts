import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import api from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
type QueryListParam = components["schemas"]["QueryListParam"];

const genericApi = {
    create: <T>(module: string, data: T) => api.post<ApiResponse<T>>(`${module}/Create`, data),
    update: <T>(module: string, internalId: string, data: T) =>
        api.put<ApiResponse<T>>(`${module}/Update`, { InternalId: internalId, Data: data }),
    delete: <T>(module: string, internalId: string) =>
        api.delete<ApiResponse<T>>(`${module}/Delete`, { params: { internalId } }),
    invalid: <T>(module: string, internalId: string, isInvalid: boolean) =>
        api.delete<ApiResponse<T>>(`${module}/Invalid`, { data: { internalId, isInvalid } }),
    queryData: <T>(module: string, internalId: string) =>
        api.get<ApiResponse<T>>(`${module}/QueryData`, { params: { internalId: internalId } }),
    queryList: <T>(module: string, condition: QueryListParam) =>
        api.post<ApiResponse<T[]>>(`${module}/QueryList`, condition),
    queryListCount: (module: string, condition: QueryListParam) =>
        api.post<ApiResponse<number>>(`${module}/GetTotalCounts`, condition),
    getModelDisplayName: (module: string) => api.get(`${module}/GetModelDisplayName`),
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

    async queryList(condition: QueryListParam)
    {
        return await genericApi.queryList<T>(this.module, condition);
    }

    async queryCount(condition: QueryListParam)
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
        return await api.get(`/${this.module}/GetEnumOptions`, {
            params: { enumName }, // 傳入 query string 參數
        });
    }
}

export const SystemAPI = new systemAPI();

export class FileManagementAPI
{
    private static readonly BASEURL = `FileManagement`;
    // private static readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/Service";
    private static readonly baseUrl = "/Service";
    public static readonly PREVIEW_URL: string = `${this.baseUrl}/${this.BASEURL}/Preview`;
    public static readonly UPLOAD_URL: string = `${this.baseUrl}/${this.BASEURL}/UploadTemp`;
    public static readonly DOWNLOAD_URL: string = `${this.baseUrl}/${this.BASEURL}/Download`;
}
