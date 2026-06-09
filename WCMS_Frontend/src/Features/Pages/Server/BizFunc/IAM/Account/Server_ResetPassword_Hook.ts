import { AccountAdapter } from "@/Features/Hooks/BizFunc/IAM/Account_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IActionHandle } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { AccountFields } from "@/types/SchemaFields";
import { useCallback, useMemo, useState } from "react";
import { useMatches } from "react-router";
import { useLocation, useNavigate } from "react-router-dom";

// #region Property
type AccountSet = components["schemas"]["AccountSet_DTO"];

type ResetPassword = components["schemas"]["ResetPassword"];

type QueryListParam = components["schemas"]["QueryListParam"];


export interface UseServerResetPasswordResult
{
    prop: FormCompProp;
    accountDict: Record<string, string>;
    userInternalId: string;
    newPwd: string;
    confirmPwd: string;
    onUserInternalIdChange: (value: string) => void;
    onNewPwdChange: (value: string) => void;
    onConfirmPwdChange: (value: string) => void;
}
// #endregion

// #region Public
export const useServerResetPassword = (theme: IBETheme): UseServerResetPasswordResult =>
{
    // 宣告變數
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;
    const adapter = useMemo(() => AccountAdapter(), []);

    const [userInternalId, setUserInternalId] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");

    const accountList = useAccountListDataByAdapter(adapter);

    const accountDict = useMemo<Record<string, string>>(() =>
    {
        // 宣告變數
        const dict: Record<string, string> = {};

        // 執行 function：轉為下拉選單格式
        for (const item of accountList.rawData ?? [])
        {
            const id = String(item?.Account?.InternalId ?? "").trim();
            if (!id) continue;

            dict[id] = `${item?.Account?.AccountId ?? ""}, ${item?.Account?.AccountName ?? ""}`;
        }

        // return
        return dict;
    }, [accountList.rawData]);

    const handleCancelBack = useCallback(() =>
    {
        // 執行 function：回到同模組 List
        navigate(location.pathname.replace(/\/ResetPassword(\/[^\/]*)?$/, "/List"));
    }, [navigate, location.pathname]);

    const resetPwd = adapter.hooks.useResetPassword({
        onError: (e: ApiAdapterError) =>
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: e.messageText });
        },
    });

    const validateBeforeSave = useCallback((): boolean =>
    {
        // 執行 function：表單檢核
        if (!userInternalId)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請選擇帳號" });
            return false;
        }

        if (!newPwd || !confirmPwd)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請輸入新密碼並再次確認" });
            return false;
        }

        if (newPwd !== confirmPwd)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次新密碼不一致" });
            return false;
        }

        return true;
    }, [userInternalId, newPwd, confirmPwd, publish]);

    const handleSave = useCallback(async (): Promise<boolean> =>
    {
        // 宣告變數
        const ok = validateBeforeSave();

        // 執行 function：驗證後送出 API
        if (!ok) return false;

        const payload: ResetPassword = { UserInternalId: userInternalId, NewPassword: newPwd };

        const res = await resetPwd.execute(payload);

        (res.SysMessage ?? []).forEach((item) =>
        {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (res.IsSuccess)
        {
            handleCancelBack();
            publish({ level: MessageStatus.Green, title: "重置成功", text: "" });
            return true;
        }

        publish({ level: MessageStatus.Error, title: "保存失敗", text: "重置密碼失敗" });
        return false;
    }, [validateBeforeSave, userInternalId, newPwd, resetPwd, publish, handleCancelBack]);

    const actions = useMemo<UseActionsResult>(() =>
    {
        // return：提供給 toolbar
        return {
            isExecuting: resetPwd.isLoading,
            onSave: handleSave,
            onCancelBack: handleCancelBack,
            onAddNew: () =>
            {/* 此頁不使用 */},
            onEdit: () =>
            {/* 此頁不使用 */},
            onDelete: async () =>
            {/* 此頁不使用 */},
            onInvalid: () =>
            {/* 此頁不使用 */},
            onPreview: () =>
            {/* 此頁不使用 */},
        };
    }, [resetPwd.isLoading, handleSave, handleCancelBack]);

    const prop = useMemo<FormCompProp>(() =>
    {
        // return：表單外層設定
        return {
            Title: handle?.Title ?? "重置密碼",
            Theme: theme,
            IsLoading: [accountList.isLoading, resetPwd.isLoading].some(Boolean),
            ErrorList: [accountList.error],
            Actions: actions,
        };
    }, [handle?.Title, theme, accountList.isLoading, accountList.error, resetPwd.isLoading, actions]);

    // return
    return {
        prop,
        accountDict,
        userInternalId,
        newPwd,
        confirmPwd,
        onUserInternalIdChange: setUserInternalId,
        onNewPwdChange: setNewPwd,
        onConfirmPwdChange: setConfirmPwd,
    };
};
// #endregion

// #region Private
const useAccountListDataByAdapter = (adapter: ReturnType<typeof AccountAdapter>) =>
{
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：顯示錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = useMemo<QueryListParam>(() =>
    {
        // return：撈下拉選單最小欄位
        return {
            Fields: [AccountFields.InternalId, AccountFields.AccountId, AccountFields.AccountName],
            Condition: "",
            OrderBy: [{ Col: AccountFields.AccountId, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);

    const query = adapter.hooks.useQueryList({ condition, deps: [], onError });

    // return
    return { rawData: (query.data ?? []) as AccountSet[], isLoading: Boolean(query.isLoading), error: query.errorText ?? null };
};
// #endregion
