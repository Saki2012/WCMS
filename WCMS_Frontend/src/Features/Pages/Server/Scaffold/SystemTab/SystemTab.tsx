import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useMemo } from "react";

// #region Property
// DTOBasicDataModelFields.ts
const DTOBasicDataModelFields = {
    CreateTime: "CreateTime",
    CreateUserId: "CreateUserId",
    CreateUser: "CreateUser",
    ModifyTime: "ModifyTime",
    ModifyUserId: "ModifyUserId",
    ModifyUser: "ModifyUser",
} as const;


type AnyObj = Record<string, any>;


type Props = { theme: IBETheme; formData: any; setKey: string; };
// #endregion

// #region Public
/** ✅ 後台共用：系統資訊頁籤（新增/修改人員與時間） */
export const SystemInfoTabComp = <TSet extends AnyObj>(props: Props) =>
{
    const setField = useSetTableField<TSet>(props.formData);

    const mainRow = useMemo(() =>
    {
        // NOTE: 嘗試從 rawData 取出主表資料（用來組 user display）
        const raw = props.formData?.data as AnyObj | undefined;
        const row = (raw?.[props.setKey] ?? null) as AnyObj | null;
        return row;
    }, [props.formData?.data, props.setKey]);

    const createUserDisplay = useMemo(() =>
    {
        // NOTE: 依 DTOBasicDataModel：CreateUser 導覽屬性
        return formatUserDisplay(mainRow?.[DTOBasicDataModelFields.CreateUser]);
    }, [mainRow]);

    const modifyUserDisplay = useMemo(() =>
    {
        // NOTE: 依 DTOBasicDataModel：ModifyUser 導覽屬性
        return formatUserDisplay(mainRow?.[DTOBasicDataModelFields.ModifyUser]);
    }, [mainRow]);

    return (
        <>
            {/* 新增人員/新增時間 */}
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    {...setField(props.setKey, DTOBasicDataModelFields.CreateUserId, "string")}
                    InputValue={createUserDisplay}
                    disabled={true}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    {...setField(props.setKey, DTOBasicDataModelFields.ModifyUserId, "string")}
                    InputValue={modifyUserDisplay}
                    disabled={true}
                />
            </div>
            {/* 修改人員/修改時間 */}
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    {...setField(props.setKey, DTOBasicDataModelFields.CreateTime, "datetime")}
                    InputValue={formatDateTime(mainRow?.[DTOBasicDataModelFields.CreateTime])}
                    disabled={true}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    {...setField(props.setKey, DTOBasicDataModelFields.ModifyTime, "datetime")}
                    InputValue={formatDateTime(mainRow?.[DTOBasicDataModelFields.ModifyTime])}
                    disabled={true}
                />
            </div>
        </>
    );
};
// #endregion

// #region Private
const pickUserId = (u: AnyObj | null | undefined): string =>
{
    const id = u?.AccountId;
    return String(id ?? "");
};


const pickUserName = (u: AnyObj | null | undefined): string =>
{
    const name = u?.AccountName;
    return String(name ?? "");
};


const formatUserDisplay = (u: AnyObj | null | undefined): string =>
{
    // NOTE: 顯示成 "id, name"
    const id = pickUserId(u);
    const name = pickUserName(u);

    if (!id && !name) return "";
    if (id && !name) return id;
    if (!id && name) return name;

    return `${id}, ${name}`;
};
// #endregion
