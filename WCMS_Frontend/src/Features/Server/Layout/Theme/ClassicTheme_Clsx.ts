import { clsx } from 'clsx';
import type{ ILibTabsStyle,ILibDropListStyle,ILibTextBoxStyle, ILibTinyMCEStyle } from "../../../../SysCore/Components/FormField/LibFormField"
import type { IGridView_Style } from "../../../../SysCore/Components/Grid/Grid_Clsx";
import type { IPaginator_Style } from "../../../../SysCore/Components/Paginator/Paginator_Clsx";
import type { IMenu_Style } from "../../../../SysCore/Components/MenuList/MenuList_Clsx"
import type {INaviBarStyle} from "../../../../SysCore/Components/NaviBar/NaviBar_Clsx"
import type { IBreadCrumbStyle } from '../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx';
import type { IBETheme } from './ITheme';

/** 後台BreadCrumb樣式 */
export const Classic_BreadCrumb:IBreadCrumbStyle = {
    ul:clsx("breadcrumb", "mb-0"),
    li:(isLast:boolean)=>clsx("breadcrumb-item", {"active":isLast}),
}

/** 經典樣式 */
export const Classic_NaviBarMenu:INaviBarStyle = {
    ul:clsx("navbar-nav", "me-auto", "mb-2", "mb-lg-0"),
    li:clsx("nav-item")
}

/** 經典Menu樣式 */
export const Classic_SidebarMenu:IMenu_Style = {
    isUl:true,
    ul:(lv:number) => clsx(lv==1? "pc-navbar" : "pc-submenu"),
    // ulStyle:{display:"block"},
    li:(isFirst,hasMenu)=> clsx("pc-item", {"pc-hasmenu":hasMenu, "pc-caption":isFirst, "Left_line":isFirst,})
};

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

/** 分頁樣式 */
export const Classic_Paginator:IPaginator_Style = {
    ul: clsx("pagination"),
    li: clsx("page-item"),
    aLink:clsx("page-link"),
    FirstPage:clsx("far", "fa-arrow-to-left"),
    PrePage:clsx("far", "fa-angle-left"),
    NextPage:clsx("far", "fa-angle-right"),
    LastPage:clsx("far", "fa-arrow-to-right"),
}


/** 經典主題 */
export const Classic_BETheme : IBETheme = {
  //#region Componets
  SidebarMenu: Classic_SidebarMenu,
  BreadCrumb: Classic_BreadCrumb,
  NavBarMenu: Classic_NaviBarMenu,
  Paginator:Classic_Paginator,
  //#region Fields
  GridView:Classic_GridView,
  DropList:Classic_LibDropList,
  Tabs:Classic_LibTabs,
  TextBox:Classic_LibTextBox,
  TinyMCE:Classic_LibTinyMCE,
}