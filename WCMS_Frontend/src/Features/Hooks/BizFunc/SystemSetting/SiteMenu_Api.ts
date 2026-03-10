import {ApiDataAdapter, type ApiAdapterError, type ApiDataHookGroup, type ApiDataLoaderGroup, type ApiLoaderData, type EffectDeps,} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID, SiteMenu_IndexFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
type QueryListParam = components["schemas"]["QueryListParam"];
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];




export class SiteMenuService extends ApiDataService<SiteMenuSet>
{
    //#region Construct
    constructor(apiInstance?: AxiosInstance) { super(PGID.SiteMenu, apiInstance); }
    //#endregion
}

type ExtraLoaders = {
    /** SiteMenu Index List（SSR 用） */
    getSiteMenuIndexListLoader: (opt?: {getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;}) 
        => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, SiteMenuSet[]>>;
    /** 第一筆 InternalId（SSR 用） */
    getFirstSiteMenuInternalIdLoader: (opt?: {getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;}) 
        => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, string | null>>;
};

type ExtraHooks = {
    /** SiteMenu Index List（CSR 用，支援 initial） */
    useSiteMenuIndexList: (opt?: { apiInstance?: AxiosInstance; deps?: EffectDeps; initial?: ApiLoaderData<QueryListParam, SiteMenuSet[]> | null; onError?: (err: ApiAdapterError) => void;}) 
        => {data: SiteMenuSet[]; apiRes: ApiResponse<SiteMenuSet[]> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
    /** 第一筆 InternalId（CSR 用，支援 initial） */
    useFirstSiteMenuInternalId: (opt?: { apiInstance?: AxiosInstance; deps?: EffectDeps; initial?: ApiLoaderData<null, string | null> | null; onError?: (err: ApiAdapterError) => void; }) 
        => { internalId: string | null; apiRes: ApiResponse<string | null> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>;};
};

export class SiteMenuAdapterImpl extends ApiDataAdapter<SiteMenuSet, SiteMenuService>
{
    // #region Property
    public declare loader: ApiDataLoaderGroup<SiteMenuSet> & ExtraLoaders;
    public declare hooks: ApiDataHookGroup<SiteMenuSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteMenuSet>)
    {
        const wrapGetSiteMenuIndexListLoader: ExtraLoaders["getSiteMenuIndexListLoader"] = (opt) => { return this.getSiteMenuIndexListLoader(opt); };
        const wrapGetFirstSiteMenuInternalIdLoader: ExtraLoaders["getFirstSiteMenuInternalIdLoader"] = (opt) =>{ return this.getFirstSiteMenuInternalIdLoader(opt); };
        return {...base,
            getSiteMenuIndexListLoader: wrapGetSiteMenuIndexListLoader,
            getFirstSiteMenuInternalIdLoader: wrapGetFirstSiteMenuInternalIdLoader,
        };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteMenuSet>)
    {
        const wrapUseSiteMenuIndexList: ExtraHooks["useSiteMenuIndexList"] = (opt) => { return this.useSiteMenuIndexList(opt); };
        const wrapUseFirstSiteMenuInternalId: ExtraHooks["useFirstSiteMenuInternalId"] = (opt) => { return this.useFirstSiteMenuInternalId(opt); };
        return {...base,
            useSiteMenuIndexList: wrapUseSiteMenuIndexList,
            useFirstSiteMenuInternalId: wrapUseFirstSiteMenuInternalId,
        };
    }
    // #endregion

    // #region Loader Func
    private getSiteMenuIndexListLoader(opt?: {getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;})
    {
        return this.createApiLoader<QueryListParam, SiteMenuSet[]>({
            action: "SiteMenu.Query.IndexList",
            getArgs: () => this.buildSiteMenuIndexListParam(),
            call: (svc, cdt) => svc.queryList(cdt),
            getApiInstance: opt?.getApiInstance,
        });
    }
    private getFirstSiteMenuInternalIdLoader(opt?: {getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;})
    {
        return this.createApiLoader<null, string | null>({
            action: "SiteMenu.Query.FirstInternalId",
            getArgs: () => null,
            call: (svc) => this.queryFirstInternalIdAsync(svc),
            getApiInstance: opt?.getApiInstance,
        });
    }
    // #endregion

    // #region Hook Func
    private useSiteMenuIndexList(opt?: {apiInstance?: AxiosInstance;deps?: EffectDeps;initial?: ApiLoaderData<QueryListParam, SiteMenuSet[]> | null;onError?: (err: ApiAdapterError) => void;})
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
    private useFirstSiteMenuInternalId(opt?: {apiInstance?: AxiosInstance;deps?: EffectDeps;initial?: ApiLoaderData<null, string | null> | null;onError?: (err: ApiAdapterError) => void;})
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
    // #endregion

    // #region Private Helper
    private buildSiteMenuIndexListParam = (): QueryListParam =>
    {
        const fields: string[] = [SiteMenu_IndexFields.InternalId];
        return { Fields: fields, PageNumber: 0, PageSize: 50 };
    };
    private async queryFirstInternalIdAsync(svc: SiteMenuService): Promise<ApiResponse<string | null>>
    {
        const env = await svc.queryList(this.buildSiteMenuIndexListParam());
        const ok = Boolean(env.IsSuccess) && env.Data !== null && env.Data !== undefined;
        if (!ok) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };
        const first = env.Data?.find(x => x?.SiteMenu_Index?.InternalId)?.SiteMenu_Index?.InternalId ?? null;
        return { IsSuccess: true, Data: first, SysMessage: env.SysMessage ?? [] };
    }
    // #endregion
}

export const SiteMenuAdapter = (apiInstance?: AxiosInstance) => new SiteMenuAdapterImpl((api?: AxiosInstance) => new SiteMenuService(api ?? apiInstance));

