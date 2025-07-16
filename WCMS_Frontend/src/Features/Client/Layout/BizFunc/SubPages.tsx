import SubBannerComp from '../Scaffold/Banner/SubBanner_Comp'
import BreadCrumbComp from '../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import MenuListComp from "../../../../SysCore/Components/MenuList/MenuList_Comp"
import PageGridComp from '../../../../Features/Client/Page/PageGrid/PageGrid_Comp'
import PageContent from '../../../../Features/Client/Page/PageContent/PageContent_Comp'
import type{IBreadCrumbStyle} from "../../../../SysCore/Components/BreadCrumb/BreadCrumb_Clsx"
import type{BreadCrumbData} from "../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data"



import {Classic_BreadCrumb} from "../../../../Features/Client/Layout/Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx"
import { Link } from 'react-router'
import type { ReactNode } from 'react'

const SubContent = () => {

  const MockData:BreadCrumbData[]=[
    {
        SrcData: "",
        Url: "",
        DOMContent:<Link to="/" title="首頁">首頁</Link>
    },
    {
        SrcData: "",
        Url: "",
        DOMContent:<Link to="/AllNews" title="最新消息">最新消息</Link>
    },
    {
        SrcData: "",
        Url: "",
        DOMContent:<>最新公告</>
    },
  ]


  const back:ReactNode=<div className="pos-relative d-inline-block ml-auto">
                            <a href="javascript:void(0);" >
                                <div className="pos-relative d-inline-block">
                                    <div className="return-box"><i className="fa fa-reply" aria-hidden="true" style={{fontSize: "112.5%", marginRight: "10px"}}></i>返回上一層</div>
                                </div>
                            </a>
                        </div>
  

  const MockStyle:IBreadCrumbStyle=Classic_BreadCrumb

  return (
    <>
      <SubBannerComp title={"最新公告(param)"} srcImg={"/Legacy/Client/images/banner/subpage_banner_img_1920x550.jpg"}></SubBannerComp>

      <section style={{ height: "0px" }}>
          <div className="container-customize1">
            <a accessKey="C" href="#" className="accesskey_main C" title="中間內容區(C)" tabIndex={1}>:::</a>
        </div>
      </section>

      <section className="Template content area">
          <div className="container-customize1 layout_padding3-bottom">
              <div className="row">

                <div className="col-md-12 w-100">
                  <nav className="custom_breadcrumb" aria-label="breadcrumb">
                    <BreadCrumbComp items={MockData} style={MockStyle} isUl={false} externalDOM={back}></BreadCrumbComp>
                  </nav>
                </div>

                <div className="col-lg-2 col-md-12 col-sm-12 col-12">
                    <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">

                        <a accessKey="L" href="#" className="accesskey_left L" title="左方選單區(L)">:::</a>
                        <h2>最新公告</h2>
                        <p></p>
                        <nav className="Left-Second-navBox">
                            <ul id="Left-SecondMenu">
                                <li className="m-link"><a className="a-focus active" href="/FrontPointOfEntry.aspx?Sn=115" title="最新公告">最新公告</a></li>
                                <li className="m-link"> <a className="a-focus" href="/Front/Allnews/Project-solicitation/National-Science-Accounting/News.aspx?id=phLQr%2F7AFj8=" target="_self" title="計畫徵件">計畫徵件<i className="fa fa-angle-right arrow" aria-hidden="true"></i></a>
                                    <ul className="leftmenuBox collapse">
                                        <li><a className="" href="/FrontPointOfEntry.aspx?Sn=121" title="國科會計畫">國科會計畫</a></li>
                                        <li><a className="" href="/FrontPointOfEntry.aspx?Sn=120" title="校內計畫">校內計畫</a></li>
                                        <li><a className="" href="/FrontPointOfEntry.aspx?Sn=122" title="校外計畫">校外計畫</a></li>
                                    </ul>
                                </li>
                                <li className="m-link"><a className="a-focus" href="/FrontPointOfEntry.aspx?Sn=123" title="法規公告">法規公告</a></li>
                                <li className="m-link"> <a className="a-focus" href="/Front/Allnews/Intramural-activities/In-school-activities/News.aspx?id=eDkgsr5WXo4=" target="_self" title="活動公告">活動公告<i className="fa fa-angle-right arrow" aria-hidden="true"></i></a>
                                    <ul className="leftmenuBox collapse">
                                        <li><a className="" href="/FrontPointOfEntry.aspx?Sn=126" title="校內活動">校內活動</a></li>
                                        <li><a className="" href="/FrontPointOfEntry.aspx?Sn=125" title="校外活動">校外活動</a></li>
                                    </ul>
                                </li>
                                <li className="m-link"><a className="a-focus" href="/FrontPointOfEntry.aspx?Sn=113" title="獲獎公告">獲獎公告</a></li>
                                <li className="m-link"><a className="a-focus" href="/FrontPointOfEntry.aspx?Sn=114" title="專題與媒體報導">專題與媒體報導</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>

                    {/* <MenuListComp items={items} theme={Classic_BETheme.SidebarMenu}></MenuListComp> */}
                    <PageGridComp></PageGridComp>
                    {/* <PageContent></PageContent> */}
          </div>
        </div>
      </section>



    </>
  );
};

export default SubContent;