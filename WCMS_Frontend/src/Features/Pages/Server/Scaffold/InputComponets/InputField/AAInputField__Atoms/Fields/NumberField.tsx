import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent } from "react";
import type { AAInputField, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, getAriaInvalid, getAriaRequired, getNativeRequired, stringifyValue } from "../AAInputField_Utils";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "number", type: "number", label: "數字", aaLabel: "請輸入數字", min: 0, max: 9999, step: 1, value: state.number }]} onChange={handleChange} />
 */

/** number 欄位，保留原生上下鍵並套用 min/max 與安全數字正規化。 */
export const NumberField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <input
                id={props.context.fieldId}
                name={props.field.key}
                type="number"
                className={buildControlClass(props.field)}
                value={stringifyValue(props.field.value)}
                min={props.field.min}
                max={props.field.max}
                step={props.field.step ?? 1}
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
                onKeyDown={(event) => preventInvalidNumberKeyDown(event, props.field)}
                onPaste={(event) => handleNumberPaste(event, props.field, props.context)}
                onChange={(event: ChangeEvent<HTMLInputElement>) => props.context.onChange(props.field.key, normalizeNumberValue(event.target.value, props.field))}
                onBlur={(event: FocusEvent<HTMLInputElement>) => { clearAAFocusStyle(event); props.context.onChange(props.field.key, normalizeNumberValue(event.target.value, props.field)); }}
            />
        </FieldControlShell>
    );
};


/** 正規化數字欄位，移除前導零、非法字元，並套用 min/max 邊界。 */
export const normalizeNumberValue = (value: string, field: AAInputField) =>
{
    const normalizedText = normalizeNumberText(value, field);
    if (!normalizedText) return "";

    const numberValue = Number(normalizedText);
    if (!Number.isFinite(numberValue)) return "";

    const boundedValue = clampNumberValue(numberValue, field);
    const adjustedValue = isIntegerNumberField(field) ? Math.trunc(boundedValue) : boundedValue;
    return String(adjustedValue);
};
// #endregion

// #region Private
/** 正規化數字文字，只接受一般十進位格式，不接受 001、e、+ 等特殊輸入。 */
const normalizeNumberText = (value: string, field: AAInputField) =>
{
    const text = value.replace(/[\u0000-\u001F\u007F,\s]/g, "");
    const allowNegative = field.min === undefined || field.min < 0;
    const allowDecimal = !isIntegerNumberField(field);
    const sign = allowNegative && text.startsWith("-") ? "-" : "";
    const numberBody = text.replace(/[^0-9.]/g, "");
    const decimalIndex = numberBody.indexOf(".");
    const integerPart = decimalIndex >= 0 ? numberBody.slice(0, decimalIndex) : numberBody;
    const decimalPart = decimalIndex >= 0 && allowDecimal ? numberBody.slice(decimalIndex + 1).replace(/\./g, "") : "";
    const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";
    return decimalIndex >= 0 && allowDecimal ? `${sign}${normalizedInteger}.${decimalPart}` : `${sign}${normalizedInteger}`;
};


/** 套用 min/max 邊界，避免輸入超出允許範圍。 */
const clampNumberValue = (value: number, field: AAInputField) =>
{
    const minValue = typeof field.min === "number" ? field.min : undefined;
    const maxValue = typeof field.max === "number" ? field.max : undefined;
    if (minValue !== undefined && value < minValue) return minValue;
    if (maxValue !== undefined && value > maxValue) return maxValue;
    return value;
};


/** 判斷數字欄位是否應只接受整數。 */
const isIntegerNumberField = (field: AAInputField) => field.step !== "any" && Number.isInteger(Number(field.step ?? 1));


/** 阻擋 number 欄位輸入 e、E、+、不合法負號與小數點等不應存在的字元。 */
const preventInvalidNumberKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: AAInputField) =>
{
    if (isNumberControlKey(event.key)) return;
    if (!isAllowedNumberInputText(event.key, field)) event.preventDefault();
};


/** 允許方向鍵、刪除、複製貼上等控制鍵，保留原生 number 上下鍵功能。 */
const isNumberControlKey = (key: string) => ["Backspace", "Delete", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key);


/** 處理貼上數字，確保貼上的內容也會套用相同規則。 */
const handleNumberPaste = (event: ClipboardEvent<HTMLInputElement>, field: AAInputField, context: FieldRenderContext) =>
{
    event.preventDefault();
    context.onChange(field.key, normalizeNumberValue(event.clipboardData.getData("text"), field));
};


/** 檢查輸入字元是否符合 number 欄位規則。 */
const isAllowedNumberInputText = (value: string, field: AAInputField) =>
{
    const allowNegative = field.min === undefined || field.min < 0;
    const allowDecimal = !isIntegerNumberField(field);
    if (value === "-") return allowNegative;
    if (value === ".") return allowDecimal;
    return /^[0-9]+$/.test(value);
};
// #endregion
