import { type ChangeEvent, useState } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldError } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, buildDescribedBy, getAriaInvalid, getAriaRequired, getHintText, getNativeRequired, normalizeTextValue, stringifyValue } from "../AAInputField_Utils";

/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "password", type: "password", label: "請輸入新密碼", aaLabel: "請輸入新密碼", autoComplete: "new-password", value: state.password }]} onChange={handleChange} />
 */

/** password 欄位，顯示「請輸入新密碼」與「再次輸入密碼」，不帶入原密碼。 */
export const PasswordField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");

    const passwordValue = stringifyValue(props.field.value);
    const confirmError = getConfirmPasswordError(passwordValue, confirmPassword);
    const confirmInputId = `${props.context.fieldId}-confirm`;
    const confirmHintId = `${confirmInputId}-hint`;
    const confirmErrorId = `${confirmInputId}-error`;

    /** 更新新密碼並清理不允許的控制字元。 */
    const updatePassword = (event: ChangeEvent<HTMLInputElement>) =>
    {
        props.context.onChange(props.field.key, normalizeTextValue(event.target.value, props.field.maxLength));
    };

    /** 更新再次輸入密碼，只留在元件內做比對，不回寫原密碼欄位。 */
    const updateConfirmPassword = (event: ChangeEvent<HTMLInputElement>) =>
    {
        setConfirmPassword(normalizeTextValue(event.target.value, props.field.maxLength));
    };

    return (
        <div className={props.field.renderVariant === "gridCell" ? "aa-input-field-cell" : "form-group"}>
            <div id={props.context.hintId} className="visually-hidden">{getHintText(props.field)}</div>
            <div className="d-grid gap-2">
                <PasswordInputBox
                    field={props.field}
                    id={props.context.fieldId}
                    name={props.field.key}
                    label="請輸入新密碼"
                    value={passwordValue}
                    inputType={showPassword ? "text" : "password"}
                    describedBy={props.context.describedBy}
                    buttonLabel={showPassword ? "隱藏新密碼" : "顯示新密碼"}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                    onChange={updatePassword}
                />
                <PasswordInputBox
                    field={props.field}
                    id={confirmInputId}
                    name={`${props.field.key}-confirm`}
                    label="再次輸入密碼"
                    value={confirmPassword}
                    inputType={showConfirmPassword ? "text" : "password"}
                    describedBy={buildDescribedBy(confirmHintId, confirmError ? confirmErrorId : "")}
                    buttonLabel={showConfirmPassword ? "隱藏再次輸入密碼" : "顯示再次輸入密碼"}
                    showPassword={showConfirmPassword}
                    confirmError={confirmError}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    onChange={updateConfirmPassword}
                />
                {confirmError && <div id={confirmErrorId} className="invalid-feedback d-block" role="alert" aria-live="polite">{confirmError}</div>}
            </div>
            <FieldError field={props.field} errorId={props.context.errorId} />
        </div>
    );
};

/** 單一密碼輸入框，右側提供顯示/隱藏密碼按鈕。 */
const PasswordInputBox = (props: { field: AAInputField; id: string; name: string; label: string; value: string; inputType: "password" | "text"; describedBy: string; buttonLabel: string; showPassword: boolean; confirmError?: string; onToggle: () => void; onChange: (event: ChangeEvent<HTMLInputElement>) => void; }) =>
{
    return (
        <div>
            <label htmlFor={props.id} className="form-text mb-2">{props.label}</label>
            <div className="position-relative">
                <input
                    id={props.id}
                    name={props.name}
                    type={props.inputType}
                    className={getPasswordControlClass(props.field, props.confirmError)}
                    style={getPasswordInputStyle(props.field, props.confirmError)}
                    value={props.value}
                    maxLength={props.field.maxLength}
                    placeholder={props.label}
                    autoComplete={props.field.autoComplete ?? "new-password"}
                    disabled={props.field.disabled}
                    readOnly={props.field.readOnly}
                    required={getNativeRequired(props.field)}
                    aria-required={getAriaRequired(props.field)}
                    aria-invalid={props.confirmError ? true : getAriaInvalid(props.field)}
                    aria-describedby={props.describedBy}
                    onFocus={applyAAFocusStyle}
                    onBlur={clearAAFocusStyle}
                    onChange={props.onChange}
                />
                <button
                    type="button"
                    className="btn btn-link text-muted position-absolute top-50 end-0 translate-middle-y px-2 py-0"
                    style={{ textDecoration: "none" }}
                    disabled={props.field.disabled}
                    aria-label={props.buttonLabel}
                    aria-pressed={props.showPassword}
                    onFocus={applyAAFocusStyle}
                    onBlur={clearAAFocusStyle}
                    onClick={props.onToggle}
                >
                    <i className={props.showPassword ? "far fa-eye" : "far fa-eye-slash"} aria-hidden="true"></i>
                </button>
            </div>
        </div>
    );
};

/** 取得密碼輸入框樣式，避免 Bootstrap invalid icon 與眼睛按鈕重疊。 */
const getPasswordInputStyle = (field: AAInputField, confirmError?: string) =>
{
    const hasInvalidIcon = Boolean(field.errorText || confirmError);

    return {
        paddingRight: hasInvalidIcon ? "4.75rem" : "2.5rem",
        backgroundPosition: hasInvalidIcon ? "right 2.45rem center" : undefined,
    };
};

/** 取得密碼欄位樣式，確認密碼不一致時補上 invalid 樣式。 */
const getPasswordControlClass = (field: AAInputField, confirmError?: string) =>
{
    return `${buildControlClass(field)}${confirmError && !field.errorText ? " is-invalid" : ""}`;
};

/** 取得確認密碼錯誤文字，空值時不提示。 */
const getConfirmPasswordError = (passwordValue: string, confirmPassword: string) =>
{
    if (!confirmPassword) return "";
    return passwordValue === confirmPassword ? "" : "兩次輸入的密碼不一致";
};
