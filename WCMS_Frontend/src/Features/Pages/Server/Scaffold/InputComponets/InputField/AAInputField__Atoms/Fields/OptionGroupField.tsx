import type { ChangeEvent, KeyboardEvent } from "react";
import type { AAInputField, AAInputOption, AAInputValue, FieldRenderContext } from "../AAInputField_Types";
import { FieldGroupShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { getAriaRequired, getNativeRequired, toStringArray } from "../AAInputField_Utils";

// #region Public
/** 渲染 radio 或多選 checkbox 群組。 */
export const OptionGroupField = (props: { field: AAInputField; context: FieldRenderContext; mode: "radio" | "checkbox"; }) =>
{
    const selectedValues = toStringArray(props.field.value);

    return (
        <FieldGroupShell field={props.field} hintId={props.context.hintId} errorId={props.context.errorId} describedBy={props.context.describedBy}>
            {(props.field.options ?? []).map((item, index) => renderOptionItem(props.field, props.context.fieldId, item, index, props.mode, selectedValues, props.context.onChange))}
        </FieldGroupShell>
    );
};



/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "radio", type: "radio", label: "狀態", aaLabel: "請選擇項目(擇一)", options, value: state.radio }]} onChange={handleChange} />
 */

/** radio 欄位。 */
export const RadioField = (props: { field: AAInputField; context: FieldRenderContext; }) => <OptionGroupField field={props.field} context={props.context} mode="radio" />;


/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "checkboxMultiple", type: "checkboxMultiple", label: "分類", aaLabel: "請勾選項目(可複選)", options, value: state.checkboxMultiple }]} onChange={handleChange} />
 */

/** checkboxMultiple 欄位。 */
export const CheckboxMultipleField = (props: { field: AAInputField; context: FieldRenderContext; }) => <OptionGroupField field={props.field} context={props.context} mode="checkbox" />;
// #endregion

// #region EntityComp
/** 渲染 radio / checkbox 群組內的單一項目。 */
const renderOptionItem = (field: AAInputField, fieldId: string, item: AAInputOption, index: number, mode: "radio" | "checkbox", selectedValues: string[], onChange: (fieldKey: string, value: AAInputValue) => void) =>
{
    const itemId = `${fieldId}-${mode}-${index}`;
    const checked = mode === "radio" ? String(field.value ?? "") === item.value : selectedValues.includes(item.value);
    const nextValue = (isChecked: boolean) => mode === "radio" ? item.value : toggleStringValue(selectedValues, item.value, isChecked);

    return (
        <div key={item.value} className="form-check form-check-inline" title={item.label}>
            <input id={itemId} name={field.key} type={mode} className="form-check-input" style={{ top: "-0.11rem", marginLeft: "-1.4rem" }} value={item.value} checked={checked} disabled={field.disabled || item.disabled} required={mode === "radio" ? getNativeRequired(field) : undefined} aria-required={mode === "radio" ? getAriaRequired(field) : undefined} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onKeyDown={(event) => handleOptionItemEnterKeyDown(event, mode, () => onChange(field.key, nextValue(!checked)))} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.key, nextValue(event.target.checked))} />
            <label className="form-check-label" htmlFor={itemId}>{item.label}</label>
        </div>
    );
};
// #endregion

// #region Private
/** checkboxMultiple 補上 Enter 切換，radio 保留原生鍵盤行為。 */
const handleOptionItemEnterKeyDown = (event: KeyboardEvent<HTMLInputElement>, mode: "radio" | "checkbox", toggleCheckbox: () => void) =>
{
    if (mode !== "checkbox" || event.key !== "Enter") return;
    event.preventDefault();
    toggleCheckbox();
};


/** 切換多選陣列值。 */
const toggleStringValue = (current: string[], value: string, checked: boolean) => checked ? Array.from(new Set([...current, value])) : current.filter((item) => item !== value);
// #endregion
