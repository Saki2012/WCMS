import type { ModelDisplaySchema, TableColumnSchema, TableSchema } from "@/types/IApiSchema";

// #region Property
export type ModelDisplayTableSource = string | readonly string[];
// #endregion

// #region Public
/**
 * 從後端 Model Metadata 取得欄位顯示名稱。
 * 找不到指定 Table 時，會再依 ColumnId 搜尋所有後端 Table。
 */
export const getModelColumnDisplayName = (model: ModelDisplaySchema | null | undefined, tableIds: ModelDisplayTableSource, columnId: string, fallback = ""): string =>
{
    const preferredColumn = findPreferredColumn(model, tableIds, columnId);
    if (preferredColumn?.ColumnDisplayName) return preferredColumn.ColumnDisplayName;
    const fallbackColumn = findColumnFromAllTables(model, columnId);
    return fallbackColumn?.ColumnDisplayName ?? fallback;
};

/** 取得指定資料表的顯示名稱，並相容前端底線屬性與後端 TableId。 */
export const getModelTableDisplayName = (
    model: ModelDisplaySchema | null | undefined,
    tableIds: ModelDisplayTableSource,
    fallback: string,
): string =>
{
    const table = findModelDisplayTable(model, tableIds);
    return table?.TableDisplayName || fallback;
};

/** 尋找 ModelDisplay 資料表，空字串代表 FormModel 根資料表。 */
export const findModelDisplayTable = (
    model: ModelDisplaySchema | null | undefined,
    tableIds: ModelDisplayTableSource,
): TableSchema | undefined =>
{
    const source = toTableIdArray(tableIds);
    const directTable = model?.Tables?.find(table => isPreferredTable(table, source));
    if (directTable) return directTable;
    return source.some(isRootTableId) ? findRootTable(model) : undefined;
};
// #endregion

// #region Private
/** 從優先 Table 清單尋找欄位。 */
const findPreferredColumn = (
    model: ModelDisplaySchema | null | undefined,
    tableIds: ModelDisplayTableSource,
    columnId: string,
): TableColumnSchema | undefined =>
{
    const table = findModelDisplayTable(model, tableIds);
    return table?.Columns?.find(column => column.ColumnId === columnId);
};

/** 判斷目前 Table 是否在優先清單內。 */
const isPreferredTable = (table: TableSchema, tableIds: readonly string[]): boolean =>
{
    const currentId = normalizeTableId(table.TableId);
    return tableIds.some(tableId => currentId === normalizeTableId(tableId));
};

/** 空 TableId 時優先使用 ModelId 對應表，最後採後端回傳的第一張 Root 表。 */
const findRootTable = (model: ModelDisplaySchema | null | undefined): TableSchema | undefined =>
{
    const modelId = normalizeTableId(model?.ModelId ?? "");
    const modelTable = model?.Tables?.find(table => normalizeTableId(table.TableId) === modelId);
    return modelTable ?? model?.Tables?.[0];
};

/** 優先 Table 找不到時，從所有 Table 尋找同名欄位。 */
const findColumnFromAllTables = (
    model: ModelDisplaySchema | null | undefined,
    columnId: string,
): TableColumnSchema | undefined =>
{
    return model?.Tables?.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);
};

/** 將單一或多個 TableId 統一轉為陣列。 */
const toTableIdArray = (tableIds: ModelDisplayTableSource): readonly string[] =>
{
    return typeof tableIds === "string" ? [tableIds] : tableIds;
};

/** 判斷是否要求 FormModel 根資料表。 */
const isRootTableId = (tableId: string): boolean =>
{
    return tableId.trim().length === 0;
};

/** 移除前端關聯屬性的底線前綴，統一進行 TableId 比對。 */
const normalizeTableId = (tableId: string): string =>
{
    return tableId.trim().replace(/^_+/, "").toLowerCase();
};
// #endregion
