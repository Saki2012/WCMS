import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AccountFields,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

//#region Public
export type SpecJournalIndexListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SpecJournalIndexSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};

export type SpecJournalIndexListAdapter = {
    SpecJournalIndex: ReturnType<typeof SpecJournalIndexAdapter>;
};

/** SpecJournalIndex List 的資料入口 */
export const useSpecJournalIndexListFetchData = (
    opt: { lang: Lang; kw: string; },
): UseFetchDataResult<SpecJournalIndexListRawData, SpecJournalIndexListAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 顯示錯誤訊息
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<SpecJournalIndexListAdapter>(() =>
    {
        // 建立 adapter group
        return {
            SpecJournalIndex: SpecJournalIndexAdapter(),
        };
    }, []);

    const baseParam = useSpecJournalIndexListQueryParam({
        lang: opt.lang,
        kw: opt.kw,
    });

    const grid = adapter.SpecJournalIndex.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });

    const isLoading = Boolean(grid.isLoading);

    const errors = useMemo(() =>
    {
        // 統一錯誤出口
        return [...(grid.errors ?? [])].filter((x): x is string => Boolean(x));
    }, [grid.errors]);

    const rawData = useMemo<SpecJournalIndexListRawData>(() =>
    {
        // 整理 Comp 要吃的資料
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
        // 重抓主資料
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        // 目前無參照資料，保留介面一致
    }, []);

    // return
    return {
        adapter,
        rawData,
        isLoading,
        errors,
        refetchData,
        refetchRefData,
    };
};
//#endregion

//#region Private
const useSpecJournalIndexListQueryParam = (
    p: { lang: Lang; kw: string; },
): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        // 列表查詢欄位
        return [
            SpecJournalIndexModelFields.IndexId,
            SpecJournalIndexModelFields.IndexName,
            SpecJournalIndexModelFields.ModifyUserId,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalIndexModelFields.ModifyUser}.${AccountFields.AccountName}`,
            SpecJournalIndexModelFields.CreateTime,
            SpecJournalIndexModelFields.ModifyTime,
            SpecJournalIndexModelFields.InternalId,
        ];
    }, []);

    const condition = useMemo(() =>
    {
        // 組搜尋條件
        let cdt = "";
        if (p.kw) {
            cdt = LibMerge( " And ", false, cdt, `${SpecJournalIndexModelFields.IndexName} Like ${p.kw}`,);
        }
        return cdt;
    }, [p.kw]);

    return useMemo(() =>
    {
        // 回傳查詢參數
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion