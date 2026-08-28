import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";

// #region Property
/** Browser Client-issued Cookie 可使用的安全 Profile。 */
export type BrowserCookieSecurityProfile = "DefaultStrict" | "NavigationLax" | "ExplicitCrossSite";

/** Browser Cookie Policy 實際輸出結果。 */
export interface BrowserCookieSecurityPolicyResult
{
    sameSite: "Strict" | "Lax" | "None";
    requireSecure: boolean;
}
// #endregion

// #region Public
/**
 * 依 Cookie Name 解析 Browser Client-issued Cookie 的中央 Security Policy。
 * 未具名的 Cookie 一律採 DefaultStrict；Lax / None 必須是明確例外。
 */
export const resolveBrowserCookieSecurityPolicy = (cookieName: string): BrowserCookieSecurityPolicyResult =>
{
    const profile = resolveBrowserCookieSecurityProfile(cookieName);
    if (profile === "NavigationLax") return { sameSite: "Lax", requireSecure: false };
    if (profile === "ExplicitCrossSite") return { sameSite: "None", requireSecure: true };
    return { sameSite: "Strict", requireSecure: false };
};
// #endregion

// #region Private
/** 解析 Cookie 的語意化 Security Profile；Named Exception 僅能集中維護於此。 */
const resolveBrowserCookieSecurityProfile = (cookieName: string): BrowserCookieSecurityProfile =>
{
    if (cookieName === LANG_COOKIE_KEY) return "NavigationLax";
    return "DefaultStrict";
};
// #endregion
