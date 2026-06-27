/** breadcrumb + return-box */
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { createContext, Fragment, type MouseEvent, type ReactNode, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./BreadCrumb.css";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";

// #region Property
type GetBreadCrumbDataOptions = {
    /** 當頁有 dynamic crumbs 時，把 current node 也變成可點 */
    treatCurrentAsLink?: boolean;
    /** current node 沒 redirectTo 時，fallback 用 module base */
    currentNodeFallbackTo?: string;
};

export type BreadcrumbItem = { label: string; to?: string; };

// --- Breadcrumb Context（給頁面動態設定） ---
type BreadcrumbContextValue = { items: BreadcrumbItem[]; setItems: (items: BreadcrumbItem[]) => void; };
export interface BreadCrumbCompProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
    /** Breadcrumb 右側工具列插槽，供 Preview 或特殊頁面追加功能。 */
    toolbarRightSlot?: ReactNode;
}
// #endregion

// #region Public
export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export const useBreadcrumb = () =>
{
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
    return ctx;
};

// --- Component ---
export const BreadCrumb_Comp = (props: BreadCrumbCompProps) =>
{
    const isZh = props.lang === "zh-tw";
    const homepageTitle = isZh ? "首頁" : "Home";
    const gobackTitle = isZh ? "返回上一層" : "Back";
    const location = useLocation();
    const moduleBase = useMemo(() => resolveModuleBaseFromPathname(location.pathname), [location.pathname]);
    const { items } = useBreadcrumb();
    const treatCurrentAsLink = (items?.length ?? 0) > 0;
    const breadCrumbData: ReactNode[] = GetBreadCrumbData(props.lang, props.site, props.node, { treatCurrentAsLink, currentNodeFallbackTo: moduleBase });
    const handleGoBack = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        e.preventDefault();
        history.back();
    };

    return (
        <BreadCrumbDefaultComp
            homepageTitle={homepageTitle}
            gobackTitle={gobackTitle}
            breadCrumbData={breadCrumbData}
            items={items}
            onGoBack={handleGoBack}
            toolbarRightSlot={props.toolbarRightSlot}
        />
    );
};
// #endregion

// #region Section

/** 其他 spec：維持原本 DOM（先內嵌在同檔，後續好搬移） */
const BreadCrumbDefaultComp = (
    props: {
        homepageTitle: string;
        gobackTitle: string;
        breadCrumbData: ReactNode[];
        items: BreadcrumbItem[];
        onGoBack: (e: MouseEvent<HTMLAnchorElement>) => void;
        toolbarRightSlot?: ReactNode;
    },
) =>
{
    // return
    return (
        <div className="col-md-12">
            <div className="breadcrumb__wrapper">
                <div className="L my-2">
                    <nav className="custom_breadcrumb" aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <LangNavLink to="/" tabIndex={0} aria-label={props.homepageTitle}>
                                    <i className="fas fa-home mx-2"></i>
                                    {props.homepageTitle}
                                    <span className="sr-only">{props.homepageTitle}</span>
                                </LangNavLink>
                            </li>

                            {/* ✅ menu crumbs */}
                            {props.breadCrumbData?.map((i, idx) => <li className="breadcrumb-item" key={`menu-${idx}`}>{i}</li>)}

                            {/* ✅ dynamic crumbs（append） */}
                            {props.items?.map((c, idx) => (
                                <li className="breadcrumb-item" key={`dyn-${idx}`}>
                                    {c.to ? <LangNavLink to={c.to} aria-label={c.label} title={c.label}>{c.label}</LangNavLink> : <span>{c.label}</span>}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                <div className="R my-2 d-flex align-items-center gap-2">
                    {props.toolbarRightSlot}
                    <a href="#" onClick={props.onGoBack} role="button" aria-label={props.gobackTitle} title={props.gobackTitle}>
                        <div className="return-box">
                            <i className="fas fa-reply mx-2"></i>
                            {props.gobackTitle}
                            <span className="sr-only">{props.gobackTitle}</span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 取得目前網址的 module base（例：/Issues/Form/... -> /Issues；/en/Issues/... -> /Issues） */
const resolveModuleBaseFromPathname = (pathname: string): string =>
{
    const segs = LibRoutePath.splitPathSegments(pathname);
    const s0 = (segs[0] ?? "").toLowerCase();
    const hasLang = (SUPPORTED_LANGS as readonly string[]).includes(s0);
    const mod = hasLang ? segs[1] : segs[0];
    if (!mod) return "/";
    return `/${mod}`;
};

/** 站台 menu breadcrumb（原本既有邏輯 + 支援 dynamic crumbs 時 current node 可點回 module） */
const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode, opts?: GetBreadCrumbDataOptions): ReactNode[] =>
{
    const result: ReactNode[] = [];
    let curNodes = site.treeByLang[lang];
    const treatCurrentAsLink = opts?.treatCurrentAsLink ?? false;
    const currentNodeFallbackTo = opts?.currentNodeFallbackTo ?? "";
    node.absIds?.forEach((id) =>
    {
        const curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (!curNode) return;
        const isCurrent = curNode.id === node.id;
        // ✅ 原本：current node 一律純文字
        // ✅ 修正：如果有 dynamic crumbs，current node 改成可點（導回 module root / redirectTo）
        if (isCurrent)
        {
            const rawTo = (curNode.redirectTo ?? "").trim();
            const canUseRawTo = rawTo !== "" && rawTo !== "/";
            const finalTo = canUseRawTo ? rawTo : currentNodeFallbackTo;
            if (treatCurrentAsLink && finalTo)
            {
                result.push(<LangNavLink key={id} to={finalTo} title={curNode.title} aria-label={curNode.title}>{curNode.title}</LangNavLink>);
            } else
            {
                result.push(<Fragment key={id}>{curNode.title}</Fragment>);
            }
        } else
        {
            const to = (curNode.redirectTo ?? "").trim();
            if (to)
            {
                result.push(<LangNavLink key={id} to={to} title={curNode.title} aria-label={curNode.title}>{curNode.title}</LangNavLink>);
            } else
            {
                result.push(<Fragment key={id}>{curNode.title}</Fragment>);
            }
        }
        curNodes = curNode.children ?? [];
    });
    return result;
};

// #endregion
