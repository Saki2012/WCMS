import type { FileArchiveListGridAdjustSlot } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/FileArchiveList";
import type { ColumnConfig, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";

const modifyColKey = "__ModifyTime__";
const downloadColKey = "__Download__";

export const extendFileArchiveListGridAdjust: FileArchiveListGridAdjustSlot = (ctx) =>
{
    // 宣告變數：新增欄位
    const modifyCol: ColumnConfig = { key: modifyColKey, title: "更新時間" };

    // 執行 function：先移除舊的同名欄位，再插到 Download 前面；找不到就放最後
    const filteredColumns = (ctx.result.columns ?? []).filter(col => col.key !== modifyColKey);
    const downloadIndex = filteredColumns.findIndex(col => col.key === downloadColKey);
    const columns = downloadIndex < 0
        ? [...filteredColumns, modifyCol]
        : [...filteredColumns.slice(0, downloadIndex), modifyCol, ...filteredColumns.slice(downloadIndex)];

    // 執行 function：逐列補 modify cell，並依 columns 順序重排
    const rows = ctx.result.rows.map((row, index) =>
    {
        const item = ctx.rawData[index];
        const modifyCell: RowCell = { col: modifyCol, content: FormatDate(item?.FileArchive?.ModifyTime) };
        const mixedCells = [...row.cells.filter(cell => cell.col.key !== modifyColKey), modifyCell];
        const cells = columns.map(col => mixedCells.find(cell => cell.col.key === col.key) ?? ({ col, content: "" } as RowCell));
        return { ...row, cells };
    });

    // return
    return { ...ctx.result, columns, rows };
};
