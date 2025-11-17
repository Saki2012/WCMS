import AAImg from "@/SpecFetures/1816/Assets/Client/images/footer/small_icon/accessibility_badge_2.1AA_88x31.svg"



export const Footer = () => {
    return (
        <footer className="Footer_section">
            <section className="footer-black Layout_Padding_5_top">
                <div className="container-customize2">
                    <span>
                        <a accessKey="B" href="#B" className="accesskey_footer B" title="下方內容區(B)" tabIndex={0} style={{ color: 'var(--FFFcolor)' }}>:::</a>
                    </span>
                    <div className="widgets-box">
                        <div className="row">

                            <div className="col-sm-6 col-12">
                                <div className="row">

                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">

                                            <div className="widget-title-content">
                                                <div className="TitleDivBox">
                                                    <span className="widget-title">聯絡資訊</span>
                                                    <span className="widget-V-line">｜</span>
                                                    <span className="widget-english">Contact Info</span>
                                                </div>
                                            </div>
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>總機 ：( 02 ) 2896-1000 #1836 or #1837</li>
                                                    <li>傳真 ：( 02 ) 7750-7223</li>
                                                    <li>信箱 ：<a href="mailto:master@library.tnua.edu.tw">master@library.tnua.edu.tw</a></li>
                                                    <li>地址 ：112301 臺北市北投區學園路1號</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-6 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">

                                            <div className="widget-title-content">
                                                <div className="TitleDivBox">
                                                    <span className="widget-title">資安資訊</span>
                                                    <span className="widget-V-line">｜</span>
                                                    <span className="widget-english">Security Info</span>
                                                </div>
                                            </div>
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        <a href="javascript:void(0);" target="_blank" title="使用規則_[ 另開視窗 ]" tabIndex={0}>使用規則</a>
                                                        <span className="mx-2">＆</span>
                                                        <a href="javascript:void(0);" target="_blank" title="服務條款_[ 另開視窗 ]" tabIndex={0}>服務條款</a>
                                                    </li>
                                                </ul>
                                                <div className="social_box">

                                                    <div className="Accessibility-Badge_box">
                                                        <a href="javascript:void(0);" target="_blank" title="無障礙網站_[ 另開視窗 ]" tabIndex={0}>
                                                            <img className="Accessibility-Badge" src={AAImg} alt="通過AA優先等級無障礙網頁檢測" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            <section className="visitor_section pt-3">

                <div className="container-customize2">
                    <div className="visitor_wraper" style={{ padding: '0 3px' }}>
                        <div className="row">

                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <div className="info_contact">
                                    <div className="dbox">
                                        <p>Copyright © 2025. 國立臺北藝術大學圖書館 All rights reserved.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <div className="info_contact">
                                    <div className="dbox">

                                        <p id="viewCount">瀏覽人數　:　0000000005</p>
                                        <p className="px-2">｜</p>
                                        <p id="updateDate">更新日期　:　2025/11/12</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="copyright_section pt-3 pb-3">
                <div className="container-customize2">
                    <div className="copyright_wraper" style={{ padding: '0 3px' }}>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="dbox-tb">
                                    <p>為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器 ( 螢幕最佳瀏覽解析度為1920*1080 )</p>
                                    <p className="px-2">｜</p>
                                    <p><a href="http://www.it-easygo.com/Main.aspx" title="國際暢行科技有限公司" target="_blank" tabIndex={0}>Design by it-easygo.</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </footer>
    )
}
