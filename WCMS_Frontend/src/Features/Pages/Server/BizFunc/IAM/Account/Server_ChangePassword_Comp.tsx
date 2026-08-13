import { FormShellComp } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import { LibPwdTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibPwdTextBox_Comp";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useServerChangePassword } from "./Server_ChangePassword_Hook";

// #region Public
/** 修改目前登入者密碼，並提供儲存與返回操作。 */
export const Server_ChangePassword_Comp = (props: { theme: IBETheme; }) =>
{
    const vm = useServerChangePassword(props.theme);
    const actions = vm.actions;

    return (
        <FormShellComp
            prop={vm.prop}
            actionToolbarButtons={[
                {
                    title: "儲存送出",
                    action: async () =>
                    {
                        await actions.onSave();
                    },
                    disabled: actions.isExecuting,
                },
                {
                    title: "取消返回",
                    action: actions.onCancelBack,
                },
            ]}
        >
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
                                                ColumnDisplayName="再次確認新密碼"
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
