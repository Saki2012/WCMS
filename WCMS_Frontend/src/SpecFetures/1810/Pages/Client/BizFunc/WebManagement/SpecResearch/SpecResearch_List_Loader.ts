import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PGID, SpecResearchDetailModelFields, SpecResearchModelFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { ISpecResearchListOptions } from "./SpecResearch_List_Comp";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
type SpecResearchDetail = components["schemas"]["SpecResearchDetailModel_DTO"];
type ShowColumnMap = Record<string, string>;

const EMPTY_QUERY: QueryListParam = { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 15 };

const ORDER: string[] = [
    SpecResearchDetailModelFields.Year,
    SpecResearchDetailModelFields.AcademicYear,
    SpecResearchDetailModelFields.Semester,
    SpecResearchDetailModelFields.CooperatingUnits,
    SpecResearchDetailModelFields.Courses,
    SpecResearchDetailModelFields.CooperationProject,
    SpecResearchDetailModelFields.ClassTime,
    SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
    SpecResearchDetailModelFields.Department,
    SpecResearchDetailModelFields.Professor,
    SpecResearchDetailModelFields.ProjectLeader,
    SpecResearchDetailModelFields.College,
    SpecResearchDetailModelFields.ProjectName,
    SpecResearchDetailModelFields.ApprovalNumber,
    SpecResearchDetailModelFields.ApprovedAmount,
    SpecResearchDetailModelFields.DuringExecution,
    SpecResearchDetailModelFields.ContractPeriod,
    SpecResearchDetailModelFields.Name,
    SpecResearchDetailModelFields.GraduationDegree,
    SpecResearchDetailModelFields.PaperTitle,
    SpecResearchDetailModelFields.Cohost1,
    SpecResearchDetailModelFields.Cohost2,
    SpecResearchDetailModelFields.Commissioned,
    SpecResearchDetailModelFields.PlanAmount,
    SpecResearchDetailModelFields.PlanContent,
    SpecResearchDetailModelFields.Remark,
];

export interface SpecResearchListLoaderArgs
{
    lang: Lang;
    categoryIds: string;
    tagIds: string;
    showColProgId: PGID;
    baseParam: QueryListParam | null;
}

export interface SpecResearchListLoaderRes
{
    showColumnMapRes: ShowColumnMap;
    countRes: number;
    listRes: SpecResearchSet[];
}

export interface SpecResearchListLoaderData
{
    args: SpecResearchListLoaderArgs;
    res: SpecResearchListLoaderRes;
}

export interface SpecResearchListRawData
{
    showColumnMap: ShowColumnMap;
    listData: SpecResearchSet[];
    count: number;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    gridProps: GridProps;
}

export interface UseSpecResearchListFetchDataResult
{
    rawData: SpecResearchListRawData;
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
const buildCondition = (p: { categoryIds: string; tagIds: string; }) =>
{
    let condition = "";
    if (p.categoryIds)
    {
        condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.CategoryId} = ${p.categoryIds}`);
    }
    if (p.tagIds)
    {
        condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.Tags} HasAllOf ${p.tagIds}`);
    }
    condition = LibMerge(" And ", false, condition, `${SpecResearchModelFields.ContentStatus} !& 4`);
    return condition;
};

/** 正規化 showColumnMap，只保留 detail 欄位 key */
const normalizeShowColumnMap = (rawMap?: ShowColumnMap | null): ShowColumnMap =>
{
    const map: ShowColumnMap = {};
    const seen = new Set<string>();

    for (const [rawKey, rawTitle] of Object.entries(rawMap ?? {}))
    {
        const key = rawKey.split(".").pop()?.trim() ?? "";
        if (!key || seen.has(key) || !ORDER.includes(key)) continue;

        seen.add(key);
        map[key] = String(rawTitle ?? key);
    }

    return map;
};

/** 依固定順序整理欄位 key */
const getOrderedShowColumnKeys = (showColumnMap: ShowColumnMap): string[] =>
{
    return Object.keys(showColumnMap)
        .filter(key => !!key)
        .sort((a, b) =>
        {
            const ai = ORDER.indexOf(a);
            const bi = ORDER.indexOf(b);
            const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
            const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
            return av - bv;
        });
};

/** 建立 detail fields */
const buildDetailFields = (): string[] =>
{
    return [
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang}`,
        ...ORDER.map(key => `${SpecResearchModelFields._SpecResearchDetail}.${key}`),
    ];
};

/** 建立主查詢參數 */
const buildBaseParam = (
    p: { categoryIds: string; tagIds: string; showColumnMap: ShowColumnMap; },
): QueryListParam | null =>
{
    if (!p.categoryIds) return null;
    if (getOrderedShowColumnKeys(p.showColumnMap).length <= 0) return null;

    return {
        Fields: [
            SpecResearchModelFields.InternalId,
            SpecResearchModelFields.ResearchId,
            ...buildDetailFields(),
        ],
        Condition: buildCondition({ categoryIds: p.categoryIds, tagIds: p.tagIds }),
        RankGroups: [{ Condition: `${SpecResearchModelFields.ContentStatus} & 1` }],
        OrderBy: [
            { Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`, Desc: true },
            {
                Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`,
                Desc: true,
            },
            {
                Col: `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Semester}`,
                Desc: false,
            },
        ],
        PageNumber: 1,
        PageSize: 15,
    };
};

/** 是否可沿用 SSR 顯示欄位 initial */
const canUseShowColInitial = (loaderData: SpecResearchListLoaderData | null) =>
{
    if (!loaderData?.args) return false;
    return loaderData.args.showColProgId === PGID.SpecResearch;
};

/** 是否可沿用 SSR list/count initial */
const canUseBaseInitial = (
    loaderData: SpecResearchListLoaderData | null,
    p: { lang: Lang; categoryIds: string; tagIds: string; },
) =>
{
    if (!loaderData?.args?.baseParam) return false;
    if (loaderData.args.lang !== p.lang) return false;
    if (loaderData.args.categoryIds !== p.categoryIds) return false;
    if (loaderData.args.tagIds !== p.tagIds) return false;
    return true;
};

/** 取得指定語系 detail */
const getDetail = (item: SpecResearchSet, lang: Lang) =>
{
    return item.SpecResearchDetail?.find(p => p.Lang === lang);
};

/** 取得 detail 欄位文字 */
const getDetailText = (detail: SpecResearchDetail | undefined, key: string, lang: Lang) =>
{
    const row = detail as Record<string, string | number | null | undefined> | undefined;
    const raw = row?.[key];

    if (key === SpecResearchDetailModelFields.ApprovedAmount || key === SpecResearchDetailModelFields.PlanAmount)
    {
        const num = typeof raw === "number" ? raw : Number(raw ?? "");
        if (!Number.isFinite(num)) return "";
        return new Intl.NumberFormat(lang, { style: "decimal" }).format(num);
    }

    return raw == null ? "" : String(raw);
};

/** 建立 Grid columns */
const buildColumns = (showColumnMap: ShowColumnMap): ColumnConfig[] =>
{
    return getOrderedShowColumnKeys(showColumnMap).map(key => ({ key, title: showColumnMap[key] ?? key }));
};

/** 建立 GridProps */
const buildGridProps = (p: {
    lang: Lang;
    showColumnMap: ShowColumnMap;
    listData: SpecResearchSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}): GridProps =>
{
    const columns = buildColumns(p.showColumnMap);

    const rows: GridRow[] = p.listData.map(item =>
    {
        const detail = getDetail(item, p.lang);

        const cells: RowCell[] = columns.map(col =>
        {
            const content = getDetailText(detail, col.key, p.lang);
            return { col, content };
        });

        return { keyId: item.SpecResearch?.InternalId ?? "", cells };
    });

    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};

/** SpecResearch SSR loader */
export const SpecResearchList_Loader =
    (p: { lang: Lang; opts?: ISpecResearchListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<SpecResearchListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const specCategory = SpecCategoryAdapter(ssrApi);
        const specResearch = SpecResearchAdapter(ssrApi);
        const categoryIds = p.opts?.Category ?? "";
        const tagIds = p.opts?.Tag ?? "";

        /** 顯示欄位 loader */
        const showColLoader = specCategory.loader.getShowColItemsLoader({
            progId: PGID.SpecResearch,
            getApiInstance: () => ssrApi,
        });

        const showColLD = await showColLoader({ request } as LoaderFunctionArgs);
        const showColumnMapRes = normalizeShowColumnMap(showColLD.apiRes.Data ?? {});
        const baseParam = buildBaseParam({ categoryIds, tagIds, showColumnMap: showColumnMapRes });

        if (!baseParam)
        {
            return {
                args: { lang: p.lang, categoryIds, tagIds, showColProgId: PGID.SpecResearch, baseParam: null },
                res: { showColumnMapRes, countRes: 0, listRes: [] },
            };
        }

        /** 主資料 count loader */
        const countLoader = specResearch.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        /** 主資料 list loader */
        const listLoader = specResearch.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD] = await Promise.all([
            countLoader({ request } as LoaderFunctionArgs),
            listLoader({ request } as LoaderFunctionArgs),
        ]);

        return {
            args: { lang: p.lang, categoryIds, tagIds, showColProgId: PGID.SpecResearch, baseParam },
            res: {
                showColumnMapRes,
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
            },
        };
    };

/** 統一提供 SpecResearch list 所需資料 */
export const useSpecResearchListFetchData = (p: {
    lang: Lang;
    options?: ISpecResearchListOptions;
}): UseSpecResearchListFetchDataResult =>
{
    const loaderData = useLoaderData() as SpecResearchListLoaderData | null;
    const adapter = useMemo(() => ({ category: SpecCategoryAdapter(), research: SpecResearchAdapter() }), []);
    const categoryIds = p.options?.Category ?? "";
    const tagIds = p.options?.Tag ?? "";

    const showColInitial = useMemo<ApiLoaderData<PGID, ShowColumnMap> | null>(() =>
    {
        if (!canUseShowColInitial(loaderData)) return null;
        return buildLoaderInitial(PGID.SpecResearch, loaderData?.res?.showColumnMapRes ?? {});
    }, [loaderData]);

    /** 顯示欄位 hook */
    const useShowCols = adapter.category.hooks.useGetShowColItems({
        progId: PGID.SpecResearch,
        initial: showColInitial,
        deps: [PGID.SpecResearch],
    });

    const showColumnMap = useMemo(() =>
    {
        return normalizeShowColumnMap(useShowCols.data ?? {});
    }, [useShowCols.data]);

    const baseParam = useMemo(() =>
    {
        return buildBaseParam({ categoryIds, tagIds, showColumnMap }) ?? EMPTY_QUERY;
    }, [categoryIds, tagIds, showColumnMap]);

    const countInitial = useMemo<ApiLoaderData<QueryListParam, number> | null>(() =>
    {
        if (!canUseBaseInitial(loaderData, { lang: p.lang, categoryIds, tagIds })) return null;
        return buildLoaderInitial(loaderData!.args.baseParam!, loaderData?.res?.countRes ?? 0);
    }, [loaderData, p.lang, categoryIds, tagIds]);

    const listInitial = useMemo<ApiLoaderData<QueryListParam, SpecResearchSet[]> | null>(() =>
    {
        if (!canUseBaseInitial(loaderData, { lang: p.lang, categoryIds, tagIds })) return null;
        return buildLoaderInitial(loaderData!.args.baseParam!, loaderData?.res?.listRes ?? []);
    }, [loaderData, p.lang, categoryIds, tagIds]);

    /** 主資料 count */
    const useCount = adapter.research.hooks.useQueryCount({
        condition: baseParam,
        initial: countInitial,
        deps: [p.lang, categoryIds, tagIds, Object.keys(showColumnMap).join(",")],
    });

    /** 主資料 list */
    const useList = adapter.research.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: listInitial,
        deps: [p.lang, categoryIds, tagIds, Object.keys(showColumnMap).join(",")],
    });

    const gridProps = useMemo(() =>
    {
        return buildGridProps({
            lang: p.lang,
            showColumnMap,
            listData: useList.data ?? [],
            pageNumber: useList.pageNumber,
            totalPages: useList.totalPages,
            onPageChange: useList.onPageChange,
        });
    }, [p.lang, showColumnMap, useList.data, useList.pageNumber, useList.totalPages, useList.onPageChange]);

    const errorList = useMemo(() =>
    {
        return [useShowCols.errorText, useCount.errorText, useList.errorText].filter((x): x is string => Boolean(x));
    }, [useShowCols.errorText, useCount.errorText, useList.errorText]);

    const rawData = useMemo<SpecResearchListRawData>(() =>
    {
        return {
            showColumnMap,
            listData: useList.data ?? [],
            count: useCount.data ?? 0,
            pageNumber: useList.pageNumber,
            totalPages: useList.totalPages,
            onPageChange: useList.onPageChange,
            gridProps,
        };
    }, [
        showColumnMap,
        useList.data,
        useCount.data,
        useList.pageNumber,
        useList.totalPages,
        useList.onPageChange,
        gridProps,
    ]);

    return {
        rawData,
        isLoading: Boolean(useShowCols.isLoading || useCount.isLoading || useList.isLoading),
        errorList,
    };
};
