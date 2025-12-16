import { Outlet, Link } from 'react-router-dom'
import SubBannerComp from '@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/SubBanner_Comp'
import BreadCrumbComp from '@/SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import MenuListComp from "@/SysCore/Components/MenuList/MenuList_Comp"
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data"
import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme'
import { useMemo, useRef, type ReactNode } from 'react'
import { BannerFields, BannerDetailFields } from "@/types/SchemaFields";
import type { INormNode, INormSite } from '@/Features/Pages/Client/Route/Site-Routing'
import type { Lang } from '@/SysCore/i18n/lang'
import type { components } from "@/types/api";
import { useNavigate } from "react-router-dom";
import { ThirdMenuComp } from '@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/ThirdMenu'
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData'
import BannerSliderProvider from '@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api'
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient'
import { buildMenuItems, getAncestorAtLevel, GetMenuData } from '@/Features/Hooks/Common/BuildMenuItems'
import { GoTopButton } from '@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton'
import { useLegacyMenuDOM } from '@/SpecFetures/1810/Pages/Client/Scaffold/MainFrame/Header'
import { LangLink } from '@/SysCore/i18n/LangLink'

type BannerSet = components["schemas"]["BannerSet_DTO"];
const useBannerPic = (bannerId: string) => {
  const provider = BannerSliderProvider();
  return useFetchGridListData<BannerSet>({
    getModelDisplayName: () => provider.getModelDisplayName(),
    fetchList: (cond) => provider.fetchList(cond),
    fetchListCount: (cond) => provider.fetchListCount(cond),
    visibleKeys: [],
    buildQueryCondition: () => ({
      Fields: [
        BannerFields.BannerId, BannerFields.Interval, BannerFields.Speed, BannerFields.Height, BannerFields.Width,
        `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
        `${BannerFields._BannerDetail}.${BannerDetailFields.FontColor}`,
        `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
      ],
      Condition: `${BannerFields.BannerId} = ${bannerId}`,
      OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: false },],
      PageNumber: 0,
      PageSize: 0,
    }),
    enabled: !!bannerId.trim(),
    deps: [bannerId],
  });
}
const GetBreadCrumbData = (lang: Lang, site: INormSite, node: INormNode): ReactNode[] => {
  const result: ReactNode[] = [<LangLink to={`/${site.siteIndex}`} title='首頁'>首頁</LangLink>];
  var curNodes = site.treeByLang[lang]
  node.absIds?.forEach(id => {
    var curNode = curNodes?.find((n: INormNode) => n.id === id);
    if (curNode?.id === node.id) {
      result.push(<>{curNode.title}</>)
    }
    else {
      result.push(<LangLink to={curNode?.redirectTo ?? ""} title={curNode?.title}>{curNode?.title}</LangLink>)
    }
    curNodes = curNode?.children ?? []
  });
  return result;
}

interface ISubPagesProps { style: IFETheme; lang: Lang; site: INormSite; node: INormNode; backHref?: string; }
const SubPageBase = (props: ISubPagesProps & { renderMain: () => React.ReactNode }) => {
  const title: string = props.node.title;
  const breadCrumbData: ReactNode[] = GetBreadCrumbData(props.lang, props.site, props.node);
  const SIDE_MAX_DEPTH = 3;
  const sideMenuData: MenuItemData[] = GetMenuData(props.lang, props.site, props.node, SIDE_MAX_DEPTH);
  const anchor = getAncestorAtLevel(props.lang, props.site, props.node, SIDE_MAX_DEPTH);
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
  const banner = useBannerPic(props.node.bannerId ?? "");
  const bannerUrl = useMemo(() => {
    if (!props.node.bannerId) return "";
    const list = banner.rawData as BannerSet[] | undefined;
    const picId = list?.[0]?.BannerDetail?.[0]?.PicSrcId;
    return picId ? `${FileManagementAPI.PREVIEW_URL}/${picId}` : "";
  }, [banner.rawData, props.node.bannerId]);
  useLegacyMenuDOM(menuRef);
  return (
    <>
      {!!bannerUrl && <SubBannerComp title={title} srcImg={bannerUrl}></SubBannerComp>}
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
                  <BreadCrumbComp items={breadCrumbData} style={props.style.BreadCrumb} isUl={false} externalDOM={back}></BreadCrumbComp>
                </nav>
              </div>
              {/* SideMenu區塊 */}
              <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                  <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">:::</a>
                  <h2>{title}</h2>
                  <p></p>
                  <nav className="Left-Second-navBox" ref={menuRef}>
                    <MenuListComp items={sideMenuData} Style={props.style.SideMenu}></MenuListComp>
                  </nav>
                </div>
              </div>
              {/* 主內容區塊 */}
              <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
                <div className='col-sm-12 col-12 px-0 page-righttopmenu'></div>
                <ThirdMenuComp item={topMenuData}></ThirdMenuComp>
                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                  <hr className="mt-1 mb-4" />
                  {/* 🟢 主內容改成 renderMain()，由外界決定塞什麼 */}
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
// 🟢 2) 既有的路由外殼：用 Outlet（保持相容）
const SubPage = (props: ISubPagesProps) => (
  <SubPageBase {...props} renderMain={() => <Outlet />} />
);
export default SubPage;

export const SubPageShell = (props: ISubPagesProps & { children: React.ReactNode }) => (
  <SubPageBase {...props} renderMain={() => props.children} />
);


