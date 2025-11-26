import { useLocation, useParams } from 'react-router-dom';
import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox, LibSwitch, LibDropList, LibUserCard, type ILibSwitchItemProp, LibCheckBox } from "@/SysCore/Components/FormField/LibFormField"
import TabContentComp from '@/SysCore/Components/TabContent/TabContent';
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from '@/SysCore/Utils/API/FetchFormData';
import UserProvider from '@/Features/Pages/Server/BizFunc/UserDTs/UserManage_Api';
import { useActions } from '@/Features/Hooks/Common/useActions';
import { useMemo, useState } from 'react';
import AccountProvider from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';
import { useSetTableField } from '@/SysCore/Components/FormField/useSetTableField';
import { AccountFields, AccountModelFields, AccountSetFields } from '@/types/SchemaFields';
import { useFetchEnumOptions } from '@/SysCore/Utils/API/SystemAPI_Hook';
import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg"
import type { LibTabsProp } from '@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
type AccountSet = components["schemas"]["AccountSet_DTO"]
const emptyData: AccountSet = {}

export const Server_Account_Form_Comp = (props: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const provider = useMemo(() => AccountProvider(), []);
    const formData = useFetchFormData<AccountSet>(provider, internalId, emptyData)
    const useAccountStatus = useFetchEnumOptions("AccountStatus");
    const actions = useActions(dirUrl, provider, formData.data, internalId as string, undefined, undefined)
    const isLoading: boolean[] = [formData.isLoading, useAccountStatus.isLoading]
    const errors: (string | null | undefined)[] = [formData.error, useAccountStatus.error]
    const prop: FormCompProp = { Title: "管理者帳號資料修改", Theme: props.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { "Account": "帳戶資訊", "Person": "人員資料" } }
    const tabContent: Record<string, React.ReactNode[]> = {
        Account: [<Account_Comp theme={props.theme} formData={formData} accountStatus={useAccountStatus.data} />],
        Person: [<Person_Comp theme={props.theme} formData={formData} />],
    };

    const userPic = formData.data?.Account?.Person?.PersonImgId ? `${FileManagementAPI.PREVIEW_URL}/${formData.data?.Account?.Person?.PersonImgId}` : pic

    return (
        <FormComp prop={prop}>
            <div className="row">
                <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                    <LibUserCard DisplayNameEN={formData.data?.Account?.AccountId ?? ""}
                        DisplayNameTW={formData.data?.Account?.AccountName ?? ""}
                        DisplayRole={"角色"} PicSrc={userPic} Style={prop.Theme.UserCard}></LibUserCard>
                </div>
                <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12">
                    <div className="panel">
                        <div className="panel-body overflow-scroll-Y">
                            <div className="form">
                                <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    )
}

const Account_Comp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AccountSet>; accountStatus: Record<string, string>; }) => {
    const setField = useSetTableField<AccountSet>(props.formData);
    return (
        <>
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.AccountId, "string")} />
                        <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.PersonId, "string")} />
                    </div>
                </div>
            </div>

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.AccountName, "string")} />
                        <LibCheckBox Style={props.theme.RadioBox} options={props.accountStatus} {...setField(AccountSetFields.Account, AccountFields.AccountStatus, "number")} />
                    </div>
                </div>
            </div>
        </>
    )
}


const Person_Comp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AccountSet>; }) => {
    return (
        <>
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        {/* <LibTextBox Style={props.theme.TextBox3} ColumnDisplayName={props.formData.displayName ?? ""} disabled={true} />
                        <LibTextBox Style={props.theme.TextBox3} ColumnDisplayName={props.formData.displayName ?? ""} disabled={true} /> */}
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
    )
}

