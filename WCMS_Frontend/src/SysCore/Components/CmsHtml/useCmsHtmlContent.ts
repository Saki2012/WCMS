import { useMemo, type ReactNode } from "react";
import { parseCmsHtml } from "./CmsHtml_Parse";
import { transformCmsHtml } from "./CmsHtml_Transform";
import type { CmsHtmlContentOptions } from "./CmsHtml_Types";

export interface CmsHtmlContentResult
{
    html: string;
    node: ReactNode;
}

/** SSR-safe CMS HTML 轉換 Hook；只使用同步 useMemo，不依賴 useEffect。 */
export const useCmsHtmlContent = (html: string | null | undefined, options: CmsHtmlContentOptions): CmsHtmlContentResult =>
{
    const normalizedHtml = useMemo(() => transformCmsHtml(html, options), [html, options.lang, options.fileMetaMap]);
    const node = useMemo(() => parseCmsHtml(normalizedHtml, { lang: options.lang }), [normalizedHtml, options.lang]);

    return { html: normalizedHtml, node };
};
