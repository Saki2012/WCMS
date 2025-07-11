import { clsx } from "clsx";

export interface ISidebarMenu_Style {
    ul(lv:number): string;
    ulStyle?:React.CSSProperties;
    li:(isFirst:boolean,hasMenu:boolean)=> string;
}

/** 經典Menu樣式 */
export const Classic_SidebarMenu:ISidebarMenu_Style = {
    ul:(lv:number) => clsx(lv==1? "pc-navbar" : "pc-submenu"),
    ulStyle:{display:"block"},
    li:(isFirst,hasMenu)=> clsx("pc-item", {"pc-hasmenu":hasMenu, "pc-caption":isFirst, "Left_line":isFirst,})
};