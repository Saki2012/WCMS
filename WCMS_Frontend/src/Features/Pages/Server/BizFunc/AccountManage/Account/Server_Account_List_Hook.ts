import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { AccountAdapter } from "@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api";
import { AccountFields, PersonModelFields, RoleDataModelFields } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type AccountSet = components["schemas"]["AccountSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
type AccountAdapterType = ReturnType<typeof AccountAdapter>;

interface AccountListGridProps {
    CurrentPage: number;
    TotalPage: number;
    onPageChange: (page: number) => void;
}

interface UseAccountListDataResult {
    rawData: AccountSet[];
    gridProps: AccountListGridProps;
    isLoading: boolean;
    error: string | null;
    refetchCurrent: () => Promise<void>;
}

interface UseServerAccountListResult {
    prop: FormCompProp;
    rawData: AccountSet[];
    gridProps: AccountListGridProps;
    dirUrl: string;
}

/** 建立列表查詢條件 */
const useAccountListData = (adapter: AccountAdapterType, query: string): UseAccountListDataResult => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function：顯示錯誤 toast
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = useMemo(() => {
        // 宣告變數
        const hasQuery = Boolean(query);

        // return
        if (!hasQuery) return "";

        return LibMerge(
            " And ",
            false,
            `(${AccountFields.AccountName} Like ${query} Or ${AccountFields.AccountId} Like ${query})`,
        );
    }, [query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                AccountFields.InternalId,
                AccountFields.AccountId,
                AccountFields.AccountName,
                `${AccountFields.Person}.${PersonModelFields.PersonImgId}`,
                `${AccountFields.Role}.${RoleDataModelFields.RoleName}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: AccountFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 12,
        };
    }, [condition]);

    const count = adapter.hooks.useQueryCount({
        condition: baseParam,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const paged = adapter.hooks.usePagedQueryList({
        baseParam,
        count: count.data ?? 0,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const gridProps = useMemo<AccountListGridProps>(() => {
        // return
        return {
            CurrentPage: paged.pageNumber,
            TotalPage: paged.totalPages,
            onPageChange: (page: number) => paged.onPageChange(page),
        };
    }, [paged.pageNumber, paged.totalPages, paged.onPageChange]);

    const refetchCurrent = useCallback(async () => {
        // 執行 function：同步刷新 count 與 list
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(count.isLoading || paged.isLoading);
    const error = count.errorText ?? paged.errorText ?? null;

    // return
    return {
        rawData: paged.data ?? [],
        gridProps,
        isLoading,
        error,
        refetchCurrent,
    };
};

/** 建立列表 actions */
const useAccountListActions = (
    dirUrl: string,
    adapter: AccountAdapterType,
    afterChanged: () => Promise<void>,
): UseActionsResult => {
    // 宣告變數
    const navigate = useNavigate();
    const { publish } = useToast();

    const cud = adapter.hooks.useCudActions({
        onError: (e: ApiAdapterError) => publish({ level: MessageStatus.Error, title: e.messageText }),
    });

    const onAddNew = useCallback(() => {
        // 執行 function：前往新增
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((internalId: string) => {
        // 執行 function：前往編輯
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() => {
        // 執行 function：回清單頁
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);

    const onDelete = useCallback(async (internalId: string) => {
        // 宣告變數
        const ok = window.confirm("確定要刪除嗎？");

        // 執行 function
        if (!ok) return;

        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach((m) => {
            publish({ level: m.Status, code: m.MessageCode, title: m.Message });
        });

        if (res.IsSuccess) await afterChanged();
    }, [cud, publish, afterChanged]);

    // return
    return useMemo(() => ({
        isExecuting: cud.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: () => { /* Account List 暫不處理 invalid */ },
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () => { /* List 不使用 preview */ },
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};

/** 提供給列表頁使用的主 hook */
export const useServerAccountList = (theme: IBETheme): UseServerAccountListResult => {
    const [kw, setKw] = useState<string>("");
    const dirUrl = useLocation().pathname.replace(/\/List$/, "/Form");
    const adapter = useMemo(() => AccountAdapter(), []);
    const dataList = useAccountListData(adapter, kw);
    const actions = useAccountListActions(dirUrl, adapter, dataList.refetchCurrent);
    const searchCompProp = useMemo<SearchBarProps>(() => {return {title: "帳號搜尋", subTitle: "搜尋帳號 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), }; }, []);
    const prop = useMemo<FormCompProp>(() => { return { Title: "會員管理", Theme: theme, IsLoading: dataList.isLoading, ErrorList: [dataList.error], Actions: actions, SearchBar: searchCompProp, };}, [theme, dataList.isLoading, dataList.error, actions, searchCompProp]);
    return {prop, rawData: dataList.rawData, gridProps: dataList.gridProps, dirUrl, };
};