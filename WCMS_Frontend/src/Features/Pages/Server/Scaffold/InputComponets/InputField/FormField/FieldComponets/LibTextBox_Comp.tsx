// 原 input 改以使用 "AAInputFieldItem" 20260625
import { useId } from "react";
import type { ILibTextBoxProp } from "./LibTextBox_Data";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
interface LibTextBoxWithParentClassProp extends ILibTextBoxProp
{
    parentClass?: string;
    onBlur?: (e: string) => void;
}
// #endregion

// #region Public
export const LibTextBox = (prop: LibTextBoxWithParentClassProp) =>
{
    const reactId = useId();
    const fieldKey = prop.ColumnDisplayName;
    // const fieldKey = prop.FieldKey ?? prop.ColumnDisplayName;  //欄位的穩定代號->FieldKey，之後可以加
    const baseId = buildAdapterBaseId(reactId);
    const inputId = buildFieldId(baseId, fieldKey);
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        prop.OnChange?.(String(value ?? ""));
    };
    /** 將 AAInputFieldItem 的 blur 值回寫到原本 LibTextBox blur callback。 */
    const handleBlur = (_fieldKey: string, value: AAInputValue) =>
    {
        prop.onBlur?.(String(value ?? ""));
    };

    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle}>
                <AAInputFieldItem
                    baseId={baseId}
                    variant="gridCell"
                    field={{
                        key: fieldKey,
                        type: "text",
                        label: prop.ColumnDisplayName,
                        aaLabel: `請輸入${prop.ColumnDisplayName}`,
                        value: prop.InputValue ?? "",
                        placeholder: `${prop.DefaultInputDisplay ?? ""}${prop.ColumnDisplayName} ...`,
                        disabled: prop.disabled ?? false,
                        helpText: `${prop.ColumnDisplayName}欄位`,
                    }}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            </div>
        </>
    );
};
// #endregion
