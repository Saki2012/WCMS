import AAImg from "@/SpecFetures/1816/Assets/Client/images/footer/small_icon/accessibility_badge_2.1AA_88x31.svg"
import type { FooterProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Footer"

const Footer = (props: FooterProps) => {
    const t = (props.lang === "en"
        ? {
            accessKeyTitle: "Footer content area (B)",
            contactTitle: "Contact",
            contactTitleEn: "Contact Info",
            tel: "Tel",
            fax: "Fax",
            email: "Email",
            address: "Address",
            addressValue: "No. 1, Xueyuan Rd., Beitou Dist., Taipei City 112301, Taiwan",
            securityTitle: "Security",
            securityTitleEn: "Security Info",
            rules: "Rules of Use",
            terms: "Terms of Service",
            openNewWindow: "Opens in a new window",
            securityHint: "Please review the rules and terms to protect your information security.",
            a11yTitle: "Accessibility statement (opens in a new window)",
            a11yAlt: "AA (WCAG 2.1) accessibility badge",
            copyright: "Copyright © 2025. National Taipei University of the Arts Library. All rights reserved.",
            viewCount: "Views",
            updateDate: "Last updated",
            browserHint:
                "For a better and more stable browsing experience, please update your browser to Microsoft Edge / Google Chrome / Mozilla Firefox or any W3C-compatible browser (recommended screen resolution: 1920×1080).",
            designByTitle: "IT-EASYGO International Accessibility Technology Co., Ltd.",
            designBy: "Design by it-easygo.",
        }
        : {
            accessKeyTitle: "下方內容區(B)",
            contactTitle: "聯絡資訊",
            contactTitleEn: "Contact Info",
            tel: "總機",
            fax: "傳真",
            email: "信箱",
            address: "地址",
            addressValue: "112301 臺北市北投區學園路1號",
            securityTitle: "資安資訊",
            securityTitleEn: "Security Info",
            rules: "使用規則",
            terms: "服務條款",
            openNewWindow: "另開視窗",
            securityHint: "為維護您的資訊安全，請詳閱使用規則與服務條款。",
            a11yTitle: "無障礙網站_[ 另開視窗 ]",
            a11yAlt: "通過AA優先等級無障礙網頁檢測",
            copyright: "Copyright © 2025. 國立臺北藝術大學圖書館 All rights reserved.",
            viewCount: "瀏覽人數",
            updateDate: "更新日期",
            browserHint:
                "為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器 ( 螢幕最佳瀏覽解析度為1920*1080 )",
            designByTitle: "國際暢行科技有限公司",
            designBy: "Design by it-easygo.",
        } as const)

    return (
        <footer className="Footer_section">
            <section className="footer-black Layout_Padding_5_top">
                <div className="container-customize2">
                    <span>
                        <a accessKey="B" href="#B" className="accesskey_footer B" title={`${t.accessKeyTitle}(B)`} tabIndex={0} style={{ color: "var(--FFFcolor)" }}>
                            :::
                        </a>
                    </span>
                    <div className="widgets-box">
                        <div className="row">
                            <div className="col-sm-6 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-title-content">
                                                <div className="TitleDivBox">
                                                    <span className="widget-title">{t.contactTitle}</span>
                                                    <span className="widget-V-line">｜</span>
                                                    <span className="widget-english">{t.contactTitleEn}</span>
                                                </div>
                                            </div>

                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        {t.tel} ：( 02 ) 2896-1000 #1836 or #1837
                                                    </li>
                                                    <li>
                                                        {t.fax} ：( 02 ) 7750-7223
                                                    </li>
                                                    <li>
                                                        {t.email} ：
                                                        <a href="mailto:master@library.tnua.edu.tw">master@library.tnua.edu.tw</a>
                                                    </li>
                                                    <li>
                                                        {t.address} ：{t.addressValue}
                                                    </li>
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
                                                    <span className="widget-title">{t.securityTitle}</span>
                                                    <span className="widget-V-line">｜</span>
                                                    <span className="widget-english">{t.securityTitleEn}</span>
                                                </div>
                                            </div>

                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        <a target="_blank" title={`${t.rules} (${t.openNewWindow})`} tabIndex={0}>
                                                            {t.rules}
                                                        </a>
                                                        <span className="mx-2">＆</span>
                                                        <a target="_blank" title={`${t.terms} (${t.openNewWindow})`} tabIndex={0}>
                                                            {t.terms}
                                                        </a>
                                                    </li>
                                                </ul>

                                                {/* ✅ 說明文案：中/英切換 */}
                                                <p style={{ margin: "0.5rem 0 0", color: "var(--FFFcolor)" }}>
                                                    {t.securityHint}
                                                </p>

                                                <div className="social_box">
                                                    <div className="Accessibility-Badge_box">
                                                        <a target="_blank" title={t.a11yTitle} tabIndex={0}>
                                                            <img className="Accessibility-Badge" src={AAImg} alt={t.a11yAlt} />
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
                    <div className="visitor_wraper" style={{ padding: "0 3px" }}>
                        <div className="row">
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <div className="info_contact">
                                    <div className="dbox">
                                        <p>{t.copyright}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <div className="info_contact">
                                    <div className="dbox">
                                        <p id="viewCount">{t.viewCount}　:　0000000005</p>
                                        <p className="px-2">｜</p>
                                        <p id="updateDate">{t.updateDate}　:　2025/11/12</p>
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
                                    <p>{t.browserHint}</p>
                                    <p className="px-2">｜</p>
                                    <p>
                                        <a href="http://www.it-easygo.com/Main.aspx" title={t.designByTitle} target="_blank" tabIndex={0}>
                                            {t.designBy}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </footer>
    )
}

export default Footer