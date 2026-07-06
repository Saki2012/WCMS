import type { KeyboardEvent } from "react";

// #region Property
export type AAInputType =
    | "text"
    | "email"
    | "tel"
    | "url"
    | "password"
    | "passwordSingle"
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
    /** 是否顯示空白 placeholder option，selectSingle 原生模式使用。 */
    showPlaceholder?: boolean;
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
    /** 是否顯示已選檔案名稱與圖片/影片預覽，主要給 file 欄位使用。 */
    showFileNameAndImg?: boolean;
    autoComplete?: string;
    /** 輸入鍵盤模式，例如 numeric、url、email。 */
    inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
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
    /** 處理欄位離開焦點事件。 */
    onBlur?: (fieldKey: string, value: AAInputValue) => void;
    /** 處理鍵盤事件，例如 Enter commit。 */
    onKeyDown?: (fieldKey: string, event: KeyboardEvent<HTMLInputElement>) => void;
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
    /** 處理欄位離開焦點事件。 */
    onBlur?: (fieldKey: string, value: AAInputValue) => void;
    /** 處理鍵盤事件，例如 Enter commit。 */
    onKeyDown?: (fieldKey: string, event: KeyboardEvent<HTMLInputElement>) => void;
}


export interface AAInputFieldAdapterOptions { baseId: string; fields: AAInputField[]; }

export interface AAInputFieldAdapterResult { baseId: string; fields: AAInputField[]; }


export interface FileReadResult { value: AAFileValue[]; fileList: File[]; errorText: string; }

export interface FilePreviewItem { key: string; name: string; size: number; type: string; previewUrl: string; isImage: boolean; isVideo: boolean; }
// #endregion