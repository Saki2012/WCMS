import type { ReactNode } from "react";

export interface ColumnConfig
{
    key: string; // 對應的欄位 key
    title: string; // 欄位標題
    width?: string | number; // 欄位寬度，如 "15%"，同時支援"auto"、"150px"、或純數字 150
    visible?: boolean; // 是否顯示欄位（可控）
}

export interface RowCell
{
    col: ColumnConfig;
    content: ReactNode;
}

export interface GridRow
{
    keyId:string;
    cells: RowCell[];
}

export interface GridProps
{
    columns: ColumnConfig[];
    rows: GridRow[];
    CurrentPage: number;
    TotalPage: number;
    onPageChange: (page: number) => void;
}
