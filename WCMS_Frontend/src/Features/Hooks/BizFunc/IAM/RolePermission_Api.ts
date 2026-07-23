import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiAdapterError, ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type RolePermissionFormModel = components["schemas"]["RoleData"];
type PermissionCatalog = components["schemas"]["PermissionCatalogModuleDTO"];
type ExtraLoaders = {};
type PermissionCatalogHookResult = {
    data: PermissionCatalog[];
    apiRes: ApiResponse<PermissionCatalog[]> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};
export type UsePermissionCatalogOptions = { lang: Lang; apiInstance?: AxiosInstance; deps?: EffectDeps; onError?: (e: ApiAdapterError) => void; };
type ExtraHooks = {
    /** 讀取權限目錄 hook */
    usePermissionCatalog: (opt: UsePermissionCatalogOptions) => PermissionCatalogHookResult;
};
// #endregion

// #region Public
export class RolePermissionService extends ApiDataService<RolePermissionFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.RolePermission, apiInstance);
    }
    /** 讀取權限目錄。 */
    public async getPermissionCatalog(): Promise<ApiResponse<PermissionCatalog[]>>
    {
        return await this.CallApi<PermissionCatalog[]>(() => this.Api.get<ApiResponse<PermissionCatalog[]>>(`${this.Module}/GetPermissionCatalog`));
    }
    // #endregion
}
export class RolePermissionAdapterImpl extends ApiDataAdapter<RolePermissionFormModel, RolePermissionService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<RolePermissionFormModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<RolePermissionFormModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    /** 擴充 loader 入口，目前 RolePermission 暫無額外 loader。 */
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<RolePermissionFormModel>): ApiDataLoaderGroup<RolePermissionFormModel> & ExtraLoaders
    {
        const merged: ApiDataLoaderGroup<RolePermissionFormModel> & ExtraLoaders = { ...base };
        return merged;
    }
    /** 擴充 hooks 入口，掛入權限目錄查詢。 */
    protected override buildExtendedHooks(base: ApiDataHookGroup<RolePermissionFormModel>): ApiDataHookGroup<RolePermissionFormModel> & ExtraHooks
    {
        const wrapUsePermissionCatalog: ExtraHooks["usePermissionCatalog"] = (opt) => this.usePermissionCatalog(opt);
        const merged: ApiDataHookGroup<RolePermissionFormModel> & ExtraHooks = { ...base, usePermissionCatalog: wrapUsePermissionCatalog };
        return merged;
    }
    // #endregion

    // #region Protected
    /** 讀取權限目錄 hook。 */
    private usePermissionCatalog: ExtraHooks["usePermissionCatalog"] = (opt) =>
    {
        const result = this.useApiQuery<null, PermissionCatalog[]>({
            action: "RolePermission.GetPermissionCatalog",
            args: null,
            initial: null,
            call: (svc) => svc.getPermissionCatalog(),
            fallbackError: "讀取權限目錄失敗",
            deps: opt.deps ?? [opt.lang],
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        return { ...result, data: result.data ?? [] };
    };
    // #endregion
}
export const RolePermissionAdapter = (apiInstance?: AxiosInstance) =>
    new RolePermissionAdapterImpl((api?: AxiosInstance) => new RolePermissionService(api ?? apiInstance));
// #endregion
