import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { type BreadCrumbCompProps } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { BreadCrumbComp } from "@/SysCore/Components/BreadCrumb/BreadCrumb_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { type MouseEvent, type ReactNode } from "react";

// #region Public
/** 1810 子頁 Breadcrumb，透過 Spec slot 覆寫 Feature 共用版。 */
export const BreadCrumb_Comp = (props: BreadCrumbCompProps) =>
{
    // 宣告變數
    const breadCrumbData = getBreadCrumbData(props.lang, props.site, props.node);
    const backTitle = getBackTitle(props.lang);
    const rightSlot = <BreadCrumbRightSlot backTitle={backTitle} toolbarRightSlot={props.toolbarRightSlot} />;

    // return
    return (
        <div className="col-md-12 w-100">
            <nav className="custom_breadcrumb" aria-label="breadcrumb">
                <BreadCrumbComp items={breadCrumbData} style={Classic_FETheme.BreadCrumb} isUl={false} externalDOM={rightSlot} />
            </nav>
        </div>
    );
};
// #endregion

// #region Section
/** 1810 Breadcrumb 右側工具列，整合 Preview 工具與返回上一層。 */
const BreadCrumbRightSlot = (props: { backTitle: string; toolbarRightSlot?: ReactNode; }) =>
{
    /** 返回上一層。 */
    const handleBack = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function
        e.preventDefault();

        if (typeof window === "undefined")
        {
            return;
        }

        window.history.back();
    };

    // return
    return (
        <li className="ms-auto list-unstyled breadcrumb-action-item">
            <div className="pos-relative d-inline-flex align-items-center gap-3 ml-auto">
                {props.toolbarRightSlot}
                <a href="#" onClick={handleBack} role="button" aria-label={props.backTitle} title={props.backTitle}>
                    <div className="return-box">
                        <i className="fa fa-reply" aria-hidden="true" style={{ fontSize: "112.5%", marginRight: "10px" }}></i>
                        {props.backTitle}
                    </div>
                </a>
            </div>
        </li>
    );
};
// #endregion

// #region Private
/** 取得首頁文字。 */
const getHomeTitle = (lang: Lang): string =>
{
    // return
    return lang === "en" ? "Home" : "首頁";
};

/** 取得返回文字。 */
const getBackTitle = (lang: Lang): string =>
{
    // return
    return lang === "en" ? "Return" : "返回上一層";
};

/** 組合 1810 子頁 Breadcrumb 資料。 */
const getBreadCrumbData = (lang: Lang, site: BreadCrumbCompProps["site"], node: INormNode): ReactNode[] =>
{
    // 宣告變數
    const homepageTitle = getHomeTitle(lang);
    const result: ReactNode[] = [<LangLink key="home" to={`/${site.siteIndex}`} title={homepageTitle}>{homepageTitle}</LangLink>];
    let curNodes = site.treeByLang[lang];

    // 執行 function
    node.absIds?.forEach(id =>
    {
        const curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (!curNode) return;

        if (curNode.id === node.id)
        {
            result.push(<span key={id}>{curNode.title}</span>);
        } else
        {
            result.push(<LangLink key={id} to={curNode.redirectTo ?? ""} title={curNode.title}>{curNode.title}</LangLink>);
        }

        curNodes = curNode.children ?? [];
    });

    // return
    return result;
};
// #endregion
