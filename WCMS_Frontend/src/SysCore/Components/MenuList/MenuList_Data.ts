/** 清單 */
import type { ReactNode } from "react";

export interface MenuItemData
{
    /** 項目主鍵 */
    Id: string;
    /** 原始資料 */
    SrcData: string;
    /** 類型 */
    Type?: "url" | "module"; // 之後處理
    /** 超連結 */
    Url: string;
    /** 另開or當前 */
    URL_Open?: "_self" | "_blank" | "";
    /** 子項目 */
    SubItem: MenuItemData[];
    /** 動態DOM欄位資料處理與渲染。取得資料後在此做動態邏輯渲染 */
    DOMContent?: ReactNode;
}
