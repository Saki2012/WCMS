/** 之後再來考慮命名方式 */

/** SideMenu用圖示 */
export const BaseCssIcon1 = {
    /** 顯示更多... */
    More:"fa-ellipsis-h",
    /** 廣告輪播圖示 */
    Carousel: "fa-bring-front",
    /** 公告圖示 */
    Bullhorn: "fa-bullhorn",
    /** 頁面 */
    Page: "fa-file-signature",
    /** 相簿 */
    Image: "fa-images",
    /** 檔案室 */    
    File: "fa-cabinet-filing",
    /** 網路資源 */
    Link: "fa-link",
    /** 問卷留言 */
    Survey: "fa-list-alt",
    /** 研討會 */
    M:"fa-chalkboard-teacher"
} as const;

export type BaseCssIcon1 = typeof BaseCssIcon1[keyof typeof BaseCssIcon1];


/** NaviMenu用圖示 */
export const BaseCssIcon2 = {
    /** 目前使用者 */
    A:"fa-user-check",
    /** 排版板模 */
    B:"fa-tasks-alt",
    /** 教師管理 */
    C:"fa-user-tie",
    /** 會員管理 */
    D:"fa-users",
    /** 產品管理 */
    E:"fa-shopping-cart",
    /** 網站功能 */
    F:"fa-network-wired",
    /** 帳號管理 */
    G:"fa-users-cog",
    /** 系統設定 */
    H:"fa-cogs",
    /** 登出系統 */
    I:"fa-sign-out",
} as const;

export type BaseCssIcon2 = typeof BaseCssIcon2[keyof typeof BaseCssIcon2];
export function createEnumReverseLookup<T extends Record<string, string | number>>(map: T) {
  // 自動建立 value-to-key 的反查對應
  const reverseMap: Record<string | number, keyof T> = Object.entries(map).reduce(
    (acc, [k, v]) => {
      acc[v] = k;
      return acc;
    },
    {} as Record<string | number, keyof T>
  );

  return {
    map,
    getKey: (value: T[keyof T]): keyof T | undefined => reverseMap[value],
    getValue: (key: keyof T): T[keyof T] => map[key],
  };
}
