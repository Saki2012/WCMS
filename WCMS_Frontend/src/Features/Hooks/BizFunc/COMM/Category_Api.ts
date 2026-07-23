import type { Lang } from "@/SysCore/i18n/lang";
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
import { LibCondition } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { CategoryDetailFields, CategoryFields, PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type CategoryFormModel = components["schemas"]["Category"];
type CategoryDetail = components["schemas"]["CategoryDetail"];
export type CategoryMapArgs = { progId: PGID | string; lang: Lang; pageSize?: number; };
export type CategoryMapLoaderData = ApiLoaderData<CategoryMapArgs, Record<string, string>>;
interface IBuildCategoryQueryByProgIdParam
{
    progId: string;
    lang?: Lang;
    pageSize?: number;
}
interface IUseCategoryMapByProgId
{
    progId: PGID | string;
    lang: Lang;
    pageSize?: number;
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
    initial?: CategoryMapLoaderData | null;
}
interface ICreateCategoryMapByProgIdLoader
{
    progId: PGID | string;
    lang: Lang;
    pageSize?: number;
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
}
type CategoryMapHookResult = {
    data: Record<string, string>;
    map: Record<string, string>;
    apiRes: ApiResponse<Record<string, string>> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};
type ExtraLoaders = { createMapByProgIdLoader: (opt: ICreateCategoryMapByProgIdLoader) => (args: LoaderFunctionArgs) => Promise<CategoryMapLoaderData>; };
type ExtraHooks = { useMapByProgId: (opt: IUseCategoryMapByProgId) => CategoryMapHookResult; };
// #endregion

// #region Public
export class CategoryService extends ApiDataService<CategoryFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Category, apiInstance);
    }
    // #endregion
}
export class CategoryAdapterImpl extends ApiDataAdapter<CategoryFormModel, CategoryService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<CategoryFormModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<CategoryFormModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<CategoryFormModel>): ApiDataLoaderGroup<CategoryFormModel> & ExtraLoaders
    {
        const wrapCreateMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) => this.createMapByProgIdLoader(opt);
        return { ...base, createMapByProgIdLoader: wrapCreateMapByProgIdLoader };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<CategoryFormModel>): ApiDataHookGroup<CategoryFormModel> & ExtraHooks
    {
        const wrapUseMapByProgId: ExtraHooks["useMapByProgId"] = (opt) => this.useMapByProgId(opt);
        return { ...base, useMapByProgId: wrapUseMapByProgId };
    }
    // #endregion

    // #region Protected
    /** loader：依 ProgId 建立 Category map loader */
    protected createMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) =>
    {
        return this.createApiLoader<CategoryMapArgs, Record<string, string>>({
            action: "Category.Query.MapByProgId",
            getArgs: () => this.buildCategoryMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize }),
            call: (svc, args) => this.queryCategoryMapByProgIdAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    /** hook：依 ProgId 取得 Category map */
    protected useMapByProgId: ExtraHooks["useMapByProgId"] = (opt) =>
    {
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize ?? 0];
        const args = useMemo<CategoryMapArgs>(() => this.buildCategoryMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize }), [
            opt.progId,
            opt.lang,
            opt.pageSize,
        ]);
        const query = this.useApiQuery<CategoryMapArgs, Record<string, string>>({
            action: "Category.Query.MapByProgId",
            args,
            initial: opt.initial ?? null,
            call: (svc, queryArgs) => this.queryCategoryMapByProgIdAsync(svc, queryArgs),
            fallbackError: "查詢分類對照失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        const map = useMemo<Record<string, string>>(() => query.data ?? {}, [query.data]);
        return { ...query, data: map, map };
    };
    // #endregion

    // #region Private
    /** 建立共用 map 查詢參數 */
    private buildCategoryMapArgs(opt: { progId: PGID | string; lang: Lang; pageSize?: number; }): CategoryMapArgs
    {
        return { progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize };
    }
    /** 依 ProgId 查詢並轉成 Category map */
    private async queryCategoryMapByProgIdAsync(svc: CategoryService, args: CategoryMapArgs): Promise<ApiResponse<Record<string, string>>>
    {
        // 宣告變數
        const query = this.buildCategoryQueryByProgIdParam({ progId: String(args.progId), lang: args.lang, pageSize: args.pageSize });
        // 執行 function：先抓原始清單
        const env = await svc.queryList(query);
        if (!env.IsSuccess)
        {
            return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };
        }
        return { IsSuccess: true, Data: this.buildCategoryMap(env.Data ?? [], args.lang), SysMessage: env.SysMessage ?? [] };
    }
    /** 建立依 ProgId 查 Category 的共用條件 */
    private buildCategoryQueryByProgIdParam = (opt: IBuildCategoryQueryByProgIdParam): QueryListParam =>
    {
        return {
            Fields: [
                CategoryFields.CategoryId,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            ],
            Condition: LibCondition.joinConditions([
                LibCondition.createCondition(CategoryFields.ProgId, LibCondition.Operator.Equal, opt.progId),
                opt.lang
                    ? LibCondition.createCondition(`${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`, LibCondition.Operator.Equal, opt.lang)
                    : null,
            ], LibCondition.JoinMode.And),
            OrderBy: [{ Col: CategoryFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: opt.pageSize ?? 0,
        };
    };
    /** 依語系把 Category 清單轉成 id-name map */
    private buildCategoryMap = (data: CategoryFormModel[], lang: Lang): Record<string, string> =>
    {
        return data.reduce<Record<string, string>>((acc, item) =>
        {
            const id = item.CategoryId;
            if (!id) return acc;
            const matched = (item._CategoryDetail ?? []).find((detail: CategoryDetail) => detail.Lang === lang);
            acc[String(id)] = matched?.CategoryName ?? "";
            return acc;
        }, {});
    };
    // #endregion
}
export const CategoryAdapter = (apiInstance?: AxiosInstance) => new CategoryAdapterImpl((api?: AxiosInstance) => new CategoryService(api ?? apiInstance));
// #endregion

/** 純格式化：把 "1,2,3" 轉成 "分類A、分類B" */
// TODO:這一支看是如何移除掉好
export const formatCategoriesName = (content: string, categoryData: CategoryFormModel[], lang: Lang): string =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";
    return raw.split(",").map(s => s.trim()).filter(Boolean).map(catId =>
        categoryData?.find(s => String(s.CategoryId) === catId)?._CategoryDetail?.find(d => d.Lang === lang)?.CategoryName
    ).filter((x): x is string => Boolean(x)).join("、");
};
