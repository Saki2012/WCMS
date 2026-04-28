import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { DefaultLang, isSupportedLang, type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";

const stripLeadingLang = (pathname: string) =>
{
    const parts = pathname.split("/").filter(Boolean);
    const seg1 = (parts[0] ?? "").toLowerCase();
    if (seg1 && isSupportedLang(seg1)) parts.shift();
    const rest = "/" + parts.join("/");
    return rest === "" ? "/" : rest;
};
const buildPathByLang = (lang: Lang, basePath: string) =>
{
    if (lang === DefaultLang) return basePath; // default：/xxx
    return basePath === "/" ? `/${lang}` : `/${lang}${basePath}`; // 非 default：/en/xxx
};
const isPathSegmentPrefix = (pathname: string, segment: string): boolean =>
{
    // 宣告變數
    const p = String(pathname || "").toLowerCase();
    const s = String(segment || "").toLowerCase();

    // 執行 function
    const ok = p === s || p.startsWith(`${s}/`);

    // return
    return ok;
};

export const SeoLinks = (props: { resolvedLang: Lang; pathname: string; }) =>
{
    if (isPathSegmentPrefix(props.pathname, "/Server") || isPathSegmentPrefix(props.pathname, "/Service")) return null; // 後台先不做語系
    const basePath = stripLeadingLang(props.pathname);
    // canonical：指向「當前語系版本」
    const canonicalUrl = buildPathByLang(props.resolvedLang, basePath);
    // alternates：第一筆放 x-default -> default 版本
    const alternates = [
        { hrefLang: "x-default", href: buildPathByLang(DefaultLang, basePath) },
        ...SUPPORTED_LANGS.map(l => ({ hrefLang: l, href: buildPathByLang(l, basePath) })),
    ];
    return <HeaderMetaComp htmlLang={props.resolvedLang} canonicalUrl={canonicalUrl} alternates={alternates} />;
};
