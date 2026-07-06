// 原 textarea 改以使用 "AAInputFieldItem" 20260625
import { useId } from "react";
import type { ILibTextAreaProp } from "./LibTextArea_Data";

import { 
    AAInputFieldItem, 
    buildAdapterBaseId, 
    buildFieldId, 
    type AAInputValue 
} 
from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";


// #region Public
/** 多行文字輸入欄位，使用 AAInputFieldItem 輸出 textarea 與 AA 屬性。 */
export const LibTextArea = (prop: ILibTextAreaProp) =>
{
    const reactId = useId();
    const fieldKey = prop.ColumnDisplayName;
    const baseId = buildAdapterBaseId(reactId);
    const inputId = buildFieldId(baseId, fieldKey);
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        prop.OnChange?.(String(value ?? ""));
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
                        type: "textarea",
                        label: prop.ColumnDisplayName,
                        aaLabel: `請輸入${prop.ColumnDisplayName}`,
                        value: prop.InputValue ?? "",
                        placeholder: `${prop.DefaultInputDisplay ?? ""}${prop.ColumnDisplayName} ...`,
                        rows: 4,
                        helpText: `${prop.ColumnDisplayName}欄位`,
                    }}
                    onChange={handleChange}
                />
            </div>
        </>
    );
};
// #endregion