import type { FooterProps } from "@/Features/Pages/Client/Scaffold/MainFrame/Footer"

const Footer = (props: FooterProps) => {
    const t = (props.lang === "en"
        ? {
            contactTitle: "Contact Us",
            tel: "Tel",
            email: "E-mail",
            address: "Address",
            addressValue: "Room 521, College of Social Sciences and Management Building, No. 145, Xingda Rd., South Dist., Taichung City 40227, Taiwan",
            mapTitle: "Map: National Chung Hsing University",
            copyright: "Copyright © 2025. National Chung Hsing University — Transcontinental International Master Program. All rights reserved.",
            viewCount: "Views",
            updateDate: "Last updated",
            browserHint: "For a better and more stable browsing experience, please update your browser to Microsoft Edge / Google Chrome / Mozilla Firefox or any W3C-compatible browser (recommended screen resolution: 1920×1080).",
            designByTitle: "IT-EASYGO International Accessibility Technology Co., Ltd.",
            designBy: "Design by it-easygo.",
        }
        : {
            contactTitle: "聯絡我們",
            tel: "電話",
            email: "E-MAIL",
            address: "地址",
            addressValue: "40227 台中市南區興大路145號（社管大樓521室）",
            mapTitle: "地圖：國立中興大學",
            copyright: "Copyright © 2025. 國立中興大學 全球事務研究跨洲碩士學位學程 All rights reserved.",
            viewCount: "瀏覽人數",
            updateDate: "更新日期",
            browserHint: "為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器  ( 螢幕最佳瀏覽解析度為1920*1080 )",
            designByTitle: "國際暢行科技有限公司",
            designBy: "Design by it-easygo.",
        } as const)

    return (
        <footer className="Footer_section">
            <section className="footer-black Layout_Padding_5">
                <div className="container-customize3">
                    <div className="widgets-box">
                        <div className="row">
                            <div className="col-sm-6 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-title-content">
                                                <div className="TitleDivBox">
                                                    <span className="widget-title">{t.contactTitle}</span>
                                                </div>
                                            </div>
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>{t.tel}：+886-4-2284-0880#598</li>
                                                    <li>
                                                        {t.email}：
                                                        <a href="mailto:tmpgs@dragon.nchu.edu.tw">tmpgs@dragon.nchu.edu.tw</a>
                                                    </li>
                                                    <li>
                                                        {t.address}：{t.addressValue}
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
                                        <iframe title={t.mapTitle} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3641.3725318706947!2d120.675326!3d24.123552000000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693cfcecffe9d9%3A0xe28afadc0dad203a!2sNational%20Chung%20Hsing%20University!5e0!3m2!1sen!2stw!4v1760948502719!5m2!1sen!2stw"
                                            width="100%" height="150" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="visitor_section pt-3">
                <div className="container-customize3">
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
                                        <p id="viewCount">
                                            {t.viewCount}　:　0000000000
                                        </p>
                                        <p className="px-2">｜</p>
                                        <p id="updateDate">
                                            {t.updateDate}　:
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="copyright_section pt-1 pb-3">
                <div className="container-customize3">
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
