import type { Lang } from "@/SysCore/i18n/lang";
import {ApiDataAdapter, type ApiAdapterError, type ApiDataHookGroup, type ApiDataLoaderGroup, type ApiLoaderData, type EffectDeps,} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type CategoryDetail = components["schemas"]["CategoryDetail_DTO"];

export type CategoryMapArgs = {progId: PGID | string;lang: Lang; pageSize?: number;};
export type CategoryMapLoaderData = ApiLoaderData<CategoryMapArgs, Record<string, string>>;
export class CategoryService extends ApiDataService<CategorySet>
{
    //#region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Category, apiInstance);
    }
    //#endregion
}
interface IBuildCategoryQueryByProgIdParam { progId: string; lang?: Lang; pageSize?: number; }
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
type ExtraLoaders = {
    createMapByProgIdLoader: (opt: ICreateCategoryMapByProgIdLoader,) => (args: LoaderFunctionArgs) => Promise<CategoryMapLoaderData>;
};
type ExtraHooks = {
    useMapByProgId: (opt: IUseCategoryMapByProgId,) => CategoryMapHookResult;
};
/** Escape Query 字串中的雙引號 */
const escapeQueryString = (value: string): string =>
{
    const escaped = value.replace(/"/g, `""`);
    return escaped;
};
/** 建立依 ProgId 查 Category 的共用條件 */
export const buildCategoryQueryByProgIdParam = (opt: IBuildCategoryQueryByProgIdParam,): QueryListParam =>
{
    const progId = escapeQueryString(opt.progId);
    const lang = opt.lang ? escapeQueryString(opt.lang) : null;
    const fields: string[] = [
        SchemaFields.CategoryFields.CategoryId,
        `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
        `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
    ];
    const condLang = lang ? ` And ${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang} = "${lang}"` : "";
    return {
        Fields: fields,
        Condition: `${SchemaFields.CategoryFields.ProgId} = "${progId}"${condLang}`,
        OrderBy: [{ Col: SchemaFields.CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 0,
        PageSize: opt.pageSize ?? 0,
    };
};
/** 依語系把 Category 清單轉成 id-name map */
export const buildCategoryMap = (data: CategorySet[],lang: Lang,): Record<string, string> =>
{
    return data.reduce<Record<string, string>>((acc, item) =>
    {
        const id = item.Category?.CategoryId;
        if (!id) return acc;
        const matched = (item.CategoryDetail ?? []).find((detail: CategoryDetail) => detail.Lang === lang,);
        acc[String(id)] = matched?.CategoryName ?? "";
        return acc;
    }, {});
};
/** 純格式化：把 "1,2,3" 轉成 "分類A、分類B" */
export const formatCategoriesName = (content: string,categoryData: CategorySet[],lang: Lang,): string =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";
    return raw.split(",").map(s => s.trim()).filter(Boolean).map(catId => categoryData?.find(s => String(s.Category?.CategoryId) === catId) ?.CategoryDetail?.find(d => d.Lang === lang) ?.CategoryName,).filter((x): x is string => Boolean(x)).join("、");
};
export class CategoryAdapterImpl extends ApiDataAdapter<CategorySet, CategoryService>
{
    //#region Property
    public declare loader: ApiDataLoaderGroup<CategorySet> & ExtraLoaders;
    public declare hooks: ApiDataHookGroup<CategorySet> & ExtraHooks;
    //#endregion

    //#region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<CategorySet>,): ApiDataLoaderGroup<CategorySet> & ExtraLoaders
    {
        const wrapCreateMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) => { return this.createMapByProgIdLoader(opt); };
        return {...base,createMapByProgIdLoader: wrapCreateMapByProgIdLoader,};
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<CategorySet>,): ApiDataHookGroup<CategorySet> & ExtraHooks
    {
        const wrapUseMapByProgId: ExtraHooks["useMapByProgId"] = (opt) => { return this.useMapByProgId(opt); };
        return {...base,useMapByProgId: wrapUseMapByProgId,};
    }
    //#endregion

    //#region Loader Func
    /** loader：依 ProgId 建立 Category map loader */
    private createMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) =>
    {
        // return
        return this.createApiLoader<CategoryMapArgs, Record<string, string>>({
            action: "Category.Query.MapByProgId",
            getArgs: () => this.buildCategoryMapArgs({
                progId: opt.progId,
                lang: opt.lang,
                pageSize: opt.pageSize,
            }),
            call: (svc, args) => this.queryCategoryMapByProgIdAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    //#endregion

    //#region Hook Func
    /** hook：依 ProgId 取得 Category map */
    private useMapByProgId: ExtraHooks["useMapByProgId"] = (opt) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize ?? 0];
        const args = useMemo<CategoryMapArgs>(() =>
        {
            return this.buildCategoryMapArgs({
                progId: opt.progId,
                lang: opt.lang,
                pageSize: opt.pageSize,
            });
        }, [opt.progId, opt.lang, opt.pageSize]);

        // 執行 function：CSR / Hydration 共用查詢
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

        const map = useMemo<Record<string, string>>(() =>
        {
            return query.data ?? {};
        }, [query.data]);

        // return
        return {
            ...query,
            data: map,
            map,
        };
    };
    //#endregion

    //#region Private Helper
    /** 建立共用 map 查詢參數 */
    private buildCategoryMapArgs(opt: {
        progId: PGID | string;
        lang: Lang;
        pageSize?: number;
    }): CategoryMapArgs
    {
        // return
        return {
            progId: opt.progId,
            lang: opt.lang,
            pageSize: opt.pageSize,
        };
    }

    /** 依 ProgId 查詢並轉成 Category map */
    private async queryCategoryMapByProgIdAsync(
        svc: CategoryService,
        args: CategoryMapArgs,
    ): Promise<ApiResponse<Record<string, string>>>
    {
        // 宣告變數
        const query = buildCategoryQueryByProgIdParam({
            progId: String(args.progId),
            lang: args.lang,
            pageSize: args.pageSize,
        });

        // 執行 function：先抓原始清單
        const env = await svc.queryList(query);

        // return
        if (!env.IsSuccess)
        {
            return {
                IsSuccess: false,
                Data: null,
                SysMessage: env.SysMessage ?? [],
            };
        }

        return {
            IsSuccess: true,
            Data: buildCategoryMap(env.Data ?? [], args.lang),
            SysMessage: env.SysMessage ?? [],
        };
    }
    //#endregion
}

export const CategoryAdapter = (apiInstance?: AxiosInstance) =>
{
    // return
    return new CategoryAdapterImpl(
        (api?: AxiosInstance) => new CategoryService(api ?? apiInstance),
    );
};