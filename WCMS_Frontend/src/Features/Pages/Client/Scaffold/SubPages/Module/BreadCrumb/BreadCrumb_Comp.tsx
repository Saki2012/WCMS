/** breadcrumb + return-box */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { createContext, Fragment, type MouseEvent, type ReactNode, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./BreadCrumb.css";

/** 取得目前網址的 module base（例：/Issues/Form/... -> /Issues；/en/Issues/... -> /Issues） */
const resolveModuleBaseFromPathname = (pathname: string): string =>
{
    // 宣告變數
    const segs = (pathname ?? "").split("/").filter(Boolean);
    const s0 = (segs[0] ?? "").toLowerCase();
    const hasLang = (SUPPORTED_LANGS as readonly string[]).includes(s0);
    const mod = hasLang ? segs[1] : segs[0];

    // return
    if (!mod) return "/";
    return `/${mod}`;
};

type GetBreadCrumbDataOptions = {
    /** 當頁有 dynamic crumbs 時，把 current node 也變成可點 */
    treatCurrentAsLink?: boolean;
    /** current node 沒 redirectTo 時，fallback 用 module base */
    currentNodeFallbackTo?: string;
};

/** 站台 menu breadcrumb（原本既有邏輯 + 支援 dynamic crumbs 時 current node 可點回 module） */
const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode, opts?: GetBreadCrumbDataOptions): ReactNode[] =>
{
    // 宣告變數
    const result: ReactNode[] = [];
    let curNodes = site.treeByLang[lang];
    const treatCurrentAsLink = opts?.treatCurrentAsLink ?? false;
    const currentNodeFallbackTo = opts?.currentNodeFallbackTo ?? "";

    // 執行 function
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

    // return
    return result;
};

export type BreadcrumbItem = { label: string; to?: string; };

type CrumbPart = { key: string; label: string; to?: string; isActive: boolean; };

/** 取得 menu path nodes（用 absIds 往下找） */
const GetMenuPathNodes = (lang: Lang, site: INormSite, node: INormNode): Array<{ id: string; title: string; to: string; }> =>
{
    // 宣告變數
    const result: Array<{ id: string; title: string; to: string; }> = [];
    let curNodes = site.treeByLang[lang];

    // 執行 function：依 absIds 往下找
    node.absIds?.forEach((id) =>
    {
        const curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (!curNode) return;

        result.push({ id: String(id), title: curNode.title ?? "", to: curNode.redirectTo ?? "" });
        curNodes = curNode.children ?? [];
    });

    // return
    return result;
};

/** 組合 menu crumbs + dynamic crumbs（最後一個為 active） */
const Build1816CrumbParts = (lang: Lang, site: INormSite, node: INormNode, dynamicItems: BreadcrumbItem[]): CrumbPart[] =>
{
    // 宣告變數
    const menuNodes = GetMenuPathNodes(lang, site, node);
    const raw: Array<{ key: string; label: string; to?: string; }> = [];

    // 執行 function：menu crumbs
    menuNodes.forEach((n) =>
    {
        const isLastMenu = String(n.id) === String(node.id);
        raw.push({ key: `m-${n.id}`, label: n.title, to: isLastMenu ? undefined : n.to });
    });

    // 執行 function：append dynamic crumbs
    (dynamicItems ?? []).forEach((d, idx) =>
    {
        raw.push({ key: `d-${idx}`, label: d.label, to: d.to });
    });

    const lastIdx = Math.max(0, raw.length - 1);

    // return
    return raw.map((r, idx) => ({ ...r, isActive: idx === lastIdx }));
};

// --- Breadcrumb Context（給頁面動態設定） ---
type BreadcrumbContextValue = { items: BreadcrumbItem[]; setItems: (items: BreadcrumbItem[]) => void; };

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export const useBreadcrumb = () =>
{
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
    return ctx;
};

/** 1816：prototype DOM（先內嵌在同檔，後續好搬移） */
const BreadCrumb1816Comp = (
    props: {
        homepageTitle: string;
        gobackTitle: string;
        printTitle: string;
        shareTitle: string;
        isZh: boolean;
        crumbParts: CrumbPart[];
        onGoBack: (e: MouseEvent<HTMLAnchorElement>) => void;
    },
) =>
{
    // return
    return (
        <div className="col-md-12">
            <div className="breadcrumb__wrapper mb-4">
                <div className="L mb-2">
                    <nav className="custom_breadcrumb" aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item ms-2">
                                <LangNavLink to="/" tabIndex={0} aria-label={props.homepageTitle}>
                                    <span className="icon-custom-school-B me-1"></span>
                                    {props.homepageTitle}
                                    <span className="sr-only">{props.homepageTitle}</span>
                                </LangNavLink>
                            </li>

                            {props.crumbParts.map((c) =>
                            {
                                if (!c.isActive)
                                {
                                    return (
                                        <li className="breadcrumb-item" key={c.key}>
                                            {c.to
                                                ? <LangNavLink to={c.to} aria-label={c.label} title={c.label}>{c.label}</LangNavLink>
                                                : <span>{c.label}</span>}
                                        </li>
                                    );
                                }

                                return (
                                    <li
                                        className="breadcrumb-item active"
                                        key={c.key}
                                        aria-current="page"
                                        aria-label={props.isZh ? `目前頁面：${c.label}` : `Current page: ${c.label}`}
                                    >
                                        <h2>{c.label}</h2>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </div>

                <div className="R d-flex flex-wrap mb-2 justify-content-between">
                    <div className="PrintingSite__wrapper mt-xl-0 mt-2">
                        <div className="Print-box"></div>
                    </div>

                    <div className="retrun-wrap ms-xl-3 ms-0 mt-xl-0 mt-2">
                        <a href="#" onClick={props.onGoBack} role="button" aria-label={props.gobackTitle} title={props.gobackTitle} className="mb-0 pb-0">
                            <div className="return-box">
                                <i className="fas fa-chevron-left me-2"></i>
                                {props.gobackTitle}
                                <span className="sr-only">{props.gobackTitle}</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 其他 spec：維持原本 DOM（先內嵌在同檔，後續好搬移） */
const BreadCrumbDefaultComp = (
    props: {
        homepageTitle: string;
        gobackTitle: string;
        breadCrumbData: ReactNode[];
        items: BreadcrumbItem[];
        onGoBack: (e: MouseEvent<HTMLAnchorElement>) => void;
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

                <div className="R my-2">
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

// --- Component ---
export const BreadCrumb_Comp = (props: { lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) =>
{
    // 宣告變數
    const is1816 = import.meta.env.VITE_SPEC_CODE === "1816";

    const isZh = props.lang === "zh-tw";
    const homepageTitle = isZh ? "首頁" : "Home";
    const gobackTitle = isZh ? "返回上一層" : "Back";
    const printTitle = isZh ? "友善列印" : "Print";
    const shareTitle = isZh ? "分享" : "Share";

    const location = useLocation();
    const moduleBase = useMemo(() => resolveModuleBaseFromPathname(location.pathname), [location.pathname]);

    // ✅ 動態 crumbs（由 page setItems）
    const { items } = useBreadcrumb();
    const treatCurrentAsLink = (items?.length ?? 0) > 0;

    // ✅ 原本 menu breadcrumb（修正：有 dynamic crumbs 時 current node 也可點）
    const breadCrumbData: ReactNode[] = GetBreadCrumbData(props.lang, props.site, props.node, { treatCurrentAsLink, currentNodeFallbackTo: moduleBase });

    // ✅ 1816 crumbs（menu + dynamic，最後一個 active）
    const crumbParts1816 = Build1816CrumbParts(props.lang, props.site, props.node, items);

    // 返回上一層
    const handleGoBack = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        // 避免 # 跳動
        e.preventDefault();
        history.back();
    };

    // ✅ 1816：prototype DOM
    if (is1816)
    {
        return (
            <BreadCrumb1816Comp
                homepageTitle={homepageTitle}
                gobackTitle={gobackTitle}
                printTitle={printTitle}
                shareTitle={shareTitle}
                isZh={isZh}
                crumbParts={crumbParts1816}
                onGoBack={handleGoBack}
            />
        );
    }

    // ✅ 其他 spec：維持原本 DOM
    return (
        <BreadCrumbDefaultComp homepageTitle={homepageTitle} gobackTitle={gobackTitle} breadCrumbData={breadCrumbData} items={items} onGoBack={handleGoBack} />
    );
};
