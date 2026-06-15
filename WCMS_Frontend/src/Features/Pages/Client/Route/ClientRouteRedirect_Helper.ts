import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { redirect } from "react-router-dom";

// #region Property
const CLIENT_NOT_FOUND_REDIRECT_STATUS = 302;
// #endregion

// #region Public
/** 建立前台 404 路徑，保留原始網址供畫面顯示 */
export const buildClientNotFoundPath = (request: Request): string =>
{
    const url = new URL(request.url);
    const lang = LibRouteLang.resolveRouteLangFromRequest(request);
    const notFoundPath = LibRouteLang.buildLangPathname("/404", lang);
    const from = encodeURIComponent(`${url.pathname}${url.search}`);

    return `${notFoundPath}?from=${from}`;
};

/** 前台資料不存在時導到 404 頁 */
export const redirectClientNotFound = (request: Request): never =>
{
    const redirectPath = buildClientNotFoundPath(request);

    throw redirect(redirectPath, CLIENT_NOT_FOUND_REDIRECT_STATUS);
};
// #endregion
