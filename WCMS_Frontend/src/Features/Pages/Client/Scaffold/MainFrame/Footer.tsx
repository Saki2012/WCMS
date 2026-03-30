import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing"
import type { Lang } from "@/SysCore/i18n/lang"
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton"
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds"
import parse from 'html-react-parser';

export interface FooterRuntimeInfo {
    /** 網站瀏覽人數 */
    viewCount: number | null
    /** 網站更新日期 */
    siteUpdatedAt?: string | null
    /** 前端版本 */
    feVersion?: string | null
    /** 後端版本 */
    beVersion?: string | null
}

export interface FooterProps {
    lang: Lang
    site: INormSite
    /** 後台 SiteFooter 富文本 */
    footerContent?: string | null
    /** 網站固定資訊 */
    runtimeInfo?: FooterRuntimeInfo
}

interface FooterText {
    currentViewCountTitle:string
    totalViewCountTitle: string
    updateDateTitle: string
    systemVersionTitle: string
    designByTitle:string
    designBy: string
}

const getFooterText = (lang: Lang): FooterText => {
    // 宣告變數
    const isEn = lang === "en"
    // return
    return isEn
        ? {
            currentViewCountTitle: "Current Views",
            totalViewCountTitle: "Total Views",
            updateDateTitle: "Last updated",
            systemVersionTitle: "System version",
            designByTitle: "IT-EASYGO International Accessibility Technology Co., Ltd.",
            designBy: "Design by it-easygo.",
        }
        : {
            currentViewCountTitle: "在線人數",
            totalViewCountTitle: "總瀏覽人數",
            updateDateTitle: "網站更新日期",
            systemVersionTitle: "系統版本",
            designByTitle: "國際暢行科技有限公司",
            designBy: "Design by it-easygo.",
        }
}

const getSiteTitle = (site: INormSite, lang: Lang): string => {
    // 宣告變數
    const currentInfo = site.indexInfoByLang?.[lang]
    const zhTwInfo = site.indexInfoByLang?.["zh-tw"]
    const enInfo = site.indexInfoByLang?.["en"]
    const title = currentInfo?.title || zhTwInfo?.title || enInfo?.title || ""

    // return
    return title
}

const formatViewCount = (value?: number | null): string => {
    // 宣告變數
    const count = value ?? 0

    // return
    return String(count).padStart(10, "0")
}

const formatUpdateDate = (value?: string | null): string => {
    // 宣告變數
    const dateText = value?.trim()
    // return
    return dateText && dateText.length > 0 ? dateText : "-"
}

const getFeVersion = (value?: string | null): string => {
    // 宣告變數
    const envVersion = import.meta.env.VITE_APP_VERSION as string | undefined
    const version = value?.trim() || envVersion || "0.0.0"
    // return
    return version
}

const getBeVersion = (value?: string | null): string => {
    // 宣告變數
    const version = value?.trim()
    // return
    return version && version.length > 0 ? version : "-"
}

const getFooterContentHtml = (lang:Lang, value?: string | null) => {
    const parseContent = useResolveInternalIds(value ?? "", { locale: lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    return content
}

const buildStatusLine = (text: FooterText, runtimeInfo: FooterRuntimeInfo | undefined,): string => {
    // 宣告變數
    const currentViewCount = formatViewCount(runtimeInfo?.viewCount)
    const viewCount = formatViewCount(runtimeInfo?.viewCount)
    const updateDate = formatUpdateDate(runtimeInfo?.siteUpdatedAt)
    const feVersion = getFeVersion(runtimeInfo?.feVersion)
    const beVersion = getBeVersion(runtimeInfo?.beVersion)
    // return
    return `${text.currentViewCountTitle}:${currentViewCount} | ${text.totalViewCountTitle}:${viewCount} | ${text.updateDateTitle}:${updateDate} | ${text.systemVersionTitle}:FE-${feVersion} / BE-${beVersion}`
}

const buildCopyrightPrefix = (currentYear: number, siteTitle: string): string => {
    const safeSiteTitle = siteTitle || "-"
    return `Copyright © ${currentYear}. ${safeSiteTitle} All rights reserved.｜`
}

const Footer = (props: FooterProps) => {
    // 宣告變數
    const text = getFooterText(props.lang)
    const siteTitle = getSiteTitle(props.site, props.lang)
    const statusLine = buildStatusLine(text, props.runtimeInfo) /**可能在執行到footer在撈就好? 畢竟表也不是來源於SiteMenu的，另外撈就行 */
    const footerContentHtml = getFooterContentHtml(props.lang,props.site.indexInfoByLang[props.lang].footerContent)
    const currentYear = new Date().getFullYear()
    const copyrightPrefix = buildCopyrightPrefix(currentYear, siteTitle)
    // return
    return (
        <footer className="Footer_section">
            <span>
                <a accessKey="B" href="#B" className="accesskey_footer B" title="下方內容區(B)(B)" >:::</a>
            </span>
            <section className="container-customize4">
                {footerContentHtml}
            </section>
            <section className="copyright_section pt-3 Layout_Padding_3_bottom">
                <div className="container-customize4">
                    <div className="copyright_wraper">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="me-1">
                                <div className="info_contact">
                                    <div className="dbox">
                                        <p className="d-inline">{copyrightPrefix}</p>
                                        <a href="http://www.it-easygo.com/Main.aspx" title={text.designByTitle} target="_blank" tabIndex={0} rel="noreferrer">
                                            {text.designBy}
                                        </a>
                                    </div>
                                </div>
                                <div className="dbox-tb d-inline">
                                    <p className="d-inline">{statusLine}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <GoTopButton />
        </footer>
    )
}

export default Footer