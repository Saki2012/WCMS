import { useId, useMemo } from "react";
import clsx from "clsx";
import type { AAInputField, AAInputFieldItemProps, FieldRenderContext } from "./AAInputField_Types";
import { buildAAInputFieldAdapter } from "./AAInputField_Adapter";
import { buildDescribedBy, buildFieldId } from "./AAInputField_Utils";
import { DateField, DateTimeField, EmailField, ReadonlyField, TelField, TextField, UrlField } from "./Fields/BaseTextInputField";
import { PasswordField } from "./Fields/PasswordField";
import { PasswordSingleField } from "./Fields/PasswordSingleField";
import { NumberField } from "./Fields/NumberField";
import { TextareaField } from "./Fields/TextareaField";
import { SelectSingleField } from "./Fields/SelectSingleField";
import { SelectMultipleField } from "./Fields/SelectMultipleField";
import { DateRangeField } from "./Fields/DateRangeField";
import { DateTimeRangeField } from "./Fields/DateTimeRangeField";
import { FileField } from "./Fields/FileField";
import { CheckboxSingleField } from "./Fields/CheckboxSingleField";
import { CheckboxMultipleField, RadioField } from "./Fields/OptionGroupField";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldItem
 *     baseId={`edit-grid-${rowId}-${columnKey}`}
 *     variant="gridCell"
 *     field={{ key: columnKey, type: "text", label: columnTitle, aaLabel: `第 ${rowIndex + 1} 列，${columnTitle}，請輸入文字內容`, value }}
 *     onChange={(_, nextValue) => onCellChange(rowId, columnKey, nextValue)}
 * />
 */

/** 單一 AA 欄位渲染器，可供 EditGrid 的 td 內使用。 */
export const AAInputFieldItem = (props: AAInputFieldItemProps) =>
{
    const reactBaseId = useId();
    const baseId = props.baseId ?? reactBaseId;
    const adapter = useMemo(() => buildAAInputFieldAdapter({ baseId, fields: [{ ...props.field, renderVariant: props.variant ?? props.field.renderVariant ?? "form" }] }), [baseId, props.field, props.variant]);
    const field = adapter.fields[0];
    const fieldId = buildFieldId(adapter.baseId, field.key);
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;
    const describedBy = buildDescribedBy(hintId, field.errorText ? errorId : "");
    const context: FieldRenderContext = {
        fieldId,
        hintId,
        errorId,
        describedBy,
        onChange: props.onChange,
        onBlur: props.onBlur,
        onKeyDown: props.onKeyDown,
    };

    return <div className={clsx(props.className, "aa-input-field-item")}>{renderAAInputField(field, context)}</div>;
};

/** 依欄位型別轉出對應 HTML 控制項。 */
export const renderAAInputField = (field: AAInputField, context: FieldRenderContext) =>
{
    if (field.type === "text") return <TextField field={field} context={context} />;
    if (field.type === "email") return <EmailField field={field} context={context} />;
    if (field.type === "tel") return <TelField field={field} context={context} />;
    if (field.type === "url") return <UrlField field={field} context={context} />;
    if (field.type === "password") return <PasswordField field={field} context={context} />;
    if (field.type === "passwordSingle") return <PasswordSingleField field={field} context={context} />;
    if (field.type === "number") return <NumberField field={field} context={context} />;
    if (field.type === "date") return <DateField field={field} context={context} />;
    if (field.type === "date-time") return <DateTimeField field={field} context={context} />;
    if (field.type === "textarea") return <TextareaField field={field} context={context} />;
    if (field.type === "selectSingle") return <SelectSingleField field={field} context={context} />;
    if (field.type === "selectMultiple") return <SelectMultipleField field={field} context={context} />;
    if (field.type === "dateRange") return <DateRangeField field={field} context={context} />;
    if (field.type === "dateTimeRange") return <DateTimeRangeField field={field} context={context} />;
    if (field.type === "file") return <FileField field={field} context={context} />;
    if (field.type === "radio") return <RadioField field={field} context={context} />;
    if (field.type === "checkboxSingle") return <CheckboxSingleField field={field} context={context} />;
    if (field.type === "checkboxMultiple") return <CheckboxMultipleField field={field} context={context} />;
    if (field.type === "readonly") return <ReadonlyField field={field} context={context} />;
    return <TextField field={field} context={context} />;
};
// #endregion