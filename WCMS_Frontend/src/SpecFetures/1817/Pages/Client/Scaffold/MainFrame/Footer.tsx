const Footer = () => {
    return (
        <footer className="Footer_section">
            <section className="footer-black Layout_Padding_5_top">

                <div className="container-customize2">
                    <span>
                        <a accessKey="B" href="#B" className="accesskey_footer B" title="下方內容區(B)" tabIndex={0} style={{ color: "var(--FFFcolor)" }}>:::</a>
                    </span>

                    <div className="widgets-box">
                        <div className="row">

                            <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
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
                                                    <li>總機 ：( 02 ) 2896-1000 #3054</li>
                                                    <li>傳真 ：( 02 ) 7750-7223</li>
                                                </ul>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
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
                                                <div className="social_box mb-1">
                                                    <a href="javascript:void(0);" target="_blank" title="Facebook_[ 另開視窗 ]" tabIndex={0}>
                                                        <i className="fab fa-facebook-square"></i>
                                                        <span className="sr-only">Facebook</span>
                                                    </a>
                                                    <a href="javascript:void(0);" target="_blank" title="Youtube_[ 另開視窗 ]" tabIndex={0}>
                                                        <i className="fab fa-youtube"></i>
                                                        <span className="sr-only">Youtube</span>
                                                    </a>
                                                    <a href="javascript:void(0);" target="_blank" title="Podcast_[ 另開視窗 ]" tabIndex={0}>
                                                        <i className="fas fa-podcast"></i>
                                                        <span className="sr-only">Podcast</span>
                                                    </a>
                                                </div>
                                                <ul className="list">
                                                    <li>地址 ：112301 臺北市北投區學園路1號</li>
                                                </ul>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="col-xxl-6 col-xl-6 col-lg-12 col-md-12 col-sm-12 col-12">
                                <div className="row">

                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-content + mt_customize">
                                                <ul className="list">
                                                    <li>
                                                        <p>Copyright © 2025. 國立臺北藝術大學傳統音樂學系 All rights reserved.</p>
                                                    </li>
                                                    <li>
                                                        <p id="viewCount">瀏覽人數　:　0000000000</p>
                                                        <p className="px-2">｜</p>
                                                        <p id="updateDate">更新日期　:　</p>

                                                    </li>
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

            <section className="copyright_section pt-3 pb-3">

                <div className="container-customize2">
                    <div className="copyright_wraper" style={{ padding: "0 3px" }}>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="dbox-tb">
                                    <p>為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器  ( 螢幕最佳瀏覽解析度為1920*1080 )</p>
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
export default Footer;