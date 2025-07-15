import type { GridProps,GridRow,ColumnConfig } from "../../../SysCore/Components/Grid/Grid_ForServer_Data"
import { useState } from "react";
import { Paginator } from "../../../SysCore/Components/Paginator/Paginator_Comp"
import type { IGridView_Style } from "./Grid_Clsx";


/** 之後合併，先暫時分開處理 */
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
                <tr className={(idx%2===1 ? style.Odd : style.Even)}>
                    {row.cells.map((data)=> (
                        <td headers={data.col.key} className={style.CellStyle} data-th={data.col.title}>{data.content}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

export const Grid=({ gridData, style }: { gridData: GridProps; style: IGridView_Style })=>{
    const [currentPage, setCurrentPage] = useState(1);
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
            (<Paginator currentPage={gridData.CurrentPage} totalPages={gridData.TotalPage} onPageChange={handlePageChange} ></Paginator>)}
        </>
    );
}