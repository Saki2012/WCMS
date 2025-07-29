// types/IApiSchema.ts
export type TableColumnSchema = {
  ColumnId: string;
  ColumnDisplayName: string;
  [key: string]: any;
};

export type TableSchema = {
  TableId: string;
  TableDisplayName?: string;
  Columns: TableColumnSchema[];
};

export type ModelDisplaySchema = {
  ModelId: string;
  ModelDisplayName: string;
  Tables: TableSchema[];
};