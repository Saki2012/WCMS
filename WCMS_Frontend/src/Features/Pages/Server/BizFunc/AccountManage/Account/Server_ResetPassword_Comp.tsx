import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useCallback, useMemo, useState } from 'react';
import { useMatches } from 'react-router';
import type { IActionHandle } from '@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData';
import LibPwdTextBox from '@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import type { UseActionsResult } from '@/Features/Hooks/Common/useActions';
import { useLocation, useNavigate } from 'react-router-dom';
import type { components } from "@/types/api";
import { AccountFields } from '@/types/SchemaFields';
import { MessageStatus } from '@/SysCore/Utils/API/APIBase';
import type { ApiAdapterError } from '@/SysCore/Utils/API/APIAdapter';

// ✅ Adapter（已支援 hooks.useResetPassword）
import { AccountAdapter } from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';

type AccountSet = components["schemas"]["AccountSet_DTO"];
type ResetPassword = components["schemas"]["ResetPassword"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 重置密碼 */
export const Server_ResetPassword_Comp = (props: { theme: IBETheme }) => {
    // 宣告變數
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const isLoading: boolean[] = [];
    const errors: (string | null | undefined)[] = [];
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;

    const adapter = useMemo(() => AccountAdapter(), []);

    const [userInternalId, setUserInternalId] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");

    // 執行 function：帳號清單（改用 adapter.hooks.useQueryList）
    const useAccountList = useAccountListDataByAdapter(adapter);

    const accountDict: Record<string, string> = useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of useAccountList.rawData ?? []) {
            const id = String(item?.Account?.InternalId ?? "").trim();
            if (!id) continue;
            dict[id] = `${item?.Account?.AccountId ?? ""}, ${item?.Account?.AccountName ?? ""}`;
        }
        return dict;
    }, [useAccountList.rawData]);

    const validateBeforeSave = useCallback((): boolean => {
        // 執行 function：表單檢核（不改 DOM，只補必要條件）
        if (!userInternalId) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請選擇帳號" });
            return false;
        }
        if (!newPwd || !confirmPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請輸入新密碼並再次確認" });
            return false;
        }
        if (newPwd !== confirmPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次新密碼不一致" });
            return false;
        }
        return true;
    }, [userInternalId, newPwd, confirmPwd, publish]);

    const handleCancelBack = useCallback(() => {
        // 執行 function：回到同模組 List（沿用你專案既有規則）
        navigate(location.pathname.replace(/\/ResetPassword(\/[^\/]*)?$/, "/List"));
    }, [navigate, location.pathname]);

    // ✅ hook：對接 AccountAdapter.hooks.useResetPassword
    const resetPwd = adapter.hooks.useResetPassword({
        onError: (e: ApiAdapterError) => {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: e.messageText });
        },
    });

    const handleSave = useCallback(async (): Promise<boolean> => {
        // 執行 function：打 API（adapter.hooks.useResetPassword）
        const ok = validateBeforeSave();
        if (!ok) return false;

        const payload: ResetPassword = {
            UserInternalId: userInternalId,
            NewPassword: newPwd,
        };

        const res = await resetPwd.execute(payload);

        (res.SysMessage ?? []).forEach(item => {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (res.IsSuccess) {
            handleCancelBack();
            publish({ level: MessageStatus.Green, title: "重置成功", text: "", });
            return true;
        }

        publish({ level: MessageStatus.Error, title: "保存失敗", text: "重置密碼失敗" });
        return false;
    }, [validateBeforeSave, userInternalId, newPwd, resetPwd, publish, handleCancelBack]);

    const actions: UseActionsResult = useMemo(() => {
        // 提供給 Form_Toolbar 使用（其餘方法這頁用不到，先放 no-op）
        return {
            isExecuting: resetPwd.isLoading,
            onSave: handleSave,
            onCancelBack: handleCancelBack,
            onAddNew: () => { },
            onEdit: () => { },
            onDelete: async () => { },
            onInvalid: () => { },
            onPreview: () => { },
        };
    }, [resetPwd.isLoading, handleSave, handleCancelBack]);

    const prop: FormCompProp = {
        Title: handle?.Title ?? "重置密碼",
        Theme: props.theme,
        IsLoading: [...isLoading, useAccountList.isLoading, resetPwd.isLoading],
        ErrorList: errors,
        Actions: actions,
    };

    // return（⚠️ DOM 完全不動）
    return (
        <FormComp prop={prop}>
            <div className="row">
                <div className="col-sm-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibDropList Style={props.theme.DropList2} ColumnDisplayName="帳號" AutoDefaultFirst={false} Options={accountDict} InputValue={userInternalId} onChange={(v) => setUserInternalId(v)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox Style={props.theme.TextBox3} ColumnDisplayName="新密碼" DefaultInputDisplay="請輸入" InputValue={newPwd} OnChange={(v) => setNewPwd(v)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" ColumnDisplayName="再次輸入密碼" InputValue={confirmPwd} OnChange={(v) => setConfirmPwd(v)} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    );
};

const useAccountListDataByAdapter = (adapter: ReturnType<typeof AccountAdapter>) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function：toast 錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = useMemo<QueryListParam>(() => {
        // 執行 function：撈下拉用的最小欄位
        return {
            Fields: [AccountFields.InternalId, AccountFields.AccountId, AccountFields.AccountName],
            Condition: "",
            OrderBy: [{ Col: AccountFields.AccountId, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);

    const query = adapter.hooks.useQueryList({
        condition,
        deps: [],
        onError,
    });

    // return
    return {
        rawData: (query.data ?? []) as AccountSet[],
        isLoading: Boolean(query.isLoading),
        error: query.errorText ?? null,
    };
};
