import { LibText } from "@/SysCore/Utils/Library/LibData";

// #region Property
/** 路由根目錄路徑 */
const ROOT_PATH = "/";
/** 路由 segment 分隔符號 */
const ROUTE_SEGMENT_SEPARATOR = "/";
/** 路由頭尾斜線比對規則 */
const EDGE_SLASH_PATTERN = /^\/+|\/+$/g;
/** 路由前導斜線比對規則 */
const LEADING_SLASH_PATTERN = /^\/+/g;
/** 路由結尾斜線比對規則 */
const TRAILING_SLASH_PATTERN = /\/+$/g;
/** 路由重複斜線比對規則 */
const REPEATED_SLASH_PATTERN = /\/{2,}/g;
/** 第一層路由 segment 比對規則 */
const LEADING_SEGMENT_PATTERN = /^\/[^/]+/;
// #endregion

// #region Public
/** 將 pathname 拆成已去空白與空值的 route segment 清單。 */
export const splitPathSegments = (pathname: string | null | undefined): string[] =>
{
    const text = LibText.safeTrim(pathname);
    const segments = LibText.splitTrimToArray(text, ROUTE_SEGMENT_SEPARATOR);
    return segments;
};
/** 取得 pathname 第一層 route segment。 */
export const getLeadingPathSegment = (pathname: string | null | undefined): string =>
{
    const segments = splitPathSegments(pathname);
    const segment = segments[0] ?? "";
    return segment;
};
/** 移除 pathname 第一層 route segment。 */
export const removeLeadingPathSegment = (pathname: string | null | undefined): string =>
{
    const text = normalizeLeadingSlash(pathname);
    const rest = text.replace(LEADING_SEGMENT_PATTERN, "");
    const path = normalizeEmptyRoutePath(rest);
    return path;
};
/** 移除 route path 頭尾斜線。 */
export const trimRouteSlash = (value: string | null | undefined): string =>
{
    const text = LibText.safeTrim(value);
    const path = text.replace(EDGE_SLASH_PATTERN, "");
    return path;
};
/** 正規化站內 route path。 */
export const normalizeInternalPath = (value: string | null | undefined): string =>
{
    const text = LibText.safeTrim(value);
    if (text.length === 0) return ROOT_PATH;

    const path = normalizeRepeatedSlash(normalizeLeadingSlash(text));
    return path;
};
/** 判斷 pathname 是否符合指定完整 route segment prefix。 */
export const isPathSegmentPrefix = (pathname: string | null | undefined, segment: string | null | undefined): boolean =>
{
    const path = normalizePrefixCompareText(pathname);
    const target = normalizePrefixCompareText(segment);
    if (target === ROOT_PATH) return path === ROOT_PATH;

    const isMatched = path === target || path.startsWith(`${target}${ROOT_PATH}`);
    return isMatched;
};
// #endregion

// #region Private
/** 正規化空路徑為根目錄路徑。 */
const normalizeEmptyRoutePath = (value: string | null | undefined): string =>
{
    const text = LibText.safeTrim(value);
    return text.length > 0 ? text : ROOT_PATH;
};
/** 確保路徑具備前導斜線。 */
const normalizeLeadingSlash = (value: string | null | undefined): string =>
{
    const text = LibText.safeTrim(value);
    if (text.length === 0) return ROOT_PATH;

    const path = `${ROOT_PATH}${text.replace(LEADING_SLASH_PATTERN, "")}`;
    return path;
};
/** 壓縮 route path 內連續重複斜線。 */
const normalizeRepeatedSlash = (value: string): string =>
{
    const path = value.replace(REPEATED_SLASH_PATTERN, ROOT_PATH);
    return path;
};
/** 建立 route prefix 比對用的小寫路徑。 */
const normalizePrefixCompareText = (value: string | null | undefined): string =>
{
    const path = normalizeInternalPath(value).toLowerCase();
    if (path === ROOT_PATH) return ROOT_PATH;

    const text = path.replace(TRAILING_SLASH_PATTERN, "");
    return text;
};
// #endregion
