// #region Public
/** 將位元遮罩轉換為 checkbox 可用的 string 陣列 */
export const parseBitmaskToStringArray = (bitmask: number, allKeys: number[]): string[] =>
{
    return allKeys.filter((key) => (bitmask & key) === key).map(String);
};


/** 將 checkbox 傳回的 string 陣列轉換為加總後的 bitmask 整數 */
export const sumStringArrayToBitmask = (selected: string[]): number =>
{
    return selected.map(Number).reduce((acc, value) => acc | value, 0);
};


/** 將數字限制在最小值與最大值之間 */
export const clamp = (value: number, min: number, max: number): number =>
{
    return Math.min(Math.max(value, min), max);
};


/** 確保頁碼至少為 1 */
export const normalizePageNumber = (page: number | null | undefined): number =>
{
    return Math.max(1, Number(page ?? 1));
};
// #endregion
