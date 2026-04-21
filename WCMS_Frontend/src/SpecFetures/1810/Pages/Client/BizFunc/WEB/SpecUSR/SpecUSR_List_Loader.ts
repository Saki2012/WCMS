import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PGID, SpecCategoryModelFields, SpecUSRDetailFields, SpecUSRModelFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type ShowColumnMap = Record<string, string>;

const EMPTY_QUERY: QueryListParam = { Fields: [], Condition: "1=0", PageNumber: 0, PageSize: 0 };

const SUPPORTED_KEYS: string[] = [
    SpecUSRDetailFields.Year,
    SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader,
    SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department,
    SpecUSRDetailFields.ProjectItem,
    SpecUSRDetailFields.PlanAmount,
    SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.Cohost1,
    SpecUSRDetailFields.Cohost2,
    SpecUSRDetailFields.Commissioned,
];

export interface ISpecUSRListOptions
{
    Category?: string;
    Tag?: string;
}

export interface SpecUSRListLoaderArgs
{
    lang: Lang | string;
    categoryId: string;
    tagIds: string;
    showColProgId: PGID;
    baseParam: QueryListParam | null;
    showColParam: QueryListParam | null;
}

export interface SpecUSRListLoaderRes
{
    listRes: SpecUSRSet[];
    showColRowsRes: SpecCategorySet[];
    showColumnItemsRes: string[];
    showColumnMapRes: ShowColumnMap;
}

export interface SpecUSRListLoaderData
{
    args: SpecUSRListLoaderArgs;
    res: SpecUSRListLoaderRes;
}

export interface SpecUSRListRawData
{
    listData: SpecUSRSet[];
    showColumnItems: string[];
    showColTitle: ColumnConfig[];
}

export interface UseSpecUSRListFetchDataResult
{
    rawData: SpecUSRListRawData;
    isLoading: boolean;
    errorList: string[];
}

/** 建立 SSR initial */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };
    return { args, apiRes };
};

/** 建立主查詢條件 */
const buildCondition = (p: { categoryId: string; tagIds: string; }) =>
{
    let condition = "";

    if (p.categoryId) condition = `${SpecUSRModelFields.CategoryId} = ${p.categoryId}`;
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.Tags} HasAllOf [${p.tagIds}]`);
    condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.ContentStatus} !& 4`);

    return condition;
};

/** 建立主資料查詢參數 */
const buildBaseParam = (p: { categoryId: string; tagIds: string; }): QueryListParam | null =>
{
    if (!p.categoryId) return null;

    return {
        Fields: [
            SpecUSRModelFields.InternalId,
            SpecUSRModelFields.USRId,
            SpecUSRModelFields.PictureId,
            SpecUSRModelFields.PicDescription,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectItem}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ExternalCooperationUnit}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Department}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.PlanAmount}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.DuringExecution}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectLeader}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectSubLeader}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Cohost1}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Cohost2}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Commissioned}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,
            `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ContentIntroduction}`,
        ],
        Condition: buildCondition({ categoryId: p.categoryId, tagIds: p.tagIds }),
        RankGroups: [{ Condition: `${SpecUSRModelFields.ContentStatus} & 1` }],
        OrderBy: [
            { Col: `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`, Desc: true },
            { Col: `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`, Desc: true },
        ],
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 建立顯示欄位查詢參數 */
const buildShowColParam = (categoryId: string): QueryListParam | null =>
{
    if (!categoryId) return null;

    return {
        Fields: [
            SpecCategoryModelFields.InternalId,
            SpecCategoryModelFields.CategoryId,
            SpecCategoryModelFields.ProgId,
            SpecCategoryModelFields.ShowColumnItems,
        ],
        Condition: `${SpecCategoryModelFields.CategoryId} = ${categoryId}`,
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 解析 category 的 ShowColumnItems */
const buildShowColumnItems = (raw?: string | null): string[] =>
{
    const seen = new Set<string>();

    return (raw ?? "")
        .split(",")
        .map(p => p.split(".").pop()?.trim() ?? "")
        .filter(p => !!p && SUPPORTED_KEYS.includes(p) && !seen.has(p))
        .map(p => (seen.add(p), p));
};

/** 正規化後端顯示欄位 title map */
const normalizeShowColumnMap = (raw?: ShowColumnMap | null): ShowColumnMap =>
{
    const map: ShowColumnMap = {};
    const seen = new Set<string>();

    for (const [rawKey, rawValue] of Object.entries(raw ?? {}))
    {
        const key = String(rawKey ?? "").split(".").pop()?.trim() ?? "";
        if (!key || !SUPPORTED_KEYS.includes(key) || seen.has(key)) continue;

        seen.add(key);
        map[key] = String(rawValue ?? key);
    }

    return map;
};

/** 建立顯示欄位標題 */
const buildShowColTitle = (showColumnMap: ShowColumnMap): ColumnConfig[] =>
{
    return SUPPORTED_KEYS.map(key => ({ key, title: showColumnMap[key] ?? key }));
};

/** 是否可沿用 SSR show column initial */
const canUseShowColInitial = (loaderData: SpecUSRListLoaderData | null, categoryId: string) =>
{
    if (!loaderData?.args?.showColParam) return false;
    if (loaderData.args.categoryId !== categoryId) return false;
    return true;
};

/** 是否可沿用 SSR show column title initial */
const canUseShowColMapInitial = (loaderData: SpecUSRListLoaderData | null) =>
{
    if (!loaderData?.args) return false;
    return loaderData.args.showColProgId === PGID.SpecUSR;
};

/** 是否可沿用 SSR list initial */
const canUseListInitial = (
    loaderData: SpecUSRListLoaderData | null,
    p: { lang: Lang | string; categoryId: string; tagIds: string; },
) =>
{
    if (!loaderData?.args?.baseParam) return false;
    if (loaderData.args.lang !== p.lang) return false;
    if (loaderData.args.categoryId !== p.categoryId) return false;
    if (loaderData.args.tagIds !== p.tagIds) return false;
    return true;
};

/** SpecUSR SSR loader */
export const SpecUSRList_Loader =
    (p: { lang: Lang; opts?: ISpecUSRListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<SpecUSRListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const category = SpecCategoryAdapter(ssrApi);
        const usr = SpecUSRAdapter(ssrApi);
        const categoryId = p.opts?.Category ?? "";
        const tagIds = p.opts?.Tag ?? "";

        const showColParam = buildShowColParam(categoryId);
        const baseParam = buildBaseParam({ categoryId, tagIds });

        let showColRowsRes: SpecCategorySet[] = [];
        let showColumnItemsRes: string[] = [];
        let showColumnMapRes: ShowColumnMap = {};

        const showColMapLoader = category.loader.getShowColItemsLoader({
            progId: PGID.SpecUSR,
            getApiInstance: () => ssrApi,
        });
        const showColMapLD = await showColMapLoader({ request } as LoaderFunctionArgs);
        showColumnMapRes = normalizeShowColumnMap(showColMapLD.apiRes.Data ?? {});

        if (showColParam)
        {
            const showColLoader = category.loader.createQueryListLoader({
                getCondition: () => showColParam,
                getApiInstance: () => ssrApi,
            });

            const showColLD = await showColLoader({ request } as LoaderFunctionArgs);
            showColRowsRes = showColLD.apiRes.Data ?? [];
            showColumnItemsRes = buildShowColumnItems(showColRowsRes[0]?.SpecCategory?.ShowColumnItems ?? "");
        }

        if (!baseParam)
        {
            return {
                args: { lang: p.lang, categoryId, tagIds, showColProgId: PGID.SpecUSR, baseParam: null, showColParam },
                res: { listRes: [], showColRowsRes, showColumnItemsRes, showColumnMapRes },
            };
        }

        const listLoader = usr.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const listLD = await listLoader({ request } as LoaderFunctionArgs);

        return {
            args: { lang: p.lang, categoryId, tagIds, showColProgId: PGID.SpecUSR, baseParam, showColParam },
            res: {
                listRes: listLD.apiRes.Data ?? [],
                showColRowsRes,
                showColumnItemsRes,
                showColumnMapRes,
            },
        };
    };

/** 統一提供 SpecUSR list 所需資料 */
export const useSpecUSRListFetchData = (p: {
    lang: Lang | string;
    options?: ISpecUSRListOptions;
}): UseSpecUSRListFetchDataResult =>
{
    const loaderData = useLoaderData() as SpecUSRListLoaderData | null;
    const adapter = useMemo(() => ({ usr: SpecUSRAdapter(), category: SpecCategoryAdapter() }), []);
    const categoryId = p.options?.Category ?? "";
    const tagIds = p.options?.Tag ?? "";

    const showColParam = useMemo(() => buildShowColParam(categoryId) ?? EMPTY_QUERY, [categoryId]);
    const baseParam = useMemo(() => buildBaseParam({ categoryId, tagIds }) ?? EMPTY_QUERY, [categoryId, tagIds]);

    const showColInitial = useMemo<ApiLoaderData<QueryListParam, SpecCategorySet[]> | null>(() =>
    {
        if (!canUseShowColInitial(loaderData, categoryId)) return null;
        return buildLoaderInitial(loaderData!.args.showColParam!, loaderData?.res?.showColRowsRes ?? []);
    }, [loaderData, categoryId]);

    const showColMapInitial = useMemo<ApiLoaderData<PGID, ShowColumnMap> | null>(() =>
    {
        if (!canUseShowColMapInitial(loaderData)) return null;
        return buildLoaderInitial(PGID.SpecUSR, loaderData?.res?.showColumnMapRes ?? {});
    }, [loaderData]);

    const listInitial = useMemo<ApiLoaderData<QueryListParam, SpecUSRSet[]> | null>(() =>
    {
        if (!canUseListInitial(loaderData, { lang: p.lang, categoryId, tagIds })) return null;
        return buildLoaderInitial(loaderData!.args.baseParam!, loaderData?.res?.listRes ?? []);
    }, [loaderData, p.lang, categoryId, tagIds]);

    /** 顯示欄位 title hook */
    const useShowColMap = adapter.category.hooks.useGetShowColItems({
        progId: PGID.SpecUSR,
        initial: showColMapInitial,
        deps: [PGID.SpecUSR],
    });

    const showColumnMap = useMemo(() =>
    {
        return normalizeShowColumnMap(useShowColMap.data ?? {});
    }, [useShowColMap.data]);

    /** 顯示欄位 hook */
    const useShowCols = adapter.category.hooks.useQueryList({
        condition: showColParam,
        initial: showColInitial,
        deps: [categoryId],
    });

    const showColumnItems = useMemo(() =>
    {
        const raw = useShowCols.data?.[0]?.SpecCategory?.ShowColumnItems ?? "";
        return buildShowColumnItems(raw);
    }, [useShowCols.data]);

    /** 主資料 hook */
    const useList = adapter.usr.hooks.useQueryList({
        condition: baseParam,
        initial: listInitial,
        deps: [p.lang, categoryId, tagIds],
    });

    const rawData = useMemo<SpecUSRListRawData>(() =>
    {
        return {
            listData: useList.data ?? [],
            showColumnItems,
            showColTitle: buildShowColTitle(showColumnMap),
        };
    }, [useList.data, showColumnItems, showColumnMap]);

    const errorList = useMemo(() =>
    {
        return [useShowColMap.errorText, useShowCols.errorText, useList.errorText].filter((x): x is string =>
            Boolean(x)
        );
    }, [useShowColMap.errorText, useShowCols.errorText, useList.errorText]);

    return {
        rawData,
        isLoading: Boolean(useShowColMap.isLoading || useShowCols.isLoading || useList.isLoading),
        errorList,
    };
};
