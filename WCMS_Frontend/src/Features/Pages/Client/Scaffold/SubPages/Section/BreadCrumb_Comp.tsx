import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { createContext, Fragment, useContext, type ReactNode } from "react";

/** 站台 menu breadcrumb（原本既有邏輯） */
const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): ReactNode[] => {
    const result: ReactNode[] = [];
    let curNodes = site.treeByLang[lang];

    node.absIds?.forEach((id) => {
        const curNode = curNodes?.find((n: INormNode) => n.id === id);

        if (curNode?.id === node.id) {
            result.push(<Fragment key={id}>{curNode.title}</Fragment>);
        } else {
            result.push(
                <LangNavLink key={id} to={curNode?.redirectTo ?? ""} title={curNode?.title} aria-label={curNode?.title}>
                    {curNode?.title}
                </LangNavLink>
            );
        }

        curNodes = curNode?.children ?? [];
    });

    return result;
};

// --- Breadcrumb Context（給頁面動態設定） ---
export type BreadcrumbItem = {
    label: string;
    to?: string;
};

type BreadcrumbContextValue = {
    items: BreadcrumbItem[];
    setItems: (items: BreadcrumbItem[]) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export const useBreadcrumb = () => {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
    return ctx;
};

// --- Component ---
export const BreadCrumb_Comp = (props: { lang: Lang; site: INormSite; node: INormNode; backHref?: string }) => {
    const homepageTitle = props.lang === "zh-tw" ? "首頁" : "Home Page";
    const gobackTitle = props.lang === "zh-tw" ? "返回上一層" : "Return";

    // ✅ 原本 menu breadcrumb
    const breadCrumbData: ReactNode[] = GetBreadCrumbData(props.lang, props.site, props.node);

    // ✅ 動態 crumbs（由 page setItems）
    const { items } = useBreadcrumb();

    // 返回上一層
    const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // 避免 # 跳動
        e.preventDefault();
        history.back();
    };

    return (
        <div className="col-md-12">
            <div className="breadcrumb__wrapper">
                <div className="L my-2">
                    <nav className="custom_breadcrumb" aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <LangNavLink to="/" tabIndex={0} aria-label={homepageTitle}>
                                    <i className="fas fa-home mx-2"></i>
                                    {homepageTitle}
                                    <span className="sr-only">{homepageTitle}</span>
                                </LangNavLink>
                            </li>

                            {/* ✅ menu crumbs */}
                            {breadCrumbData?.map((i, idx) => (
                                <li className="breadcrumb-item" key={`menu-${idx}`}>
                                    {i}
                                </li>
                            ))}

                            {/* ✅ dynamic crumbs（append） */}
                            {items?.map((c, idx) => (
                                <li className="breadcrumb-item" key={`dyn-${idx}`}>
                                    {c.to ? (
                                        <LangNavLink to={c.to} aria-label={c.label} title={c.label}>
                                            {c.label}
                                        </LangNavLink>
                                    ) : (
                                        <span>{c.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                <div className="R my-2">
                    <a href="#" onClick={handleGoBack} role="button" aria-label={gobackTitle} title={gobackTitle}>
                        <div className="return-box">
                            <i className="fas fa-reply mx-2"></i>
                            {gobackTitle}
                            <span className="sr-only">{gobackTitle}</span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};
