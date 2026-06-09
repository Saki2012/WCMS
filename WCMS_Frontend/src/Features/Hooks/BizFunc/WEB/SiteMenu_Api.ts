import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID, SiteMenu_IndexFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SaveSiteInfoDTO = components["schemas"]["SaveSiteInfo_DTO"];
type SaveMenuStructureDTO = components["schemas"]["SaveMenuStructure_DTO"];
type SaveMenuItemDTO = components["schemas"]["SaveMenuItem_DTO"];
type SaveMenuItemResultDTO = components["schemas"]["SaveMenuItemResult_DTO"];
type UseSaveActionOptions<TRes> = {
    apiInstance?: AxiosInstance;
    onError?: (err: ApiAdapterError) => void;
    onSuccess?: (res: TRes | null, apiRes: ApiResponse<TRes>) => void | Promise<void>;
};

type UseSaveActionResult<TReq, TRes> = {
    isSaving: boolean;
    errorText: string | null;
    apiRes: ApiResponse<TRes> | null;
    saveAsync: (data: TReq) => Promise<ApiResponse<TRes>>;
};
type ExtraLoaders = {
    /** SiteMenu Index List（SSR 用） */
    getSiteMenuIndexListLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, SiteMenuSet[]>>;
    /** 第一筆 InternalId（SSR 用） */
    getFirstSiteMenuInternalIdLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, string | null>>;
};
type ExtraHooks = {
    /** SiteMenu Index List（CSR 用，支援 initial） */
    useSiteMenuIndexList: (
        opt?: {
            apiInstance?: AxiosInstance;
            deps?: EffectDeps;
            initial?: ApiLoaderData<QueryListParam, SiteMenuSet[]> | null;
            onError?: (err: ApiAdapterError) => void;
        },
    ) => { data: SiteMenuSet[]; apiRes: ApiResponse<SiteMenuSet[]> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
    /** 第一筆 InternalId（CSR 用，支援 initial） */
    useFirstSiteMenuInternalId: (
        opt?: {
            apiInstance?: AxiosInstance;
            deps?: EffectDeps;
            initial?: ApiLoaderData<null, string | null> | null;
            onError?: (err: ApiAdapterError) => void;
        },
    ) => { internalId: string | null; apiRes: ApiResponse<string | null> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
    /** 保存網站基本資訊 */
    useSaveSiteInfo: (opt?: UseSaveActionOptions<SaveSiteInfoDTO>) => UseSaveActionResult<SaveSiteInfoDTO, SaveSiteInfoDTO>;
    /** 保存網站選單結構 */
    useSaveMenuStructure: (opt?: UseSaveActionOptions<SaveMenuStructureDTO>) => UseSaveActionResult<SaveMenuStructureDTO, SaveMenuStructureDTO>;
    /** 保存單筆網站選單項目 */
    useSaveMenuItem: (opt?: UseSaveActionOptions<SaveMenuItemResultDTO>) => UseSaveActionResult<SaveMenuItemDTO, SaveMenuItemResultDTO>;
};
// #endregion

// #region Public
export class SiteMenuService extends ApiDataService<SiteMenuSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SiteMenu, apiInstance);
    }
    /** 保存網站基本資訊。 */
    public async saveSiteInfo(data: SaveSiteInfoDTO): Promise<ApiResponse<SaveSiteInfoDTO>>
    {
        return await this.CallApi<SaveSiteInfoDTO>(() =>
            this.Api.put<ApiResponse<SaveSiteInfoDTO>>(`${this.Module}/SaveSiteInfo`, { InternalId: data.InternalId, Data: data })
        );
    }
    /** 保存網站選單結構。 */
    public async saveMenuStructure(data: SaveMenuStructureDTO): Promise<ApiResponse<SaveMenuStructureDTO>>
    {
        return await this.CallApi<SaveMenuStructureDTO>(() =>
            this.Api.put<ApiResponse<SaveMenuStructureDTO>>(`${this.Module}/SaveMenuStructure`, { InternalId: data.InternalId, Data: data })
        );
    }
    /** 保存單筆網站選單項目。 */
    public async saveMenuItem(data: SaveMenuItemDTO): Promise<ApiResponse<SaveMenuItemResultDTO>>
    {
        return await this.CallApi<SaveMenuItemResultDTO>(() =>
            this.Api.put<ApiResponse<SaveMenuItemResultDTO>>(`${this.Module}/SaveMenuItem`, { InternalId: data.InternalId, Data: data })
        );
    }
    // #endregion
}
export class SiteMenuAdapterImpl extends ApiDataAdapter<SiteMenuSet, SiteMenuService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SiteMenuSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SiteMenuSet> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    /** 擴充 SiteMenu SSR loader。 */
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteMenuSet>)
    {
        const wrapGetSiteMenuIndexListLoader: ExtraLoaders["getSiteMenuIndexListLoader"] = (opt) => this.getSiteMenuIndexListLoader(opt);
        const wrapGetFirstSiteMenuInternalIdLoader: ExtraLoaders["getFirstSiteMenuInternalIdLoader"] = (opt) => this.getFirstSiteMenuInternalIdLoader(opt);

        return { ...base, getSiteMenuIndexListLoader: wrapGetSiteMenuIndexListLoader, getFirstSiteMenuInternalIdLoader: wrapGetFirstSiteMenuInternalIdLoader };
    }
    /** 擴充 SiteMenu CSR hooks。 */
    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteMenuSet>)
    {
        const wrapUseSiteMenuIndexList: ExtraHooks["useSiteMenuIndexList"] = (opt) => this.useSiteMenuIndexList(opt);
        const wrapUseFirstSiteMenuInternalId: ExtraHooks["useFirstSiteMenuInternalId"] = (opt) => this.useFirstSiteMenuInternalId(opt);
        const wrapUseSaveSiteInfo: ExtraHooks["useSaveSiteInfo"] = (opt) => this.useSaveSiteInfo(opt);
        const wrapUseSaveMenuStructure: ExtraHooks["useSaveMenuStructure"] = (opt) => this.useSaveMenuStructure(opt);
        const wrapUseSaveMenuItem: ExtraHooks["useSaveMenuItem"] = (opt) => this.useSaveMenuItem(opt);

        return {
            ...base,
            useSiteMenuIndexList: wrapUseSiteMenuIndexList,
            useFirstSiteMenuInternalId: wrapUseFirstSiteMenuInternalId,
            useSaveSiteInfo: wrapUseSaveSiteInfo,
            useSaveMenuStructure: wrapUseSaveMenuStructure,
            useSaveMenuItem: wrapUseSaveMenuItem,
        };
    }
    // #endregion

    // #region Protected
    /** loader：查詢 SiteMenu Index List。 */
    protected getSiteMenuIndexListLoader(opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; })
    {
        return this.createApiLoader<QueryListParam, SiteMenuSet[]>({
            action: "SiteMenu.Query.IndexList",
            getArgs: () => this.buildSiteMenuIndexListParam(),
            call: (svc, cdt) => svc.queryList(cdt),
            getApiInstance: opt?.getApiInstance,
        });
    }
    /** loader：查詢第一筆 SiteMenu InternalId。 */
    protected getFirstSiteMenuInternalIdLoader(opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; })
    {
        return this.createApiLoader<null, string | null>({
            action: "SiteMenu.Query.FirstInternalId",
            getArgs: () => null,
            call: (svc) => this.queryFirstInternalIdAsync(svc),
            getApiInstance: opt?.getApiInstance,
        });
    }
    /** hook：查詢 SiteMenu Index List。 */
    protected useSiteMenuIndexList(
        opt?: {
            apiInstance?: AxiosInstance;
            deps?: EffectDeps;
            initial?: ApiLoaderData<QueryListParam, SiteMenuSet[]> | null;
            onError?: (err: ApiAdapterError) => void;
        },
    )
    {
        const deps = opt?.deps ?? [];
        const args = useMemo(() => this.buildSiteMenuIndexListParam(), []);
        const r = this.useApiQuery<QueryListParam, SiteMenuSet[]>({
            action: "SiteMenu.Query.IndexList",
            args,
            initial: opt?.initial ?? null,
            call: (svc, cdt) => svc.queryList(cdt),
            fallbackError: "查詢選單清單失敗",
            deps,
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const data = useMemo(() => r.data ?? [], [r.data]);

        return { ...r, data };
    }
    /** hook：查詢第一筆 SiteMenu InternalId。 */
    protected useFirstSiteMenuInternalId(
        opt?: {
            apiInstance?: AxiosInstance;
            deps?: EffectDeps;
            initial?: ApiLoaderData<null, string | null> | null;
            onError?: (err: ApiAdapterError) => void;
        },
    )
    {
        const deps = opt?.deps ?? [];
        const args = useMemo(() => null, []);
        const r = this.useApiQuery<null, string | null>({
            action: "SiteMenu.Query.FirstInternalId",
            args,
            initial: opt?.initial ?? null,
            call: (svc) => this.queryFirstInternalIdAsync(svc),
            fallbackError: "查詢選單 InternalId 失敗",
            deps,
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const internalId = useMemo(() => r.data ?? null, [r.data]);
        return { ...r, internalId };
    }
    /** hook：保存網站基本資訊。 */
    protected useSaveSiteInfo(opt?: UseSaveActionOptions<SaveSiteInfoDTO>)
    {
        const fallbackError = "保存網站基本資訊失敗";
        const action = this.useApiAction<SaveSiteInfoDTO, SaveSiteInfoDTO>({
            action: "SiteMenu.SaveSiteInfo",
            fallbackError,
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: async (apiRes) =>
            {
                await opt?.onSuccess?.(apiRes.Data ?? null, apiRes);
            },
            call: (svc, data) => svc.saveSiteInfo(data),
        });
        const errorText = useMemo(() => this.buildActionErrorText(action.apiRes, fallbackError), [action.apiRes, fallbackError]);
        return { isSaving: action.isLoading, errorText, apiRes: action.apiRes, saveAsync: action.execute };
    }
    /** hook：保存網站選單結構。 */
    protected useSaveMenuStructure(opt?: UseSaveActionOptions<SaveMenuStructureDTO>)
    {
        const fallbackError = "保存網站選單結構失敗";
        const action = this.useApiAction<SaveMenuStructureDTO, SaveMenuStructureDTO>({
            action: "SiteMenu.SaveMenuStructure",
            fallbackError,
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: async (apiRes) =>
            {
                await opt?.onSuccess?.(apiRes.Data ?? null, apiRes);
            },
            call: (svc, data) => svc.saveMenuStructure(data),
        });
        const errorText = useMemo(() => this.buildActionErrorText(action.apiRes, fallbackError), [action.apiRes, fallbackError]);

        return { isSaving: action.isLoading, errorText, apiRes: action.apiRes, saveAsync: action.execute };
    }
    /** hook：保存單筆網站選單項目。 */
    protected useSaveMenuItem(opt?: UseSaveActionOptions<SaveMenuItemResultDTO>)
    {
        const fallbackError = "保存網站選單項目失敗";
        const action = this.useApiAction<SaveMenuItemDTO, SaveMenuItemResultDTO>({
            action: "SiteMenu.SaveMenuItem",
            fallbackError,
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: async (apiRes) =>
            {
                await opt?.onSuccess?.(apiRes.Data ?? null, apiRes);
            },
            call: (svc, data) => svc.saveMenuItem(data),
        });
        const errorText = useMemo(() => this.buildActionErrorText(action.apiRes, fallbackError), [action.apiRes, fallbackError]);
        return { isSaving: action.isLoading, errorText, apiRes: action.apiRes, saveAsync: action.execute };
    }
    // #endregion

    // #region Private
    /** 查詢第一筆 SiteMenu InternalId。 */
    private async queryFirstInternalIdAsync(svc: SiteMenuService): Promise<ApiResponse<string | null>>
    {
        const env = await svc.queryList(this.buildSiteMenuIndexListParam());
        const ok = Boolean(env.IsSuccess) && env.Data !== null && env.Data !== undefined;
        if (!ok) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };

        const first = env.Data?.find(x => x?.SiteMenu_Index?.InternalId)?.SiteMenu_Index?.InternalId ?? null;
        return { IsSuccess: true, Data: first, SysMessage: env.SysMessage ?? [] };
    }
    /** 由 action 回應推導錯誤文字，維持既有 hook 對外格式。 */
    private buildActionErrorText<T>(apiRes: ApiResponse<T> | null, fallback: string): string | null
    {
        if (!apiRes || apiRes.IsSuccess) return null;
        const sysMessages = apiRes.SysMessage ?? [];
        const messageText = sysMessages.map(m => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.replace(/^:|:$/g, "").trim()).filter(x => x.length > 0).join(
            "；",
        );
        return messageText || fallback;
    }
    /** 建立 SiteMenu Index List 查詢參數。 */
    private buildSiteMenuIndexListParam = (): QueryListParam =>
    {
        return { Fields: [SiteMenu_IndexFields.InternalId], PageNumber: 0, PageSize: 50 };
    };
    // #endregion
}
export const SiteMenuAdapter = (apiInstance?: AxiosInstance) => new SiteMenuAdapterImpl((api?: AxiosInstance) => new SiteMenuService(api ?? apiInstance));
// #endregion
