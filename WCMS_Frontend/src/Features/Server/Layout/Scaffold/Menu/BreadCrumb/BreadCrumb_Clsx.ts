import { clsx } from 'clsx';

export interface IBreadCrumbStyle {
    ul: string;
    li(isLast:boolean): string;
}
/** 後台BreadCrumb樣式 */
export const Classic_BreadCrumb:IBreadCrumbStyle = {
    ul:clsx("breadcrumb", "mb-0"),
    li:(isLast:boolean)=>clsx("breadcrumb-item", {"active":isLast}),
}