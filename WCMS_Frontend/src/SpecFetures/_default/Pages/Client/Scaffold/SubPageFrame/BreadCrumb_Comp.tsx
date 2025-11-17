import type { Lang } from "@/SysCore/i18n/lang"
import { NavLink } from "react-router-dom";


export const BreadCrumb_Comp = (props: { lang: Lang; item: [] }) => {
    const homepageTitle = props.lang === "zh-tw" ? "首頁" : "Home Page"
    const gobackTitle = props.lang === "zh-tw" ? "返回上一層" : "Return"

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
                                {props.item.map((i: any) => {
                                    return (<>
                                        <li className="breadcrumb-item">
                                            <NavLink to={i.Url} aria-label={i.Title}>{i.Title}</NavLink>
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