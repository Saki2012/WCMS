import { useLocation, useParams } from 'react-router-dom';
import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox, LibUserCard, LibCheckBox, LibDropList } from "@/SysCore/Components/FormField/LibFormField"
import TabContentComp from '@/SysCore/Components/TabContent/TabContent';
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from '@/SysCore/Utils/API/FetchFormData';
import { useActions } from '@/Features/Hooks/Common/useActions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AccountProvider from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';
import { useSetTableField } from '@/SysCore/Components/FormField/useSetTableField';
import { AccountFields, AccountSetFields, PersonModelFields, RoleDataModelFields } from '@/types/SchemaFields';
import { useFetchEnumOptions } from '@/SysCore/Utils/API/SystemAPI_Hook';
import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg"
import type { LibTabsProp } from '@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import LibPwdTextBox from '@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import { IDataProvider, MessageStatus } from '@/SysCore/Interface/IApiProvider';
import PersonProvider from '@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import RolePermissionProvider from '@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api';
type AccountSet = components["schemas"]["AccountSet_DTO"]
type PersonSet = components["schemas"]["PersonSet_DTO"]
type RoleSet = components["schemas"]["RolePermissionSet_DTO"]
const accountEmptyData: AccountSet = {}
const personEmptyData: PersonSet = {}


export const Server_Account_Form_Comp = (props: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const pvd = useMemo(() => { return { AccountPvd: AccountProvider(), PersonPvd: PersonProvider(), RolePvd: RolePermissionProvider() } }, []);
    const formData = useFetchFormData<AccountSet>(pvd.AccountPvd, internalId, accountEmptyData)
    const useAccountStatus = useFetchEnumOptions("AccountStatus");
    const usePerson = usePersonListData(pvd.PersonPvd);
    const useRole = useRoleListData(pvd.RolePvd);
    const isLoading: boolean[] = [formData.isLoading, useAccountStatus.isLoading, usePerson.isLoading, useRole.isLoading]
    const errors: (string | null | undefined)[] = [formData.error, useAccountStatus.error, usePerson.error, useRole.error]
    const isAddNew = !internalId
    const { publish } = useToast();
    const [confirmPwd, setConfirmPwd] = useState<string>("");
    useEffect(() => { if (!isAddNew) setConfirmPwd(""); }, [isAddNew]);

    const roleDict: Record<string, string> = useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of useRole.rawData ?? []) {
            const roleId = String(item?.RoleData?.RoleId ?? "").trim();
            if (!roleId) continue;
            dict[roleId] = String(item?.RoleData?.RoleName ?? "").trim();
        }
        return dict;
    }, [useRole.rawData]);

    const personDict: Record<string, string> = useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of usePerson.rawData ?? []) {
            const roleId = String(item?.Person?.PersonId ?? "").trim();
            if (!roleId) continue;
            dict[roleId] = String(item?.Person?.PersonId ?? "").trim();
        }
        return dict;
    }, [usePerson.rawData]);

    const actionsBase = useActions(dirUrl, pvd.AccountPvd, formData.data, internalId as string, undefined, undefined);


    // ✅ 驗證：只在按下儲存時檢查
    const validateBeforeSave = useCallback((): boolean => {
        if (!isAddNew) return true;
        const pwd = String(formData.data?.Account?.Password ?? "");
        const confirm = confirmPwd;
        if (!pwd || !confirm) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請輸入密碼並再次確認", });
            return false;
        }
        if (pwd !== confirm) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次密碼不一致", });
            return false;
        }
        return true;
    }, [isAddNew, formData.data?.Account?.Password, confirmPwd, publish]);
    // ✅ 包裝 onSave：驗證不過就不打 API
    const handleSaveWithValidate = useCallback(async (): Promise<boolean> => {
        const ok = validateBeforeSave();
        if (!ok) return false;
        const res = await actionsBase.onSave();
        return res;
    }, [validateBeforeSave, actionsBase]);
    const actions = useMemo(() => { return { ...actionsBase, onSave: handleSaveWithValidate, }; }, [actionsBase, handleSaveWithValidate]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { "Account": "帳戶資訊", "Person": "人員資料" } }
    const tabContent: Record<string, React.ReactNode[]> = {
        Account: [<Account_Comp theme={props.theme} formData={formData} accountStatus={useAccountStatus.data} isAddNew={isAddNew} confirmPwd={confirmPwd} onConfirmPwdChange={setConfirmPwd} personIds={personDict} roleIds={roleDict} />],
        Person: [<Person_Comp theme={props.theme} formData={formData} />],
    };
    const userPic = formData.data?.Account?.Person?.PersonImgId ? `${FileManagementAPI.PREVIEW_URL}/${formData.data?.Account?.Person?.PersonImgId}` : pic
    const prop: FormCompProp = { Title: "管理者帳號資料修改", Theme: props.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
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
                        <div className="panel-body">
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

const Account_Comp = (props: {
    theme: IBETheme; formData: UseFetchFormDataResult<AccountSet>; accountStatus: Record<string, string>;
    personIds: Record<string, string>; roleIds: Record<string, string>;
    isAddNew: boolean; confirmPwd: string; onConfirmPwdChange: (v: string) => void;
}) => {
    const setField = useSetTableField<AccountSet>(props.formData);
    return (
        <>
            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.AccountId, "string")} disabled={!props.isAddNew} />
                        <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.AccountName, "string")} />
                    </div>
                </div>
            </div>

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
                        <LibDropList Style={props.theme.DropList2} Options={props.personIds} AutoDefaultFirst={false} {...setField(AccountSetFields.Account, AccountFields.PersonId, "string")} />
                        <LibDropList Style={props.theme.DropList2} Options={props.roleIds} AutoDefaultFirst={false} {...setField(AccountSetFields.Account, AccountFields.RoleId, "string")} />
                    </div>
                </div>
            </div>

            {props.isAddNew ?
                <div className="row mx-0">
                    <div className="col form-group">
                        <div className="row mx-0">
                            <LibPwdTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(AccountSetFields.Account, AccountFields.Password, "string")} />
                            <LibPwdTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" ColumnDisplayName="再次輸入密碼" InputValue={props.confirmPwd} OnChange={(v) => props.onConfirmPwdChange(v)} />
                        </div>
                    </div>
                </div>
                : null
            }

            <div className="row mx-0">
                <div className="col form-group">
                    <div className="row mx-0">
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





const usePersonListData = (provider: IDataProvider<PersonSet>) => {
    var condition: string = ``;
    return useFetchGridListData<PersonSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [PersonModelFields.PersonId, PersonModelFields.PersonName, PersonModelFields.InternalId,],
            Condition: condition,
            OrderBy: [{ Col: PersonModelFields.CreateTime, Desc: false },],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};

const useRoleListData = (provider: IDataProvider<RoleSet>) => {
    var condition: string = ``;
    return useFetchGridListData<RoleSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [RoleDataModelFields.RoleId, RoleDataModelFields.RoleName, RoleDataModelFields.InternalId,],
            Condition: condition,
            OrderBy: [{ Col: RoleDataModelFields.CreateTime, Desc: false },],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};