import type { ChangeEvent, KeyboardEvent } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildCheckClass, getAriaInvalid, getAriaRequired, getNativeRequired } from "../AAInputField_Utils";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "checkboxSingle", type: "checkboxSingle", label: "啟用", aaLabel: "請勾選項目", value: state.checkboxSingle }]} onChange={handleChange} />
 */

/** checkboxSingle 欄位。 */
export const CheckboxSingleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <input id={props.context.fieldId} name={props.field.key} type="checkbox" className={buildCheckClass(props.field)} checked={Boolean(props.field.value)} disabled={props.field.disabled} required={getNativeRequired(props.field)} aria-required={getAriaRequired(props.field)} aria-invalid={getAriaInvalid(props.field)} aria-describedby={props.context.describedBy} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onKeyDown={(event) => handleCheckboxEnterKeyDown(event, () => props.context.onChange(props.field.key, !Boolean(props.field.value)))} onChange={(event: ChangeEvent<HTMLInputElement>) => props.context.onChange(props.field.key, event.target.checked)} />
        </FieldControlShell>
    );
};
// #endregion

// #region Private
/** checkbox 補上 Enter 切換，保留原生 Space 行為。 */
const handleCheckboxEnterKeyDown = (event: KeyboardEvent<HTMLInputElement>, toggleCheckbox: () => void) =>
{
    if (event.key !== "Enter") return;
    event.preventDefault();
    toggleCheckbox();
};
// #endregion
