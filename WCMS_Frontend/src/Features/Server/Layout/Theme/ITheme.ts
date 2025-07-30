import type { IMenu_Style } from "../../../../SysCore/Components/MenuList/MenuList_Clsx"
import type { IBreadCrumbStyle } from "../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx"
import type { INaviBarStyle } from "../../../../SysCore/Components/NaviBar/NaviBar_Clsx"
import type { ILibTabsStyle, ILibDropListStyle, ILibTextBoxStyle, ILibTinyMCEStyle } from "../../../../SysCore/Components/FormField/LibFormField"
import type { IGridView_Style } from "../../../../SysCore/Components/Grid/Grid_Clsx";
import type { IPaginator_Style } from "../../../../SysCore/Components/Paginator/Paginator_Clsx";

/** 後台主題設定 */
export interface IBETheme {
  //#region Componets
  SidebarMenu: IMenu_Style;
  BreadCrumb: IBreadCrumbStyle;
  NavBarMenu:INaviBarStyle;
  GridView:IGridView_Style
  Paginator:IPaginator_Style
  CategoryTagList:IMenu_Style;

  //#region Fields
  DropList:ILibDropListStyle
  Tabs:ILibTabsStyle;
  TextBox:ILibTextBoxStyle
  TinyMCE:ILibTinyMCEStyle
}

