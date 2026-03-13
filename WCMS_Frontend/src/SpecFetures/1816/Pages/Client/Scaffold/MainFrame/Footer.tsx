import { useEffect } from "react"
import type { FooterProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Footer"
import AAPic from "@/SpecFetures/1816/Assets/Client/images/footer/small_icon/accessibility_badge_2.1AA_88x31.svg"
import LogoPic from "@/SpecFetures/1816/Assets/Client/images/logo/LOGO_266x41_W.svg"
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";

// ✅ 文案集中：避免散落在 JSX，方便後續維護
const getFooterText = (lang?: FooterProps["lang"]) => {
    // 宣告變數
    const isEn = lang === "en"

    // 執行 function
    const t = isEn
        ? {
            accessKeyTitle: "Footer content area (B)",
            contactTitle: "Contact",
            contactTitleEn: "Contact Info",
            tel: "Tel",
            fax: "Fax",
            email: "Email",
            address: "Address",
            addressValue: "No. 1, Xueyuan Rd., Beitou Dist., Taipei City 112301, Taiwan",
            a11yTitle: "Accessibility (opens in a new window)",
            a11yAlt: "WCAG 2.1 AA accessibility badge",
            a11yHint: "This website meets WCAG 2.1 AA.",
            viewCountTitle: "Views",
            updateDateTitle: "Last updated",
            copyright:
                "Copyright © 2025. National Taipei University of the Arts Library. All rights reserved.",
            browserHint:
                "For a better and more stable browsing experience, please update your browser to Microsoft Edge / Google Chrome / Mozilla Firefox or any W3C-compatible browser (recommended screen resolution: 1920×1080).",
            designByTitle: "IT-EASYGO International Accessibility Technology Co., Ltd.",
            designBy: "Design by it-easygo.",
            // SSR 初始顯示（CSR 會自動覆蓋）
            initialViewCount: "0000000000",
            initialUpdateDate: "2026/01/02",
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
            a11yTitle: "無障礙網站_[ 另開視窗 ]",
            a11yAlt: "通過AA優先等級無障礙網頁檢測",
            a11yHint: "本網站通過 AA 無障礙標準",
            viewCountTitle: "瀏覽人數",
            updateDateTitle: "更新日期",
            copyright: "Copyright © 2025. 國立臺北藝術大學圖書館 All rights reserved.",
            browserHint:
                "為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器  ( 螢幕最佳瀏覽解析度為1920*1080 )",
            designByTitle: "國際暢行科技有限公司",
            designBy: "Design by it-easygo.",
            // SSR 初始顯示（CSR 會自動覆蓋）
            initialViewCount: "0000000000",
            initialUpdateDate: "2026/01/02",
        }

    // return
    return t
}

// ✅ CSR 行為：用 React 取代 index.html 內嵌 script（SSR 安全）
const useFooterAutoUpdate = () => {
    useEffect(() => {
        // 宣告變數
        const isBrowser = typeof window !== "undefined"
        if (!isBrowser) return

        // 執行 function：自動更新日期
        const updateTodayDate = () => {
            const el = document.getElementById("updateDate")
            if (!el) return

            const today = new Date()
            const yyyy = today.getFullYear()
            const mm = String(today.getMonth() + 1).padStart(2, "0")
            const dd = String(today.getDate()).padStart(2, "0")
            el.textContent = `${yyyy}/${mm}/${dd}`
        }

        // 執行 function：模擬瀏覽人數增加（localStorage）
        const updateViewCount = () => {
            const el = document.getElementById("viewCount")
            if (!el) return

            const key = "page_view_count"
            const raw = window.localStorage.getItem(key)
            const next = raw ? Number.parseInt(raw, 10) + 1 : 1

            window.localStorage.setItem(key, String(next))
            el.textContent = String(next).padStart(10, "0")
        }

        updateTodayDate()
        updateViewCount()
    }, [])
}

const Footer = (props: FooterProps) => {
    // 宣告變數
    const t = getFooterText(props.lang)

    // 執行 function
    useFooterAutoUpdate()

    // return
    return (
        <footer className="Footer_section">
            <section className="container-customize4">
                <div className="row">
                    <span>
                        <a
                            accessKey="B"
                            href="#B"
                            className="accesskey_footer B"
                            title={`${t.accessKeyTitle}(B)`}
                            tabIndex={0}
                            style={{ color: "var(--FFFcolor)" }}
                        >
                            :::
                        </a>
                    </span>

                    <div className="col-xl-9 col-12 order-xl-1 order-2">
                        {/* footer-black */}
                        <div className="footer-black Layout_Padding_5_top Layout_Padding_5_bottom">
                            <div className="">
                                {/* widgets-box */}
                                <div className="widgets-box">
                                    <div className="row">
                                        <div className="col-xl-4 col-lg-5 col-md-6 col-sm-12 col-12 border-right">
                                            <div className="row">
                                                <div className="col-12 mb-md-0 mb-3">
                                                    <div className="footer-widget info-widget">
                                                        <div className="widget-title-content">
                                                            <div className="TitleDivBox">
                                                                <span className="widget-title">{t.contactTitle}</span>
                                                                <span className="widget-english">{t.contactTitleEn}</span>
                                                            </div>
                                                        </div>

                                                        <div className="widget-content">
                                                            <ul className="list">
                                                                <li>
                                                                    {t.tel}：( 02 ) 2896-1000 #1836 or #1837
                                                                </li>
                                                                <li>
                                                                    {t.fax}：( 02 ) 7750-7223
                                                                </li>
                                                                <li>
                                                                    {t.email}：
                                                                    <a
                                                                        href="mailto:master@library.tnua.edu.tw"
                                                                        title=""
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        master@library.tnua.edu.tw
                                                                    </a>
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

                                        <div className="col-xl-8 col-lg-7 col-md-6 col-sm-12 col-12 ps-xl-5 ps-3">
                                            <div className="footer-widget info-widget">
                                                <div className="widget-content my-1">
                                                    <div className="social_box">
                                                        <div className="Accessibility-Badge_box">
                                                            <a
                                                                href="#"
                                                                target="_blank"
                                                                title={t.a11yTitle}
                                                                tabIndex={0}
                                                                style={{ height: "auto", width: "auto" }}
                                                                rel="noreferrer"
                                                            >
                                                                <img
                                                                    className="Accessibility-Badge"
                                                                    src={AAPic}
                                                                    alt={t.a11yAlt}
                                                                />
                                                            </a>
                                                            <ul className="list">
                                                                <li>{t.a11yHint}</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    {/* //無障礙 END */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* widgets-box */}
                            </div>
                        </div>
                        {/* footer-black */}
                    </div>

                    <div className="col-xl-3 col-lg-12 order-xl-2 order-1">
                        {/* visitor_section */}
                        <div className="visitor_section Layout_Padding_5_top Layout_Padding_5_bottom d-flex align-items-xl-end align-items-start">
                            <div className="w-100">
                                <div className="visitor_wraper" style={{ padding: "0 3px" }}>
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="footer-widget info-widget d-flex flex-xl-column flex-row align-items-xl-end align-items-center justify-content-between flex-wrap">
                                                <div className="logo mt-2 mb-xl-5 mb-3 pb-xl-4 pb-0 me-5 me-xl-0">
                                                    <img src={LogoPic} alt="" />
                                                </div>
                                                <div className="info_contact">
                                                    <div className="dbox">
                                                        <div className="pe-3 me-3 border-right">
                                                            <p className="">{t.viewCountTitle}</p>
                                                            <p id="viewCount" className="">
                                                                {t.initialViewCount}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="">{t.updateDateTitle}</p>
                                                            <p id="updateDate" className="">
                                                                {t.initialUpdateDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* index.html 原本這段是註解區，這裡保留 DOM 區塊結構（不加內容） */}
                                        {/*<div class="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                            <div class="info_contact">
                                                <div class="dbox"><p>更新日期 : 2022/11/15</p></div>
                                            </div>
                                        </div>*/}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* visitor_section */}
                    </div>
                </div>
            </section>

            {/* copyright_section */}
            <section className="copyright_section pt-3 Layout_Padding_3_bottom">
                <div className="container-customize4">
                    <div className="copyright_wraper">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="me-1">
                                <div className="info_contact">
                                    <div className="dbox">
                                        <p>{t.copyright}</p>
                                    </div>
                                </div>
                                <div className="dbox-tb d-inline">
                                    <p className="d-inline">{t.browserHint}</p>
                                    <p className="px-2 d-inline">｜</p>
                                    <p className="d-inline">
                                        <a href="http://www.it-easygo.com/Main.aspx" title={t.designByTitle} target="_blank" tabIndex={0} rel="noreferrer">
                                            {t.designBy}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* copyright_section */}

            <GoTopButton />
        </footer>
    )
}

export default Footer
