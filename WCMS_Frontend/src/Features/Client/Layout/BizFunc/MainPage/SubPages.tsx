import { Outlet, Link } from 'react-router-dom'
import SubBannerComp from '../../Scaffold/Banner/SubBanner_Comp'
import BreadCrumbComp from '../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import MenuListComp from "../../../../../SysCore/Components/MenuList/MenuList_Comp"
import type { BreadCrumbData } from "../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data"
import type { MenuItemData } from "../../../../../SysCore/Components/MenuList/MenuList_Data"
import type { IFETheme } from '../../Theme/ITheme'
import type { ReactNode } from 'react'
import type { INormNode, INormSite } from '../../../Site-Routing'
import type { Lang } from '../../../../../SysCore/i18n/lang'
import { useNavigate } from "react-router-dom";


interface ISubPagesProps {
  Style: IFETheme;
  Lang: string | Lang
  site: INormSite;
  node: INormNode;
  backHref?: string;
}


const GetBreadCrumbData = (lang: string, site: INormSite, node: INormNode): BreadCrumbData[] => {
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

const GetMenuData = (lang: string, site: INormSite, node: INormNode): MenuItemData[] => {
  const roots = site.treeByLang?.[lang] ?? [];
  const rootNode = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
  if (!rootNode) return [];
  return buildMenuItems(rootNode.children ?? [], node.id);
};

//明天調整一下item的內容
export const buildMenuItems = (nodes: INormNode[] = [], activeId: number): MenuItemData[] => {
  return nodes
    .filter(n => n.isShowOnMenu !== false) // 過濾掉不顯示的
    .map(n => {
      const hasChildren = !!(n.children && n.children.length);
      const isInternal = !!n.redirectTo && n.redirectTo.startsWith("/");
      const isActivedId = n.id === activeId;
      const content: ReactNode = n.redirectTo
        ? (isInternal
          ? (<Link to={n.redirectTo} title={n.title} className={isActivedId ? "active" : ""} aria-current={isActivedId ? "page" : undefined} > {n.title} </Link>)
          : (<a href={n.redirectTo} title={n.title} rel="noopener" aria-current={isActivedId ? "page" : undefined} > {n.title} </a>)
        )
        : <a href={n.redirectTo} title={n.title} rel="noopener" aria-current={isActivedId ? "page" : undefined} > {n.title} </a>;
      const result: MenuItemData = {
        Id: String(n.id), SrcData: "", Type: n.redirectTo ? "url" : "module", Url: n.redirectTo ?? "", URL_Open: "1",
        DOMContent: content, SubItem: hasChildren ? buildMenuItems(n.children!, activeId) : []
      };
      return result;
    });
};

const SubContent = (props: ISubPagesProps) => {
  const title: string = props.node.title;
  const breadCrumbData: BreadCrumbData[] = GetBreadCrumbData(props.Lang, props.site, props.node);
  const menuData: MenuItemData[] = GetMenuData(props.Lang, props.site, props.node);
  const navigate = useNavigate(); // 🔑 先宣告
  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); navigate(-1); };
  const back: ReactNode = <div className="pos-relative d-inline-block ml-auto">
    <a href="#" onClick={handleBack}>
      <div className="pos-relative d-inline-block">
        <div className="return-box"><i className="fa fa-reply" aria-hidden="true" style={{ fontSize: "112.5%", marginRight: "10px" }}></i>返回上一層</div>
      </div>
    </a>
  </div>

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
                <nav className="custom_breadcrumb" aria-label="breadcrumb">
                  <BreadCrumbComp items={breadCrumbData} style={props.Style.BreadCrumb} isUl={false} externalDOM={back}></BreadCrumbComp>
                </nav>
              </div>
              {/* SideMenu區塊 */}
              <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                  <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">:::</a>
                  <h2>{title}</h2>
                  <p></p>
                  <nav className="Left-Second-navBox">
                    <MenuListComp items={menuData} Style={props.Style.SideMenu}></MenuListComp>
                  </nav>
                </div>
              </div>
              {/* 主內容區塊 */}
              <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
                <div className='col-sm-12 col-12 px-0 page-righttopmenu'></div>
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