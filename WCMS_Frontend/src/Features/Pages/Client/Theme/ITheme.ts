import type { IBreadCrumbStyle } from "../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx";
import type { IGridView_Style } from "../../../../SysCore/Components/Grid/Grid_Clsx";
import type { IMenu_Style } from "../../../../SysCore/Components/MenuList/MenuList_Clsx";
import type { INaviBarStyle } from "../../../../SysCore/Components/NaviBar/NaviBar_Clsx";
import type { IPaginator_Style } from "../../../../SysCore/Components/Paginator/Paginator_Clsx";

// #region Property
/** 前台主題設定 */
export interface IFETheme
{
    MainMenu: IMenu_Style;
    SideMenu: IMenu_Style;
    BreadCrumb: IBreadCrumbStyle;
    NaviBarMenu: INaviBarStyle;

    // //#region Fields
    GridView: IGridView_Style;
    Paginator: IPaginator_Style;
    // DropList:ILibDropListStyle
    // Tabs:ILibTabsStyle;
    // TextBox:ILibTextBoxStyle
    // TinyMCE:ILibTinyMCEStyle
}
// #endregion
