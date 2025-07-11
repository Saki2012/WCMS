
import { z } from 'zod';
/** 頁面清單資料 */
const PageManagementList_Raw = z.object({
  /** 頁面Id */
  PageId: z.string(),
  /** 類別Id */
  CategoryId: z.string(),
  /** 類別名稱 */
  CategoryName: z.string(),
  /** 觀看次數 */
  ViewCount: z.number(),
  /** 系統內部唯一標識號 */
  InternalId: z.string(),
  /** 修改人Id */
  ModifyUserId: z.string(),
  /** 修改人名稱 */
  ModifyUserName: z.string(),
  /** 修改時間 */
  ModifyTime: z.coerce.date(), // ✅ 接受字串或 Date，自動轉換
});

export const PageManagementList_View = PageManagementList_Raw.extend({
  // 如需擴充欄位可寫在這裡
});

export type PageManagementList_View = z.infer<typeof PageManagementList_View>;

/** 頁面完整資料 */
const PageManagement_Raw = z.object({
  PageManagement: z.object({
    /** 頁面Id */
    PageId: z.string(),
    /** 類別Id */
    CategoryId: z.string(),
  }).strip(),
  PageManagementDetail: z.array(
    z.object({
      /** 頁面Id */
      PageId: z.string(),
      /** 行項主鍵 */
      RowId:z.number(),
      /** 語系 */
      Lang: z.string(),
      /** 標題 */
      Title: z.string(),
      /** 內容 */
      Content: z.string(),
    }).strip()
  ),
}).strip();
export const PageManagement_View = PageManagement_Raw.extend({});
export type PageManagement_View = z.infer<typeof PageManagement_View>;


export interface QueryListRequest {
  fields: string[]; // 想要回傳的欄位
  condition?: string;
  pageIndex?: number;
  pageSize?: number;
}

