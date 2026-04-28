import { ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup, type ApiLoaderData, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";

type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];
type Lang = string;
type MatCateInfoFieldsMap = Map<string, string>;
type MatCateInfoFieldsApiData = Record<string, string>[];

// #region Property
const ActionGetMatCateInfoFields = "MatCategory.GetMatCateInfoFields";

interface MatCateInfoFieldsArgs
{
    catId: string;
    lang: Lang;
}

interface ICreateMatCateInfoFieldsLoader
{
    catId: string;
    lang: Lang;
    getApiInstance?: () => AxiosInstance | undefined;
}
interface IUseMatCateInfoFields
{
    catId?: string | null;
    lang: Lang;
    initial?: MatCateInfoFieldsMap | null;
    deps?: EffectDeps;
    onError?: (message: string) => void;
    apiInstance?: AxiosInstance;
}
export type MatCateInfoFieldsLoaderData = ApiLoaderData<MatCateInfoFieldsArgs, MatCateInfoFieldsMap>;

interface MatCateInfoFieldsHookResult
{
    data: MatCateInfoFieldsMap;
    map: MatCateInfoFieldsMap;
    apiRes: ApiResponse<MatCateInfoFieldsMap> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
}
type ExtraLoaders = {
    createMatCateInfoFieldsLoader: (opt: ICreateMatCateInfoFieldsLoader) => (args: LoaderFunctionArgs) => Promise<MatCateInfoFieldsLoaderData>;
};
type ExtraHooks = { useMatCateInfoFields: (opt: IUseMatCateInfoFields) => MatCateInfoFieldsHookResult; };
// #endregion
export class MatCategoryService extends ApiDataService<MatCategorySet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.MatCategory, apiInstance);
    }
    // #endregion
    // #region Public Api
    public async getMatCateInfoFieldsAsync(args: MatCateInfoFieldsArgs): Promise<ApiResponse<MatCateInfoFieldsApiData>>
    {
        const res = await this.Api.get<ApiResponse<MatCateInfoFieldsApiData>>(`${this.Module}/GetMatCateInfoFields`, {
            params: { catId: args.catId, lang: args.lang },
        });
        return res.data;
    }
    // #endregion
}

class MatCategoryAdapterImpl extends ApiDataAdapter<MatCategorySet, MatCategoryService>
{
    // #region Loaders
    declare public loader: ApiDataLoaderGroup<MatCategorySet> & ExtraLoaders;
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<MatCategorySet>): ApiDataLoaderGroup<MatCategorySet> & ExtraLoaders
    {
        return { ...base, createMatCateInfoFieldsLoader: (opt) => this.createMatCateInfoFieldsLoader(opt) };
    }
    /** loader：取得物件類別動態欄位 map */
    private createMatCateInfoFieldsLoader: ExtraLoaders["createMatCateInfoFieldsLoader"] = (opt) =>
    {
        return this.createApiLoader<MatCateInfoFieldsArgs, MatCateInfoFieldsMap>({
            action: ActionGetMatCateInfoFields,
            getArgs: () => this.buildMatCateInfoFieldsArgs({ catId: opt.catId, lang: opt.lang }),
            call: (svc, args) => this.queryMatCateInfoFieldsAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    // #endregion
    // #region Hooks
    declare public hooks: ApiDataHookGroup<MatCategorySet> & ExtraHooks;
    protected override buildExtendedHooks(base: ApiDataHookGroup<MatCategorySet>): ApiDataHookGroup<MatCategorySet> & ExtraHooks
    {
        return { ...base, useMatCateInfoFields: (opt) => this.useMatCateInfoFields(opt) };
    }
    /** hook：取得物件類別動態欄位 map */
    private useMatCateInfoFields: ExtraHooks["useMatCateInfoFields"] = (opt) =>
    {
        // 宣告變數：整理查詢參數
        const args = useMemo<MatCateInfoFieldsArgs>(() =>
        {
            return this.buildMatCateInfoFieldsArgs({ catId: opt.catId ?? "", lang: opt.lang });
        }, [opt.catId, opt.lang]);

        const initial = useMemo<MatCateInfoFieldsLoaderData | undefined>(() =>
        {
            if (!opt.initial) return undefined;

            return { action: ActionGetMatCateInfoFields, args, data: opt.initial, apiRes: { IsSuccess: true, Data: opt.initial, SysMessage: [] } };
        }, [args, opt.initial]);

        // 執行 function：CSR / Hydration 共用查詢
        const query = this.useApiQuery<MatCateInfoFieldsArgs, MatCateInfoFieldsMap>({
            action: ActionGetMatCateInfoFields,
            args,
            initial,
            call: (svc, queryArgs) => this.queryMatCateInfoFieldsAsync(svc, queryArgs),
            fallbackError: "查詢物件類別動態欄位失敗",
            deps: opt.deps ?? [opt.catId ?? "", opt.lang],
            onError: () => opt.onError?.("查詢物件類別動態欄位失敗"),
            apiInstance: opt.apiInstance,
        });
        const map = useMemo<MatCateInfoFieldsMap>(() => query.data ?? new Map<string, string>(), [query.data]);
        // return
        return { ...query, data: map, map };
    };
    // #endregion

    // #region Private Func
    /** 建立欄位查詢參數 */
    private buildMatCateInfoFieldsArgs(opt: { catId: string; lang: Lang; }): MatCateInfoFieldsArgs
    {
        return { catId: opt.catId, lang: opt.lang };
    }
    /** 呼叫後端取得欄位 map */
    private async queryMatCateInfoFieldsAsync(svc: MatCategoryService, args: MatCateInfoFieldsArgs): Promise<ApiResponse<MatCateInfoFieldsMap>>
    {
        if (!args.catId) return { IsSuccess: true, Data: new Map<string, string>(), SysMessage: [] };
        const res = await svc.getMatCateInfoFieldsAsync(args);
        const data = new Map<string, string>(Object.entries(res.Data?.[0] ?? {}));
        return { ...res, Data: data };
    }
    // #endregion
}

export const MatCategoryAdapter = (apiInstance?: AxiosInstance) =>
{
    return new MatCategoryAdapterImpl((api?: AxiosInstance) => new MatCategoryService(api ?? apiInstance));
};
