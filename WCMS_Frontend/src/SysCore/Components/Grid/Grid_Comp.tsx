import { LibJson } from "@/SysCore/Utils/Library/LibData";
import { useEffect, useState } from "react";
import type { IPaginator_Style } from "../Paginator/Paginator_Clsx";
import { NewPaginatorCanInputPage } from "../Paginator/Paginator_Comp";
import type { IGridView_Style } from "./Grid_Clsx";
import type { ColumnConfig, GridColumnWidthMap, GridProps, GridRow } from "./Grid_Data";

// #region Property
/** Grid 欄寬 localStorage key */
export const STORAGE_KEY = "grid-col-widths";
/** Grid 欄位最小寬度 */
const MIN_COLUMN_WIDTH_PX = 50;
// #endregion

// #region Public
export const ColRender = (props: { columns: ColumnConfig[]; style?: IGridView_Style; onResize: (index: number, width: number) => void; }) =>
{
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) =>
    {
        e.preventDefault();
        const startX = e.clientX;
        // 拿到實際的 th 元素寬度
        const th = e.currentTarget.parentElement as HTMLTableCellElement;
        const startWidth = th.getBoundingClientRect().width;
        const onMouseMove = (e: MouseEvent) =>
        {
            const newWidth = Math.max(MIN_COLUMN_WIDTH_PX, startWidth + (e.clientX - startX));
            props.onResize(index, newWidth);
        };
        const onMouseUp = () =>
        {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };
    return (
        <thead>
            <tr className="tr-only-hide-titlebar">
                {props.columns.filter((col) => col.visible !== false).map((col, idx) => (
                    <th key={col.key} scope="col" style={{ width: typeof col.width === "number" ? `${col.width}px` : "auto", position: "relative" }}>
                        {col.title}
                        {/* 不是最後一欄才有分隔線 */}
                        {idx < props.columns.length - 1 && (
                            <div
                                onMouseDown={(e) => handleMouseDown(e, idx)}
                                style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "5px", cursor: "col-resize", userSelect: "none" }}
                            />
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    );
};
export const RowRender = (props: { rows: GridRow[]; style?: IGridView_Style; }) =>
{
    return (
        <tbody>
            {props.rows
                && props.rows.map((row, idx) => (
                    <tr key={row.keyId} className={idx % 2 === 1 ? props.style?.Odd : props.style?.Even}>
                        {(row.cells ?? []).map((data, cellIdx) => <td key={cellIdx} headers={data.col.key} className={"table_td_vertical_align"} data-th={data.col.title}>{data.content}</td>)}
                    </tr>
                ))}
        </tbody>
    );
};
export const Grid = (props: { gridData: GridProps; style: IGridView_Style; pageStyle: IPaginator_Style; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    const [, setCurrentPage] = useState(1);
    useEffect(() =>
    {
        const widths = LibJson.readLocalStorageJson<GridColumnWidthMap>(STORAGE_KEY, {}, { guard: LibJson.isNumberRecord });
        setColumns((prev) => applySavedColumnWidths(prev, widths));
    }, []);
    const handleResize = (index: number, width: number) =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths = buildColumnWidthMap(updated);
            LibJson.writeLocalStorageJson(STORAGE_KEY, widths);
            return updated;
        });
    };
    const handlePageChange = (page: number) =>
    {
        setCurrentPage(page);
        if (props.gridData.onPageChange) props.gridData.onPageChange(page);
    };
    return (
        <>
            <div className="row mx-0">
                <div className="RWD-TABLE-BOX">
                    <table className={props.style.TableStyle}>
                        <ColRender columns={columns} style={props.style} onResize={handleResize} />
                        <RowRender rows={props.gridData.rows} style={props.style} />
                    </table>
                </div>
            </div>
            {props.gridData.TotalPage > 1 && (
                <NewPaginatorCanInputPage
                    currentPage={props.gridData.CurrentPage}
                    totalPages={props.gridData.TotalPage}
                    onPageChange={handlePageChange}
                    style={props.pageStyle}
                />
            )}
        </>
    );
};
// #endregion

// #region Private
/** 套用 localStorage 記錄的 Grid 欄寬。 */
const applySavedColumnWidths = (columns: ColumnConfig[], widths: GridColumnWidthMap): ColumnConfig[] =>
{
    return columns.map((col) => ({
        ...col,
        width: resolveColumnWidth(col, widths),
    }));
};
/** 解析欄位目前應使用的寬度。 */
const resolveColumnWidth = (col: ColumnConfig, widths: GridColumnWidthMap): number | undefined =>
{
    if (typeof widths[col.key] === "number") return widths[col.key];
    if (typeof col.width === "number") return col.width;
    return undefined;
};
/** 建立可保存到 localStorage 的欄寬資料。 */
const buildColumnWidthMap = (columns: ColumnConfig[]): GridColumnWidthMap =>
{
    const widths: GridColumnWidthMap = {};
    columns.forEach((col) =>
    {
        if (typeof col.width === "number") widths[col.key] = col.width;
    });
    return widths;
};
// #endregion
