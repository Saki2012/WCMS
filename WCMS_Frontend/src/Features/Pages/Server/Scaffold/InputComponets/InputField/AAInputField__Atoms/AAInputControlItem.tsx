import type { FocusEvent, InputHTMLAttributes } from "react";
import { applyAAFocusStyle, clearAAFocusStyle } from "./AAInputField_Focus";

// #region Property
export type AAInputControlType = "checkbox" | "radio";

export interface AAInputControlItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">
{
    /** input 類型，目前只給 checkbox / radio 使用。 */
    type: AAInputControlType;
    /** 無障礙名稱，若外層已有 label htmlFor 可不傳。 */
    aaLabel?: string;
    /** 額外描述文字 id。 */
    describedBy?: string;
    /** 是否為錯誤狀態。 */
    invalid?: boolean;
}
// #endregion

// #region Public
/** 只輸出 input 控制項，不包 FieldControlShell，適合既有 form-check 結構。 */
export const AAInputControlItem = (props: AAInputControlItemProps) =>
{
    const {
        aaLabel,
        describedBy,
        invalid,
        onFocus,
        onBlur,
        ...inputProps
    } = props;

    /** 套用 AA focus 樣式並保留外部 focus 事件。 */
    const handleFocus = (event: FocusEvent<HTMLInputElement>) =>
    {
        applyAAFocusStyle(event);
        onFocus?.(event);
    };

    /** 清除 AA focus 樣式並保留外部 blur 事件。 */
    const handleBlur = (event: FocusEvent<HTMLInputElement>) =>
    {
        clearAAFocusStyle(event);
        onBlur?.(event);
    };

    return (
        <input
            {...inputProps}
            aria-label={props["aria-label"] ?? aaLabel}
            aria-describedby={props["aria-describedby"] ?? describedBy}
            aria-invalid={props["aria-invalid"] ?? invalid}
            aria-required={props["aria-required"]}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
};
// #endregion