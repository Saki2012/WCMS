import { buildMenuItems, getAncestorAtLevel, GetMenuData } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";
import type { ISubPageLoaderData } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage_Loader";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useLegacyMenuDOM } from "@/SpecFetures/1810/Pages/Client/Scaffold/MainFrame/Header";
import SubBannerComp from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/SubBanner_Comp";
import { ThirdMenuComp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/ThirdMenu";
import BreadCrumbComp from "@/SysCore/Components/BreadCrumb/BreadCrumb_Comp";
import MenuListComp from "@/SysCore/Components/MenuList/MenuList_Comp";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { type ReactNode, useMemo, useRef } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";

type BannerSet = components["schemas"]["BannerSet_DTO"];
type BannerDetail = components["schemas"]["BannerDetail_DTO"];

interface ISubPagesProps
{
    style: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}

const getHomeTitle = (lang: Lang): string =>
{
    if (lang === "en") return "Home";
    return "首頁";
};

const getBackTitle = (lang: Lang): string =>
{
    if (lang === "en") return "Return";
    return "返回上一層";
};

const getBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): ReactNode[] =>
{
    // 宣告變數
    const homepageTitle = getHomeTitle(lang);
    const result: ReactNode[] = [<LangLink to={`/${site.siteIndex}`} title={homepageTitle}>{homepageTitle}</LangLink>];
    let curNodes = site.treeByLang[lang];

    // 執行 function
    node.absIds?.forEach(id =>
    {
        const curNode = curNodes?.find((n: INormNode) => n.id === id);
        if (!curNode) return;

        if (curNode.id === node.id) result.push(<>{curNode.title}</>);
        else result.push(<LangLink to={curNode.redirectTo ?? ""} title={curNode.title}>{curNode.title}</LangLink>);

        curNodes = curNode.children ?? [];
    });

    // return
    return result;
};

const findNodeById = (nodes: INormNode[] | undefined, id: number): INormNode | undefined =>
{
    // 宣告變數
    if (!nodes?.length) return undefined;

    // 執行 function
    for (const n of nodes)
    {
        if (n.id === id) return n;

        const hit = findNodeById(n.children, id);
        if (hit) return hit;
    }

    // return
    return undefined;
};

const getBannerList = (data: ISubPageLoaderData): BannerSet[] =>
{
    // 宣告變數
    const list = data.bannerInitial?.apiRes?.Data;

    // return
    return Array.isArray(list) ? list : [];
};

const getValidBannerDetail = (list: BannerSet[]): BannerDetail | undefined =>
{
    // 宣告變數
    const banner = list[0];
    const now = Date.now();
    const details = banner?.BannerDetail ?? [];

    // return
    return [...details]
        .filter(detail =>
        {
            const start = detail.Validate_Start ? new Date(detail.Validate_Start).getTime() : -Infinity;
            const end = detail.Validate_End ? new Date(detail.Validate_End).getTime() : Infinity;
            return !!detail.PicSrcId && start <= now && now <= end;
        })
        .sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0))[0];
};

const getBannerUrl = (data: ISubPageLoaderData): string =>
{
    // 宣告變數
    const list = getBannerList(data);
    const detail = getValidBannerDetail(list);
    const picSrcId = detail?.PicSrcId ?? "";

    // return
    return picSrcId ? FileManagementAPI.get_Public_Preview_Url(picSrcId) : "";
};

const SubPageBase = (props: ISubPagesProps & { renderMain: () => React.ReactNode; }) =>
{
    // 宣告變數
    const data = useLoaderData() as ISubPageLoaderData;
    const localizedNode = useMemo(() =>
    {
        const roots = props.site.treeByLang?.[props.lang];
        return findNodeById(roots, props.node.id);
    }, [props.lang, props.site, props.node.id]);

    const title = localizedNode?.title ?? props.node.title;
    const breadCrumbData = getBreadCrumbData(props.lang, props.site, props.node);
    const SIDE_MAX_DEPTH = 3;
    const sideMenuData: MenuItemData[] = GetMenuData(props.lang, props.site, props.node, SIDE_MAX_DEPTH);
    const anchor = getAncestorAtLevel(props.lang, props.site, props.node, SIDE_MAX_DEPTH);
    const topMenuData: MenuItemData[] = buildMenuItems(anchor?.children ?? [], props.node.id);
    const navigate = useNavigate();
    const gobackTitle = getBackTitle(props.lang);
    const menuRef = useRef<HTMLUListElement>(null);

    const bannerUrl = useMemo(() => getBannerUrl(data), [data]);

    const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function
        e.preventDefault();
        navigate(-1);
    };

    const back: ReactNode = (
        <div className="pos-relative d-inline-block ml-auto">
            <a href="#" onClick={handleBack}>
                <div className="pos-relative d-inline-block">
                    <div className="return-box">
                        <i
                            className="fa fa-reply"
                            aria-hidden="true"
                            style={{ fontSize: "112.5%", marginRight: "10px" }}
                        >
                        </i>
                        {gobackTitle}
                    </div>
                </div>
            </a>
        </div>
    );

    // 執行 function
    useLegacyMenuDOM(menuRef);

    // return
    return (
        <>
            {!!bannerUrl && <SubBannerComp title={title} srcImg={bannerUrl}></SubBannerComp>}

            <section style={{ height: "0px" }}>
                <div className="container-customize1">
                    <a
                        id="content"
                        accessKey="C"
                        href="#content"
                        className="accesskey_main C"
                        title="中間內容區(C)"
                        tabIndex={0}
                    >
                        :::
                    </a>
                </div>
            </section>

            <div className="ContentPlaceContent_Area">
                <section className="Template content area">
                    <div className="container-customize1 layout_padding3-bottom">
                        <div className="row">
                            <div className="col-md-12 w-100">
                                <nav className="custom_breadcrumb" aria-label="breadcrumb">
                                    <BreadCrumbComp
                                        items={breadCrumbData}
                                        style={props.style.BreadCrumb}
                                        isUl={false}
                                        externalDOM={back}
                                    >
                                    </BreadCrumbComp>
                                </nav>
                            </div>

                            {!!sideMenuData?.length && (
                                <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                                    <div
                                        id="ContentPlaceContent_ContentSubMenu"
                                        className="col-sm-12 col-12 px-0 page-leftmenu"
                                    >
                                        <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">
                                            :::
                                        </a>
                                        <h2>{title}</h2>
                                        <p></p>
                                        <nav className="Left-Second-navBox" ref={menuRef}>
                                            <MenuListComp items={sideMenuData} Style={props.style.SideMenu}>
                                            </MenuListComp>
                                        </nav>
                                    </div>
                                </div>
                            )}

                            <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
                                <div className="col-sm-12 col-12 px-0 page-righttopmenu"></div>
                                <ThirdMenuComp item={topMenuData}></ThirdMenuComp>
                                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                                    <hr className="mt-1 mb-4" />
                                    {props.renderMain()}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <GoTopButton />
        </>
    );
};

const SubPage = (props: ISubPagesProps) => (
    <SubPageBase
        {...props}
        renderMain={() => <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />}
    />
);

export default SubPage;

export const SubPageShell = (props: ISubPagesProps & { children: React.ReactNode; }) => (
    <SubPageBase
        {...props}
        renderMain={() => props.children}
    />
);
