// #region Property
// FetchDataTypes.ts

/** Hook 統一出口：rawData 可自定義 key/value 結構 */
export interface UseFetchDataResult<TRawData extends Record<string, unknown>, TAdapter extends Record<string, unknown>>
{
    adapter: TAdapter;
    /** 主要資料與關聯資料（list/count/categoryMap... 皆可自定義） */
    rawData: TRawData;
    /** 內部所有 hooks 的 loading 聚合結果 */
    isLoading: boolean;
    /** 已正規化後的錯誤訊息（後續可在產生 errors 時做 dev/prod 差異） */
    errors: (string | null)[];
    /** 重抓「主資料」（可一次包含多個主資料，例如 count + list + detail） */
    refetchData: () => Promise<void>;
    /** 重抓「參考/關聯資料」（例如 category/tag/map/model display...） */
    refetchRefData?: () => Promise<void>;
}


/** （可選）SSR/Loader 初始資料格式：用 argsKey 判斷是否需要 CSR 補抓 */
// 重要 - 需要給前台SSR的入口參數
export interface FetchInitialData<TRawData extends Record<string, unknown>>
{
    /** 例如 `${specCode}|${lang}|${kw}|${page}|${pageSize}` */
    argsKey: string;

    /** SSR 已載入的資料（對應同 argsKey） */
    rawData: TRawData;

    /** SSR 階段整理出的錯誤（通常 isLoading 不需要） */
    errors: string[];
}
// #endregion
