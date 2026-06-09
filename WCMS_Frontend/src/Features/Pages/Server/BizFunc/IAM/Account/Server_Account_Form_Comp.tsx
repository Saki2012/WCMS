import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import LibPwdTextBox from "@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { AccountFields, AccountSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    accountEmptyData,
    type AccountFormRawData,
    type AccountFormRefs,
    useAccountFormTemplate,
} from "./Server_Account_Form_Hook";

// #region Property
type AccountSet = components["schemas"]["AccountSet_DTO"];


interface AccountFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;
}


interface AccountContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AccountSet>;

    /** Account Hook 整理後的參照資料 */
    refs: AccountFormRefs;

    /** Account Form 額外狀態 */
    rawData: AccountFormRawData;
}


interface AccountSectionProps extends AccountContentProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<AccountSet>>;

    /** AccountStatus 選項 */
    accountStatusOptions: Record<string, string>;

    /** Person 選項 */
    personOptions: Map<string, string>;

    /** Role 選項 */
    roleOptions: Map<string, string>;
}


interface UserCardSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AccountSet>;

    /** UserCard 使用的人員圖片 ID */
    userPicId: string;
}
// #endregion

// #region Public
/** 後台帳號 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Account_Form_Comp = (props: AccountFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(buildBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useAccountFormTemplate({
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: accountEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <AccountContentComp
                    theme={props.theme}
                    binding={vm.binding}
                    refs={vm.refs}
                    rawData={vm.rawData}
                />
            )}
        />
    );
};
// #endregion

// #region Section
/** 帳號資料主要內容區，保留原本左側使用者卡片與右側分頁版面。 */
const AccountContentComp = (props: AccountContentProps) =>
{
    return (
        <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                <UserCardComp
                    theme={props.theme}
                    binding={props.binding}
                    userPicId={props.rawData.userPicId}
                />
            </div>
            <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12">
                <AccountPanelComp {...props} />
            </div>
        </div>
    );
};


/** 帳號資料右側 Panel 區塊。 */
const AccountPanelComp = (props: AccountContentProps) =>
{
    const setField = useSetTableField<AccountSet>(props.binding);
    const personOptions = useMemo(() => buildOptionsMap(props.refs.personIds), [props.refs.personIds]);
    const roleOptions = useMemo(() => buildOptionsMap(props.refs.roleIds), [props.refs.roleIds]);
    const tabInfo = useMemo(() => buildAccountTabInfo(props.theme), [props.theme]);
    const tabContent = buildAccountTabContent({
        ...props,
        setField,
        accountStatusOptions: props.refs.accountStatus,
        personOptions,
        roleOptions,
    });

    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form">
                    <TabContentComp
                        tabInfos={tabInfo}
                        components={tabContent}
                    />
                </div>
            </div>
        </div>
    );
};


/** 左側使用者卡片，圖片來源與顯示名稱由 Account binding 統一提供。 */
const UserCardComp = (props: UserCardSectionProps) =>
{
    const userPic = FileManagementAPI.get_Server_Preview_Url(props.userPicId) ?? pic;

    return (
        <LibUserCard
            DisplayNameEN={props.binding.data?.Account?.AccountId ?? ""}
            DisplayNameTW={props.binding.data?.Account?.AccountName ?? ""}
            DisplayRole={"角色"}
            PicSrc={userPic}
            Style={props.theme.UserCard}
        />
    );
};


/** 帳戶資訊欄位。 */
const AccountFieldsComp = (props: AccountSectionProps) =>
{
    return (
        <>
            {buildAccountIdFields(props)}
            {buildAccountRefFields(props)}
            {props.rawData.isAddNew ? buildAccountPasswordFields(props) : null}
            {buildAccountStatusFields(props)}
        </>
    );
};


/** 人員資料區，目前維持舊版空白區塊，避免擴大調整範圍。 */
const PersonFieldsComp = () =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0"></div>
            </div>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 建立帳號 Form 各分頁內容。 */
const buildAccountTabContent = (props: AccountSectionProps): Record<string, ReactNode[]> =>
{
    return {
        Account: [<AccountFieldsComp key="Account" {...props} />],
        Person: [<PersonFieldsComp key="Person" />],
        System: [
            <SystemInfoTabComp
                key="System"
                theme={props.theme}
                formData={props.binding}
                setKey={AccountSetFields.Account}
            />,
        ],
    };
};


/** 建立返回帳號列表路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(?:\/[^/]+)?$/, "/List");
};


/** 建立 Tab 設定。 */
const buildAccountTabInfo = (theme: IBETheme): LibTabsProp =>
{
    return { Style: theme.Tabs, item: { Account: "帳戶資訊", Person: "人員資料", System: "系統資料" } };
};


/** 將 Record 選項轉成舊版 LibDropList 使用的 Map。 */
const buildOptionsMap = (data: Record<string, string>): Map<string, string> =>
{
    return new Map<string, string>(Object.entries(data ?? {}));
};


/** 建立帳號與名稱欄位。 */
const buildAccountIdFields = (props: AccountSectionProps): ReactNode =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(AccountSetFields.Account, AccountFields.AccountId, "string")}
                        disabled={!props.rawData.isAddNew}
                    />
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(AccountSetFields.Account, AccountFields.AccountName, "string")}
                    />
                </div>
            </div>
        </div>
    );
};


/** 建立人員與角色下拉欄位。 */
const buildAccountRefFields = (props: AccountSectionProps): ReactNode =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibDropList
                        Style={props.theme.DropList2}
                        Options={props.personOptions}
                        AutoDefaultFirst={false}
                        {...props.setField(AccountSetFields.Account, AccountFields.PersonId, "string")}
                    />
                    <LibDropList
                        Style={props.theme.DropList2}
                        Options={props.roleOptions}
                        AutoDefaultFirst={false}
                        {...props.setField(AccountSetFields.Account, AccountFields.RoleId, "string")}
                    />
                </div>
            </div>
        </div>
    );
};


/** 建立新增帳號使用的密碼欄位。 */
const buildAccountPasswordFields = (props: AccountSectionProps): ReactNode =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibPwdTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(AccountSetFields.Account, AccountFields.Password, "string")}
                    />
                    <LibPwdTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        ColumnDisplayName="再次輸入密碼"
                        InputValue={props.rawData.confirmPwd}
                        OnChange={props.rawData.onConfirmPwdChange}
                    />
                </div>
                {buildValidationMessages(props.rawData.validationErrors)}
            </div>
        </div>
    );
};


/** 建立本地檢核訊息。 */
const buildValidationMessages = (errors: string[]): ReactNode =>
{
    if (errors.length === 0) return null;

    return (
        <div className="text-danger small mt-1" role="alert">
            {errors.map(item => (
                <div key={item}>{item}</div>
            ))}
        </div>
    );
};


/** 建立帳號狀態欄位。 */
const buildAccountStatusFields = (props: AccountSectionProps): ReactNode =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibCheckBox
                        Style={props.theme.RadioBox}
                        options={props.accountStatusOptions}
                        {...props.setField(AccountSetFields.Account, AccountFields.AccountStatus, "number")}
                    />
                </div>
            </div>
        </div>
    );
};
// #endregion
