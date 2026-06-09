import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PersonModelFields, PersonSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    personEmptyData,
    type PersonFormRefs,
    usePersonFormTemplate,
} from "./Server_Person_Form_Hook";

// #region Property
type PersonSet = components["schemas"]["PersonSet_DTO"];


interface PersonFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;
}


interface PersonContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<PersonSet>;

    /** Person Hook 整理後的參照資料 */
    refs: PersonFormRefs;
}


interface PersonFieldSectionProps extends PersonContentProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<PersonSet>>;
}


interface PersonUserCardProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<PersonSet>;
}
// #endregion

// #region Public
/** 後台人員 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Person_Form_Comp = (props: PersonFormCompProps) =>
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

    const template = usePersonFormTemplate({
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: personEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <PersonContentComp
                    theme={props.theme}
                    binding={vm.binding}
                    refs={vm.refs}
                />
            )}
        />
    );
};
// #endregion

// #region Section
/** 人員資料主要內容區，保留原本左側頭像與右側欄位版面。 */
const PersonContentComp = (props: PersonContentProps) =>
{
    return (
        <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                <PersonUserCardComp theme={props.theme} binding={props.binding} />
            </div>
            <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12 ms-auto">
                <PersonPanelComp {...props} />
            </div>
        </div>
    );
};


/** 人員資料右側 Panel 區塊。 */
const PersonPanelComp = (props: PersonContentProps) =>
{
    const setField = useSetTableField<PersonSet>(props.binding);

    return (
        <div className="panel">
            <div className="panel-body">
                <div className="form">
                    <PersonFieldSectionComp {...props} setField={setField} />
                </div>
            </div>
        </div>
    );
};


/** 左側人員頭像卡片，圖片上傳後回寫 PersonImgId。 */
const PersonUserCardComp = (props: PersonUserCardProps) =>
{
    const userPic = FileManagementAPI.get_Server_Preview_Url(props.binding.data?.Person?.PersonImgId) ?? pic;
    const setPersonImgId = useCallback((id: string) =>
    {
        props.binding.setFormData(prev => updatePersonImgId(prev, id));
    }, [props.binding]);

    return (
        <LibUserCard
            DisplayNameEN={props.binding.data?.Person?.PersonId ?? ""}
            DisplayNameTW={props.binding.data?.Person?.PersonName ?? ""}
            DisplayRole={""}
            PicSrc={userPic}
            Style={props.theme.UserImageUploadCard}
            onUploadedTempId={setPersonImgId}
        />
    );
};


/** 人員資料欄位區。 */
const PersonFieldSectionComp = (props: PersonFieldSectionProps) =>
{
    return (
        <>
            {buildPersonIdFields(props)}
            {buildPersonGenderFields(props)}
            {buildPersonEmailFields(props)}
            {buildPersonPhoneFields(props)}
        </>
    );
};
// #endregion

// #region EntityComp
/** 建立返回人員列表路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(?:\/[^/]+)?$/, "/List");
};


/** 建立人員代碼與姓名欄位。 */
const buildPersonIdFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonSetFields.Person, PersonModelFields.PersonId, "string")}
                    />
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonSetFields.Person, PersonModelFields.PersonName, "string")}
                    />
                </div>
            </div>
        </div>
    );
};


/** 建立性別欄位。 */
const buildPersonGenderFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibCheckBox
                        Style={props.theme.RadioBox}
                        options={props.refs.genderOpt}
                        {...props.setField(PersonSetFields.Person, PersonModelFields.Gender, "number")}
                    />
                </div>
            </div>
        </div>
    );
};


/** 建立 Email 欄位。 */
const buildPersonEmailFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonSetFields.Person, PersonModelFields.Email, "string")}
                    />
                </div>
            </div>
        </div>
    );
};


/** 建立電話欄位。 */
const buildPersonPhoneFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonSetFields.Person, PersonModelFields.MobilePhone, "string")}
                    />
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonSetFields.Person, PersonModelFields.HomePhone, "string")}
                    />
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 更新 PersonImgId，供左側人員頭像上傳後回寫。 */
const updatePersonImgId = (prev: PersonSet, id: string): PersonSet =>
{
    const cur = prev ?? {};
    const nextPerson = { ...(cur.Person ?? {}), PersonImgId: id };
    return { ...cur, Person: nextPerson };
};
// #endregion
