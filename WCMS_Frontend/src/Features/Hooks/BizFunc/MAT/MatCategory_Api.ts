import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup, type ApiLoaderData, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";

// #region Property
type MatCategoryFormModel = components["schemas"]["MatCategoryFormModel"];
interface MatCateInfoFieldApiItem
{
    Field?: string | null;
    DisplayName?: string | null;
    RowNo?: number | null;
}
type MatCateInfoFieldsApiData = MatCateInfoFieldApiItem[];
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
    initial?: Map<string, string> | null;
    deps?: EffectDeps;
    onError?: (message: string) => void;
    apiInstance?: AxiosInstance;
}
export type MatCateInfoFieldsLoaderData = ApiLoaderData<MatCateInfoFieldsArgs, Map<string, string>>;
interface MatCateInfoFieldsHookResult
{
    data: Map<string, string>;
    map: Map<string, string>;
    apiRes: ApiResponse<Map<string, string>> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
}
type ExtraLoaders = {
    createMatCateInfoFieldsLoader: (opt: ICreateMatCateInfoFieldsLoader) => (args: LoaderFunctionArgs) => Promise<MatCateInfoFieldsLoaderData>;
};
type ExtraHooks = { useMatCateInfoFields: (opt: IUseMatCateInfoFields) => MatCateInfoFieldsHookResult; };
// #endregion

// #region Public
export class MatCategoryService extends ApiDataService<MatCategoryFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.MatCategory, apiInstance);
    }
    public async getMatCateInfoFieldsAsync(args: MatCateInfoFieldsArgs): Promise<ApiResponse<MatCateInfoFieldsApiData>>
    {
        // TODO: 應該直接Return api res就好，但因為現在是在return data，就不確定後續邏輯層怎麼處理，後續待修
        const res = await this.Api.get<ApiResponse<MatCateInfoFieldsApiData>>(`${this.Module}/GetMatCateInfoFields`, {
            params: { catId: args.catId, lang: args.lang },
        });
        return res.data;
    }
    // #endregion
}
export class MatCategoryAdapterImpl extends ApiDataAdapter<MatCategoryFormModel, MatCategoryService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<MatCategoryFormModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<MatCategoryFormModel> & ExtraHooks;
    // #endregion

    // #region protected Virtual
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<MatCategoryFormModel>): ApiDataLoaderGroup<MatCategoryFormModel> & ExtraLoaders
    {
        return { ...base, createMatCateInfoFieldsLoader: (opt) => this.createMatCateInfoFieldsLoader(opt) };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<MatCategoryFormModel>): ApiDataHookGroup<MatCategoryFormModel> & ExtraHooks
    {
        return { ...base, useMatCateInfoFields: (opt) => this.useMatCateInfoFields(opt) };
    }
    // #endregion

    // #region Protected
    /** loader：取得物件類別動態欄位 map */
    protected createMatCateInfoFieldsLoader: ExtraLoaders["createMatCateInfoFieldsLoader"] = (opt) =>
    {
        return this.createApiLoader<MatCateInfoFieldsArgs, Map<string, string>>({
            action: ActionGetMatCateInfoFields,
            getArgs: () => this.buildMatCateInfoFieldsArgs({ catId: opt.catId, lang: opt.lang }),
            call: (svc, args) => this.queryMatCateInfoFieldsAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    /** hook：取得物件類別動態欄位 map */
    protected useMatCateInfoFields: ExtraHooks["useMatCateInfoFields"] = (opt) =>
    {
        // 宣告變數：整理查詢參數
        const args = useMemo<MatCateInfoFieldsArgs>(() => this.buildMatCateInfoFieldsArgs({ catId: opt.catId ?? "", lang: opt.lang }), [opt.catId, opt.lang]);
        const initial = useMemo<MatCateInfoFieldsLoaderData | undefined>(() =>
        {
            if (!opt.initial) return undefined;
            return { action: ActionGetMatCateInfoFields, args, data: opt.initial, apiRes: { IsSuccess: true, Data: opt.initial, SysMessage: [] } };
        }, [args, opt.initial]);
        // 執行 function：CSR / Hydration 共用查詢
        const query = this.useApiQuery<MatCateInfoFieldsArgs, Map<string, string>>({
            action: ActionGetMatCateInfoFields,
            args,
            initial,
            call: (svc, queryArgs) => this.queryMatCateInfoFieldsAsync(svc, queryArgs),
            fallbackError: "查詢物件類別動態欄位失敗",
            deps: opt.deps ?? [opt.catId ?? "", opt.lang],
            onError: () => opt.onError?.("查詢物件類別動態欄位失敗"),
            apiInstance: opt.apiInstance,
        });
        const map = useMemo<Map<string, string>>(() => query.data ?? new Map<string, string>(), [query.data]);
        return { ...query, data: map, map };
    };
    // #endregion

    // #region Private
    /** 建立欄位查詢參數 */
    private buildMatCateInfoFieldsArgs(opt: { catId: string; lang: Lang; }): MatCateInfoFieldsArgs
    {
        return { catId: opt.catId, lang: opt.lang };
    }
    /** 呼叫後端取得有序欄位資料並轉成 map */
    private async queryMatCateInfoFieldsAsync(svc: MatCategoryService, args: MatCateInfoFieldsArgs): Promise<ApiResponse<Map<string, string>>>
    {
        if (!args.catId) return { IsSuccess: true, Data: new Map<string, string>(), SysMessage: [] };
        const res = await svc.getMatCateInfoFieldsAsync(args);
        const data = buildMatCateInfoFieldsMap(res.Data ?? []);
        return { ...res, Data: data };
    }
    // #endregion
}
export const MatCategoryAdapter = (apiInstance?: AxiosInstance) =>
    new MatCategoryAdapterImpl((api?: AxiosInstance) => new MatCategoryService(api ?? apiInstance));
// #endregion

// #region Private
/** 將有序 API 欄位陣列轉成 Map，保留後台 RowNo 順序。 */
const buildMatCateInfoFieldsMap = (items: MatCateInfoFieldsApiData): Map<string, string> =>
{
    const result = new Map<string, string>();
    const orderedItems = [...items].sort(compareMatCateInfoFieldOrder);
    orderedItems.forEach(item => appendMatCateInfoField(result, item));
    return result;
};
/** 比較動態欄位顯示順序，RowNo 相同時保留後端陣列順序。 */
const compareMatCateInfoFieldOrder = (left: MatCateInfoFieldApiItem, right: MatCateInfoFieldApiItem): number =>
{
    return Number(left.RowNo ?? 0) - Number(right.RowNo ?? 0);
};
/** 將單一有效欄位加入 Map，重複 key 保留第一筆。 */
const appendMatCateInfoField = (result: Map<string, string>, item: MatCateInfoFieldApiItem): void =>
{
    const field = String(item.Field ?? "");
    if (!field || result.has(field)) return;
    const displayName = String(item.DisplayName ?? `【${field}】`);
    result.set(field, displayName);
};
// #endregion
