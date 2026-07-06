import { FormShellComp } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibPwdTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibPwdTextBox_Comp";
import { LibDropList } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useMemo } from "react";
import { useServerResetPassword } from "./Server_ResetPassword_Hook";

// #region Public
export const Server_ResetPassword_Comp = (props: { theme: IBETheme; }) =>
{
    // 宣告變數
    const vm = useServerResetPassword(props.theme);
    const accountOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(vm.accountDict ?? {}));
    }, [vm.accountDict]);
    // return（DOM 不動）
    return (
        <FormShellComp prop={vm.prop}>
            <div className="row">
                <div className="col-sm-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibDropList
                                                Style={props.theme.DropList2}
                                                ColumnDisplayName="帳號"
                                                AutoDefaultFirst={false}
                                                Options={accountOpts}
                                                InputValue={vm.userInternalId}
                                                onChange={(v) => vm.onUserInternalIdChange(v)}
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
                                                InputValue={vm.newPwd}
                                                OnChange={(v) => vm.onNewPwdChange(v)}
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
                                                ColumnDisplayName="再次確認新密碼"
                                                InputValue={vm.confirmPwd}
                                                OnChange={(v) => vm.onConfirmPwdChange(v)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormShellComp>
    );
};
// #endregion
