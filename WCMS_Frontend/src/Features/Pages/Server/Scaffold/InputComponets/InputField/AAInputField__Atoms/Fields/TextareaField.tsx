import type { ChangeEvent } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, getAriaInvalid, getAriaRequired, getNativeRequired, normalizeTextValue, stringifyValue } from "../AAInputField_Utils";

/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "textarea", type: "textarea", label: "內容", aaLabel: "請輸入文字內容(可多行)", rows: 5, value: state.textarea }]} onChange={handleChange} />
 */

/** textarea 欄位。 */
export const TextareaField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <textarea
                id={props.context.fieldId}
                name={props.field.key}
                className={buildControlClass(props.field)}
                value={stringifyValue(props.field.value)}
                rows={props.field.rows ?? 4}
                maxLength={props.field.maxLength}
                placeholder={props.field.placeholder}
                autoComplete={props.field.autoComplete}
                disabled={props.field.disabled}
                readOnly={props.field.readOnly}
                required={getNativeRequired(props.field)}
                aria-required={getAriaRequired(props.field)}
                aria-invalid={getAriaInvalid(props.field)}
                aria-describedby={props.context.describedBy}
                onFocus={applyAAFocusStyle}
                onBlur={clearAAFocusStyle}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => props.context.onChange(props.field.key, normalizeTextValue(event.target.value, props.field.maxLength))}
            />
        </FieldControlShell>
    );
};
