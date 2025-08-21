import { Outlet, Link } from 'react-router-dom'
import SubBannerComp from '../../Scaffold/Banner/SubBanner_Comp'
import BreadCrumbComp from '../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import MenuListComp from "../../../../../SysCore/Components/MenuList/MenuList_Comp"
import type { BreadCrumbData } from "../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data"
import type { MenuItemData } from "../../../../../SysCore/Components/MenuList/MenuList_Data"
import type { IFETheme } from '../../Theme/ITheme'
import type { ReactNode } from 'react'


interface ISubPagesProps {
  Style: IFETheme;
  Title: string;
  BannerId?: string;
  BreadCrumbs?: BreadCrumbData[];
  Menu?: MenuItemData[];
  backHref?: string;
}



const SubContent = (props: ISubPagesProps) => {
  //#region  FakeData
  const breadCrumbData: BreadCrumbData[] = [
    {
      SrcData: "",
      Url: "",
      DOMContent: <Link to="/" title="首頁">首頁</Link>
    },
    {
      SrcData: "",
      Url: "",
      DOMContent: <Link to="/AllNews" title="最新消息">最新消息</Link>
    },
    {
      SrcData: "",
      Url: "",
      DOMContent: <>最新公告</>
    },
  ]
  const menuData: MenuItemData[] = [
    {
      Id: "115", SrcData: "", Type: "url", Url: "/FrontPointOfEntry.aspx?Sn=115", URL_Open: "1", SubItem: [],
      DOMContent: (<Link className="a-focus active" to="/Allnews" title="最新公告">最新公告</Link>),
    },
    {
      Id: "計畫徵件", SrcData: "", Type: "url", Url: "/Front/Allnews/Project-solicitation/National-Science-Accounting/News.aspx?id=phLQr%2F7AFj8=", URL_Open: "1",
      SubItem: [
        {
          Id: "121", SrcData: "", Type: "url", Url: "/FrontPointOfEntry.aspx?Sn=121", URL_Open: "1", SubItem: [],
          DOMContent: (<a className="" href="/FrontPointOfEntry.aspx?Sn=121" title="國科會計畫">國科會計畫</a>),
        },
        {
          Id: "120", SrcData: "", Type: "url", Url: "/FrontPointOfEntry.aspx?Sn=120", URL_Open: "1", SubItem: [],
          DOMContent: (<a className="" href="/FrontPointOfEntry.aspx?Sn=120" title="校內計畫">校內計畫</a>),
        },
        {
          Id: "122", SrcData: "", Type: "url", Url: "/FrontPointOfEntry.aspx?Sn=122", URL_Open: "1", SubItem: [],
          DOMContent: (<a className="" href="/FrontPointOfEntry.aspx?Sn=122" title="校外計畫">校外計畫</a>),
        },
      ],
      DOMContent: (<Link className="a-focus" to="List" target="_self" title="計畫徵件">計畫徵件<i className="fa fa-angle-right arrow" aria-hidden="true"></i></Link>),
    },
    {
      Id: "123", SrcData: "", Type: "url", Url: "/FrontPointOfEntry.aspx?Sn=123", URL_Open: "1", SubItem: [],
      DOMContent: (<a className="a-focus" href="/FrontPointOfEntry.aspx?Sn=123" title="法規公告">法規公告</a>),
    },
  ];
  const back: ReactNode = <div className="pos-relative d-inline-block ml-auto">
    <a href="javascript:void(0);" >
      <div className="pos-relative d-inline-block">
        <div className="return-box"><i className="fa fa-reply" aria-hidden="true" style={{ fontSize: "112.5%", marginRight: "10px" }}></i>返回上一層</div>
      </div>
    </a>
  </div>
  //#endregion

  return (
    <>
      <SubBannerComp title={props.Title} srcImg={"/Legacy/Client/images/banner/subpage_banner_img_1920x550.jpg"}></SubBannerComp>
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
                  <BreadCrumbComp items={props.BreadCrumbs ?? []} style={props.Style.BreadCrumb} isUl={false} externalDOM={back}></BreadCrumbComp>
                </nav>
              </div>
              {/* SideMenu區塊 */}
              <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                  <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">:::</a>
                  <h2>{props.Title}</h2>
                  <p></p>
                  <nav className="Left-Second-navBox">
                    <MenuListComp items={props.Menu ?? []} Style={props.Style.SideMenu}></MenuListComp>
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