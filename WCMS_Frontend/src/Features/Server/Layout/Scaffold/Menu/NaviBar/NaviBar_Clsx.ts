import { clsx } from "clsx";

export interface INaviBarMenu_Style {
    ul: string;
    li:string;
}

/** 經典樣式 */
export const Classic_NaviBarMenu:INaviBarMenu_Style = {
    ul:clsx("navbar-nav", "me-auto", "mb-2", "mb-lg-0"),
    li:clsx("nav-item")
};