import type { ReactNode } from "react";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Public Types

export type EditGridPrimitiveValue = string | number | boolean | null | undefined;
export type EditGridOptionValue = string | number | boolean;
export type EditGridSelectionMode = "single" | "multiple";
export type EditGridInputType = "text" | "email" | "tel" | "password" | "number" | "date" | "date-time" | "textarea" | "select" | "selectSingle" | "selectMultiple" | "file" | "radio" | "checkbox" | "checkboxSingle" | "checkboxGroup" | "checkboxMultiple" | "dateRange" | "dateTimeRange" | "readonly";
export type EditGridRowState = "none" | "insert" | "update" | "delete";
export type EditGridLang = Lang;

export interface EditGridFileValue
{
    file?: File;
    fileName: string;
    url?: string;
    mimeType?: string;
    size?: number;
}

export type EditGridCellValue = EditGridPrimitiveValue | EditGridOptionValue[] | EditGridFileValue;

export interface EditGridSelectOption { label: string; value: EditGridOptionValue; disabled?: boolean; }

export interface ColumnConfig
{
    key: string;
    title: string;
    width?: string | number;
    minWidth?: number;
    visible?: boolean;
    editable?: boolean;
    required?: boolean;
    placeholder?: string;
    inputType?: EditGridInputType;
    options?: EditGridSelectOption[];
    selectionMode?: EditGridSelectionMode;
    searchPlaceholder?: string;
    accept?: string;
    multiple?: boolean;
    maxFileCount?: number;
    maxFileSizeMB?: number;
    aaLabel?: string;
    helpText?: string;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number | "any";
    rows?: number;
    searchable?: boolean;
    maxSearchLength?: number;
    render?: (args: EditGridCellRenderArgs) => ReactNode;
    editRender?: (args: EditGridCellRenderArgs) => ReactNode;
    validate?: (value: EditGridCellValue, row: GridRow, rowIndex: number) => string | undefined;
}

export interface RowCell
{
    col: ColumnConfig;
    content: ReactNode;
    value?: EditGridCellValue;
    editable?: boolean;
    required?: boolean;
    placeholder?: string;
    inputType?: EditGridInputType;
    options?: EditGridSelectOption[];
    selectionMode?: EditGridSelectionMode;
    searchPlaceholder?: string;
    accept?: string;
    multiple?: boolean;
    maxFileCount?: number;
    maxFileSizeMB?: number;
    aaLabel?: string;
    helpText?: string;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number | "any";
    rows?: number;
    searchable?: boolean;
    maxSearchLength?: number;
    render?: (args: EditGridCellRenderArgs) => ReactNode;
    editRender?: (args: EditGridCellRenderArgs) => ReactNode;
    validate?: (value: EditGridCellValue, row: GridRow, rowIndex: number) => string | undefined;
}

export interface GridRow
{
    keyId: string;
    cells: RowCell[];
    rowId?: string | number;
    rowNo?: number;
    rowState?: EditGridRowState;
    RowId?: string | number;
    RowNo?: number;
    rowid?: string | number;
    rowno?: number;
}

export interface GridProps
{
    columns: ColumnConfig[];
    rows: GridRow[];
    CurrentPage: number;
    TotalPage: number;
    onPageChange: (page: number) => void;
}

export interface EditGridCellRenderArgs
{
    row: GridRow;
    rowIndex: number;
    cell: RowCell;
    column: ColumnConfig;
    value: EditGridCellValue;
    disabled: boolean;
    updateValue: (value: EditGridCellValue) => void;
}

export interface IEditGridView_Style
{
    TableStyle?: string;
    ColumnStyle?: string;
    RowStyle?: string;
    Odd?: string;
    Even?: string;
    CellStyle?: string;
    ToolbarStyle?: string;
    ButtonStyle?: string;
    DangerButtonStyle?: string;
    ActionCellStyle?: string;
    ErrorStyle?: string;
}

export interface EditGridProps
{
    GridData?: GridProps;
    gridData?: GridProps;
    title?: string;
    lang?: EditGridLang;
    style?: IEditGridView_Style;
    storageKey?: string;
    minTableWidth?: number;
    scrollBreakpoint?: number;
    disabled?: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDrag?: boolean;
    showOperationGuide?: boolean;
    showRowNo?: boolean;
    actionColumnTitle?: string;
    emptyText?: string;
    addButtonText?: string;
    editButtonText?: string;
    saveButtonText?: string;
    cancelButtonText?: string;
    deleteButtonText?: string;
    deleteConfirmMessage?: string;
    ariaLabel?: string;
    createRow?: (nextRowNo: number) => GridRow;
    onGridDataChange?: (gridData: GridProps) => void;
    onRowsChange?: (rows: GridRow[]) => void;
    onDeleteRow?: (row: GridRow) => void;
}

// #endregion
