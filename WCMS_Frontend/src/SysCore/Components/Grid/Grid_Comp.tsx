import type { GridProps,GridRow,ColumnConfig } from "./Grid_Data"
import { useState } from "react";
import { Paginator } from "../Paginator/Paginator_Comp"
import type { IGridView_Style } from "./Grid_Clsx";
import type { IPaginator_Style } from "../Paginator/Paginator_Clsx";

const ColRender = ({ columns, style }: { columns: ColumnConfig[]; style: IGridView_Style }) =>{
    return (
        <thead>
            <tr className={style.ColumnStyle}>
                {columns.filter(col => col.visible !== false).map((col) => (
                    <th key={col.key} id={col.key.toString()} style={{ width: col.width || "auto" }}>
                    {col.title}
                    </th>
                ))}
            </tr>
        </thead>
    )
}

const RowRender = ({ rows, style }: { rows: GridRow[]; style: IGridView_Style }) =>{
    return (
        <tbody>
            {rows.map((row,idx) => (
                <tr key={idx} className={(idx%2===1 ? style.Odd : style.Even)}>
                    {row.cells.map((data,idx)=> (
                        <td key={idx} headers={data.col.key} className={style.CellStyle} data-th={data.col.title}>{data.content}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

export const Grid=({ gridData, style, pageStyle }: { gridData: GridProps; style: IGridView_Style; pageStyle:IPaginator_Style })=>{
    const [_, setCurrentPage] = useState(1);
    const handlePageChange = (page: number) => {
    setCurrentPage(page);
    null; // 重新查詢資料
    };

    return(
        <>
        <div className="row mx-0">
            <div className="RWD-TABLE-BOX">
                <table className={style.TableStyle}>
                    <ColRender columns={gridData.columns} style={style}></ColRender>
                    <RowRender rows={gridData.rows} style={style}></RowRender>
                </table>
            </div>
        </div>
        {!(gridData.CurrentPage === 1 && gridData.TotalPage === 1) && 
            (<Paginator currentPage={gridData.CurrentPage} totalPages={gridData.TotalPage} onPageChange={handlePageChange} style={pageStyle} ></Paginator>)}
        </>
    );
}