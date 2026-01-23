import { useEffect, useMemo, useState } from "react"
import type { FooterProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Footer"

type FooterText = {
    // Contact / Publisher
    telLabel: string
    telValue: string
    emailLabel: string
    emailValue: string
    addressLabel: string
    addressValue: string
    publisherLabel: string
    publisherValue: string

    // Copyright / meta
    copyright: string
    issnLine: string

    // CC / funding (EN 版需求)
    extraNote?: string
    fundedNote?: string

    // View / update
    viewCountLabel: string
    updateDateLabel: string

    // Bottom hint
    browserHint: string
    designByTitle: string
    designByText: string

    // A11y
    accesskeyTitle: string
}

const Footer = (props: FooterProps) => {
    const [viewCount, setViewCount] = useState("0000000000")
    const [updateDate, setUpdateDate] = useState("")

    const t = useMemo<FooterText>(() => {
        if (props.lang === "en") {
            return {
                telLabel: "Tel",
                telValue: "+886-2-2621-5656 #2382",
                emailLabel: "E-mail",
                emailValue: "joemls@mail2.tku.edu.tw",
                addressLabel: "Address",
                addressValue: "No. 151, Yingzhuan Rd., Tamsui Dist., New Taipei City 251301, Taiwan (R.O.C)",
                publisherLabel: "Publisher",
                publisherValue: "Tamkang University Press",

                issnLine: "ISSN-L：1013-090X ISSN（Print）：1013-090X ISSN（Online）：2309-9100 DOI：10.6120/JoEMLS CODEN：CYTHD5",
                copyright: "Copyright © 2025. Tamkang University — Journal of Educational Media & Library Sciences. All rights reserved.",

                extraNote:
                    "The journal is published under the terms of the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) by Tamkang University Press.",
                fundedNote:
                    "This website is funded by The Research Institute for the Humanities and Social Sciences, National Science and Technology Council",

                viewCountLabel: "Views",
                updateDateLabel: "Last updated",

                browserHint:
                    "For a better and more stable browsing experience, please update your browser to Microsoft Edge / Google Chrome / Mozilla Firefox or any W3C-compatible browser (recommended screen resolution: 1920×1080).",
                designByTitle: "IT-EASYGO International Accessibility Technology Co., Ltd.",
                designByText: "Design by it-easygo.",
                accesskeyTitle: "Bottom content area (B)",
            }
        }

        return {
            telLabel: "電話",
            telValue: "886-2-2621-5656  #2382",
            emailLabel: "E-mail",
            emailValue: "joemls@mail2.tku.edu.tw",
            addressLabel: "地址",
            addressValue: "251301台灣新北市淡水區英專路151號",
            publisherLabel: "出版者",
            publisherValue: "淡江大學出版中心",

            issnLine: "ISSN-L：1013-090X  │  ISSN（Print）：1013-090X  │  ISSN（Online）：2309-9100  │  DOI：10.6120/JoEMLS  │  CODEN：CYTHD5",
            copyright: "Copyright © 2025. 淡江大學 教育資料與圖書館學 All rights reserved.",
            extraNote:
                "本刊網站刊載之所有資料與素材，其得受著作權保護之範圍，由淡江大學出版社根據CC創用4.0國際 CC BY-NC（姓名標示－非商業性）發布",
            fundedNote:
                "本網站獲國科會人文社會科學研究中心補助",
            viewCountLabel: "瀏覽人數",
            updateDateLabel: "更新日期",

            browserHint:
                "為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器 Microsoft Edge / Google Chrome / Mozilla Firefox 或相容 W3C 網頁標準之瀏覽器  ( 螢幕最佳瀏覽解析度為1920*1080 )",
            designByTitle: "國際暢行科技有限公司",
            designByText: "Design by it-easygo.",
            accesskeyTitle: "下方內容區(B)",
        }
    }, [props.lang])

    useEffect(() => {
        // 1) 更新日期 yyyy/MM/dd
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, "0")
        const dd = String(today.getDate()).padStart(2, "0")
        setUpdateDate(`${yyyy}/${mm}/${dd}`)

        // 2) 模擬瀏覽人數（localStorage）
        const key = "wcms.page_view_count"
        const raw = window.localStorage.getItem(key)
        const next = raw ? Number.parseInt(raw, 10) + 1 : 1
        window.localStorage.setItem(key, String(next))
        setViewCount(String(next).padStart(10, "0"))
    }, [])

    return (
        <footer className="Footer_section">
            <section className="footer-black Layout_Padding_5_top">
                <div className="container-customize2">
                    <span>
                        <a
                            accessKey="B"
                            href="#B"
                            className="accesskey_footer B"
                            title={t.accesskeyTitle}
                            tabIndex={0}
                            style={{ color: "var(--FFFcolor)" }}
                        >
                            :::
                        </a>
                    </span>

                    <div className="widgets-box">
                        <div className="row mx-0">
                            {/* Tel + Email */}
                            <div className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        {t.telLabel} ：{t.telValue}
                                                    </li>
                                                    <li>
                                                        {t.emailLabel} ：
                                                        <a href={`mailto:${t.emailValue}`} title={t.emailValue}>
                                                            {t.emailValue}
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address + Publisher */}
                            <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        {t.addressLabel} ：{t.addressValue}
                                                    </li>
                                                    <li>
                                                        {t.publisherLabel} ：{t.publisherValue}
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Copyright + View + Update */}
                            <div className="col-xxl-5 col-xl-5 col-lg-12 col-md-12 col-sm-12 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mb-3">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        <p>{t.copyright}</p>
                                                    </li>
                                                    <li style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                                                        <p id="viewCount">
                                                            {t.viewCountLabel}　:　{viewCount}
                                                        </p>
                                                        <p className="px-2">｜</p>
                                                        <p id="updateDate">
                                                            {t.updateDateLabel}　:　{updateDate}
                                                        </p>
                                                    </li>



                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ISSN line */}
                            <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                <div className="row">
                                    <div className="col-12 mb-md-0 mt-2">
                                        <div className="footer-widget info-widget">
                                            <div className="widget-content">
                                                <ul className="list">
                                                    <li>
                                                        <p>{t.issnLine}</p>
                                                    </li>
                                                    <li>
                                                        <p>{t.extraNote}</p>
                                                    </li>
                                                    <li>
                                                        <p>{t.fundedNote}</p>
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

            <section className="copyright_section pt-0 pb-3">
                <div className="container-customize2">
                    <div className="copyright_wraper">
                        <div className="row mx-0">
                            <div className="col-md-12">
                                <div className="dbox-tb">
                                    <p>{t.browserHint}</p>
                                    <p className="px-2">｜</p>
                                    <p>
                                        <a
                                            href="http://www.it-easygo.com/Main.aspx"
                                            title={t.designByTitle}
                                            target="_blank"
                                            rel="noreferrer"
                                            tabIndex={0}
                                        >
                                            {t.designByText}
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
