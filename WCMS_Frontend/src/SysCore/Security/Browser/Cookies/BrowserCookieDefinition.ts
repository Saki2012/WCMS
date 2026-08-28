// #region Property
/** Browser 端 Cookie 的用途與生命週期描述；SameSite / Secure 由 Browser Cookie Security Policy 決定。 */
export interface BrowserCookieDefinition
{
    /** Cookie 名稱 */
    name: string;

    /** Cookie Path，未指定時由 Cookie Service 使用 /。 */
    path?: string;

    /** Cookie Domain；未指定時維持 Host-only。 */
    domain?: string;

    /** Cookie 存活秒數。 */
    maxAgeSeconds?: number;

    /** Cookie 到期時間。 */
    expires?: Date;
}
// #endregion
