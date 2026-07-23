import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibTextBox, LibUserCard } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { PersonFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    personEmptyData,
    type PersonFormRefs,
    usePersonFormTemplate,
} from "./Server_Person_Form_Hook";

// #region Property
type PersonFormModel = components["schemas"]["Person"];

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
    binding: ServerFormBinding<PersonFormModel>;

    /** Person Hook 整理後的參照資料 */
    refs: PersonFormRefs;
}

interface PersonFieldSectionProps extends PersonContentProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useFormModelField<PersonFormModel>>;
}

interface PersonUserCardProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<PersonFormModel>;
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
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
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
    const setField = useFormModelField<PersonFormModel>(props.binding);

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
    const userPic = FileManagementAPI.get_Server_Preview_Url(props.binding.data?.PersonImgId) ?? pic;
    const setPersonImgId = useCallback((id: string) => (props.binding.setFormData(prev => updatePersonImgId(prev, id))), [props.binding]);
    return <LibUserCard DisplayNameEN={props.binding.data?.PersonId ?? ""} DisplayNameTW={props.binding.data?.PersonName ?? ""} DisplayRole={""} PicSrc={userPic} Style={props.theme.UserImageUploadCard} onUploadedTempId={setPersonImgId} />;
};

/** 人員資料欄位區。 */
const PersonFieldSectionComp = (props: PersonFieldSectionProps) =>
{
    return (
        <>
            <PersonIdFields {...props} />
            <PersonGenderFields {...props} />
            <PersonEmailFields {...props} />
            <PersonPhoneFields {...props} />
        </>
    );
};
/** 人員代碼與姓名欄位。 */
const PersonIdFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonFields.PersonId, "string")}
                    />
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonFields.PersonName, "string")}
                    />
                </div>
            </div>
        </div>
    );
};

/** 性別欄位。 */
const PersonGenderFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibCheckBox
                        Style={props.theme.RadioBox}
                        options={props.refs.genderOpt}
                        {...props.setField(PersonFields.Gender, "number")}
                    />
                </div>
            </div>
        </div>
    );
};

/** Email 欄位。 */
const PersonEmailFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonFields.Email, "string")}
                    />
                </div>
            </div>
        </div>
    );
};

/** 電話欄位。 */
const PersonPhoneFields = (props: PersonFieldSectionProps) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonFields.MobilePhone, "string")}
                    />
                    <LibTextBox
                        Style={props.theme.TextBox3}
                        DefaultInputDisplay="請輸入"
                        {...props.setField(PersonFields.HomePhone, "string")}
                    />
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 更新 PersonImgId，供左側人員頭像上傳後回寫。 */
const updatePersonImgId = (prev: PersonFormModel, id: string): PersonFormModel =>
{
    const cur = prev ?? {};
    return { ...cur, PersonImgId: id };
};
// #endregion
