import { Helmet } from "react-helmet";

interface IHeaderMetaProps {
  /* 每頁動態（必填/建議填） */
  title?: string;
  description?: string;
  canonicalUrl?: string;

  /* 可選動態 */
  keywords?: string;
  robots?: "index,follow" | "noindex,nofollow" | string;

  /* OG / Twitter */
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterUrl?: string;

  /* 多語系 alternate */
  alternates?: Array<{ hrefLang: string; href: string }>;
}

/* 站級固定常數（可依主/子站在 SSR 注入不同值） */
interface ISiteDefaults {
  siteName?: string;          // og:site_name
  themeColor?: string;        // <meta name="theme-color">
  applicationName?: string;   // <meta name="application-name">
  faviconHref?: string;       // <link rel="icon">
}

/* 由外層（App）決定本站常數；若不傳就不輸出 */
const siteDefaults: ISiteDefaults = {
  siteName: "WCMS",
  themeColor: "#0a4fff",
  applicationName: "WCMS",
  faviconHref: "/favicon.ico",
};

export const HeaderMetaComp: React.FC<IHeaderMetaProps> = (props) => (
  <Helmet>
    {/* 全站固定（寫死） */}
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    {siteDefaults.themeColor && (<meta name="theme-color" content={siteDefaults.themeColor} />)}
    {siteDefaults.applicationName && (<meta name="application-name" content={siteDefaults.applicationName} />)}
    {siteDefaults.faviconHref && (<link rel="icon" href={siteDefaults.faviconHref} />)}
    {siteDefaults.siteName && (<meta property="og:site_name" content={siteDefaults.siteName} />)}

    {/* 每頁動態 */}
    {props.title && <title>{props.title}</title>}
    {props.description && (<meta name="description" content={props.description} />)}
    {props.keywords && <meta name="keywords" content={props.keywords} />}
    {props.canonicalUrl && (<link rel="canonical" href={props.canonicalUrl} />)}
    {props.robots && <meta name="robots" content={props.robots} />}

    {/* 多語系 alternate */}
    {props.alternates?.map((a, i) => (<link key={i} rel="alternate" hrefLang={a.hrefLang} href={a.href} />))}

    {/* Open Graph */}
    {(props.ogTitle ?? props.title) && (<meta property="og:title" content={props.ogTitle ?? props.title!} />)}
    {(props.ogDescription ?? props.description) && (<meta property="og:description" content={props.ogDescription ?? props.description!} />)}
    {(props.ogUrl ?? props.canonicalUrl) && (<meta property="og:url" content={props.ogUrl ?? props.canonicalUrl!} />)}
    {props.ogImage && <meta property="og:image" content={props.ogImage} />}

    {/* Twitter */}
    {(props.twitterCard || props.ogImage) && (<meta name="twitter:card" content={props.twitterCard ?? "summary_large_image"} />)}
    {(props.twitterTitle ?? props.ogTitle ?? props.title) && (<meta name="twitter:title" content={props.twitterTitle ?? props.ogTitle ?? props.title!} />)}
    {(props.twitterDescription ?? props.ogDescription ?? props.description) && (<meta name="twitter:description" content={props.twitterDescription ?? props.ogDescription ?? props.description!} />)}
    {(props.twitterUrl ?? props.ogUrl ?? props.canonicalUrl) && (<meta name="twitter:url" content={props.twitterUrl ?? props.ogUrl ?? props.canonicalUrl!} />)}
    {props.twitterImage && (<meta name="twitter:image" content={props.twitterImage} />)}
  </Helmet>
);
