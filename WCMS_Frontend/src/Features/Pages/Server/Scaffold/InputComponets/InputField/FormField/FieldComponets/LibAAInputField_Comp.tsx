import type { AAInputField, AAInputOption, AAInputValue } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";
import { AAInputFieldItem } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";
import type { ILibAAInputFieldProp, LibAAInputOptions } from "./LibAAInputField_Data";

// #region Public
/** 將既有 FormField binding 轉接成 AAInputFieldItem。 */
export const LibAAInputField = (props: ILibAAInputFieldProp) =>
{
    const field = buildAAInputField(props);
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        const changeHandler = props.OnChange ?? props.onChange;
        changeHandler?.(value);
    };

    return (
        <AAInputFieldItem
            baseId={props.BaseId}
            variant={props.Variant ?? "form"}
            className={props.ClassName}
            field={field}
            onChange={handleChange}
        />
    );
};
// #endregion

// #region Private
/** 建立 AAInputField 所需欄位資料。 */
const buildAAInputField = (props: ILibAAInputFieldProp): AAInputField =>
{
    return {
        key: props.FieldKey ?? props.ColumnDisplayName,
        type: props.Type ?? "text",
        label: props.ColumnDisplayName,
        aaLabel: props.AALabel,
        value: props.InputValue,
        options: normalizeAAOptions(props.Options),
        helpText: props.HelpText ?? `${props.ColumnDisplayName}欄位`,
        errorText: props.ErrorText,
        required: props.Required,
        placeholder: props.Placeholder,
        disabled: props.disabled,
        readOnly: props.readOnly,
        maxLength: props.MaxLength,
        min: props.Min,
        max: props.Max,
        step: props.Step,
        rows: props.Rows,
        autoComplete: props.AutoComplete,
        searchable: props.Searchable,
        searchPlaceholder: props.SearchPlaceholder,
        renderVariant: props.Variant ?? "form",
    };
};

/** 將舊 FormField 的 options 格式轉成 AAInputOption。 */
const normalizeAAOptions = (options?: LibAAInputOptions): AAInputOption[] | undefined =>
{
    if (!options) return undefined;
    if (Array.isArray(options)) return options;
    if (options instanceof Map) return Array.from(options.entries()).map(([value, label]) => ({ value, label }));

    return Object.entries(options).map(([value, label]) => ({ value, label }));
};
// #endregion