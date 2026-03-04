import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { components } from "@/types/api";
import { AccountFields, SpecOpenScheduleRuleModelFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];

//#region Public
export type ScheduleRuleListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SpecOpenScheduleRuleSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};

export type ScheduleRuleListAdapter = {
    ScheduleRule: ReturnType<typeof SpecOpenScheduleRuleAdapter>;
};

/** ✅ 主入口：Server ScheduleRule List 的所有 fetch 都集中在這裡 */
export const useScheduleRuleListFetchData = (
    opt: { kw: string },
): UseFetchDataResult<ScheduleRuleListRawData, ScheduleRuleListAdapter> => {
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<ScheduleRuleListAdapter>(() => {
        return { ScheduleRule: SpecOpenScheduleRuleAdapter() };
    }, []);

    // 執行 function：Query param
    const baseParam = useScheduleRuleListQueryParam({ kw: opt.kw });

    // 執行 function：主資料（Grid）
    const grid = adapter.ScheduleRule.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        onError,
    });

    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() => {
        return [...(grid.errors ?? [])];
    }, [grid.errors]);

    // 宣告變數：rawData 統一出口
    const rawData = useMemo<ScheduleRuleListRawData>(() => {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count,
            list: grid.list,
            pageNumber: grid.pageNumber,
            totalPages: grid.totalPages,
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

    const refetchData = useCallback(async () => {
        await grid.refetchData();
    }, [grid]);

    // return
    return { adapter, rawData, isLoading, errors, refetchData };
};
//#endregion

//#region Private
const useScheduleRuleListQueryParam = (p: { kw: string }): QueryListParam => {
    const fields = useMemo<string[]>(() => {
        return [
            SpecOpenScheduleRuleModelFields.AcademicYearId,
            SpecOpenScheduleRuleModelFields.AcademicStart,
            SpecOpenScheduleRuleModelFields.AcademicEnd,
            SpecOpenScheduleRuleModelFields.CreateTime,
            SpecOpenScheduleRuleModelFields.ModifyUserId,
            `${SpecOpenScheduleRuleModelFields.ModifyUser}.${AccountFields.AccountName}`,
            SpecOpenScheduleRuleModelFields.ModifyTime,
            SpecOpenScheduleRuleModelFields.InternalId,
        ];
    }, []);

    const condition = useMemo(() => {
        let cdt = "";
        if (p.kw) cdt = LibMerge(" And ", false, cdt, `${SpecOpenScheduleRuleModelFields.AcademicYearId} Like ${p.kw}`);
        return cdt;
    }, [p.kw]);

    return useMemo(() => {
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [{ Col: SpecOpenScheduleRuleModelFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion