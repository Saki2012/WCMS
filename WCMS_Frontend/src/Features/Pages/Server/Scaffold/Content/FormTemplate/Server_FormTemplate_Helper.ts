import { type Lang, normalizeSupportedLang } from "@/SysCore/i18n/lang";

// #region Public
/** 依 Detail Lang 建立支援語系資料 Map，重複語系保留第一筆。 */
export const buildServerSupportedLangDetailMap = <TDetail extends { Lang?: Lang; }>(details: TDetail[]): Map<string, TDetail> =>
{
    return details.reduce<Map<string, TDetail>>(appendSupportedLangDetail, new Map<string, TDetail>());
};
// #endregion

// #region Private
/** 將有效語系 Detail 加入 Map。 */
const appendSupportedLangDetail = <TDetail extends { Lang?: Lang; }>(map: Map<string, TDetail>, detail: TDetail): Map<string, TDetail> =>
{
    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang || map.has(lang)) return map;
    map.set(lang, detail);
    return map;
};
// #endregion
