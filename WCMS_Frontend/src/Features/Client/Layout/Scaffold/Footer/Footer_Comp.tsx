/*footer模塊*/
import SiteInfo from "../../../../../SysCore/Components/SiteInfo/SiteInfo_Comp"
import mock_SiteInfoData from '../../../../../SysCore/Components/SiteInfo/SiteInfo_Data'

export type NavItem = {
    Title: string;
    URL: string;
};


const Footer = () => {
    return (
        <footer className="footer_section">
            <div className="footer-black">
                {/* 從DB抓SiteFooter資料後直接渲染，本身會是HTML格式，故不用再次調整，另外有機會要來優化編輯器，或是就廢除設定功能了 */}
                <section className="contact_section layout_padding3-top">
                    <div className="container-customize1">
                        <div className="widgets-box">
                            <div className="row mx-0">
                                <div className="col-sm-3 col-12">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="footer-widget about-widget my-md-4 mb-3"><img alt="國立臺灣藝術大學_研究發展處 LOGO" src="/Legacy/Client/images/logo/logo_Footer_W_225x125.svg" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-5 col-12">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="footer-widget info-widget">
                                                <div className="widget-content w-100">
                                                    <div className="row">
                                                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 p-0">
                                                            <ul className="list">
                                                                <li><a href="/About/About-Intro" tabIndex={5} title="關於本處">關於本處</a></li>
                                                                <li><a href="/Division-Planning/Division-Planning-About" tabIndex={5} title="研究企劃組">研究企劃組</a></li>
                                                                <li><a href="/Division-Academic/Division-Academic-About" tabIndex={5} title="學術發展組">學術發展組</a></li>
                                                                <li><a href="https://iic.ntua.edu.tw/" rel="noopener noreferrer" tabIndex={5} target="_blank" title="產學暨育成中心(另開新視窗)">產學暨育成中心</a></li>
                                                                <li><a href="/USR/USR-About/USR-About-Org" tabIndex={5} title="永續發展暨社會責任實踐計畫推動中心">永續發展暨社會責任實踐計畫推動中心</a></li>
                                                            </ul>
                                                        </div>
                                                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 p-0">
                                                            <ul className="list">
                                                                <li><a href="/Allnews/All-announcement" tabIndex={5} title="最新消息">最新消息</a></li>
                                                                <li><a href="/Allnews/Project-solicitation/National-Science-Accounting" tabIndex={5} title="計畫徵件">計畫徵件</a></li>
                                                                <li><a href="/RelevantRegulations/DownloadsAll1" tabIndex={5} title="相關法規">相關法規</a></li>
                                                                <li><a href="/All-Downloads/DownloadsAllView" tabIndex={5} title="資料下載">資料下載</a></li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4 col-12">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="footer-widget info-widget mb-md-4 mb-3">
                                                <div className="widget-title-content">
                                                    <div className="TitleDivBox"><span className="widget-title">聯絡資訊</span></div>
                                                </div>
                                                <div className="widget-content">
                                                    <ul className="list">
                                                        <li>總機 ：( 02 ) 2272-2181</li>
                                                        <li>傳真 ：( 02 ) 2969-4830</li>
                                                        <li>Mail ：<a href="mailto:rd@ntua.edu.tw" title="Mail">rd@ntua.edu.tw</a></li>
                                                        <li>地址 ：22058 新北市板橋區大觀路一段59號</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </footer>
    );
}

export default Footer;