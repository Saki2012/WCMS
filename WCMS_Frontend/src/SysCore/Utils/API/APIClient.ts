import api, { type ApiResponse, MessageStatus, type SysMessageModel } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance, AxiosResponse } from "axios";
import axios from "axios";
import type { EnumOption } from "./SystemAPI_Hook";

type QueryListParam = components["schemas"]["QueryListParam"];

/** API服務層
 * 注意:繼承的Function須一律Return ApiResponse格式，好讓後續hook、loader接收後有共同處理方式
 */
export class ApiBaseService
{
    // #region Property
    protected readonly Module: PGID;
    protected readonly Api: AxiosInstance;
    // #endregion

    // #region Construct
    constructor(module: PGID, apiInstance?: AxiosInstance)
    {
        this.Module = module;
        this.Api = apiInstance ?? api;
    }
    // #endregion

    // #region Protected
    protected async CallApi<U>(fn: () => Promise<AxiosResponse<ApiResponse<U>>>): Promise<ApiResponse<U>>
    {
        try
        {
            // 宣告變數
            const res = await fn();
            return res.data;
        } catch (err)
        {
            // 宣告變數
            const fallbackStatus = 0;
            if (axios.isAxiosError(err))
            {
                const status = err.response?.status ?? fallbackStatus;
                const serverEnv = err.response?.data as ApiResponse<U> | undefined;
                if (serverEnv && typeof serverEnv === "object" && "IsSuccess" in serverEnv) return serverEnv;
                return this.BuildHttpError<U>(status, err.message);
            }
            if (err instanceof Error) return this.BuildHttpError<U>(fallbackStatus, err.message);
            return this.BuildHttpError<U>(fallbackStatus, "Unknown error");
        }
    }
    // #endregion

    // #region Private
    private BuildHttpError<U>(httpStatus: number, message: string): ApiResponse<U>
    {
        const env: ApiResponse<U> = {
            IsSuccess: false,
            Data: null,
            SysMessage: [
                {
                    Status: MessageStatus.Error,
                    MessageCode: `Http Error ${httpStatus}`,
                    Message: message,
                } as SysMessageModel,
            ],
        };
        return env;
    }
    // #endregion
}

export class ApiDataService<T> extends ApiBaseService
{
    async create(data: T): Promise<ApiResponse<T>>
    {
        return await this.CallApi<T>(() => this.Api.post<ApiResponse<T>>(`${this.Module}/Create`, data));
    }
    async update(internalId: string, data: T): Promise<ApiResponse<T>>
    {
        return await this.CallApi<T>(() =>this.Api.put<ApiResponse<T>>(`${this.Module}/Update`, { InternalId: internalId, Data: data }));
    }
    async delete(internalId: string): Promise<ApiResponse<T>>
    {
        return await this.CallApi<T>(() =>this.Api.delete<ApiResponse<T>>(`${this.Module}/Delete`, { params: { internalId } }));
    }
    async invalid(internalId: string, isInvalid: boolean): Promise<ApiResponse<T>>
    {
        return await this.CallApi<T>(() =>this.Api.delete<ApiResponse<T>>(`${this.Module}/Invalid`, { data: { internalId, isInvalid } }));
    }
    async queryData(internalId: string): Promise<ApiResponse<T>>
    {
        const query= await this.CallApi<T>(() =>this.Api.get<ApiResponse<T>>(`${this.Module}/QueryData`, { params: { internalId } }));
        return query
    }
    async queryList(condition: QueryListParam): Promise<ApiResponse<T[]>>
    {
        return await this.CallApi<T[]>(() => this.Api.post<ApiResponse<T[]>>(`${this.Module}/QueryList`, condition));
    }
    async queryCount(condition: QueryListParam): Promise<ApiResponse<number>>
    {
        return await this.CallApi<number>(() =>this.Api.post<ApiResponse<number>>(`${this.Module}/GetTotalCounts`, condition));
    }
    async getModelDisplayName(): Promise<ApiResponse<ModelDisplaySchema[]>>
    {
        return await this.CallApi<ModelDisplaySchema[]>(() =>this.Api.get<ApiResponse<ModelDisplaySchema[]>>(`${this.Module}/GetModelDisplayName`));
    }
}

export class SystemAPI extends ApiBaseService
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SystemAPI, apiInstance);
    }
    async getEnumOptions(enumName: string): Promise<ApiResponse<EnumOption[]>>
    {
        return await this.CallApi<EnumOption[]>(() =>this.Api.get(`${this.Module}/GetEnumOptions`, { params: { enumName } }));
    }
}

export class FileManagementAPI
{
    //#region property
    private static readonly BASEURL = PGID.FileManagement;
    private static readonly baseUrl = "/Service";

    //#region 前台使用公開API
    private static readonly PUBLIC_PREVIEW_URL: string = `${this.baseUrl}/${this.BASEURL}/Public_Preview`;
    private static readonly PUBLIC_DOWNLOAD_URL: string = `${this.baseUrl}/${this.BASEURL}/Public_Download`;
    //#endregion

    //#region 後台權限使用API
    private static readonly SERVER_Preview_URL: string = `${this.baseUrl}/${this.BASEURL}/Server_Preview`;
    private static readonly SERVER_DOWNLOAD_URL: string = `${this.baseUrl}/${this.BASEURL}/Server_Download`;
    /** 後台上傳檔案url (但流程應該可以優化共用，待處理) */
    public static readonly Server_UploadTemp: string = `${this.baseUrl}/${this.BASEURL}/Server_UploadTemp`;
    //#endregion

    //#endregion
    
    //#region Public

    //#region 前台使用公開API
    /** 取得前台預覽網址
     * 
     * @param internalId 
     * @param fileName 
     * @returns 
     */
    public static get_Public_Preview_Url(internalId: string | null | undefined, fileName?: string | null | undefined): string
    {
        if(!internalId?.trim()) return "";
        const baseUrl = `${this.PUBLIC_PREVIEW_URL}/${encodeURIComponent(internalId)}`;
        return `${baseUrl}${this.buildQueryString(fileName)}`;
    }
    /** 取得前台下載網址
     * 
     * @param internalId 
     * @param fileName 
     * @returns 
     */
    public static get_Public_Download_Url(internalId: string | null | undefined, fileName?: string | null | undefined): string
    {
        if(!internalId?.trim()) return "";
        const baseUrl = `${this.PUBLIC_DOWNLOAD_URL}/${encodeURIComponent(internalId)}`;
        return `${baseUrl}${this.buildQueryString(fileName)}`;
    }
    //#endregion

    //#region 後台權限使用API
    /** 取得前台預覽網址
     * 
     * @param internalId 
     * @param fileName 
     * @returns 
     */
    public static get_Server_Preview_Url(internalId: string | null | undefined, fileName?: string | null | undefined): string
    {
        if(!internalId?.trim()) return "";
        const baseUrl = `${this.SERVER_Preview_URL}/${encodeURIComponent(internalId)}`;
        return `${baseUrl}${this.buildQueryString(fileName)}`;
    }
    /** 取得後台下載網址
     * 
     * @param internalId 
     * @param fileName 
     * @returns 
     */
    public static get_Server_Download_Url(internalId: string | null | undefined, fileName?: string | null | undefined): string
    {
        if(!internalId?.trim()) return "";
        const baseUrl = `${this.SERVER_DOWNLOAD_URL}/${encodeURIComponent(internalId)}`;
        return `${baseUrl}${this.buildQueryString(fileName)}`;
    }
    //#endregion

    //#endregion
    
    //#region Private
    /** 組合 query string；有值才附加
     * @param fileName 
     * @returns 
     */
    private static buildQueryString(fileName?: string | null | undefined): string
    {
        if (!fileName?.trim()) return "";
        const query = new URLSearchParams({fileName: fileName,});
        return `?${query.toString()}`;
    }
    //#endregion
    
}

