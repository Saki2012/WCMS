import type { ISidebarMenu_Style } from '../Scaffold/Menu/SideMenu/SideMenu_Clsx'
import { Classic_SidebarMenu } from '../Scaffold/Menu/SideMenu/SideMenu_Clsx'

import type { IBreadCrumbStyle } from '../Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx'
import { Classic_BreadCrumb } from '../Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx'

import type { INaviBarMenu_Style } from '../Scaffold/Menu/NaviBar/NaviBar_Clsx'
import { Classic_NaviBarMenu } from '../Scaffold/Menu/NaviBar/NaviBar_Clsx'



/** 後台主題設定 */
export interface IBETheme {
  SidebarMenu: ISidebarMenu_Style
  BreadCrumb: IBreadCrumbStyle;
  NavBarMenu:INaviBarMenu_Style;
}

/** 經典主題 */
export const Classic_BETheme: IBETheme = {
  SidebarMenu: Classic_SidebarMenu,
  BreadCrumb: Classic_BreadCrumb,
  NavBarMenu: Classic_NaviBarMenu,
}