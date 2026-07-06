// 原 input 改以使用 "AAInputFieldItem" 20260626
import { useId, useMemo, useState } from "react";
import type { ILibTextBoxProp } from "./LibTextBox_Data";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
interface ILibPwdTextBoxProp extends ILibTextBoxProp
{
    InputName?: string;
    AutoComplete?: string;
    PreventAutoFill?: boolean;
}
// #endregion

// #region Public
/** 密碼輸入欄位，使用 passwordSingle 輸出單一密碼 input。 */
export const LibPwdTextBox = (prop: ILibPwdTextBoxProp) =>
{
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(prop.PreventAutoFill ?? true);
    const inputName = useMemo(() =>
    {
        const raw = prop.InputName ?? `wcms-pwd-${baseId}`;
        return raw.replace(/[^a-zA-Z0-9_-]/g, "");
    }, [prop.InputName, baseId]);
    const inputId = buildFieldId(baseId, inputName);
    const autoComplete = prop.AutoComplete ?? "off";
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        prop.OnChange?.(String(value ?? ""));
    };
    const handleUnlock = () =>
    {
        if (isReadOnly) setIsReadOnly(false);
    };
    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
            <div className={prop.Style.SelectStyle} onFocus={handleUnlock} onMouseDown={handleUnlock}>
                <AAInputFieldItem
                    baseId={baseId}
                    variant="gridCell"
                    field={{
                        key: inputName,
                        type: "passwordSingle",
                        label: prop.ColumnDisplayName,
                        aaLabel: `請輸入${prop.ColumnDisplayName}`,
                        value: prop.InputValue ?? "",
                        placeholder: `${prop.DefaultInputDisplay ?? ""}${prop.ColumnDisplayName} ...`,
                        disabled: prop.disabled ?? false,
                        readOnly: isReadOnly,
                        autoComplete,
                        helpText: `${prop.ColumnDisplayName}欄位`,
                    }}
                    onChange={handleChange}
                />
            </div>
        </>
    );
};
// #endregion