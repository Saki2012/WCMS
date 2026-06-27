import { FormShellComp } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibPwdTextBox } from "@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useServerChangePassword } from "./Server_ChangePassword_Hook";

// #region Public
export const Server_ChangePassword_Comp = (props: { theme: IBETheme; }) =>
{
    const vm = useServerChangePassword(props.theme);
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
                                            <LibTextBox
                                                Style={props.theme.TextBox3}
                                                ColumnDisplayName="帳號"
                                                DefaultInputDisplay="請輸入"
                                                disabled={true}
                                                InputValue={vm.displayName}
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
                                                InputValue={vm.oldPwd}
                                                OnChange={vm.onOldPwdChange}
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
                                                OnChange={vm.onNewPwdChange}
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
                                                InputValue={vm.confirmPwd}
                                                OnChange={vm.onConfirmPwdChange}
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
