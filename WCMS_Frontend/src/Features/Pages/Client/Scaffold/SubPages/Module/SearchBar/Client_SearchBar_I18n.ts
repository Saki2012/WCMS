import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
/** 前台共用搜尋列語系文字。 */
export interface ClientSearchBarText
{
    title: string;
    searchButtonText: string;
    resetButtonText: string;
    allOptionText: string;
}
// #endregion

// #region Public
/** 取得前台共用搜尋列語系文字。 */
export const getClientSearchBarText = (lang: Lang): ClientSearchBarText =>
{
    if (lang === "en")
    {
        return {
            title: "Search",
            searchButtonText: "Search",
            resetButtonText: "Reset",
            allOptionText: "All",
        };
    }
    return {
        title: "搜尋條件",
        searchButtonText: "搜尋",
        resetButtonText: "重置",
        allOptionText: "全部",
    };
};
// #endregion
