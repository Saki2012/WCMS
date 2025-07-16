

import type {INaviBarStyle} from "../../../../SysCore/Components/NaviBar/NaviBar_Clsx"
import {Classic_NaviBarMenu} from "../../Layout/Scaffold/Menu/NaviBar/NaviBar_Clsx"



/** 前台主題設定 */
export interface IFETheme {
  //#region Componets
  // SidebarMenu: ISidebarMenu_Style;
  // BreadCrumb: IBreadCrumbStyle;
  NavBarMenu:INaviBarStyle;

  // //#region Fields
  // GridView:IGridView_Style
  // DropList:ILibDropListStyle
  // Tabs:ILibTabsStyle;
  // TextBox:ILibTextBoxStyle
  // TinyMCE:ILibTinyMCEStyle
}

/** 經典主題 */
export const Classic_FETheme : IFETheme = {
  //#region Componets
  // SidebarMenu: Classic_SidebarMenu,
  // BreadCrumb: Classic_BreadCrumb,
  NavBarMenu: Classic_NaviBarMenu,
  //#region Fields
  // GridView:Classic_GridView,
  // DropList:Classic_LibDropList,
  // Tabs:Classic_LibTabs,
  // TextBox:Classic_LibTextBox,
  // TinyMCE:Classic_LibTinyMCE,
}