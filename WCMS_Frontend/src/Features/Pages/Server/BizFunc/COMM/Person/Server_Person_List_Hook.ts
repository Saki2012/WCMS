import { PersonAdapter } from "@/Features/Hooks/BizFunc/COMM/Person_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { AccountModelFields, PersonModelFields } from "@/types/SchemaFields";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type PersonSet = components["schemas"]["PersonSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

interface PersonListGridProps
{
    CurrentPage: number;
    TotalPage: number;
    onPageChange: (page: number) => void;
}

interface UsePersonListDataResult
{
    rawData: PersonSet[];
    gridProps: PersonListGridProps;
    isLoading: boolean;
    error: string | null;
    refetchCurrent: () => Promise<void>;
}

interface UseServerPersonListResult
{
    prop: FormCompProp;
    rawData: PersonSet[];
    gridProps: PersonListGridProps;
    dirUrl: string;
}

/** 人員列表頁主 hook */
export const useServerPersonList = (theme: IBETheme): UseServerPersonListResult =>
{
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const dirUrl = useLocation().pathname.replace(/\/List$/, "/Form");
    const adapter = useMemo(() => PersonAdapter(), []);

    const dataList = usePersonListByAdapter(adapter, kw);
    const actions = usePersonActionsFromAdapter(dirUrl, adapter, dataList.refetchCurrent);

    const searchCompProp = useMemo<SearchBarProps>(() =>
    {
        // return
        return { title: "人員搜尋", subTitle: "搜尋人員 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw("") };
    }, []);

    const prop = useMemo<FormCompProp>(() =>
    {
        // return
        return { Title: "會員管理", Theme: theme, IsLoading: dataList.isLoading, ErrorList: [dataList.error], Actions: actions, SearchBar: searchCompProp };
    }, [theme, dataList.isLoading, dataList.error, actions, searchCompProp]);

    // return
    return { prop, rawData: dataList.rawData, gridProps: dataList.gridProps, dirUrl };
};

/** 用 Adapter 取得人員列表（含 Count + 分頁） */
const usePersonListByAdapter = (adapter: ReturnType<typeof PersonAdapter>, query: string): UsePersonListDataResult =>
{
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：顯示錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = usePersonCondition(query);

    const baseParam = useMemo<QueryListParam>(() =>
    {
        // return
        return {
            Fields: [
                PersonModelFields.InternalId,
                PersonModelFields.PersonId,
                PersonModelFields.PersonName,
                PersonModelFields.PersonImgId,
                PersonModelFields.CreateTime,
                PersonModelFields.ModifyTime,
                PersonModelFields.ModifyUserId,
                `${PersonModelFields.ModifyUser}.${AccountModelFields.AccountName}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: PersonModelFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 12,
        };
    }, [condition]);

    const count = adapter.hooks.useQueryCount({ condition: baseParam, deps: [baseParam.Condition ?? ""], onError });

    const paged = adapter.hooks.usePagedQueryList({ baseParam, count: count.data ?? 0, deps: [baseParam.Condition ?? ""], onError });

    const gridProps = useMemo<PersonListGridProps>(() =>
    {
        // return
        return { CurrentPage: paged.pageNumber, TotalPage: paged.totalPages, onPageChange: (page: number) => paged.onPageChange(page) };
    }, [paged.pageNumber, paged.totalPages, paged.onPageChange]);

    const refetchCurrent = useCallback(async () =>
    {
        // 執行 function：刪除/新增後同步刷新 count 與 list
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(count.isLoading || paged.isLoading);
    const error = count.errorText ?? paged.errorText ?? null;

    // return
    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchCurrent };
};

/** 組搜尋條件字串 */
const usePersonCondition = (query: string): string =>
{
    // return
    return useMemo(() =>
    {
        // 宣告變數
        let condition = "";

        // 執行 function：有關鍵字時組查詢條件
        if (query)
        {
            condition = LibMerge(" And ", false, condition, `(${PersonModelFields.PersonName} Like ${query} Or ${PersonModelFields.PersonId} Like ${query})`);
        }

        // return
        return condition;
    }, [query]);
};

/** 後台 actions */
const usePersonActionsFromAdapter = (dirUrl: string, adapter: ReturnType<typeof PersonAdapter>, afterChanged: () => Promise<void>): UseActionsResult =>
{
    // 宣告變數
    const navigate = useNavigate();
    const { publish } = useToast();

    const cud = adapter.hooks.useCudActions({ onError: (e: ApiAdapterError) => publish({ level: MessageStatus.Error, title: e.messageText }) });

    const onAddNew = useCallback(() =>
    {
        // 執行 function：前往新增
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((internalId: string) =>
    {
        // 執行 function：前往編輯
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() =>
    {
        // 執行 function：回清單
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);

    const onDelete = useCallback(async (internalId: string) =>
    {
        // 宣告變數
        const ok = window.confirm("確定要刪除嗎？");

        // 執行 function
        if (!ok) return;

        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach((m) =>
        {
            publish({ level: m.Status, code: m.MessageCode, title: m.Message });
        });

        if (res.IsSuccess)
        {
            await afterChanged();
        }
    }, [cud, publish, afterChanged]);

    // return
    return useMemo(() => ({
        isExecuting: cud.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: () =>
        {/* List 不做 */},
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () =>
        {/* List 不用 */},
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};
