import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang"
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { Fragment, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): ReactNode[] => {
    const result: ReactNode[] = [];
    var curNodes = site.treeByLang[lang]
    node.absIds?.forEach(id => {
        var curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (curNode?.id === node.id) { result.push(<Fragment key={id}>{curNode.title}</Fragment>) }
        else { result.push(<LangNavLink key={id} to={curNode?.redirectTo ?? ""} title={curNode?.title} aria-label={curNode?.title}>{curNode?.title}</LangNavLink>) }
        curNodes = curNode?.children ?? []
    });
    return result;
}

export const BreadCrumb_Comp = (props: { lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) => {
    const homepageTitle = props.lang === "zh-tw" ? "首頁" : "Home Page"
    const gobackTitle = props.lang === "zh-tw" ? "返回上一層" : "Return"
    const breadCrumbData: ReactNode[] = GetBreadCrumbData(props.lang, props.site, props.node);
    return (
        <>
            <div className="col-md-12">
                <div className="breadcrumb__wrapper">
                    <div className="L my-2">
                        <nav className="custom_breadcrumb" aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <LangNavLink to="/" tabIndex={0} aria-label={homepageTitle}>
                                        <i className="fas fa-home mx-2"></i>{homepageTitle}<span className="sr-only">{homepageTitle}</span>
                                    </LangNavLink>
                                </li>
                                {breadCrumbData && breadCrumbData.map((i, idx) => {
                                    return (
                                        <Fragment key={idx}>
                                            <li className="breadcrumb-item">
                                                {i}
                                            </li>
                                        </Fragment>
                                    )
                                })}
                            </ol>
                        </nav>
                    </div>

                    <div className="R my-2">
                        <a onClick={() => { "history.back(); return false;" }} role="button" aria-label={gobackTitle} title={gobackTitle}>
                            <div className="return-box">
                                <i className="fas fa-reply mx-2"></i>{gobackTitle}
                                <span className="sr-only">{gobackTitle}</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}