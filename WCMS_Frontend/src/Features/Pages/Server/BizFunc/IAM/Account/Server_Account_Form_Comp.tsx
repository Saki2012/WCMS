import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import LibPwdTextBox from "@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { AccountFields, AccountSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { SystemInfoTabComp } from "../../../Scaffold/SystemTab/SystemTab";
import { useServerAccountForm } from "./Server_Account_Form_Hook";

type AccountSet = components["schemas"]["AccountSet_DTO"];

export const Server_Account_Form_Comp = (props: { theme: IBETheme; }) =>
{
    const vm = useServerAccountForm(props.theme);
    const personOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(vm.personIds ?? {}));
    }, [vm.personIds]);

    const roleOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(vm.roleIds ?? {}));
    }, [vm.roleIds]);
    const tabInfo: LibTabsProp = useMemo(() =>
    {
        return { Style: props.theme.Tabs, item: { Account: "帳戶資訊", Person: "人員資料", System: "系統資料" } };
    }, [props.theme.Tabs]);
    const tabContent: Record<string, React.ReactNode[]> = useMemo(() =>
    {
        return {
            Account: [
                <Account_Comp
                    key="Account"
                    theme={props.theme}
                    formData={vm.formData}
                    accountStatus={vm.accountStatus}
                    isAddNew={vm.isAddNew}
                    confirmPwd={vm.confirmPwd}
                    onConfirmPwdChange={vm.onConfirmPwdChange}
                    personIds={personOpts}
                    roleIds={roleOpts}
                />,
            ],
            Person: [<Person_Comp key="Person" theme={props.theme} formData={vm.formData} />],
            System: [<SystemInfoTabComp theme={props.theme} formData={vm.formData} setKey={AccountSetFields.Account} />],
        };
    }, [props.theme, vm.formData, vm.accountStatus, vm.isAddNew, vm.confirmPwd, vm.onConfirmPwdChange, vm.personIds, vm.roleIds]);
    const userPic = FileManagementAPI.get_Server_Preview_Url(vm.userPicId) ?? pic;

    return (
        <FormComp prop={vm.prop}>
            <div className="row">
                <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                    <LibUserCard
                        DisplayNameEN={vm.formData.data?.Account?.AccountId ?? ""}
                        DisplayNameTW={vm.formData.data?.Account?.AccountName ?? ""}
                        DisplayRole={"角色"}
                        PicSrc={userPic}
                        Style={vm.prop.Theme.UserCard}
                    />
                </div>
                <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <TabContentComp tabInfos={tabInfo} components={tabContent} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    );
};

const Account_Comp = (
    props: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<AccountSet>;
        accountStatus: Record<string, string>;
        personIds: Map<string, string>;
        roleIds: Map<string, string>;
        isAddNew: boolean;
        confirmPwd: string;
        onConfirmPwdChange: (v: string) => void;
    },
) =>
{
    const setField = useSetTableField<AccountSet>(props.formData);
    return (
        <>
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibTextBox
                            Style={props.theme.TextBox3}
                            DefaultInputDisplay="請輸入"
                            {...setField(AccountSetFields.Account, AccountFields.AccountId, "string")}
                            disabled={!props.isAddNew}
                        />
                        <LibTextBox
                            Style={props.theme.TextBox3}
                            DefaultInputDisplay="請輸入"
                            {...setField(AccountSetFields.Account, AccountFields.AccountName, "string")}
                        />
                    </div>
                </div>
            </div>

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibDropList
                            Style={props.theme.DropList2}
                            Options={props.personIds}
                            AutoDefaultFirst={false}
                            {...setField(AccountSetFields.Account, AccountFields.PersonId, "string")}
                        />
                        <LibDropList
                            Style={props.theme.DropList2}
                            Options={props.roleIds}
                            AutoDefaultFirst={false}
                            {...setField(AccountSetFields.Account, AccountFields.RoleId, "string")}
                        />
                    </div>
                </div>
            </div>

            {props.isAddNew
                ? (
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                                <LibPwdTextBox
                                    Style={props.theme.TextBox3}
                                    DefaultInputDisplay="請輸入"
                                    {...setField(AccountSetFields.Account, AccountFields.Password, "string")}
                                />
                                <LibPwdTextBox
                                    Style={props.theme.TextBox3}
                                    DefaultInputDisplay="請輸入"
                                    ColumnDisplayName="再次輸入密碼"
                                    InputValue={props.confirmPwd}
                                    OnChange={(v) => props.onConfirmPwdChange(v)}
                                />
                            </div>
                        </div>
                    </div>
                )
                : null}

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibCheckBox
                            Style={props.theme.RadioBox}
                            options={props.accountStatus}
                            {...setField(AccountSetFields.Account, AccountFields.AccountStatus, "number")}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

const Person_Comp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AccountSet>; }) =>
{
    // return
    return (
        <>
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        {
                            /* <LibTextBox Style={props.theme.TextBox3} ColumnDisplayName={props.formData.displayName ?? ""} disabled={true} />
                        <LibTextBox Style={props.theme.TextBox3} ColumnDisplayName={props.formData.displayName ?? ""} disabled={true} /> */
                        }
                    </div>
                </div>
            </div>

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        {/* <LibTextBox Style={props.theme.TextBox} ColumnDisplayName={props.formData.displayName ?? ""} disabled={true} /> */}
                    </div>
                </div>
            </div>
        </>
    );
};
