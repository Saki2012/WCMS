// #region Property
export type AAInputType =
    | "text"
    | "email"
    | "tel"
    | "password"
    | "number"
    | "date"
    | "date-time"
    | "textarea"
    | "selectSingle"
    | "selectMultiple"
    | "dateRange"
    | "dateTimeRange"
    | "file"
    | "radio"
    | "checkboxSingle"
    | "checkboxMultiple"
    | "readonly";


export type AAInputValue = string | number | boolean | string[] | AAFileValue[] | null | undefined;


export interface AAInputOption { value: string; label: string; disabled?: boolean; }

export interface AAFileValue { file?: File; name: string; size: number; type: string; url?: string; }

export interface AAInputState { [key: string]: AAInputValue; }


export type AAInputFieldRenderVariant = "form" | "gridCell";


export interface AAInputField
{
    key: string;
    type: AAInputType;
    label: string;
    aaLabel?: string;
    value?: AAInputValue;
    options?: AAInputOption[];
    helpText?: string;
    errorText?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number | "any";
    rows?: number;
    accept?: string;
    multiple?: boolean;
    maxFileCount?: number;
    maxFileSizeMB?: number;
    autoComplete?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
    maxSearchLength?: number;
    calendarBaseDate?: string;
    renderVariant?: AAInputFieldRenderVariant;
}


export interface AAInputFieldItemProps
{
    field: AAInputField;
    onChange: (fieldKey: string, value: AAInputValue) => void;
    baseId?: string;
    variant?: AAInputFieldRenderVariant;
    className?: string;
}


export interface AAInputFieldListProps
{
    fields: AAInputField[];
    onChange: (fieldKey: string, value: AAInputValue) => void;
    title?: string;
    description?: string;
    className?: string;
    idPrefix?: string;
}


export interface FieldRendererProps
{
    baseId: string;
    field: AAInputField;
    onChange: (fieldKey: string, value: AAInputValue) => void;
}


export interface FieldRenderContext
{
    fieldId: string;
    hintId: string;
    errorId: string;
    describedBy: string;
    onChange: (fieldKey: string, value: AAInputValue) => void;
}


export interface AAInputFieldAdapterOptions { baseId: string; fields: AAInputField[]; }

export interface AAInputFieldAdapterResult { baseId: string; fields: AAInputField[]; }


export interface FileReadResult { value: AAFileValue[]; fileList: File[]; errorText: string; }

export interface FilePreviewItem { key: string; name: string; size: number; type: string; previewUrl: string; isImage: boolean; isVideo: boolean; }
// #endregion
