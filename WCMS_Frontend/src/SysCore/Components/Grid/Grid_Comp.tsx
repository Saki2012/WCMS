import { useEffect, useState } from "react";
import type { IPaginator_Style } from "../Paginator/Paginator_Clsx";
import { NewPaginatorCanInputPage } from "../Paginator/Paginator_Comp";
import type { IGridView_Style } from "./Grid_Clsx";
import type { ColumnConfig, GridProps, GridRow } from "./Grid_Data";

export const STORAGE_KEY = "grid-col-widths";

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
            const newWidth = Math.max(50, startWidth + (e.clientX - startX));
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
                        {(row.cells ?? []).map((data, cellIdx) => (
                            <td key={cellIdx} headers={data.col.key} className={"table_td_vertical_align"} data-th={data.col.title}>{data.content}</td>
                        ))}
                    </tr>
                ))}
        </tbody>
    );
};

export const Grid = (props: { gridData: GridProps; style: IGridView_Style; pageStyle: IPaginator_Style; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    const [_, setCurrentPage] = useState(1);
    useEffect(() =>
    {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved)
        {
            const widths = JSON.parse(saved);
            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    width: typeof widths[col.key] === "number" ? widths[col.key] : typeof col.width === "number" ? col.width : undefined,
                }))
            );
        }
    }, []);

    const handleResize = (index: number, width: number) =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths: Record<string, number> = {};
            updated.forEach((c) =>
            {
                if (typeof c.width === "number") widths[c.key] = c.width;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
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
