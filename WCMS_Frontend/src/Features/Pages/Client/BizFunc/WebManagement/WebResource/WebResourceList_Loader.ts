// WebResourceList_Loader.ts
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PGID, WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IWebResourceListOptions } from "./WebResourceList";

type QueryListParam = components["schemas"]["QueryListParam"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategoryMap = Record<string, string>;

type CategoryMapInitialArgs = { progId: PGID; lang: Lang; };

export interface WebResourceListLoaderArgs
{
    baseParam: QueryListParam;
    lang: Lang;
    categoryIds: string;
    tagIds: string;
    style: number;
}

export interface WebResourceListLoaderRes
{
    countRes: number;
    listRes: WebResourceSet[];
    cateMapRes: CategoryMap;
}

export interface WebResourceListLoaderData
{
    args: WebResourceListLoaderArgs;
    res: WebResourceListLoaderRes;
}

export interface WebResourceListRawData
{
    count: number;
    listData: WebResourceSet[];
    categoryMap: CategoryMap;
    gridProps: GridProps;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    baseParam: QueryListParam;
    style: number;
}

export interface UseWebResourceListFetchDataResult
{
    rawData: WebResourceListRawData;
    isLoading: boolean;
    errorList: string[];
}

/** 組 WebResource 查詢條件 */
const buildCondition = (p: { lang: Lang; opts: IWebResourceListOptions; }) =>
{
    let condition = "";

    if (p.opts.Category)
    {
        condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAny [${p.opts.Category}]`);
    }
    if (p.opts.Tag) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Tags} HasAny [${p.opts.Tag}]`);

    condition = LibMerge(" And ", false, condition, `${WebResourceFields.ContentStatus} !& 4`);
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${p.lang}`,
    );
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} != ''`,
    );

    return condition;
};

/** 組 WebResource 基礎查詢參數 */
const buildBaseParam = (p: { lang: Lang; opts: IWebResourceListOptions; }): QueryListParam =>
{
    const condition = buildCondition(p);

    return {
        Fields: [
            WebResourceFields.InternalId,
            WebResourceFields.WebResourceId,
            WebResourceFields.PicId,
            WebResourceFields.PicDescription,
            WebResourceFields.Categories,
            WebResourceFields.ContentStatus,
            WebResourceFields.CreateTime,

            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立 SSR initial */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };
    return { args, apiRes };
};

/** 比對目前條件是否可沿用 SSR base initial */
const canUseBaseInitial = (
    loaderData: WebResourceListLoaderData | null,
    p: { lang: Lang; categoryIds: string; tagIds: string; style: number; },
) =>
{
    if (!loaderData?.args?.baseParam) return false;
    if (loaderData.args.lang !== p.lang) return false;
    if (loaderData.args.categoryIds !== p.categoryIds) return false;
    if (loaderData.args.tagIds !== p.tagIds) return false;
    if (loaderData.args.style !== p.style) return false;
    return true;
};

/** 比對目前語系是否可沿用 SSR category map initial */
const canUseCategoryInitial = (loaderData: WebResourceListLoaderData | null, lang: Lang) =>
{
    if (!loaderData?.args) return false;
    return loaderData.args.lang === lang;
};

/** 組 grid columns */
const buildVisibleColumns = (): ColumnConfig[] =>
{
    return [
        { key: WebResourceFields.Categories, title: "類別" },
        { key: WebResourceInfoFields.Title, title: "標題" },
        { key: WebResourceInfoFields.ResUrl, title: "連結" },
    ];
};

/** 組 grid cell 文字 */
const buildCellContent = (p: { item: WebResourceSet; colKey: string; lang: Lang; }) =>
{
    switch (p.colKey)
    {
        case WebResourceInfoFields.Title:
            return p.item.WebResourceInfo?.find(d => d.Lang === p.lang)?.Title ?? "";
        case WebResourceInfoFields.ResUrl:
            return p.item.WebResourceInfo?.find(d => d.Lang === p.lang)?.ResUrl ?? "";
        case WebResourceFields.Categories:
            return p.item.WebResource?.Categories ?? "";
        default:
            return "";
    }
};

/** 由 list 建立 gridProps */
const buildGridProps = (p: {
    lang: Lang;
    listData: WebResourceSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}): GridProps =>
{
    const columns = buildVisibleColumns();
    const rows: GridRow[] = p.listData.map(item =>
    {
        const cells: RowCell[] = columns.map(col => ({
            col,
            content: buildCellContent({ item, colKey: col.key, lang: p.lang }),
        }));
        return { keyId: item.WebResource?.InternalId ?? "", cells };
    });

    return {
        columns,
        rows,
        CurrentPage: p.pageNumber,
        TotalPage: p.totalPages,
        onPageChange: p.onPageChange,
    };
};

/** WebResource SSR loader */
export const WebResourceList_Loader =
    (p: { lang: Lang; opts: IWebResourceListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<WebResourceListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const webRes = WebResourceAdapter(ssrApi);
        const cate = CategoryAdapter(ssrApi);
        const baseParam = buildBaseParam(p);

        /** 主資料 count */
        const countLoader = webRes.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        /** 主資料 list */
        const listLoader = webRes.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        /** Category map */
        const cateLoader = cate.loader.createMapByProgIdLoader({
            progId: PGID.WebResource,
            lang: p.lang,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD, cateLD] = await Promise.all([
            countLoader({ request } as LoaderFunctionArgs),
            listLoader({ request } as LoaderFunctionArgs),
            cateLoader({ request } as LoaderFunctionArgs),
        ]);

        return {
            args: {
                baseParam,
                lang: p.lang,
                categoryIds: p.opts.Category ?? "",
                tagIds: p.opts.Tag ?? "",
                style: p.opts.Style ?? 1,
            },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
                cateMapRes: cateLD.apiRes.Data ?? {},
            },
        };
    };

/** 統一提供 WebResource list 所需資料 */
export const useWebResourceListFetchData = (
    p: { lang: Lang; options?: IWebResourceListOptions; },
): UseWebResourceListFetchDataResult =>
{
    const loaderData = useLoaderData() as WebResourceListLoaderData | null;
    const adapter = useMemo(() => ({ web: WebResourceAdapter(), cate: CategoryAdapter() }), []);
    const categoryIds = p.options?.Category ?? "";
    const tagIds = p.options?.Tag ?? "";
    const style = p.options?.Style ?? 1;

    /** 查詢條件與 SSR loader 共用 */
    const baseParam = useMemo(() =>
    {
        return buildBaseParam({ lang: p.lang, opts: { Category: categoryIds, Tag: tagIds, Style: style } });
    }, [p.lang, categoryIds, tagIds, style]);

    const canUseBase = useMemo(() =>
    {
        return canUseBaseInitial(loaderData, { lang: p.lang, categoryIds, tagIds, style });
    }, [loaderData, p.lang, categoryIds, tagIds, style]);

    const countInitial = useMemo<ApiLoaderData<QueryListParam, number> | null>(() =>
    {
        if (!canUseBase || !loaderData?.args?.baseParam) return null;
        return buildLoaderInitial(loaderData.args.baseParam, loaderData.res.countRes ?? 0);
    }, [canUseBase, loaderData]);

    const listInitial = useMemo<ApiLoaderData<QueryListParam, WebResourceSet[]> | null>(() =>
    {
        if (!canUseBase || !loaderData?.args?.baseParam) return null;
        return buildLoaderInitial(loaderData.args.baseParam, loaderData.res.listRes ?? []);
    }, [canUseBase, loaderData]);

    const categoryInitial = useMemo<ApiLoaderData<CategoryMapInitialArgs, CategoryMap> | null>(() =>
    {
        if (!canUseCategoryInitial(loaderData, p.lang)) return null;
        return buildLoaderInitial({ progId: PGID.WebResource, lang: p.lang }, loaderData?.res?.cateMapRes ?? {});
    }, [loaderData, p.lang]);

    /** 主資料 count */
    const useCount = adapter.web.hooks.useQueryCount({
        condition: baseParam,
        initial: countInitial,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
    });

    /** 主資料 list */
    const useList = adapter.web.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: listInitial,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
    });

    /** Category map */
    const useCategory = adapter.cate.hooks.useMapByProgId({
        progId: PGID.WebResource,
        lang: p.lang,
        initial: categoryInitial,
        deps: [PGID.WebResource, p.lang],
    });

    const gridProps = useMemo(() =>
    {
        return buildGridProps({
            lang: p.lang,
            listData: useList.data ?? [],
            pageNumber: useList.pageNumber,
            totalPages: useList.totalPages,
            onPageChange: useList.onPageChange,
        });
    }, [p.lang, useList.data, useList.pageNumber, useList.totalPages, useList.onPageChange]);

    const errorList = useMemo(() =>
    {
        return [useCount.errorText, useList.errorText, useCategory.errorText].filter((x): x is string => Boolean(x));
    }, [useCount.errorText, useList.errorText, useCategory.errorText]);

    const rawData = useMemo<WebResourceListRawData>(() =>
    {
        return {
            count: useCount.data ?? 0,
            listData: useList.data ?? [],
            categoryMap: useCategory.map ?? {},
            gridProps,
            pageNumber: useList.pageNumber,
            totalPages: useList.totalPages,
            onPageChange: useList.onPageChange,
            baseParam,
            style,
        };
    }, [
        useCount.data,
        useList.data,
        useList.pageNumber,
        useList.totalPages,
        useList.onPageChange,
        useCategory.map,
        gridProps,
        baseParam,
        style,
    ]);

    return {
        rawData,
        isLoading: Boolean(useCount.isLoading || useList.isLoading || useCategory.isLoading),
        errorList,
    };
};
