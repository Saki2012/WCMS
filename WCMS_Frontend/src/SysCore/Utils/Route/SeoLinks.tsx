import { DefaultLang, isSupportedLang, SUPPORTED_LANGS, type Lang } from '@/SysCore/i18n/lang';
import { HeaderMetaComp } from '@/SysCore/Components/HeaderMeta/HeaderMeta_Comp';


const stripLeadingLang = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const seg1 = (parts[0] ?? "").toLowerCase();
  if (seg1 && isSupportedLang(seg1)) parts.shift();
  const rest = "/" + parts.join("/");
  return rest === "" ? "/" : rest;
};
const buildPathByLang = (lang: Lang, basePath: string) => {
  if (lang === DefaultLang) return basePath;              // default：/xxx
  return basePath === "/" ? `/${lang}` : `/${lang}${basePath}`; // 非 default：/en/xxx
};

export const SeoLinks = (props: { resolvedLang: Lang, pathname: string }) => {
  if (props.pathname.startsWith("/Server") || props.pathname.startsWith("/Service")) return null; // 後台先不做語系
  const basePath = stripLeadingLang(props.pathname);
  // canonical：指向「當前語系版本」
  const canonicalUrl = buildPathByLang(props.resolvedLang, basePath);
  // alternates：第一筆放 x-default -> default 版本
  const alternates = [
    { hrefLang: "x-default", href: buildPathByLang(DefaultLang, basePath) },
    ...SUPPORTED_LANGS.map(l => ({ hrefLang: l, href: buildPathByLang(l, basePath) })),];
  return <HeaderMetaComp htmlLang={props.resolvedLang} canonicalUrl={canonicalUrl} alternates={alternates} />;
};
