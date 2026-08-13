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
    actions: UseActionsResult;
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
/** 建立修改密碼頁面的資料、驗證與操作行為。 */
export const useServerChangePassword = (theme: IBETheme): UseServerChangePasswordResult =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;
    const adapter = useMemo(() => AccountAdapter(), []);

    const [displayName, setDisplayName] = useState<string>("");
    const [oldPwd, setOldPwd] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");

    /** 返回同模組帳號列表。 */
    const handleCancelBack = useCallback(() =>
    {
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
        /** 讀取目前登入者顯示資訊。 */
        const loadUserName = async () =>
        {
            const res = await AuthAPI.me();
            const data = res.data;
            setDisplayName(data ? `${data.User.UserId}, ${data.User.UserName}` : "");
        };

        void loadUserName();
    }, []);

    /** 檢查修改密碼必填欄位與密碼一致性。 */
    const validateBeforeSave = useCallback((): boolean =>
    {
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

    /** 驗證表單並送出修改密碼 API。 */
    const handleSave = useCallback(async (): Promise<boolean> =>
    {
        const ok = validateBeforeSave();
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
        return { Title: handle?.Title ?? "修改密碼", Theme: theme, IsLoading: changePwd.isLoading, ErrorList: [], Actions: actions };
    }, [handle?.Title, theme, changePwd.isLoading, actions]);

    return {
        prop,
        actions,
        displayName,
        oldPwd,
        newPwd,
        confirmPwd,
        onOldPwdChange: setOldPwd,
        onNewPwdChange: setNewPwd,
        onConfirmPwdChange: setConfirmPwd,
    };
};
// #endregion
