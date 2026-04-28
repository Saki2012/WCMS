import { clsx } from "clsx";
import type { IBreadCrumbStyle } from "../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx";
import type { IGridView_Style } from "../../../../SysCore/Components/Grid/Grid_Clsx";
import type { IMenu_Style } from "../../../../SysCore/Components/MenuList/MenuList_Clsx";
import type { INaviBarStyle } from "../../../../SysCore/Components/NaviBar/NaviBar_Clsx";
import type { IPaginator_Style } from "../../../../SysCore/Components/Paginator/Paginator_Clsx";
import type { IFETheme } from "./ITheme";

/** 前台SubPage SideMenu樣式 */
export const Classic_MainMenu: IMenu_Style = {
    isUl: true,
    ul: (lv: number) => clsx(lv == 1 ? "menu" : "collapse"),
    li: (lv: number) => clsx(lv == 1 ? "m-number" : ""),
};
/** 前台SubPage SideMenu樣式 */
export const Classic_SideMenu: IMenu_Style = { isUl: true, ul: (lv: number) => clsx(lv == 1 ? "Left-SecondMenu" : "collapse"), li: () => clsx("m-link") };
/** 前台BreadCrumb樣式 */
export const Classic_BreadCrumb: IBreadCrumbStyle = { ul: clsx("breadcrumb"), li: (isLast: boolean) => clsx("breadcrumb-item", { "active": isLast }) };
/** 導覽樣式 */
export const Classic_NaviBarMenu: INaviBarStyle = { ul: clsx("nav", "Customize_Nav"), li: clsx("nav-item") };
/** Grid表樣式 */
export const Classic_GridView: IGridView_Style = {
    TableStyle: clsx("table", "table-striped", "table-bordered", "table-hover", "table-rwd"),
    ColumnStyle: clsx("tr-only-hide-titlebar"),
    RowStyle: clsx(""),
    Odd: clsx(""),
    Even: clsx(""),
    CellStyle: clsx("table_td_vertical_align"),
};
/** 分頁樣式 */
export const Classic_Paginator: IPaginator_Style = {
    ul: clsx("pagination"),
    li: clsx("paginate_button"),
    aLink: clsx(""),
    FirstPage: clsx("fa", "icon_stop-angle-left"),
    PrePage: clsx("fa", "icon_angle-left"),
    NextPage: clsx("fa", "icon_angle-right"),
    LastPage: clsx("fa", "icon_stop-angle-right"),
};

/** 經典主題 */
export const Classic_FETheme: IFETheme = {
    // #region Componets
    MainMenu: Classic_MainMenu,
    SideMenu: Classic_SideMenu,
    BreadCrumb: Classic_BreadCrumb,
    NaviBarMenu: Classic_NaviBarMenu,

    // #region Fields
    GridView: Classic_GridView,
    Paginator: Classic_Paginator,
    // DropList:Classic_LibDropList,
    // Tabs:Classic_LibTabs,
    // TextBox:Classic_LibTextBox,
    // TinyMCE:Classic_LibTinyMCE,
};
