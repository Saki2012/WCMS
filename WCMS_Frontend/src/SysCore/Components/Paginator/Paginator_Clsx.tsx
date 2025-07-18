import { clsx } from "clsx";

export interface IPaginator_Style {
    ul: string;
    li: string;
    aLink:string;
    FirstPage:string;
    PrePage:string;
    NextPage:string;
    LastPage:string;
}

export const Classic_Paginator={
    ul: clsx("pagination"),
    li: clsx("page-item"),
    aLink:clsx("page-link"),
    FirstPage:clsx("far", "fa-arrow-to-left"),
    PrePage:clsx("far", "fa-angle-left"),
    NextPage:clsx("far", "fa-angle-right"),
    LastPage:clsx("far", "fa-arrow-to-right"),
}


