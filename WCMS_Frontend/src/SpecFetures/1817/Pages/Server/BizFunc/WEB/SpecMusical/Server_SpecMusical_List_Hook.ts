import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, SpecMusicalModelFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

// #region Public
export type SpecMusicalListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SpecMusicalSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};

export type SpecMusicalListAdapter = { SpecMusical: ReturnType<typeof SpecMusicalAdapter>; };

/** SpecMusical List 的所有 fetch 集中在這裡 */
export const useSpecMusicalListFetchData = (opt: { lang: Lang; kw: string; }): UseFetchDataResult<SpecMusicalListRawData, SpecMusicalListAdapter> =>
{
    const { publish } = useToast();

    /** 統一處理 Adapter 錯誤提示 */
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    /** 集中建立 Adapter，避免重複 new */
    const adapter = useMemo(() =>
    {
        return { SpecMusical: SpecMusicalAdapter() };
    }, []);

    /** 組 Query 參數 */
    const baseParam = useSpecMusicalListQueryParam({ kw: opt.kw });

    /** 主資料：Grid 所需的 model/count/list/paging */
    const grid = adapter.SpecMusical.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });

    /** 統一 loading 狀態 */
    const isLoading = Boolean(grid.isLoading);

    /** 統一 errors 出口 */
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? [])];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors]);

    /** 統一 rawData 出口 */
    const rawData = useMemo<SpecMusicalListRawData>(() =>
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
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    /** 重新抓主資料 */
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);

    /** 目前無額外參照資料，保留介面一致 */
    const refetchRefData = useCallback(async () =>
    {
        return;
    }, []);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** 組出 SpecMusical List 的查詢參數 */
const useSpecMusicalListQueryParam = (p: { kw: string; }): QueryListParam =>
{
    /** 固定欄位清單 */
    const fields = useMemo<string[]>(() =>
    {
        return [
            SpecMusicalModelFields.MusicalId,
            SpecMusicalModelFields.MusicalName,
            SpecMusicalModelFields.CoverPicId,
            SpecMusicalModelFields.Specification,
            SpecMusicalModelFields.ModifyUserId,
            `${SpecMusicalModelFields.ModifyUser}.${AccountFields.AccountName}`,
            SpecMusicalModelFields.CreateTime,
            SpecMusicalModelFields.ModifyTime,
            SpecMusicalModelFields.InternalId,
        ];
    }, []);

    /** 依關鍵字組條件 */
    const condition = useMemo(() =>
    {
        let cdt = ``;

        if (p.kw)
        {
            cdt = LibMerge(" And ", false, cdt, `${SpecMusicalModelFields.MusicalName} Like ${p.kw}`);
        }

        return cdt;
    }, [p.kw]);

    /** 回傳最終 QueryListParam */
    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10 };
    }, [fields, condition]);
};
// #endregion
