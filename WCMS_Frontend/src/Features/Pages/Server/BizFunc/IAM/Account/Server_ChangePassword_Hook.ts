import { AccountAdapter } from "@/Features/Hooks/BizFunc/IAM/Account_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IActionHandle } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { AuthAPI } from "@/SysCore/Utils/API/AuthClient";
import type { components } from "@/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMatches } from "react-router";
import { useLocation, useNavigate } from "react-router-dom";

// #region Property
type ChangePassword = components["schemas"]["ChangePassword"];


export interface UseServerChangePasswordResult
{
    prop: FormCompProp;
    displayName: string;
    oldPwd: string;
    newPwd: string;
    confirmPwd: string;
    onOldPwdChange: (value: string) => void;
    onNewPwdChange: (value: string) => void;
    onConfirmPwdChange: (value: string) => void;
}
// #endregion

// #region Public
export const useServerChangePassword = (theme: IBETheme): UseServerChangePasswordResult =>
{
    // 宣告變數
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;
    const adapter = useMemo(() => AccountAdapter(), []);

    const [displayName, setDisplayName] = useState<string>("");
    const [oldPwd, setOldPwd] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");

    const handleCancelBack = useCallback(() =>
    {
        // 執行 function：回到同模組 List 頁
        navigate(location.pathname.replace(/\/ChangePassword(\/[^\/]*)?$/, "/List"));
    }, [navigate, location.pathname]);

    const changePwd = adapter.hooks.useChangePassword({
        onError: (e) =>
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: e.messageText });
        },
    });

    useEffect(() =>
    {
        // 執行 function：讀取目前登入者資訊
        const loadUserName = async () =>
        {
            const res = await AuthAPI.me();
            const data = res.data;
            setDisplayName(data ? `${data.Id}, ${data.Name}` : "");
        };

        void loadUserName();
    }, []);

    const validateBeforeSave = useCallback((): boolean =>
    {
        // 執行 function：儲存前檢查欄位
        if (!oldPwd || !newPwd || !confirmPwd)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請輸入舊密碼、新密碼與再次確認密碼" });
            return false;
        }

        if (newPwd !== confirmPwd)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次新密碼不一致" });
            return false;
        }

        if (oldPwd === newPwd)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "新密碼不可與舊密碼相同" });
            return false;
        }

        return true;
    }, [oldPwd, newPwd, confirmPwd, publish]);

    const handleSave = useCallback(async (): Promise<boolean> =>
    {
        // 宣告變數
        const ok = validateBeforeSave();

        // 執行 function：驗證後送出 API
        if (!ok) return false;

        const payload: ChangePassword = { OldPassword: oldPwd, NewPassword: newPwd };

        const res = await changePwd.execute(payload);

        (res.SysMessage ?? []).forEach((item) =>
        {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (!res.IsSuccess)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "修改密碼失敗" });
            return false;
        }

        handleCancelBack();
        publish({ level: MessageStatus.Green, title: "修改成功", text: "" });
        return true;
    }, [validateBeforeSave, oldPwd, newPwd, changePwd, publish, handleCancelBack]);

    const actions = useMemo<UseActionsResult>(() =>
    {
        // return：提供表單工具列使用
        return {
            isExecuting: changePwd.isLoading,
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
    }, [changePwd.isLoading, handleSave, handleCancelBack]);

    const prop = useMemo<FormCompProp>(() =>
    {
        // return：表單外層設定
        return { Title: handle?.Title ?? "修改密碼", Theme: theme, IsLoading: changePwd.isLoading, ErrorList: [], Actions: actions };
    }, [handle?.Title, theme, changePwd.isLoading, actions]);

    // return
    return { prop, displayName, oldPwd, newPwd, confirmPwd, onOldPwdChange: setOldPwd, onNewPwdChange: setNewPwd, onConfirmPwdChange: setConfirmPwd };
};
// #endregion
