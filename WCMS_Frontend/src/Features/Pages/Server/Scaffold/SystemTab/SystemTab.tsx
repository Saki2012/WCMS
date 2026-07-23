import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import {
    type FormDataLike,
    useFormModelField,
    useFormModelObjectField,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useMemo } from "react";

// #region Property
const BasicDataFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
} as const;

type AnyObj = Record<string, any>;

interface SystemInfoTabProps<TFormModel extends AnyObj>
{
    theme: IBETheme;
    formData: FormDataLike<TFormModel>;
    /** 系統欄位位於內嵌 Model 時指定該 Root property，例如 MatCategory.Category。 */
    modelField?: keyof TFormModel;
}
// #endregion

// #region Public
/** 後台共用系統資訊頁籤，支援 FormModel Root 或內嵌 object。 */
export const SystemInfoTabComp = <TFormModel extends AnyObj>(props: SystemInfoTabProps<TFormModel>) =>
{
    const rootField = useFormModelField(props.formData);
    const objectField = useFormModelObjectField(props.formData, props.modelField);
    const bindField = (field: string, mode: "string" | "datetime") => props.modelField
        ? objectField(field, mode)
        : rootField(field as keyof TFormModel, mode);
    const mainRow = useMemo(() => resolveSystemInfoModel(props.formData.data, props.modelField), [props.formData.data, props.modelField]);
    const createUserDisplay = useMemo(() => formatUserDisplay(mainRow?.[BasicDataFields.CreateUser]), [mainRow]);
    const modifyUserDisplay = useMemo(() => formatUserDisplay(mainRow?.[BasicDataFields.ModifyUser]), [mainRow]);
    return (
        <>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} {...bindField(BasicDataFields.CreateUserId, "string")} InputValue={createUserDisplay} disabled={true} />
                <LibTextBox Style={props.theme.TextBox3} {...bindField(BasicDataFields.ModifyUserId, "string")} InputValue={modifyUserDisplay} disabled={true} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} {...bindField(BasicDataFields.CreateTime, "datetime")} InputValue={formatDateTime(mainRow?.[BasicDataFields.CreateTime])} disabled={true} />
                <LibTextBox Style={props.theme.TextBox3} {...bindField(BasicDataFields.ModifyTime, "datetime")} InputValue={formatDateTime(mainRow?.[BasicDataFields.ModifyTime])} disabled={true} />
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 取得系統資訊實際所在的 FormModel object。 */
const resolveSystemInfoModel = <TFormModel extends AnyObj>(formModel: TFormModel, modelField?: keyof TFormModel): AnyObj | null =>
{
    if (!modelField) return formModel;
    const value = formModel?.[modelField];
    return value && typeof value === "object" && !Array.isArray(value) ? value as AnyObj : null;
};

/** 格式化帳號識別與名稱。 */
const formatUserDisplay = (user: AnyObj | null | undefined): string =>
{
    const id = String(user?.AccountId ?? "");
    const name = String(user?.AccountName ?? "");
    if (!id) return name;
    if (!name) return id;
    return `${id}, ${name}`;
};
// #endregion
