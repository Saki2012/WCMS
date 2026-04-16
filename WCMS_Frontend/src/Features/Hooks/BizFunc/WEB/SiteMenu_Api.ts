import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse, SysMessageModel } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID, SiteMenu_IndexFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";

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

export class SiteMenuService extends ApiDataService<SiteMenuSet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SiteMenu, apiInstance);
    }
    // #endregion

    // #region Custom Action
    /** 保存網站基本資訊 */
    async saveSiteInfo(data: SaveSiteInfoDTO): Promise<ApiResponse<SaveSiteInfoDTO>>
    {
        return await this.CallApi<SaveSiteInfoDTO>(() =>
            this.Api.put<ApiResponse<SaveSiteInfoDTO>>(`${this.Module}/SaveSiteInfo`, {
                InternalId: data.InternalId,
                Data: data,
            })
        );
    }

    /** 保存網站選單結構 */
    async saveMenuStructure(data: SaveMenuStructureDTO): Promise<ApiResponse<SaveMenuStructureDTO>>
    {
        return await this.CallApi<SaveMenuStructureDTO>(() =>
            this.Api.put<ApiResponse<SaveMenuStructureDTO>>(`${this.Module}/SaveMenuStructure`, {
                InternalId: data.InternalId,
                Data: data,
            })
        );
    }

    /** 保存單筆網站選單項目 */
    async saveMenuItem(data: SaveMenuItemDTO): Promise<ApiResponse<SaveMenuItemResultDTO>>
    {
        return await this.CallApi<SaveMenuItemResultDTO>(() =>
            this.Api.put<ApiResponse<SaveMenuItemResultDTO>>(`${this.Module}/SaveMenuItem`, {
                InternalId: data.InternalId,
                Data: data,
            })
        );
    }
    // #endregion
}

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
    ) => {
        data: SiteMenuSet[];
        apiRes: ApiResponse<SiteMenuSet[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    /** 第一筆 InternalId（CSR 用，支援 initial） */
    useFirstSiteMenuInternalId: (
        opt?: {
            apiInstance?: AxiosInstance;
            deps?: EffectDeps;
            initial?: ApiLoaderData<null, string | null> | null;
            onError?: (err: ApiAdapterError) => void;
        },
    ) => {
        internalId: string | null;
        apiRes: ApiResponse<string | null> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    /** 保存網站基本資訊 */
    useSaveSiteInfo: (
        opt?: UseSaveActionOptions<SaveSiteInfoDTO>,
    ) => UseSaveActionResult<SaveSiteInfoDTO, SaveSiteInfoDTO>;

    /** 保存網站選單結構 */
    useSaveMenuStructure: (
        opt?: UseSaveActionOptions<SaveMenuStructureDTO>,
    ) => UseSaveActionResult<SaveMenuStructureDTO, SaveMenuStructureDTO>;

    /** 保存單筆網站選單項目 */
    useSaveMenuItem: (
        opt?: UseSaveActionOptions<SaveMenuItemResultDTO>,
    ) => UseSaveActionResult<SaveMenuItemDTO, SaveMenuItemResultDTO>;
};

export class SiteMenuAdapterImpl extends ApiDataAdapter<SiteMenuSet, SiteMenuService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SiteMenuSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SiteMenuSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteMenuSet>)
    {
        const wrapGetSiteMenuIndexListLoader: ExtraLoaders["getSiteMenuIndexListLoader"] = (opt) =>
        {
            return this.getSiteMenuIndexListLoader(opt);
        };
        const wrapGetFirstSiteMenuInternalIdLoader: ExtraLoaders["getFirstSiteMenuInternalIdLoader"] = (opt) =>
        {
            return this.getFirstSiteMenuInternalIdLoader(opt);
        };
        return {
            ...base,
            getSiteMenuIndexListLoader: wrapGetSiteMenuIndexListLoader,
            getFirstSiteMenuInternalIdLoader: wrapGetFirstSiteMenuInternalIdLoader,
        };
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteMenuSet>)
    {
        const wrapUseSiteMenuIndexList: ExtraHooks["useSiteMenuIndexList"] = (opt) =>
        {
            return this.useSiteMenuIndexList(opt);
        };
        const wrapUseFirstSiteMenuInternalId: ExtraHooks["useFirstSiteMenuInternalId"] = (opt) =>
        {
            return this.useFirstSiteMenuInternalId(opt);
        };
        const wrapUseSaveSiteInfo: ExtraHooks["useSaveSiteInfo"] = (opt) =>
        {
            return this.useSaveSiteInfo(opt);
        };
        const wrapUseSaveMenuStructure: ExtraHooks["useSaveMenuStructure"] = (opt) =>
        {
            return this.useSaveMenuStructure(opt);
        };
        const wrapUseSaveMenuItem: ExtraHooks["useSaveMenuItem"] = (opt) =>
        {
            return this.useSaveMenuItem(opt);
        };

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

    // #region Loader Func
    private getSiteMenuIndexListLoader(
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    )
    {
        return this.createApiLoader<QueryListParam, SiteMenuSet[]>({
            action: "SiteMenu.Query.IndexList",
            getArgs: () => this.buildSiteMenuIndexListParam(),
            call: (svc, cdt) => svc.queryList(cdt),
            getApiInstance: opt?.getApiInstance,
        });
    }

    private getFirstSiteMenuInternalIdLoader(
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    )
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
    private useSiteMenuIndexList(
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

    private useFirstSiteMenuInternalId(
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

    private useSaveSiteInfo(opt?: UseSaveActionOptions<SaveSiteInfoDTO>)
    {
        return this.useSaveAction<SaveSiteInfoDTO, SaveSiteInfoDTO>({
            action: "SiteMenu.SaveSiteInfo",
            fallbackSuccess: "保存網站基本資訊成功",
            fallbackError: "保存網站基本資訊失敗",
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: opt?.onSuccess,
            call: (svc, data) => svc.saveSiteInfo(data),
        });
    }

    private useSaveMenuStructure(opt?: UseSaveActionOptions<SaveMenuStructureDTO>)
    {
        return this.useSaveAction<SaveMenuStructureDTO, SaveMenuStructureDTO>({
            action: "SiteMenu.SaveMenuStructure",
            fallbackSuccess: "保存網站選單結構成功",
            fallbackError: "保存網站選單結構失敗",
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: opt?.onSuccess,
            call: (svc, data) => svc.saveMenuStructure(data),
        });
    }

    private useSaveMenuItem(opt?: UseSaveActionOptions<SaveMenuItemResultDTO>)
    {
        return this.useSaveAction<SaveMenuItemDTO, SaveMenuItemResultDTO>({
            action: "SiteMenu.SaveMenuItem",
            fallbackSuccess: "保存網站選單項目成功",
            fallbackError: "保存網站選單項目失敗",
            apiInstance: opt?.apiInstance,
            onError: opt?.onError,
            onSuccess: opt?.onSuccess,
            call: (svc, data) => svc.saveMenuItem(data),
        });
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

    private useSaveAction<TReq, TRes>(opt: {
        action: string;
        fallbackSuccess: string;
        fallbackError: string;
        apiInstance?: AxiosInstance;
        onError?: (err: ApiAdapterError) => void;
        onSuccess?: (res: TRes | null, apiRes: ApiResponse<TRes>) => void | Promise<void>;
        call: (svc: SiteMenuService, data: TReq) => Promise<ApiResponse<TRes>>;
    }): UseSaveActionResult<TReq, TRes>
    {
        const { publish } = useToast();
        const svc = useMemo(() => this.getService(opt.apiInstance), [opt.apiInstance]);
        const [isSaving, setIsSaving] = useState(false);
        const [errorText, setErrorText] = useState<string | null>(null);
        const [apiRes, setApiRes] = useState<ApiResponse<TRes> | null>(null);

        const saveAsync = useCallback(async (data: TReq): Promise<ApiResponse<TRes>> =>
        {
            setIsSaving(true);
            setErrorText(null);

            try
            {
                const env = await opt.call(svc, data);
                setApiRes(env);
                const msgTitle = env.IsSuccess ? opt.fallbackSuccess : opt.fallbackError; // 這一塊之後要改邏輯
                this.emitSysMessages(publish, msgTitle, env.SysMessage ?? []);

                if (!env.IsSuccess)
                {
                    const err = this.buildActionError(env, opt.fallbackError, opt.action);
                    setErrorText(err.messageText);
                    opt.onError?.(err);
                    return env;
                }

                await opt.onSuccess?.(env.Data ?? null, env);
                return env;
            } finally
            {
                setIsSaving(false);
            }
        }, [svc, publish, opt.call, opt.fallbackError, opt.action, opt.onError, opt.onSuccess]);

        return { isSaving, errorText, apiRes, saveAsync };
    }

    private emitSysMessages(publish: ReturnType<typeof useToast>["publish"], title: string, messages: SysMessageModel[])
    {
        messages.forEach(m =>
        {
            publish({
                level: m.Status ?? MessageStatus.Info,
                code: m.MessageCode,
                title: title ?? "",
                text: m.Message,
            });
        });
    }

    private buildActionError<T>(apiRes: ApiResponse<T>, fallback: string, action: string): ApiAdapterError
    {
        const sysMessages = apiRes.SysMessage ?? [];
        const messageText = sysMessages
            .map(m => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.trim())
            .filter(x => x.length > 0)
            .join("；") || fallback;

        return { messageText, sysMessages, action };
    }
    // #endregion
}

export const SiteMenuAdapter = (apiInstance?: AxiosInstance) =>
    new SiteMenuAdapterImpl((api?: AxiosInstance) => new SiteMenuService(api ?? apiInstance));
