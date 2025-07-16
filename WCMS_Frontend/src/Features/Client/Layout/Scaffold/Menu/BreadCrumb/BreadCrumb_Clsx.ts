import { clsx } from 'clsx';
import type { IBreadCrumbStyle } from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx';

/** 前台BreadCrumb樣式 */
export const Classic_BreadCrumb:IBreadCrumbStyle = {
    ul:clsx("breadcrumb"),
    li:(isLast:boolean)=>clsx("breadcrumb-item", {"active":isLast}),
}