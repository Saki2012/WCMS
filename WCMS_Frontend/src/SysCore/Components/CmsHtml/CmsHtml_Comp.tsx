import type { ReactElement } from "react";
import type { CmsHtmlContentOptions } from "./CmsHtml_Types";
import { useCmsHtmlContent } from "./useCmsHtmlContent";

// #region Property
export interface ICmsHtmlCompProps extends CmsHtmlContentOptions
{
    html?: string | null;
}
// #endregion

// #region Public
/** CMS / TinyMCE HTML 唯一渲染入口，SSR 與 CSR 都會同步完成 HTML 正規化與 LangLink 轉換。 */
export const CmsHtml_Comp = (props: ICmsHtmlCompProps): ReactElement | null =>
{
    const content = useCmsHtmlContent(props.html, props);
    if (!content.node) return null;
    return <>{content.node}</>;
};
// #endregion
