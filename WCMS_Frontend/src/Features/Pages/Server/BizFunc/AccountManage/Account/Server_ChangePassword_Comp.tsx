import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '@/SysCore/Utils/API/AuthClient';
import { useMatches } from 'react-router';
import type { IActionHandle } from '@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData';
import LibPwdTextBox from '@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import type { UseActionsResult } from '@/Features/Hooks/Common/useActions';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccountAdapter } from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';
import type { components } from '@/types/api';
import { MessageStatus } from '@/SysCore/Utils/API/APIBase';

type ChangePassword = components["schemas"]["ChangePassword"];

export const Server_ChangePassword_Comp = (props: { theme: IBETheme }) => {
    // 宣告變數
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const isLoading: boolean[] = [];
    const errors: (string | null | undefined)[] = [];
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;

    const adapter = useMemo(() => AccountAdapter(), []);

    const [displayName, setUserName] = useState<string>("");
    const [oldPwd, setOldPwd] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");

    const handleCancelBack = useCallback(() => {
        // 回到同模組 List（沿用你專案既有規則）
        navigate(location.pathname.replace(/\/ChangePassword(\/[^\/]*)?$/, "/List"));
    }, [navigate, location.pathname]);

    // ✅ hook：對接 AccountAdapter.hooks.useChangePassword
    const changePwd = adapter.hooks.useChangePassword({
        onError: (e) => {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: e.messageText });
        },
    });

    // 執行 function
    useEffect(() => {
        // 讀取目前登入者資訊（顯示帳號）
        const loadUserName = async () => {
            const res = await AuthAPI.me();
            const data = res.data;
            setUserName(data ? `${data.Id}, ${data.Name}` : "");
        };
        void loadUserName();
    }, []);

    const validateBeforeSave = useCallback((): boolean => {
        // 按下儲存才做檢查
        if (!oldPwd || !newPwd || !confirmPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請輸入舊密碼、新密碼與再次確認密碼" });
            return false;
        }
        if (newPwd !== confirmPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次新密碼不一致" });
            return false;
        }
        if (oldPwd === newPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "新密碼不可與舊密碼相同" });
            return false;
        }
        return true;
    }, [oldPwd, newPwd, confirmPwd, publish]);

    const handleSave = useCallback(async (): Promise<boolean> => {
        // 打 API：adapter.hooks.useChangePassword().execute({ OldPassword, NewPassword })
        const ok = validateBeforeSave();
        if (!ok) return false;

        const payload: ChangePassword = {
            OldPassword: oldPwd,
            NewPassword: newPwd,
        };

        const res = await changePwd.execute(payload);

        (res.SysMessage ?? []).forEach(item => {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (res.IsSuccess) {
            handleCancelBack();
            publish({ level: MessageStatus.Green, title: "修改成功", text: "", });
            return true;
        }

        publish({ level: MessageStatus.Error, title: "保存失敗", text: "修改密碼失敗" });
        return false;
    }, [validateBeforeSave, oldPwd, newPwd, changePwd, publish, handleCancelBack]);

    const actions: UseActionsResult = useMemo(() => {
        // 提供給 Form_Toolbar 使用（其餘方法這頁用不到，先放 no-op）
        return {
            isExecuting: changePwd.isLoading,
            onSave: handleSave,
            onCancelBack: handleCancelBack,
            onAddNew: () => { },
            onEdit: () => { },
            onDelete: async () => { },
            onInvalid: () => { },
            onPreview: () => { },
        };
    }, [changePwd.isLoading, handleSave, handleCancelBack]);

    const prop: FormCompProp = {
        Title: handle?.Title ?? "修改密碼",
        Theme: props.theme,
        IsLoading: [...isLoading, changePwd.isLoading],
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
                                            <LibTextBox
                                                Style={props.theme.TextBox3}
                                                ColumnDisplayName="帳號"
                                                DefaultInputDisplay="請輸入"
                                                disabled={true}
                                                InputValue={displayName}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox
                                                Style={props.theme.TextBox3}
                                                ColumnDisplayName="舊密碼"
                                                DefaultInputDisplay="請輸入"
                                                InputValue={oldPwd}
                                                OnChange={(v) => setOldPwd(v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox
                                                Style={props.theme.TextBox3}
                                                ColumnDisplayName="新密碼"
                                                DefaultInputDisplay="請輸入"
                                                InputValue={newPwd}
                                                OnChange={(v) => setNewPwd(v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox
                                                Style={props.theme.TextBox3}
                                                DefaultInputDisplay="請輸入"
                                                ColumnDisplayName="再次輸入密碼"
                                                InputValue={confirmPwd}
                                                OnChange={(v) => setConfirmPwd(v)}
                                            />
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
