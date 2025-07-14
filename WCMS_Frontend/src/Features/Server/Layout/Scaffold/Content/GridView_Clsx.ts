import { clsx } from "clsx";
import type { IGridView_Style } from "../../../../../SysCore/Components/Grid/Grid_Clsx";


/** 經典Menu樣式 */
export const Classic_GridView:IGridView_Style = {
    TableStyle: clsx("table","table-striped","table-bordered","table-rwd"),
    ColumnStyle:clsx("tr-only-hide-titlebar"),
    RowStyle:clsx(""),
    Odd:clsx("transparent"),
    Even:clsx("gray"),
    CellStyle:clsx("table_td_vertical_align")
};