import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, getAriaInvalid, getAriaRequired, getNativeRequired, normalizeTextValue, stringifyValue } from "../AAInputField_Utils";

// #region Public
/** 單一密碼輸入欄位，不處理確認密碼驗證。 */
export const PasswordSingleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPassword ? "text" : "password";
    const buttonLabel = showPassword ? "隱藏密碼" : "顯示密碼";
    const handleBlur = (event: FocusEvent<HTMLInputElement>) =>
    {
        clearAAFocusStyle(event);
        props.context.onBlur?.(props.field.key, normalizeTextValue(event.currentTarget.value, props.field.maxLength));
    };
    const handleTogglePassword = () =>
    {
        setShowPassword((prev) => !prev);
    };
    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <div style={{ position: "relative" }}>
                <input
                    id={props.context.fieldId}
                    name={props.field.key}
                    type={inputType}
                    className={buildControlClass(props.field)}
                    style={{ paddingRight: 40 }}
                    value={stringifyValue(props.field.value)}
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
                    onBlur={handleBlur}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => props.context.onChange(props.field.key, normalizeTextValue(event.target.value, props.field.maxLength))}
                />
                <button
                    type="button"
                    className="eye-btn"
                    aria-label={buttonLabel}
                    aria-pressed={showPassword}
                    aria-controls={props.context.fieldId}
                    onClick={handleTogglePassword}
                    style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        right: 8,
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                    }}
                >
                    <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
            </div>
        </FieldControlShell>
    );
};
// #endregion