import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import type { BrowserCookieDefinition } from "./BrowserCookieDefinition";

// #region Property
/** 語系 Cookie 保存秒數，目前設定為一年。 */
const LANG_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
// #endregion

// #region Public
/** Route Language Preference Cookie 定義。 */
export const RouteLanguageCookieDefinition: BrowserCookieDefinition = {
    name: LANG_COOKIE_KEY,
    path: "/",
    maxAgeSeconds: LANG_COOKIE_MAX_AGE_SECONDS,
};
// #endregion
