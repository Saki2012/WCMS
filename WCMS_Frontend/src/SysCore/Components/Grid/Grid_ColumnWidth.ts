import { LibJson } from "@/SysCore/Utils/Library/LibData";
import type { ColumnConfig, GridColumnWidthMap } from "./Grid_Data";

// #region Public
/** 從 localStorage 讀取 Grid 欄寬記憶。 */
export const readGridColumnWidths = (storageKey: string): GridColumnWidthMap =>
{
    return LibJson.readLocalStorageJson<GridColumnWidthMap>(
        storageKey,
        {},
        { guard: LibJson.isNumberRecord },
    );
};

/** 套用 localStorage 記錄的 Grid 欄寬。 */
export const applyGridColumnWidths = (columns: ColumnConfig[], widths: GridColumnWidthMap): ColumnConfig[] =>
{
    return columns.map((col) => ({
        ...col,
        width: resolveGridColumnWidth(col, widths),
    }));
};

/** 將 Grid 欄寬寫入 localStorage。 */
export const writeGridColumnWidths = (storageKey: string, columns: ColumnConfig[]): boolean =>
{
    const widths = buildGridColumnWidthMap(columns);
    return LibJson.writeLocalStorageJson(storageKey, widths);
};
// #endregion

// #region Private
/** 解析欄位目前應使用的寬度。 */
const resolveGridColumnWidth = (col: ColumnConfig, widths: GridColumnWidthMap): number | undefined =>
{
    if (typeof widths[col.key] === "number") return widths[col.key];
    if (typeof col.width === "number") return col.width;

    return undefined;
};

/** 建立可保存到 localStorage 的欄寬資料。 */
const buildGridColumnWidthMap = (columns: ColumnConfig[]): GridColumnWidthMap =>
{
    const widths: GridColumnWidthMap = {};

    columns.forEach((col) =>
    {
        if (typeof col.width === "number") widths[col.key] = col.width;
    });

    return widths;
};
// #endregion
