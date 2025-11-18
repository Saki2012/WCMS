import type { INormNode, INormSite } from "@/Features/Pages/Client/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang"
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): ReactNode[] => {
    const result: ReactNode[] = [];
    var curNodes = site.treeByLang[lang]
    node.absIds?.forEach(id => {
        var curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (curNode?.id === node.id) { result.push(<>{curNode.title}</>) }
        else { result.push(<NavLink to={curNode?.redirectTo ?? ""} title={curNode?.title} aria-label={curNode?.title}>{curNode?.title}</NavLink>) }
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
                                    <NavLink to="/" tabIndex={0} aria-label={homepageTitle}>
                                        <i className="fas fa-home mx-2"></i>{homepageTitle}<span className="sr-only">{homepageTitle}</span>
                                    </NavLink>
                                </li>
                                {breadCrumbData && breadCrumbData.map((i) => {
                                    return (<>
                                        <li className="breadcrumb-item">
                                            {i}
                                        </li>
                                    </>)
                                })}
                            </ol>
                        </nav>
                    </div>

                    <div className="R my-2">
                        <a href="javascript:void(0)" onClick={() => { "history.back(); return false;" }} role="button" aria-label={gobackTitle} title={gobackTitle}>
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