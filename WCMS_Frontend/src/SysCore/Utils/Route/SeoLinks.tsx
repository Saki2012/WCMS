import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { DefaultLang, type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";

// #region Public
/** 輸出目前頁面的 canonical 與 alternate SEO 語系連結。 */
export const SeoLinks = (props: { resolvedLang: Lang; pathname: string; }) =>
{
    if (LibRouteLang.isRouteLangBypassPathname(props.pathname)) return null;
    const basePath = LibRouteLang.stripLeadingRouteLang(props.pathname);
    const canonicalUrl = LibRouteLang.buildLangPathname(basePath, props.resolvedLang);
    const alternates = [
        { hrefLang: "x-default", href: LibRouteLang.buildLangPathname(basePath, DefaultLang) },
        ...SUPPORTED_LANGS.map(lang => ({ hrefLang: lang, href: LibRouteLang.buildLangPathname(basePath, lang) })),
    ];
    return <HeaderMetaComp htmlLang={props.resolvedLang} canonicalUrl={canonicalUrl} alternates={alternates} />;
};
// #endregion
