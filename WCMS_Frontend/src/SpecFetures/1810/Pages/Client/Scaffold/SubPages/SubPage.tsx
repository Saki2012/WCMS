import { buildMenuItems, getAncestorAtLevel, GetMenuData } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { ISubPageLoaderData } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage_Loader";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import SubBannerComp from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/SubBanner_Comp";
import { ThirdMenuComp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/ThirdMenu";
import BreadCrumbComp from "@/SysCore/Components/BreadCrumb/BreadCrumb_Comp";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { isSupportedLang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { getTodayRange } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import clsx from "clsx";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Outlet, useLoaderData, useLocation, useNavigate } from "react-router-dom";

// #region Property
type BannerSet = components["schemas"]["BannerSet_DTO"];

type BannerDetail = components["schemas"]["BannerDetail_DTO"];

type UrlMatchType = "exact" | "ancestor" | null;


interface ISubPagesProps
{
    style: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}


interface ISideMenuProps
{
    style: IFETheme;
    title: string;
    items: MenuItemData[];
    pathname: string;
    lang: Lang;
}
// #endregion

// #region Public
export const SubPageShell = (props: ISubPagesProps & { children: ReactNode; }) => <SubPageBase {...props} renderMain={() => props.children} />;
// #endregion

// #region Section
const SideMenuComp = (props: ISideMenuProps) =>
{
    // 宣告變數
    const { activeIds, expandedIdsByPath } = useMemo(() => calcActiveAndExpanded(props.items, props.pathname), [props.items, props.pathname]);
    const { expandedIds, toggleExpand } = useExpandedMenuState(props.items, props.pathname, expandedIdsByPath);

    const renderLeaf = (item: MenuItemData): ReactNode =>
    {
        const active = activeIds.has(item.Id);
        const target = item.URL_Open;

        if (isExternalUrl(item.Url))
        {
            return (
                <a
                    href={item.Url}
                    title={item.SrcData}
                    target={target}
                    rel={target === "_blank" ? "noopener noreferrer" : undefined}
                    className={clsx(active && "active", "flex-nowrap")}
                    aria-current={active ? "page" : undefined}
                >
                    {renderLinkIcon(item.Url)}
                    {item.SrcData}
                </a>
            );
        }

        return (
            <LangNavLink
                to={item.Url}
                title={item.SrcData}
                target={target}
                className={({ isActive }) => clsx((isActive || active) && "active")}
                aria-current={active ? "page" : undefined}
            >
                {item.SrcData}
            </LangNavLink>
        );
    };

    const renderItems = (items: MenuItemData[], depth: number = 1): ReactNode =>
    {
        return items.map((item, idx) =>
        {
            const hasSub = hasSubItems(item);
            const expanded = hasSub && expandedIds.has(item.Id);
            const active = activeIds.has(item.Id);
            const liClass = props.style.SideMenu.li(depth, idx === 0, hasSub, expanded || active);

            const handleToggle = (e: MouseEvent<HTMLAnchorElement>) =>
            {
                // 執行 function
                e.preventDefault();
                toggleExpand(item.Id);
            };

            return (
                <li key={`${item.Id}-${idx}`} className={liClass}>
                    {hasSub
                        ? (
                            <a href="#" onClick={handleToggle} aria-expanded={expanded} aria-current={active ? "page" : undefined}>
                                {item.SrcData}
                                <i className={clsx("fa", expanded ? "fa-angle-down" : "fa-angle-right", "arrow")} aria-hidden="true"></i>
                            </a>
                        )
                        : (renderLeaf(item))}

                    {hasSub && (
                        <ul
                            className={clsx(props.style.SideMenu.ul(depth + 1), expanded && "in")}
                            style={{ display: expanded ? "block" : "none" }}
                            aria-hidden={!expanded}
                        >
                            {renderItems(item.SubItem, depth + 1)}
                        </ul>
                    )}
                </li>
            );
        });
    };

    // return
    if (!props.items.length) return null;

    return (
        <div className="col-lg-2 col-md-12 col-sm-12 col-12">
            <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                <Accesskey type="L" lang={props.lang} />
                <h2>{props.title}</h2>
                <p></p>
                <nav className="Left-Second-navBox">
                    <ul className={props.style.SideMenu.ul(1)}>{renderItems(props.items)}</ul>
                </nav>
            </div>
        </div>
    );
};
// #endregion

// #region EntityComp
// 若為外部連結 新增icon
const renderLinkIcon = (url?: string | null) =>
{
    return isExternalUrl(url) ? <i className="fa fa-link me-2"></i> : null;
};


const buildMenuTreeKey = (items: MenuItemData[]): string =>
{
    // return
    return items.map(item => `${item.Id}[${buildMenuTreeKey(item.SubItem ?? [])}]`).join("|");
};
// #endregion

// #region Private
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
    const list = data?.bannerInitial?.apiRes?.Data;

    // return
    return Array.isArray(list) ? list : [];
};


const getValidBannerDetail = (list: BannerSet[]): BannerDetail | undefined =>
{
    // 宣告變數
    const banner = list[0];
    const details = banner?.BannerDetail ?? [];
    const { dayStart, dayEnd } = getTodayRange();

    // return
    return [...details].filter(detail =>
    {
        const start = detail.Validate_Start ? new Date(detail.Validate_Start).getTime() : -Infinity;
        const end = detail.Validate_End ? new Date(detail.Validate_End).getTime() : Infinity;
        return !!detail.PicSrcId && start <= dayEnd && end >= dayStart;
    }).sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0))[0];
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


const hasSubItems = (item: MenuItemData): boolean =>
{
    // return
    return !!item.SubItem?.length;
};


const isExternalUrl = (url?: string | null): boolean =>
{
    // return
    return !!url && (/^https?:\/\//i.test(url) || url.startsWith("//"));
};


const normalizePath = (path: string): string =>
{
    // 宣告變數
    const clean = (path ?? "/").split("?")[0].split("#")[0];

    // return
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};


const stripLangPrefixFromPath = (path: string): string =>
{
    // 宣告變數
    const p = normalizePath(path);
    const segs = p.split("/").filter(Boolean);
    const first = segs[0]?.toLowerCase();

    // return
    if (!first) return "/";
    if (!isSupportedLang(first)) return p;

    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};


const getUrlMatchType = (currentPath: string, itemUrl?: string): UrlMatchType =>
{
    // 宣告變數
    if (!itemUrl || isExternalUrl(itemUrl)) return null;

    const cur = stripLangPrefixFromPath(currentPath);
    const url = stripLangPrefixFromPath(itemUrl);

    // return
    if (cur === url) return "exact";
    if (url !== "/" && cur.startsWith(`${url}/`)) return "ancestor";
    return null;
};


const calcActiveAndExpanded = (items: MenuItemData[], pathname: string) =>
{
    // 宣告變數
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();

    const dfs = (item: MenuItemData): boolean =>
    {
        const matchType = getUrlMatchType(pathname, item.Url);
        const selfActive = matchType === "exact";
        let hasActiveInSubtree = !!matchType;

        item.SubItem?.forEach(child =>
        {
            if (dfs(child)) hasActiveInSubtree = true;
        });

        if (selfActive) activeIds.add(item.Id);
        if (hasSubItems(item) && hasActiveInSubtree) expandedIdsByPath.add(item.Id);

        return hasActiveInSubtree;
    };

    // 執行 function
    items.forEach(dfs);

    // return
    return { activeIds, expandedIdsByPath };
};


const removeExpandedIdsInNode = (item: MenuItemData, next: Set<string>): void =>
{
    // 執行 function
    if (!hasSubItems(item)) return;

    next.delete(item.Id);
    item.SubItem.forEach(child => removeExpandedIdsInNode(child, next));
};


const removeExpandedBranch = (items: MenuItemData[], branchId: string, next: Set<string>): boolean =>
{
    // 執行 function
    for (const item of items)
    {
        if (item.Id === branchId)
        {
            removeExpandedIdsInNode(item, next);
            return true;
        }

        if (hasSubItems(item) && removeExpandedBranch(item.SubItem, branchId, next)) return true;
    }

    // return
    return false;
};


const closeSiblingBranches = (items: MenuItemData[], targetId: string, next: Set<string>): boolean =>
{
    // 執行 function
    for (const item of items)
    {
        if (item.Id === targetId)
        {
            items.forEach(sibling =>
            {
                if (sibling.Id === targetId) return;
                removeExpandedBranch(items, sibling.Id, next);
            });
            return true;
        }

        if (hasSubItems(item) && closeSiblingBranches(item.SubItem, targetId, next)) return true;
    }

    // return
    return false;
};


const mergeExpandedIds = (prev: Set<string>, expandedIdsByPath: Set<string>): Set<string> =>
{
    // 宣告變數
    const next = new Set(prev);

    // 執行 function
    expandedIdsByPath.forEach(id => next.add(id));

    // return
    return next;
};


const closeOtherTopLevelBranches = (menuItems: MenuItemData[], expandedIdsByPath: Set<string>, next: Set<string>): void =>
{
    // 執行 function
    menuItems.forEach(item =>
    {
        if (!hasSubItems(item)) return;
        if (expandedIdsByPath.has(item.Id)) return;
        removeExpandedBranch(menuItems, item.Id, next);
    });
};


const useExpandedMenuState = (menuItems: MenuItemData[], pathname: string, expandedIdsByPath: Set<string>) =>
{
    // 宣告變數
    const menuTreeKey = useMemo(() => buildMenuTreeKey(menuItems), [menuItems]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(expandedIdsByPath));

    // 執行 function
    useEffect(() =>
    {
        setExpandedIds(new Set(expandedIdsByPath));
    }, [menuTreeKey]);

    useEffect(() =>
    {
        setExpandedIds(prev =>
        {
            const next = mergeExpandedIds(prev, expandedIdsByPath);
            closeOtherTopLevelBranches(menuItems, expandedIdsByPath, next);
            return next;
        });
    }, [pathname, menuItems, expandedIdsByPath]);

    const toggleExpand = (itemId: string): void =>
    {
        setExpandedIds(prev =>
        {
            const next = new Set(prev);
            const isOpen = next.has(itemId);

            if (isOpen)
            {
                removeExpandedBranch(menuItems, itemId, next);
                return next;
            }

            closeSiblingBranches(menuItems, itemId, next);
            next.add(itemId);
            return next;
        });
    };

    // return
    return { expandedIds, toggleExpand };
};


const SubPageBase = (props: ISubPagesProps & { renderMain: () => ReactNode; }) =>
{
    // 宣告變數
    const data = useLoaderData() as ISubPageLoaderData;
    const navigate = useNavigate();
    const location = useLocation();

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
    const gobackTitle = getBackTitle(props.lang);
    const bannerUrl = useMemo(() => getBannerUrl(data), [data]);

    const handleBack = (e: MouseEvent<HTMLAnchorElement>) =>
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
                        <i className="fa fa-reply" aria-hidden="true" style={{ fontSize: "112.5%", marginRight: "10px" }}></i>
                        {gobackTitle}
                    </div>
                </div>
            </a>
        </div>
    );

    // return
    return (
        <>
            {!!bannerUrl && <SubBannerComp title={title} srcImg={bannerUrl}></SubBannerComp>}

            <div className="ContentPlaceContent_Area">
                <section className="Template content area">
                    <div className="container-customize1 layout_padding3-bottom">
                        <div className="row">
                            <div className="col-md-12 w-100">
                                <nav className="custom_breadcrumb" aria-label="breadcrumb">
                                    <BreadCrumbComp items={breadCrumbData} style={props.style.BreadCrumb} isUl={false} externalDOM={back}></BreadCrumbComp>
                                </nav>
                            </div>

                            {!!sideMenuData?.length && (
                                <SideMenuComp style={props.style} title={title} items={sideMenuData} pathname={location.pathname} lang={props.lang} />
                            )}

                            <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
                                <section style={{ height: "0px" }}>
                                    <div className="container-customize1">
                                        <Accesskey type="C" lang={props.lang} />
                                    </div>
                                </section>
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
        </>
    );
};


const SubPage = (props: ISubPagesProps) => (
    <SubPageBase {...props} renderMain={() => <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />} />
);


export default SubPage;
// #endregion
