import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, getAriaInvalid, getAriaRequired, getNativeRequired, normalizeTextValue, stringifyValue } from "../AAInputField_Utils";

// #region Public

/** text 欄位。 */
export const TextField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="text" />;


/** email 欄位。 */
export const EmailField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="email" />;


/** tel 欄位。 */
export const TelField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="tel" />;


/** url 欄位。 */
export const UrlField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="url" />;


/** date 欄位。 */
export const DateField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="date" />;


/** date-time 欄位，實際 HTML input type 使用 datetime-local。 */
export const DateTimeField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={props.field} context={props.context} inputType="datetime-local" />;


/** readonly 欄位。 */
export const ReadonlyField = (props: { field: AAInputField; context: FieldRenderContext; }) => <BaseTextInputField field={{ ...props.field, readOnly: true }} context={props.context} inputType="text" />;
// #endregion

// #region Private
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "text", type: "text", label: "文字", aaLabel: "請輸入文字內容", value: state.text }]} onChange={handleChange} />
 * <AAInputFieldList fields={[{ key: "email", type: "email", label: "電子郵件", aaLabel: "請輸入有效電子郵件", value: state.email }]} onChange={handleChange} />
 * <AAInputFieldList fields={[{ key: "tel", type: "tel", label: "電話", aaLabel: "請輸入聯絡電話", value: state.tel }]} onChange={handleChange} />
 * <AAInputFieldList fields={[{ key: "date", type: "date", label: "日期", aaLabel: "請選擇日期", value: state.date }]} onChange={handleChange} />
 * <AAInputFieldList fields={[{ key: "date-time", type: "date-time", label: "日期時間", aaLabel: "請選擇日期與時間", value: state["date-time"] }]} onChange={handleChange} />
 * <AAInputFieldList fields={[{ key: "readonly", type: "readonly", label: "唯讀資料", aaLabel: "僅供檢視", value: state.readonly }]} onChange={handleChange} />
 */

/** 共用文字型 input 底層欄位。 */
const BaseTextInputField = (props: { field: AAInputField; context: FieldRenderContext; inputType: string; }) =>
{
    /** 處理文字欄位離開焦點，保留 AA focus 樣式清除與外部 blur callback。 */
    const handleBlur = (event: FocusEvent<HTMLInputElement>) =>
    {
        clearAAFocusStyle(event);
        props.context.onBlur?.(props.field.key, normalizeTextValue(event.currentTarget.value, props.field.maxLength));
    };

    /** 處理文字欄位鍵盤事件，保留外部 Enter commit callback。 */
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        props.context.onKeyDown?.(props.field.key, event);
    };

    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <input
                id={props.context.fieldId}
                name={props.field.key}
                type={props.inputType}
                className={buildControlClass(props.field)}
                value={stringifyValue(props.field.value)}
                min={props.field.min}
                max={props.field.max}
                step={props.field.step}
                maxLength={props.field.maxLength}
                placeholder={props.field.placeholder}
                autoComplete={props.field.autoComplete}
                inputMode={props.field.inputMode}
                disabled={props.field.disabled}
                readOnly={props.field.readOnly}
                required={getNativeRequired(props.field)}
                aria-required={getAriaRequired(props.field)}
                aria-invalid={getAriaInvalid(props.field)}
                aria-describedby={props.context.describedBy}
                onFocus={applyAAFocusStyle}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onChange={(event: ChangeEvent<HTMLInputElement>) => props.context.onChange(props.field.key, normalizeTextValue(event.target.value, props.field.maxLength))}
            />
        </FieldControlShell>
    );
};
// #endregion