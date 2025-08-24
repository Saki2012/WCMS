{/* // 最新消息 // */ }
import { Link } from 'react-router-dom';
import 'swiper/swiper-bundle.css';


const CategoryTabs = () => {
    return (
        <section className="Newsbox-section" style={{ backgroundImage: "url(/Legacy/Client/Images/bg/background-transparent-image_1920x600.png)" }}>
            <div className="Mask-DivBox layout_padding2 bg-white">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                {/* // 標題 start */}
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3><span className="title-tw">最新消息<span className="c-line"></span></span></h3>
                                        <span className="en-box">
                                            <span className="title-en">Latest News</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 以下為假資料 */}
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-xxl-2 col-xl-3 col-lg-3 col-md-12 col-sm-12 col-12 + px-4">
                                {/* // 頁籤 TAB start */}
                                <div className="tab_ulbox">
                                    <ul className="nav nav-tabs p-0 STYL0 + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                        <li className="nav-item">
                                            <a className="nav-link i1 active" data-bs-toggle="tab" href="#tab-1" tabIndex={6} title="最新公告" >最新公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i2" data-bs-toggle="tab" href="#tab-2" tabIndex={7} title="計畫徵件" >計畫徵件</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i3" data-bs-toggle="tab" href="#tab-3" tabIndex={8} title="法規公告" >法規公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i4" data-bs-toggle="tab" href="#tab-4" tabIndex={9} title="活動公告" >活動公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i5" data-bs-toggle="tab" href="#tab-5" tabIndex={10} title="獲獎公告" >獲獎公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i6" data-bs-toggle="tab" href="#tab-6" tabIndex={11} title="專題與媒體報導" >專題與媒體報導</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-xxl-10 col-xl-9 col-lg-9 col-md-12 col-sm-12 col-12 + px-4">
                                <div className="tab-content + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.3s">
                                    <div className="tab-pane fade show active" id="tab-1">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News1" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/All-announcement" className="Btn_s1" tabIndex={6} title="更多最新公告">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-2">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News2" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/Project-solicitation/National-Science-Accounting" className="Btn_s1" tabIndex={7} title="更多計畫徵件">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-3">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News3" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/Regulatory-Announcements" className="Btn_s1" tabIndex={8} title="更多法規公告">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-4">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News4" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/Intramural-activities/In-school-activities" className="Btn_s1" tabIndex={9} title="更多活動公告">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-5">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News5" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/Award-announcement" className="Btn_s1" tabIndex={10} title="更多獲獎公告">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-6">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    {/* <asp:Literal ID="Lit_News6" runat="server" /> */}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <Link to="/Allnews/Special-Topics-and-Media-Coverage" className="Btn_s1" tabIndex={11} title="更多專題與媒體報導">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 以上為假資料 */}
                </div>
            </div>
        </section>
    )
};

export default CategoryTabs;