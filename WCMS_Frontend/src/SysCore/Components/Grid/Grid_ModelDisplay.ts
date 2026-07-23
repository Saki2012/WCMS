import type { ModelDisplaySchema, TableColumnSchema, TableSchema } from "@/types/IApiSchema";

// #region Public
/**
 * 從後端 Model Metadata 取得欄位顯示名稱。
 * 找不到指定 Table 時，會再以 ColumnId 搜尋所有 Table，最後才使用 fallback。
 */
export const getModelColumnDisplayName = (
    model: ModelDisplaySchema | null | undefined,
    tableIds: readonly string[],
    columnId: string,
    fallback: string,
): string =>
{
    const preferredColumn = findPreferredColumn(model, tableIds, columnId);
    if (preferredColumn?.ColumnDisplayName) return preferredColumn.ColumnDisplayName;

    const fallbackColumn = findColumnFromAllTables(model, columnId);
    return fallbackColumn?.ColumnDisplayName || fallback;
};
// #endregion

// #region Private
/** 從優先 Table 清單尋找欄位。 */
const findPreferredColumn = (
    model: ModelDisplaySchema | null | undefined,
    tableIds: readonly string[],
    columnId: string,
): TableColumnSchema | undefined =>
{
    const table = model?.Tables?.find(item => isPreferredTable(item, tableIds));
    return table?.Columns?.find(column => column.ColumnId === columnId);
};

/** 判斷目前 Table 是否在優先清單內。 */
const isPreferredTable = (table: TableSchema, tableIds: readonly string[]): boolean =>
{
    return tableIds.some(tableId => table.TableId === tableId);
};

/** 優先 Table 找不到時，從所有 Table 尋找同名欄位。 */
const findColumnFromAllTables = (
    model: ModelDisplaySchema | null | undefined,
    columnId: string,
): TableColumnSchema | undefined =>
{
    return model?.Tables?.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);
};
// #endregion
