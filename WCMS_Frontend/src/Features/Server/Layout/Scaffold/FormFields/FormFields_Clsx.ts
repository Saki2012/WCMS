import { clsx } from 'clsx';
import type{ ILibTabsStyle,ILibDropListStyle,ILibTextBoxStyle, ILibTinyMCEStyle } from "../../../../../SysCore/Components/FormField/LibFormField"
import type { IGridView_Style } from "../../../../../SysCore/Components/Grid/Grid_Clsx";

/** 頁籤樣式 */
export const Classic_LibTabs:ILibTabsStyle = {
    UlStyle:clsx("nav","nav-tabs"),
    LiStyle:clsx("nav-item"),
    BtnStyle:clsx("nav-link"),
}

/** 下拉選單樣式 */
export const Classic_LibDropList:ILibDropListStyle ={
    Labelstyle:clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label"),
    SelectStyle:clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none"),
    OptionsStyle:clsx("form-select"),
}

/** 文字輸入框樣式 */
export const Classic_LibTextBox:ILibTextBoxStyle ={
    Labelstyle:clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label"),
    SelectStyle:clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none"),
    InputStyle:clsx("form-control"),
}

/** 文字輸入框樣式 */
export const Classic_LibTinyMCE:ILibTinyMCEStyle ={
    Labelstyle:clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label"),
    SelectStyle:clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none"),
}

/** Grid表樣式 */
export const Classic_GridView:IGridView_Style = {
    TableStyle: clsx("table","table-striped","table-bordered","table-rwd"),
    ColumnStyle:clsx("tr-only-hide-titlebar"),
    RowStyle:clsx(""),
    Odd:clsx("transparent"),
    Even:clsx("gray"),
    CellStyle:clsx("table_td_vertical_align")
};