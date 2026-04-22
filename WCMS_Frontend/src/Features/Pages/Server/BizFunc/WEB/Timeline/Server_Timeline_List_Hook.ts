import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
type QueryListParam = components["schemas"]["QueryListParam"];
type TimelineSet = components["schemas"]["TimelineSet_DTO"];

// #region Public
export type TimelineListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: TimelineSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};
type TimelineListAdapter = {
    Timeline: ReturnType<typeof TimelineAdapter>;
};
/** ✅ 主入口：Server Timeline List 的所有 fetch 都集中在這裡 */
export const useTimelineListFetchData = (
    opt: { lang: Lang; kw: string; },
): UseFetchDataResult<TimelineListRawData, TimelineListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter: TimelineListAdapter = useMemo(() =>
    {
        return { Timeline: TimelineAdapter() };
    }, []);
    // 執行 function：Query param（穩定 reference，避免 deps 無限觸發）
    const baseParam = useTimelineListQueryParam({ lang: opt.lang, kw: opt.kw });
    // 執行 function：主資料（公告 Grid）
    const grid = adapter.Timeline.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? [])];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<TimelineListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [
        grid.modelDisplayName,
        grid.count,
        grid.list,
        grid.pageNumber,
        grid.totalPages,
        grid.onPageChange,
        grid.param,
    ]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
const useTimelineListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [
            TimelineFields.TimelineId,
            TimelineFields.TimelineName,
            `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`,
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Title}`,
            TimelineFields.ModifyUserId,
            TimelineFields.CreateTime,
            TimelineFields.ModifyTime,
            TimelineFields.InternalId,
            `${TimelineFields.ModifyUser}.${AccountFields.AccountName}`,
        ];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt =
            `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang} = ${p.lang}`;
        if (p.kw)
        {
            cdt = LibMerge(" And ", false, cdt, `${TimelineFields.TimelineName} Like ${p.kw}`);
        }
        return cdt;
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [{ Col: TimelineFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition]);
};
// #endregion
