import { Outlet, Link } from 'react-router-dom'
import SubBannerComp from '@/Features/Pages/Client/Scaffold/Banner/SubBanner_Comp'
import BreadCrumbComp from '@/SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import MenuListComp from "@/SysCore/Components/MenuList/MenuList_Comp"
import type { BreadCrumbData } from "@/SysCore/Components/BreadCrumb/BreadCrumb_Data"
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data"
import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme'
import { useRef, type ReactNode } from 'react'
import type { INormNode, INormSite } from '@/Features/Pages//Client/Site-Routing'
import type { Lang } from '@/SysCore/i18n/lang'
import { useNavigate } from "react-router-dom";
import { useLegacyMenuDOM } from '@/Features/Pages/Client/Scaffold/Menu/MainMenu/MainMenu_Comp'
import { ThirdMenuComp } from '@/Features/Pages/Client/Scaffold/Menu/ThirdMenu'


interface ISubPagesProps { Style: IFETheme; Lang: Lang; site: INormSite; node: INormNode; backHref?: string; }


const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): BreadCrumbData[] => {
  const result: BreadCrumbData[] = [{ DOMContent: <Link to={`/${site.siteIndex}`} title='首頁'>首頁</Link> }];
  var curNodes = site.treeByLang[lang]
  node.absIds?.forEach(id => {
    var curNode = curNodes?.find((n: INormNode) => n.id === id);
    if (curNode?.id === node.id) {
      result.push({ DOMContent: <>{curNode.title}</> })
    }
    else {
      result.push({ DOMContent: <Link to={curNode?.redirectTo ?? ""} title={curNode?.title}>{curNode?.title}</Link> })
    }
    curNodes = curNode?.children ?? []
  });
  return result;
}

const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] => {
  const roots = site.treeByLang?.[lang] ?? [];
  const rootNode = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
  if (!rootNode) return [];
  return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};

//明天調整一下item的內容
export const buildMenuItems = (nodes: INormNode[] = [], activeId: number, currentDepth: number = 1, maxDepth: number = Infinity): MenuItemData[] => {
  return nodes
    .filter(n => n.isShowOnMenu !== false) // 過濾掉不顯示的
    .map(n => {
      const hasChildren = !!(n.children && n.children.length);
      const isInternal = !!n.type && n.type === 'module'
      const isActivedId = n.id === activeId;
      const domContent = hasChildren && currentDepth < maxDepth ? (<>{n.title}<i className="fa fa-angle-right arrow" aria-hidden="true"></i></>) : <>{n.title}</>
      const segments = (n.absSegments ?? []).filter(Boolean);
      const path = segments.length > 0 ? "/" + segments.map(s => encodeURIComponent(s.toLowerCase())).join("/") : ("#");
      const target = (() => {
        switch (n.windowTarget) {
          case 0: return "_self";
          case 1: return "_blank";
          // case 2: return "_parent";
          // case 3: return "_top";
          default: return "";
        }
      })();
      const content: ReactNode =
        (isInternal
          ? (<Link to={path} title={n.title} className={isActivedId ? "active" : ""} aria-current={isActivedId ? "page" : undefined} > {domContent} </Link>)
          : n.redirectTo?.startsWith("/") ?
            (<Link to={n.redirectTo} title={n.title} className={isActivedId ? "active" : ""} aria-current={isActivedId ? "page" : undefined} > {domContent} </Link>)
            : (<a href={path} title={n.title} rel="noopener" target={target} aria-current={isActivedId ? "page" : undefined} > {domContent} </a>)
        )

      const result: MenuItemData = {
        Id: String(n.id), SrcData: n.title, Type: path ? "url" : "module", Url: path ?? "", URL_Open: "1",
        DOMContent: content,
        SubItem: hasChildren && currentDepth < maxDepth ? buildMenuItems(n.children!, activeId, currentDepth + 1, maxDepth) : []
      };
      return result;
    });
};

// 取得「第 level 層」的節點（level=1 表示 root 的第一層子節點層級）
const getAncestorAtLevel = (lang: Lang, site: INormSite, node: INormNode, level: number): INormNode | undefined => {
  const roots = site.treeByLang?.[lang] ?? [];
  const root = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
  if (!root) return undefined;

  // 第一層從 root.children 開始算
  let depth = 1;
  let curNode: INormNode | undefined = root;
  let curChildren: INormNode[] = root.children ?? [];

  // absIds 依序是從上到下的節點 id（包含目前節點）
  for (const id of (node.absIds ?? []).slice(1)) {
    const next = curChildren.find(c => c.id === id);
    if (!next) break;
    if (depth === level) return next;      // 抵達指定層
    curNode = next;
    curChildren = next.children ?? [];
    depth++;
  }

  // 若實際深度不夠，回傳最接近的（最後找到的）節點
  return undefined;
};
const SubContent = (props: ISubPagesProps) => {
  const title: string = props.node.title;
  const breadCrumbData: BreadCrumbData[] = GetBreadCrumbData(props.Lang, props.site, props.node);
  const SIDE_MAX_DEPTH = 3;
  const sideMenuData: MenuItemData[] = GetMenuData(props.Lang, props.site, props.node, SIDE_MAX_DEPTH);
  const anchor = getAncestorAtLevel(props.Lang, props.site, props.node, SIDE_MAX_DEPTH);
  const topMenuData: MenuItemData[] = buildMenuItems(anchor?.children ?? [], props.node.id);

  const navigate = useNavigate(); // 🔑 先宣告
  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); navigate(-1); };
  const back: ReactNode = <div className="pos-relative d-inline-block ml-auto">
    <a href="#" onClick={handleBack}>
      <div className="pos-relative d-inline-block">
        <div className="return-box"><i className="fa fa-reply" aria-hidden="true" style={{ fontSize: "112.5%", marginRight: "10px" }}></i>返回上一層</div>
      </div>
    </a>
  </div>

  const menuRef = useRef<HTMLUListElement>(null);
  useLegacyMenuDOM(menuRef);

  return (
    <>
      <SubBannerComp title={title} srcImg={"/Legacy/Client/images/banner/subpage_banner_img_1920x550.jpg"}></SubBannerComp>
      <section style={{ height: "0px" }}>
        <div className="container-customize1">
          <a accessKey="C" href="#" className="accesskey_main C" title="中間內容區(C)" tabIndex={1}>:::</a>
        </div>
      </section>
      <div className="ContentPlaceContent_Area">
        <section className="Template content area">
          <div className="container-customize1 layout_padding3-bottom">
            <div className="row">
              {/* BreacCrumb區塊 */}
              <div className="col-md-12 w-100">
                <nav className="custom_breadcrumb" aria-label="breadcrumb" >
                  <BreadCrumbComp items={breadCrumbData} style={props.Style.BreadCrumb} isUl={false} externalDOM={back}></BreadCrumbComp>
                </nav>
              </div>
              {/* SideMenu區塊 */}
              <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                  <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">:::</a>
                  <h2>{title}</h2>
                  <p></p>
                  <nav className="Left-Second-navBox" ref={menuRef}>
                    <MenuListComp items={sideMenuData} Style={props.Style.SideMenu}></MenuListComp>
                  </nav>
                </div>
              </div>
              {/* 主內容區塊 */}
              <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
                <div className='col-sm-12 col-12 px-0 page-righttopmenu'></div>
                <ThirdMenuComp item={topMenuData}></ThirdMenuComp>
                <div id="ContentPlaceContent_ContentConentA" className='col-sm-12 col-12 px-0'>
                  <hr className="mt-1 mb-4"></hr>
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SubContent;