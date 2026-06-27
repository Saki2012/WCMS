import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { type BreadCrumbCompProps, BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { type Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { type MouseEvent, type ReactNode, useContext } from "react";
import "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb.css";

// #region Property
type CrumbPart = { key: string; label: string; to?: string; isActive: boolean; };
// #endregion

// #region Public
/** 1816 專用 Breadcrumb，保留 prototype DOM 並透過 Spec slot 覆寫 Feature 共用版。 */
export const BreadCrumb_Comp = (props: BreadCrumbCompProps) =>
{
    const isZh = props.lang === "zh-tw";
    const homepageTitle = isZh ? "首頁" : "Home";
    const gobackTitle = isZh ? "返回上一層" : "Back";
    const printTitle = isZh ? "友善列印" : "Print";
    const shareTitle = isZh ? "分享" : "Share";
    const ctx = useContext(BreadcrumbContext);
    const items = ctx?.items ?? [];
    const crumbParts = Build1816CrumbParts(props.lang, props.site, props.node, items);
    const handleGoBack = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        e.preventDefault();
        history.back();
    };

    return (
        <BreadCrumb1816Comp
            homepageTitle={homepageTitle}
            gobackTitle={gobackTitle}
            printTitle={printTitle}
            shareTitle={shareTitle}
            isZh={isZh}
            crumbParts={crumbParts}
            onGoBack={handleGoBack}
            toolbarRightSlot={props.toolbarRightSlot}
        />
    );
};
// #endregion

// #region Section
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
        toolbarRightSlot?: ReactNode;
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
                    {props.toolbarRightSlot}
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
// #endregion

// #region Private

/** 取得 menu path nodes（用 absIds 往下找） */
const GetMenuPathNodes = (lang: Lang, site: INormSite, node: INormNode): Array<{ id: string; title: string; to: string; }> =>
{
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
    return result;
};

/** 組合 menu crumbs + dynamic crumbs（最後一個為 active） */
const Build1816CrumbParts = (lang: Lang, site: INormSite, node: INormNode, dynamicItems: BreadcrumbItem[]): CrumbPart[] =>
{
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
    return raw.map((r, idx) => ({ ...r, isActive: idx === lastIdx }));
};
// #endregion
