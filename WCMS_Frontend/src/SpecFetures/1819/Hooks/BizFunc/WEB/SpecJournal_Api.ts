import { type ApiAdapterError, ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type ORCIDData = components["schemas"]["ORCIDData"];

/** 出刊 request；若之後 swagger 已補 PublishReq，可直接改回 components schema */
export type PublishJournalReq = { InternalId: string; JournalIndexId?: string | null; JournalIndexRowId?: number | null; };

type ExtraLoaders = {};

type GetAuthorByOrcidHookResult = {
    execute: (orcid: string) => Promise<ApiResponse<ORCIDData[]>>;
    isLoading: boolean;
    apiRes: ApiResponse<ORCIDData[]> | null;
    data: ORCIDData | null;
    rawData: ORCIDData[];
};

type PublishJournalHookResult = { execute: (dto: PublishJournalReq) => Promise<ApiResponse<object>>; isLoading: boolean; apiRes: ApiResponse<object> | null; };

type UnpublishJournalHookResult = { execute: (internalId: string) => Promise<ApiResponse<object>>; isLoading: boolean; apiRes: ApiResponse<object> | null; };

type ExtraHooks = {
    /** 依 ORCID iD 查作者公開資訊 */
    useGetAuthorByOrcid: (
        opt?: { apiInstance?: AxiosInstance; onSuccess?: (data: ORCIDData | null) => void; onError?: (err: ApiAdapterError) => void; },
    ) => GetAuthorByOrcidHookResult;
    /** 將預刊本轉為期刊本 */
    usePublishJournal: (opt?: { apiInstance?: AxiosInstance; onSuccess?: () => void; onError?: (err: ApiAdapterError) => void; }) => PublishJournalHookResult;
    /** 將期刊本退回預刊本 */
    useUnpublishJournal: (
        opt?: { apiInstance?: AxiosInstance; onSuccess?: () => void; onError?: (err: ApiAdapterError) => void; },
    ) => UnpublishJournalHookResult;
};
const toAdapterError = <T>(apiRes: ApiResponse<T>, fallback: string, action: string): ApiAdapterError =>
{
    // 宣告變數
    const sysMessages = apiRes?.SysMessage ?? [];
    const messageText = sysMessages.map((m) => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.trim()).filter((s) => s.length > 0).join("；");

    // return
    return { messageText: messageText || fallback, sysMessages, httpStatus: undefined, action };
};
/** 取回第一筆 ORCID 作者資料 */
const getFirstOrcidData = (data: ORCIDData[] | null | undefined): ORCIDData | null =>
{
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] ?? null;
};

class SpecJournalService extends ApiDataService<SpecJournalSet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecJournal, apiInstance);
    }
    // #endregion

    // #region API Func
    /** 呼叫後端依 ORCID 查作者資訊 */
    async getAuthorByOrcid(orcid: string): Promise<ApiResponse<ORCIDData[]>>
    {
        return await this.CallApi<ORCIDData[]>(() => this.Api.get<ApiResponse<ORCIDData[]>>(`${this.Module}/GetAuthorByOrcid`, { params: { orcid } }));
    }
    /** 呼叫後端出刊 API */
    async publishJournal(dto: PublishJournalReq): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() => this.Api.put<ApiResponse<object>>(`${this.Module}/PublishJournal`, dto));
    }
    /** 呼叫後端退回預刊 API */
    async unpublishJournal(internalId: string): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() =>
            this.Api.put<ApiResponse<object>>(`${this.Module}/UnpublishJournal`, JSON.stringify(internalId), {
                headers: { "Content-Type": "application/json" },
            })
        );
    }
    // #endregion
}
class SpecJournalAdapterImpl extends ApiDataAdapter<SpecJournalSet, SpecJournalService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SpecJournalSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SpecJournalSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    /** 擴充 loader 入口，目前 SpecJournal 暫無額外 loader */
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SpecJournalSet>): ApiDataLoaderGroup<SpecJournalSet> & ExtraLoaders
    {
        const merged: ApiDataLoaderGroup<SpecJournalSet> & ExtraLoaders = { ...base };
        return merged;
    }

    /** 擴充 hooks 入口，掛入 ORCID / 出刊 / 退回預刊 */
    protected override buildExtendedHooks(base: ApiDataHookGroup<SpecJournalSet>): ApiDataHookGroup<SpecJournalSet> & ExtraHooks
    {
        // 宣告變數
        const wrapUseGetAuthorByOrcid: ExtraHooks["useGetAuthorByOrcid"] = (opt) =>
        {
            return this.useGetAuthorByOrcid(opt);
        };
        const wrapUsePublishJournal: ExtraHooks["usePublishJournal"] = (opt) =>
        {
            return this.usePublishJournal(opt);
        };
        const wrapUseUnpublishJournal: ExtraHooks["useUnpublishJournal"] = (opt) =>
        {
            return this.useUnpublishJournal(opt);
        };
        const merged: ApiDataHookGroup<SpecJournalSet> & ExtraHooks = {
            ...base,
            useGetAuthorByOrcid: wrapUseGetAuthorByOrcid,
            usePublishJournal: wrapUsePublishJournal,
            useUnpublishJournal: wrapUseUnpublishJournal,
        };
        return merged;
    }
    // #endregion

    // #region Hook Func
    /** hook：依 ORCID 查作者資訊 */
    private useGetAuthorByOrcid: ExtraHooks["useGetAuthorByOrcid"] = (opt) =>
    {
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<ORCIDData[]> | null>(null);
        const apiInstance = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;
        const svc = useMemo(() =>
        {
            return new SpecJournalService(apiInstance);
        }, [apiInstance]);
        const execute = useCallback(async (orcid: string) =>
        {
            setIsLoading(true);
            try
            {
                const res = await svc.getAuthorByOrcid(orcid);
                const first = getFirstOrcidData(res.Data);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "查詢 ORCID 作者資訊失敗", "SpecJournal.GetAuthorByOrcid"));
                } else
                {
                    onSuccess?.(first);
                }

                return res;
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, onSuccess, onError]);

        const data = useMemo<ORCIDData | null>(() =>
        {
            return getFirstOrcidData(apiRes?.Data);
        }, [apiRes]);

        const rawData = useMemo<ORCIDData[]>(() =>
        {
            return apiRes?.Data ?? [];
        }, [apiRes]);

        // return
        return { execute, isLoading, apiRes, data, rawData };
    };

    /** hook：將預刊本轉為期刊本 */
    private usePublishJournal: ExtraHooks["usePublishJournal"] = (opt) =>
    {
        // 宣告變數
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiInstance = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const svc = useMemo(() =>
        {
            return new SpecJournalService(apiInstance);
        }, [apiInstance]);

        const execute = useCallback(async (dto: PublishJournalReq) =>
        {
            // 執行 function：呼叫出刊 API
            setIsLoading(true);
            try
            {
                const res = await svc.publishJournal(dto);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "出刊失敗", "SpecJournal.PublishJournal"));
                } else
                {
                    onSuccess?.();
                }

                return res;
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, onSuccess, onError]);

        // return
        return { execute, isLoading, apiRes };
    };

    /** hook：將期刊本退回預刊本 */
    private useUnpublishJournal: ExtraHooks["useUnpublishJournal"] = (opt) =>
    {
        // 宣告變數
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiInstance = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const svc = useMemo(() =>
        {
            return new SpecJournalService(apiInstance);
        }, [apiInstance]);

        const execute = useCallback(async (internalId: string) =>
        {
            // 執行 function：呼叫退回預刊 API
            setIsLoading(true);
            try
            {
                const res = await svc.unpublishJournal(internalId);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "退回預刊失敗", "SpecJournal.UnpublishJournal"));
                } else
                {
                    onSuccess?.();
                }

                return res;
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, onSuccess, onError]);

        // return
        return { execute, isLoading, apiRes };
    };
    // #endregion
}

export const SpecJournalAdapter = (apiInstance?: AxiosInstance) =>
{
    return new SpecJournalAdapterImpl((api?: AxiosInstance) => new SpecJournalService(api ?? apiInstance));
};
