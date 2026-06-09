import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { LibRouteLang, LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import React from "react";
import { Link, type LinkProps, NavLink, type NavLinkProps, type To } from "react-router-dom";

// #region Property
/** 多語系連結共用 Props */
interface LangLinkBaseProps
{
    /** 連結目標；內站路由、外站網址都由這裡傳入 */
    to: To;

    /** 強制指定語系；未指定時使用 LangContext 目前語系 */
    lang?: Lang;

    /** 不自動補語系前綴；適用於 /401、錨點、特殊固定路由 */
    noLangPrefix?: boolean;

    /** 連結開啟方式；未指定時內站預設 _self，外站與公開檔案預設 _blank */
    target?: React.HTMLAttributeAnchorTarget;

    /** 連結提示文字；不直接顯示，另開新視窗時會作為 title / aria-label 的基礎文案 */
    title?: string;
}

/** 多語系 Link Props */
export interface LangLinkProps extends Omit<LinkProps, keyof LangLinkBaseProps>, LangLinkBaseProps
{}

/** 多語系 NavLink Props */
export interface LangNavLinkProps extends Omit<NavLinkProps, keyof LangLinkBaseProps>, LangLinkBaseProps
{}

/** 多語系連結解析狀態參數 */
interface ResolvedLangLinkStateArgs
{
    /** 連結目標 */
    to: To;

    /** 強制指定語系 */
    lang?: Lang;

    /** 是否不自動補語系前綴 */
    noLangPrefix?: boolean;

    /** 連結開啟方式 */
    target?: React.HTMLAttributeAnchorTarget;

    /** 連結提示文字 */
    title?: string;

    /** aria-label 文字 */
    ariaLabel?: string;

    /** 連結子內容 */
    children?: React.ReactNode;

    /** rel 屬性 */
    rel?: string;
}

/** 多語系連結解析後狀態 */
interface ResolvedLangLinkState
{
    /** 是否為不安全 URL */
    isUnsafeUrl: boolean;

    /** 是否應使用原生 a */
    isNativeAnchor: boolean;

    /** 最終 target */
    finalTarget: React.HTMLAttributeAnchorTarget;

    /** 最終連結目標 */
    finalTo: To;

    /** 另開新視窗 AA 屬性 */
    a11yAttrs: BlankA11yAttrs;
}

/** 另開視窗 AA 文字設定 */
interface BlankA11yText
{
    /** 已存在提示判斷用後綴 */
    suffix: string;

    /** 文案格式化方法 */
    format: (text: string) => string;
}

/** 另開視窗 AA 屬性 */
interface BlankA11yAttrs
{
    /** title 文字 */
    title?: string;

    /** aria-label 文字 */
    "aria-label"?: string;

    /** rel 屬性 */
    rel?: string;
}

/** NavLink 非作用中狀態 */
interface NavInactiveState
{
    /** 是否為作用中路由 */
    isActive: boolean;

    /** 是否等待導頁 */
    isPending: boolean;

    /** 是否正在 transition */
    isTransitioning: boolean;
}

/** NavLink className callback */
type NavClassNameFn = (p: NavInactiveState) => string | undefined;

/** NavLink style callback */
type NavStyleFn = (p: NavInactiveState) => React.CSSProperties | undefined;

/** NavLink children callback */
type NavChildrenFn = (p: NavInactiveState) => React.ReactNode;

/** 原生 a 模擬 NavLink 時使用的非作用中狀態 */
const INACTIVE_NAV_STATE: NavInactiveState = { isActive: false, isPending: false, isTransitioning: false };

/** 另開新視窗 AA 文案對應表 */
const BLANK_A11Y_TEXT_MAP: Partial<Record<Lang, BlankA11yText>> = {
    "zh-tw": { suffix: "另開新視窗", format: text => `${text}（另開新視窗）` },
    "zh-cn": { suffix: "另开新窗口", format: text => `${text}（另开新窗口）` },
    "en": { suffix: "opens in new window", format: text => `${text} (opens in new window)` },
};

/** 預設連結名稱對應表 */
const DEFAULT_LINK_LABEL_MAP: Partial<Record<Lang, string>> = { "zh-tw": "連結", "zh-cn": "链接", "en": "link" };

/** 已存在的另開視窗提示文字 */
const BLANK_HINTS = ["另開新視窗", "另開視窗", "另开新窗口", "另开窗口", "opens in new window"];

/** 允許直接交給瀏覽器處理的原生協定 */
const SAFE_NATIVE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];
// #endregion

// #region Public
/** 多語系 Link，依目前語系自動補前台路徑前綴。 */
export const LangLink: React.FC<LangLinkProps> = (props) =>
{
    const { to, lang, noLangPrefix, target, title, rel, children, className, style, ...rest } = props;
    const ariaLabel = rest["aria-label"];
    const state = useResolvedLangLinkState({ to, lang, noLangPrefix, target, title, ariaLabel, children, rel });

    if (state.isUnsafeUrl)
    {
        return <span className={className} style={style} title={title} aria-label={ariaLabel}>{children}</span>;
    }

    if (state.isNativeAnchor)
    {
        return <a {...rest} href={getToText(to)} target={state.finalTarget} className={className} style={style} {...state.a11yAttrs}>{children}</a>;
    }

    return <Link {...rest} to={state.finalTo} target={state.finalTarget} className={className} style={style} {...state.a11yAttrs}>{children}</Link>;
};

/** 多語系 NavLink，依目前語系自動補前台路徑前綴。 */
export const LangNavLink: React.FC<LangNavLinkProps> = (props) =>
{
    const { to, lang, noLangPrefix, target, title, rel, children, className, style, ...rest } = props;
    const ariaLabel = rest["aria-label"];
    const renderChildren = React.useMemo(() => resolveNavChildren(children), [children]);
    const state = useResolvedLangLinkState({ to, lang, noLangPrefix, target, title, ariaLabel, children: renderChildren, rel });
    if (state.isUnsafeUrl)
    {
        return <span className={resolveNavClassName(className)} style={resolveNavStyle(style)} title={title} aria-label={ariaLabel}>{renderChildren}</span>;
    }
    if (state.isNativeAnchor)
    {
        return (
            <a {...rest} href={getToText(to)} target={state.finalTarget} className={resolveNavClassName(className)} style={resolveNavStyle(style)} {...state.a11yAttrs}>
                {renderChildren}
            </a>
        );
    }

    return <NavLink {...rest} to={state.finalTo} target={state.finalTarget} className={className} style={style} {...state.a11yAttrs}>{children}</NavLink>;
};
// #endregion

// #region Protected
/** 解析多語系連結共用狀態。 */
const useResolvedLangLinkState = (args: ResolvedLangLinkStateArgs): ResolvedLangLinkState =>
{
    const ctx = useLang();
    const activeLang = (args.lang ?? ctx.code ?? DefaultLang) as Lang;
    const isUnsafeUrl = React.useMemo(() => isUnsafeSchemeUrl(args.to), [args.to]);
    const isNativeAnchor = React.useMemo(() => shouldUseNativeAnchor(args.to), [args.to]);
    const finalTarget = React.useMemo(() => resolveTarget({ to: args.to, target: args.target }), [args.to, args.target]);
    const finalTo = React.useMemo(() => resolveFinalTo({ to: args.to, activeLang, noLangPrefix: args.noLangPrefix, isNativeAnchor }), [args.to, activeLang, args.noLangPrefix, isNativeAnchor]);
    const a11yAttrs = React.useMemo(() => buildA11yAttrs({ lang: activeLang, target: finalTarget, title: args.title, ariaLabel: args.ariaLabel, children: args.children, rel: args.rel }), [
        activeLang,
        finalTarget,
        args.title,
        args.ariaLabel,
        args.children,
        args.rel,
    ]);
    return { isUnsafeUrl, isNativeAnchor, finalTarget, finalTo, a11yAttrs };
};
// #endregion

// #region Private
/** 建立另開新視窗需要的 title / aria-label / rel。
 */
const buildA11yAttrs = (
    p: { lang: Lang; target?: React.HTMLAttributeAnchorTarget; title?: string; ariaLabel?: string; children?: React.ReactNode; rel?: string; },
): BlankA11yAttrs =>
{
    if (p.target !== "_blank") return { title: p.title, "aria-label": p.ariaLabel, rel: p.rel };

    const titleBase = getBaseLabel({ value: p.title ?? p.ariaLabel, children: p.children, lang: p.lang });
    const ariaBase = getBaseLabel({ value: p.ariaLabel ?? p.title, children: p.children, lang: p.lang });

    return { title: formatBlankLabel(titleBase, p.lang), "aria-label": formatBlankLabel(ariaBase, p.lang), rel: mergeBlankRel(p.rel) };
};

/** 取得實際 target；有手動指定就尊重指定值。
 */
const resolveTarget = (p: { to: To; target?: React.HTMLAttributeAnchorTarget; }): React.HTMLAttributeAnchorTarget =>
{
    if (p.target) return p.target;
    if (isExternalHttpUrl(p.to)) return "_blank";
    if (isPublicFileUrl(p.to)) return "_blank";
    return "_self";
};

/** 解析最終連結目標。 */
const resolveFinalTo = (args: { to: To; activeLang: Lang; noLangPrefix?: boolean; isNativeAnchor: boolean; }): To =>
{
    if (args.noLangPrefix || args.isNativeAnchor) return args.to;

    const finalTo = withLangTo(args.to, args.activeLang);
    return finalTo;
};

/** 判斷是否應改用原生 a，外站、Service、錨點與安全特殊協定不走 React Router Link。 */
const shouldUseNativeAnchor = (to: To): boolean =>
{
    return isExternalHttpUrl(to) || isSafeNativeSchemeUrl(to) || isHashOnlyUrl(to) || isServiceRouteUrl(to);
};

/** 取得語系對應的另開視窗文案。 */
const getBlankA11yText = (lang: Lang): BlankA11yText =>
{
    return BLANK_A11Y_TEXT_MAP[lang] ?? BLANK_A11Y_TEXT_MAP[DefaultLang] ?? BLANK_A11Y_TEXT_MAP["zh-tw"]!;
};

/** 取得預設連結名稱。 */
const getDefaultLinkLabel = (lang: Lang): string =>
{
    return DEFAULT_LINK_LABEL_MAP[lang] ?? DEFAULT_LINK_LABEL_MAP[DefaultLang] ?? "連結";
};

/** 正規化文字，避免 title / aria-label 出現多餘空白。 */
const normalizeText = (text?: string): string =>
{
    const value = LibText.safeTrim(text).replace(/\s+/g, " ");
    return value;
};

/** 判斷文字是否已經包含另開視窗提示，避免重複補字。 */
const hasBlankHint = (text?: string): boolean =>
{
    const value = normalizeText(text).toLowerCase();
    return BLANK_HINTS.some(x => value.includes(x.toLowerCase()));
};

/** 將另開視窗提示接到連結名稱後方。 */
const formatBlankLabel = (text: string, lang: Lang): string =>
{
    if (hasBlankHint(text)) return text;
    return getBlankA11yText(lang).format(text);
};

/** 從 React children 嘗試取出純文字。 */
const getTextFromChildren = (node: React.ReactNode): string =>
{
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(getTextFromChildren).join("");
    if (React.isValidElement<{ children?: React.ReactNode; }>(node)) return getTextFromChildren(node.props.children);

    return "";
};

/** 取得 title / aria-label 的基礎文字。 */
const getBaseLabel = (p: { value?: string; children?: React.ReactNode; lang: Lang; }): string =>
{
    return normalizeText(p.value) || normalizeText(getTextFromChildren(p.children)) || getDefaultLinkLabel(p.lang);
};

/** 合併 rel，target="_blank" 時需補 noopener noreferrer。 */
const mergeBlankRel = (rel?: string): string =>
{
    const values = normalizeText(rel).split(" ").filter(Boolean);
    const hasNoopener = values.some(x => x.toLowerCase() === "noopener");
    const hasNoreferrer = values.some(x => x.toLowerCase() === "noreferrer");

    if (!hasNoopener) values.push("noopener");
    if (!hasNoreferrer) values.push("noreferrer");

    return values.join(" ");
};

/** 取得 To 的字串網址。 */
const getToText = (to: To): string =>
{
    if (typeof to === "string") return to;
    return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
};

/** 取得網址協定。 */
const getUrlScheme = (to: To): string =>
{
    const match = normalizeText(getToText(to)).match(/^([a-z][a-z0-9+.-]*:)/i);
    return match?.[1]?.toLowerCase() ?? "";
};

/** 判斷是否為允許的瀏覽器原生協定網址。 */
const isSafeNativeSchemeUrl = (to: To): boolean =>
{
    const scheme = getUrlScheme(to);
    return scheme !== "" && SAFE_NATIVE_SCHEMES.includes(scheme);
};

/** 判斷是否為不允許的瀏覽器協定網址。 */
const isUnsafeSchemeUrl = (to: To): boolean =>
{
    const scheme = getUrlScheme(to);
    return scheme !== "" && !SAFE_NATIVE_SCHEMES.includes(scheme);
};

/** 判斷是否為頁內錨點。 */
const isHashOnlyUrl = (to: To): boolean =>
{
    return normalizeText(getToText(to)).startsWith("#");
};

/** 判斷是否為 http / https / protocol-relative 外站網址。 */
const isExternalHttpUrl = (to: To): boolean =>
{
    return /^(https?:)?\/\//i.test(normalizeText(getToText(to)));
};

/** 判斷是否為 Service Route。 */
const isServiceRouteUrl = (to: To): boolean =>
{
    const url = normalizeText(getToText(to));
    const isMatched = LibRoutePath.isPathSegmentPrefix(url, "/service");
    return isMatched;
};

/** 判斷是否為公開檔案預覽 / 下載網址。 */
const isPublicFileUrl = (to: To): boolean =>
{
    const url = normalizeText(getToText(to));
    const isDownloadUrl = LibRoutePath.isPathSegmentPrefix(url, "/service/filemanagement/public_download");
    const isPreviewUrl = LibRoutePath.isPathSegmentPrefix(url, "/service/filemanagement/public_preview");
    return isDownloadUrl || isPreviewUrl;
};

/** 將 To 物件套用語系路徑規則。 */
const withLangTo = (to: To, lang: Lang): To =>
{
    if (typeof to === "string") return LibRouteLang.buildLangPathname(to, lang);

    const pathname = to.pathname ?? "";
    if (!pathname) return to;

    return { ...to, pathname: LibRouteLang.buildLangPathname(pathname, lang) };
};

/** 將 NavLink 的 className callback 轉成外站 a 可用的 className。 */
const resolveNavClassName = (className: NavLinkProps["className"]): string | undefined =>
{
    if (typeof className === "function") return (className as NavClassNameFn)(INACTIVE_NAV_STATE);
    return className;
};

/** 將 NavLink 的 style callback 轉成外站 a 可用的 style。 */
const resolveNavStyle = (style: NavLinkProps["style"]): React.CSSProperties | undefined =>
{
    if (typeof style === "function") return (style as NavStyleFn)(INACTIVE_NAV_STATE);
    return style;
};

/** 將 NavLink 的 children callback 轉成外站 a 可用的 children。 */
const resolveNavChildren = (children: NavLinkProps["children"]): React.ReactNode =>
{
    if (typeof children === "function") return (children as NavChildrenFn)(INACTIVE_NAV_STATE);
    return children;
};
// #endregion
