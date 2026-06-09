// #region Property
/** 頁面清單狀態 */
export interface IListViewState
{
    /** 目前頁碼 */
    pageNumber: number;

    /** 每頁筆數 */
    pageSize: number;

    /** 搜尋關鍵字 */
    keyword?: string;

    /** 排序欄位 */
    sortField?: string;

    /** 是否倒序 */
    sortDesc?: boolean;
}
// #endregion
