import type { ISidebarMenu_Style } from '../Scaffold/Menu/SideMenu/SideMenu_Clsx'
import { Classic_SidebarMenu } from '../Scaffold/Menu/SideMenu/SideMenu_Clsx'

import type { IBreadCrumbStyle } from '../Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx'
import { Classic_BreadCrumb } from '../Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx'

import type { INaviBarMenu_Style } from '../Scaffold/Menu/NaviBar/NaviBar_Clsx'
import { Classic_NaviBarMenu } from '../Scaffold/Menu/NaviBar/NaviBar_Clsx'

import type {ILibTabsStyle,ILibDropListStyle,ILibTextBoxStyle,ILibTinyMCEStyle} from "../../../../SysCore/Components/FormField/LibFormField"
import { Classic_LibTabs,Classic_LibDropList,Classic_LibTextBox, Classic_LibTinyMCE,Classic_GridView } from "../../Layout/Scaffold/FormFields/FormFields_Clsx"
import type { IGridView_Style } from "../../../../SysCore/Components/Grid/Grid_Clsx";


/** 後台主題設定 */
export interface IBETheme {
  //#region Componets
  SidebarMenu: ISidebarMenu_Style;
  BreadCrumb: IBreadCrumbStyle;
  NavBarMenu:INaviBarMenu_Style;

  //#region Fields
  GridView:IGridView_Style
  DropList:ILibDropListStyle
  Tabs:ILibTabsStyle;
  TextBox:ILibTextBoxStyle
  TinyMCE:ILibTinyMCEStyle


}

/** 經典主題 */
export const Classic_BETheme : IBETheme = {
  //#region Componets
  SidebarMenu: Classic_SidebarMenu,
  BreadCrumb: Classic_BreadCrumb,
  NavBarMenu: Classic_NaviBarMenu,
  //#region Fields
  GridView:Classic_GridView,
  DropList:Classic_LibDropList,
  Tabs:Classic_LibTabs,
  TextBox:Classic_LibTextBox,
  TinyMCE:Classic_LibTinyMCE,
}