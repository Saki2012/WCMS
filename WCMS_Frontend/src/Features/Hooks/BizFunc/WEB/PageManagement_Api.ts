import { type ApiAdapterError, ApiDataAdapter, type ApiDataHookGroup, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

// #region Property
type PageManagementFormModel = components["schemas"]["PageManagement"];
interface PageManagementUsedProgRaw
{
    [key: string]: string;
}
interface IUseUsedProgList
{
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
}
interface UsedProgListHookResult
{
    data: Map<string, string>;
    apiRes: ApiResponse<PageManagementUsedProgRaw> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
}
type ExtraHooks = { useUsedProgList: (opt?: IUseUsedProgList) => UsedProgListHookResult; };
// #endregion

// #region Public
export class PageManagementService extends ApiDataService<PageManagementFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.PageManagement, apiInstance);
    }
    /** 取得可被 SiteMenu 設定的功能模塊列表 */
    public async getUsedProgListAsync(): Promise<ApiResponse<PageManagementUsedProgRaw>>
    {
        return await this.CallApi<PageManagementUsedProgRaw>(() => this.Api.get<ApiResponse<PageManagementUsedProgRaw>>(`${this.Module}/GetUsedProgList`));
    }
    // #endregion
}
export class PageManagementAdapterImpl extends ApiDataAdapter<PageManagementFormModel, PageManagementService>
{
    // #region Property
    declare public hooks: ApiDataHookGroup<PageManagementFormModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    protected override buildExtendedHooks(base: ApiDataHookGroup<PageManagementFormModel>): ApiDataHookGroup<PageManagementFormModel> & ExtraHooks
    {
        return { ...base, useUsedProgList: (opt) => this.useUsedProgList(opt) };
    }
    // #endregion

    // #region Protected
    /** hook：取得可被 SiteMenu 設定的功能模塊列表 */
    protected useUsedProgList: ExtraHooks["useUsedProgList"] = (opt) =>
    {
        const query = this.useApiQuery<null, PageManagementUsedProgRaw>({
            action: "PageManagement.GetUsedProgList",
            args: null,
            call: (svc) => svc.getUsedProgListAsync(),
            fallbackError: "查詢可設定功能模塊失敗",
            deps: opt?.deps ?? [],
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const map = useMemo(() => new Map(Object.entries(query.data?.[0] ?? {})), [query.data]);
        return { ...query, data: map };
    };
    // #endregion
}
export const PageManagementAdapter = (apiInstance?: AxiosInstance) =>
    new PageManagementAdapterImpl((api?: AxiosInstance) => new PageManagementService(api ?? apiInstance));
// #endregion
