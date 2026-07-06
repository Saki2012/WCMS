import type {
    AAInputFieldRenderVariant,
    AAInputOption,
    AAInputType,
    AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
export type LibAAInputOptions = AAInputOption[] | Record<string, string> | Map<string, string>;

export interface ILibAAInputFieldProp
{
    Style?: unknown;
    FieldKey?: string;
    Type?: AAInputType;
    ColumnDisplayName: string;
    InputValue?: AAInputValue;
    Options?: LibAAInputOptions;
    OnChange?: (value: AAInputValue) => void;
    onChange?: (value: AAInputValue) => void;
    AALabel?: string;
    HelpText?: string;
    ErrorText?: string;
    Required?: boolean;
    Placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    MaxLength?: number;
    Min?: number;
    Max?: number;
    Step?: number | "any";
    Rows?: number;
    AutoComplete?: string;
    Searchable?: boolean;
    SearchPlaceholder?: string;
    BaseId?: string;
    Variant?: AAInputFieldRenderVariant;
    ClassName?: string;
}
// #endregion