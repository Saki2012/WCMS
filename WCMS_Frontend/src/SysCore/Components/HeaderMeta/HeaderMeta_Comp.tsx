import React from "react";
import { Helmet } from "react-helmet-async";

// #region Property
export interface IHeaderMetaProps
{
    /** 當前頁面語系（用來寫 <html lang="...">），例如 zh-tw / en */
    htmlLang?: string;
    /** 每頁必要/建議 */
    title?: string;
    description?: string;
    canonicalUrl?: string;
    /** SEO 控制 */
    robots?: string; // 例："index,follow" / "noindex,nofollow"
    /** 多語系 alternate（hreflang） */
    alternates?: Array<{ hrefLang: string; href: string; }>;
    /** Social（可選） */
    siteName?: string; // og:site_name（站名）
    ogImage?: string; // 分享縮圖
}
// #endregion

// #region Public
export const HeaderMetaComp: React.FC<IHeaderMetaProps> = (props) =>
{
    const htmlLang = toHtmlLang(props.htmlLang);

    const ogTitle = props.title;
    const ogDesc = props.description;
    const ogUrl = props.canonicalUrl;

    return (
        <Helmet htmlAttributes={{ lang: htmlLang }}>
            {props.title && <title>{props.title}</title>}
            {props.description && <meta name="description" content={props.description} />}
            {props.canonicalUrl && <link rel="canonical" href={props.canonicalUrl} />}
            {props.robots && <meta name="robots" content={props.robots} />}
            {props.alternates?.map((a) => <link key={`${a.hrefLang}:${a.href}`} rel="alternate" hrefLang={a.hrefLang} href={a.href} />)}
            {/* Open Graph（精簡版） */}
            {props.siteName && <meta property="og:site_name" content={props.siteName} />}
            {ogTitle && <meta property="og:title" content={ogTitle} />}
            {ogDesc && <meta property="og:description" content={ogDesc} />}
            {ogUrl && <meta property="og:url" content={ogUrl} />}
            {props.ogImage && <meta property="og:image" content={props.ogImage} />}
            <meta property="og:type" content="website" />
            {/* Twitter（精簡版） */}
            <meta name="twitter:card" content={props.ogImage ? "summary_large_image" : "summary"} />
            {ogTitle && <meta name="twitter:title" content={ogTitle} />}
            {ogDesc && <meta name="twitter:description" content={ogDesc} />}
            {props.ogImage && <meta name="twitter:image" content={props.ogImage} />}
        </Helmet>
    );
};
// #endregion

// #region Private
const toHtmlLang = (x?: string) =>
{
    const v = (x ?? "").toLowerCase();
    return v === "zh-tw" ? "zh-TW" : v === "zh-cn" ? "zh-CN" : v === "en" ? "en" : v || "zh-TW";
};
// #endregion
