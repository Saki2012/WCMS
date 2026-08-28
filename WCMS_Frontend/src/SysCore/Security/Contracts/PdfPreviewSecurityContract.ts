// #region Property
/** Public_Preview 對 Browser Native PDF Viewer 的具名相容性 Context。 */
export const PDF_NATIVE_PREVIEW_QUERY_KEY = "wcmsPreview";

export const PDF_NATIVE_PREVIEW_QUERY_VALUE = "native";

const PUBLIC_PREVIEW_URL_FRAGMENT = "/service/filemanagement/public_preview/";
// #endregion

// #region Public
/**
 * 只替 WCMS Public_Preview URL 加上 Native Preview Context。
 * 此參數只描述 Browser Rendering Context，不具 Authentication / Authorization 語意。
 */
export const withNativePdfPreviewContext = (url: string): string =>
{
    const source = `${url ?? ""}`.trim();
    if (!source || !isWcmsPublicPreviewUrl(source)) return source;

    const hashIndex = source.indexOf("#");
    const base = hashIndex >= 0 ? source.slice(0, hashIndex) : source;
    const hash = hashIndex >= 0 ? source.slice(hashIndex) : "";
    const queryKey = encodeURIComponent(PDF_NATIVE_PREVIEW_QUERY_KEY);
    const queryValue = encodeURIComponent(PDF_NATIVE_PREVIEW_QUERY_VALUE);
    const existingPattern = new RegExp(`([?&])${queryKey}=[^&#]*`, "i");

    if (existingPattern.test(base))
    {
        return `${base.replace(existingPattern, `$1${queryKey}=${queryValue}`)}${hash}`;
    }

    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}${queryKey}=${queryValue}${hash}`;
};

/** 判斷 Browser-facing Request 是否為具名 Native PDF Preview Context。 */
export const isNativePdfPreviewRequestUrl = (url: string): boolean =>
{
    const source = `${url ?? ""}`.trim();
    if (!source || !isWcmsPublicPreviewUrl(source)) return false;

    const queryIndex = source.indexOf("?");
    if (queryIndex < 0) return false;

    const hashIndex = source.indexOf("#", queryIndex);
    const query = source.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined);
    const params = new URLSearchParams(query);
    return params.get(PDF_NATIVE_PREVIEW_QUERY_KEY)?.trim().toLowerCase() === PDF_NATIVE_PREVIEW_QUERY_VALUE;
};
// #endregion

// #region Private
/** 判斷 URL 是否為 WCMS FileManagement Public_Preview。 */
const isWcmsPublicPreviewUrl = (url: string): boolean =>
{
    const path = url.split(/[?#]/, 1)[0].toLowerCase();
    return path.includes(PUBLIC_PREVIEW_URL_FRAGMENT);
};
// #endregion
