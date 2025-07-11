/** 清單 */
import type { ReactNode } from 'react';

export interface NaviData {
  /** 主鍵 */
  Id:string;
  /** 來源資料 */
  SrcData: string;
  /** 路徑 */
  Url: string;
  /** 動態DOM欄位資料處理與渲染。取得資料後在此做動態邏輯渲染 */
  DOMContent?:ReactNode;
};
