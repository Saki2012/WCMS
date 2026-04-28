import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type TimelineSet = components["schemas"]["TimelineSet_DTO"];

export interface ITimelineOptions
{
    TimelineId?: string;
    IsDesc?: boolean;
}

export interface TimelineFormLoaderArgs
{
    lang: Lang;
    timelineId: string;
    isDesc: boolean;
    pageSize: number;
    pageNumber: number;
    condition: string;
    listParam: QueryListParam;
}

export interface TimelineFormLoaderRes
{
    gridRes: ApiGridLoaderData<TimelineSet>;
}

export interface TimelineFormLoaderData
{
    args: TimelineFormLoaderArgs;
    res: TimelineFormLoaderRes;
}

export interface TimelineFormFetchDataResult
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: TimelineSet[];
    title: string;
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    onPageChange: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 5;

/** 跳脫查詢字串雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 轉成正整數 */
const toPositiveInt = (value: string | null | undefined, fallback: number): number =>
{
    // 宣告變數
    const n = Number(value);

    // return
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
};

/** 建 Timeline 條件字串 */
const buildTimelineCondition = (p: { lang: Lang; timelineId: string; }): string =>
{
    // 宣告變數
    const timelineId = escapeQueryValue(p.timelineId);
    const lang = escapeQueryValue(p.lang);

    // return
    return `${TimelineFields.TimelineId} = "${timelineId}"`
        + ` And ${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang} = "${lang}"`;
};

/** 建 Timeline QueryListParam */
const buildTimelineQuery = (p: { condition: string; isDesc: boolean; }): QueryListParam =>
{
    // return
    return {
        Fields: [
            TimelineFields.TimelineId,
            TimelineFields.TimelineName,
            `${TimelineFields._TimelineItem}.${TimelineItemFields.TimelineId}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields.RowId}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.TimelineId}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.ParentRowId}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.RowId}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Title}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Content}`,
        ],
        Condition: p.condition,
        OrderBy: [{ Col: `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`, Desc: p.isDesc }],
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    p: { lang: Lang; opts?: ITimelineOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; timelineId: string; isDesc: boolean; }>; },
): TimelineFormLoaderArgs =>
{
    // 宣告變數
    const timelineId = `${p.overrides?.timelineId ?? p.opts?.TimelineId ?? ""}`.trim();
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? DEFAULT_PAGE_SIZE;
    const condition = buildTimelineCondition({ lang: p.lang, timelineId });
    const isDesc = Boolean(p.overrides?.isDesc ?? p.opts?.IsDesc ?? false);
    // return
    return { lang: p.lang, timelineId, pageSize, pageNumber, condition, isDesc, listParam: buildTimelineQuery({ condition, isDesc }) };
};

const matchQueryInitial = <TData>(
    currentParam: QueryListParam,
    initial: ApiLoaderData<QueryListParam, TData> | null | undefined,
): ApiLoaderData<QueryListParam, TData> | null =>
{
    // 宣告變數
    const currentKey = JSON.stringify(currentParam ?? null);
    const initialKey = JSON.stringify(initial?.args ?? null);

    // return
    return currentKey === initialKey ? (initial ?? null) : null;
};

/** 取重置 key */
const buildResetKey = (args: Pick<TimelineFormLoaderArgs, "lang" | "timelineId" | "pageSize" | "isDesc">): string =>
{
    // return
    return JSON.stringify({ lang: args.lang, timelineId: args.timelineId, pageSize: args.pageSize, isDesc: args.isDesc });
};

/** SSR Loader：首屏撈 timeline grid */
export const TimelineForm_Loader =
    (p: { lang: Lang; opts?: ITimelineOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; timelineId: string; }>; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<TimelineFormLoaderData> =>
    {
        // 宣告變數
        const ssrApi = getSsrApi(request);
        const timeline = TimelineAdapter(ssrApi);
        const url = new URL(request.url);

        const baseArgs = buildLoaderArgs({
            lang: p.lang,
            opts: p.opts,
            overrides: {
                timelineId: p.overrides?.timelineId,
                pageNumber: p.overrides?.pageNumber ?? toPositiveInt(url.searchParams.get("page"), 1),
                pageSize: p.overrides?.pageSize,
            },
        });

        const gridLoader = timeline.loader.createQueryGridDataLoader({ getCondition: () => baseArgs.listParam, getApiInstance: () => ssrApi });

        const gridRes = await gridLoader({ request } as LoaderFunctionArgs);

        // return
        return { args: baseArgs, res: { gridRes } };
    };

/** CSR Hook：Component 一行拿 Timeline list + paginator */
export const useTimelineFormFetchData = (p: { lang: Lang; opts?: ITimelineOptions; }): TimelineFormFetchDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as TimelineFormLoaderData;
    const timeline = useMemo(() => TimelineAdapter(), []);

    const currentArgs = useMemo(() =>
    {
        return buildLoaderArgs({ lang: p.lang, opts: p.opts });
    }, [p.lang, p.opts]);

    const gridInitial = useMemo<ApiGridInitial<TimelineSet>>(() =>
    {
        return {
            model: initial.res.gridRes.model,
            count: matchQueryInitial(currentArgs.listParam, initial.res.gridRes.count),
            list: matchQueryInitial(currentArgs.listParam, initial.res.gridRes.list),
        };
    }, [currentArgs.listParam, initial.res.gridRes]);

    const grid = timeline.hooks.useQueryGridData({
        baseParam: currentArgs.listParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        initial: gridInitial,
    });

    const resetKey = useMemo(() =>
    {
        return buildResetKey(currentArgs);
    }, [currentArgs]);

    const prevResetKeyRef = useRef<string>(resetKey);

    useEffect(() =>
    {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        grid.onPageChange(1);
    }, [resetKey, grid.onPageChange]);

    const listData = useMemo<TimelineSet[]>(() =>
    {
        return grid.list ?? [];
    }, [grid.list]);

    const title = useMemo(() =>
    {
        return `${listData[0]?.Timeline?.TimelineName ?? ""}`.trim();
    }, [listData]);

    const errorList = useMemo(() =>
    {
        return [grid.errorText].filter((x): x is string => Boolean(x));
    }, [grid.errorText]);

    // return
    return {
        pageSize: currentArgs.pageSize,
        pageNumber: grid.pageNumber,
        totalPages: grid.totalPages,
        totalCount: grid.count,
        listData,
        title,
        isLoading: Boolean(grid.isLoading),
        errorText: grid.errorText ?? null,
        errorList,
        onPageChange: grid.onPageChange,
    };
};
