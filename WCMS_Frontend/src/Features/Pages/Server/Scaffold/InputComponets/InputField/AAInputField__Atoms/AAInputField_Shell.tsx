import type { ReactNode } from "react";
import type { AAInputField } from "./AAInputField_Types";
import { getAriaInvalid, getAriaRequired, getFieldAaLabel, getHintText } from "./AAInputField_Utils";

// #region Property
interface FieldShellProps { field: AAInputField; fieldId: string; hintId: string; errorId: string; children: ReactNode; }
// #endregion

// #region Public
/** 一般控制項外框，符合 form-group / hidden label / hint / input 結構。 */
export const FieldControlShell = (props: FieldShellProps) =>
{
    const isGridCell = props.field.renderVariant === "gridCell";
    const hintClassName = isGridCell ? "visually-hidden" : "form-text mb-1";

    return (
        <div className={isGridCell ? "aa-input-field-cell" : "form-group"}>
            <label htmlFor={props.fieldId} className="visually-hidden">{getFieldAaLabel(props.field)}</label>
            <div id={props.hintId} className={hintClassName}>{getHintText(props.field)}</div>
            {props.children}
            <FieldError field={props.field} errorId={props.errorId} />
        </div>
    );
};


/** 群組控制項外框，radio/checkbox multiple 使用 fieldset 保持語意。 */
export const FieldGroupShell = (props: { field: AAInputField; hintId: string; errorId: string; describedBy: string; children: ReactNode; }) =>
{
    const isGridCell = props.field.renderVariant === "gridCell";
    const hintClassName = isGridCell ? "visually-hidden" : "form-text mb-1";

    return (
        <div className={isGridCell ? "aa-input-field-cell" : "form-group"}>
            <fieldset className="m-0 p-0 border-0" aria-describedby={props.describedBy} aria-required={getAriaRequired(props.field)} aria-invalid={getAriaInvalid(props.field)}>
                <legend className="visually-hidden">{getFieldAaLabel(props.field)}</legend>
                <div id={props.hintId} className={hintClassName}>{getHintText(props.field)}</div>
                <div>{props.children}</div>
            </fieldset>
            <FieldError field={props.field} errorId={props.errorId} />
        </div>
    );
};


/** 渲染欄位錯誤訊息。 */
export const FieldError = (props: { field: AAInputField; errorId: string; }) =>
{
    if (!props.field.errorText) return null;
    return <div id={props.errorId} className="invalid-feedback d-block" role="alert" aria-live="polite">{props.field.errorText}</div>;
};
// #endregion
