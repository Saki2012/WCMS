import type { GridProps } from "../../../SysCore/Components/Grid/Grid_ForServer_Data"
import { useState } from "react";
import { Paginator } from "../../../SysCore/Components/Paginator/Paginator_Comp"


/** 之後合併，先暫時分開處理 */
const ColRender = ({gridData}:{gridData:GridProps}) =>{
    return (
        <thead>
            <tr className={gridData.style.ColumnStyle}>
                {gridData.columns.filter(col => col.visible !== false).map((col) => (
                    <th id={col.key.toString()} style={{ width: col.width || "auto" }}>
                    {col.title}
                    </th>
                ))}
            </tr>
        </thead>
    )
}

const RowRender = ({gridData}:{gridData:GridProps}) =>{
    return (
        <tbody>
            {gridData.rows.map((row,idx) => (
                <tr className={(idx%2===1 ? gridData.style.Odd : gridData.style.Even)}>
                    {row.cells.map((data)=> (
                        <td headers={data.col.key} className={gridData.style.CellStyle} data-th={data.col.title}>{data.content}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

export const Grid=({gridData}:{gridData:GridProps})=>{
    const [currentPage, setCurrentPage] = useState(1);
    const handlePageChange = (page: number) => {
    setCurrentPage(page);
    null; // 重新查詢資料
    };
    return(
        <>
        <div className="row mx-0">
            <div className="RWD-TABLE-BOX">
                <table className={gridData.style.TableStyle}>
                    <ColRender gridData={gridData}></ColRender>
                    <RowRender gridData={gridData}></RowRender>
                </table>
            </div>
        </div>
        <Paginator currentPage={1} totalPages={5} onPageChange={handlePageChange}  ></Paginator>
        </>
    );
}