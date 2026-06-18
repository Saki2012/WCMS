import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
// import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton"
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { GoTop } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTop/GoTop";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import "./Footer.css";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { buildSystemVersionText } from "@/SysCore/Utils/SystemInfo/SystemVersionText";

// #region Property
export interface FooterRuntimeInfo
{
    /** 最近 10 分鐘內瀏覽人數 */
    recentlyViewCount: number | null;
    /** 網站總瀏覽人數 */
    viewCount: number | null;
    /** 網站更新日期 */
    siteUpdatedAt?: string | null;
    /** 前端版本 */
    feVersion?: string | null;
    /** 後端版本 */
    beVersion?: string | null;
}
export interface FooterProps
{
    lang: Lang;
    site: INormSite;
    /** 後台 SiteFooter 富文本 */
    footerContent?: string | null;
    /** 網站固定資訊 */
    runtimeInfo?: FooterRuntimeInfo;
}
interface FooterText
{
    currentViewCountTitle: string;
    totalViewCountTitle: string;
    updateDateTitle: string;
    systemVersionTitle: string;
    designByTitle: string;
    designBy: string;
}
// #endregion

// #region Public
export const Footer = (props: FooterProps) =>
{
    const text = getFooterText(props.lang);
    const siteTitle = getSiteTitle(props.site, props.lang);
    const statusLine = buildStatusLine(text, props.runtimeInfo); /**可能在執行到footer在撈就好? 畢竟表也不是來源於SiteMenu的，另外撈就行 */
    const currentYear = new Date().getFullYear();
    const copyrightPrefix = buildCopyrightPrefix(currentYear, siteTitle);
    return (
        <footer className="Footer_section">
            <section className="tinyMCE_section">
                <div className="container-tinyMCEfooter">
                    <Accesskey type="Z" lang={props.lang} />
                    <CmsHtml_Comp html={props.site.indexInfoByLang[props.lang].footerContent} lang={props.lang} />
                </div>
            </section>
            <section className="copyright_section">
                <div className="container-copyright">
                    <div className="copyright_wrapper">
                        <div className="wrapper_box">
                            <div className="info_box_1">
                                <span className="content">{statusLine}</span>
                            </div>
                            <div className="info_box_2">
                                <span className="content">{copyrightPrefix}</span>
                                <LangLink className="design_by" to="http://www.it-easygo.com/Main.aspx" title={text.designByTitle}>{text.designBy}</LangLink>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <GoTop lang={props.lang} />
        </footer>
    );
};
// #endregion

// #region Protected
const buildStatusLine = (text: FooterText, runtimeInfo: FooterRuntimeInfo | undefined): string =>
{
    const currentViewCount = formatViewCount(runtimeInfo?.recentlyViewCount);
    const viewCount = formatViewCount(runtimeInfo?.viewCount);
    const updateDate = formatUpdateDate(runtimeInfo?.siteUpdatedAt);
    const systemVersionText = buildSystemVersionText({ feVersion: runtimeInfo?.feVersion, beVersion: runtimeInfo?.beVersion });
    return `${text.currentViewCountTitle}:${currentViewCount} | ${text.totalViewCountTitle}:${viewCount} | ${text.updateDateTitle}:${updateDate} | ${text.systemVersionTitle}:${systemVersionText}`;
};

const buildCopyrightPrefix = (currentYear: number, siteTitle: string): string =>
{
    const safeSiteTitle = siteTitle || "-";
    return `Copyright © ${currentYear}. ${safeSiteTitle} All rights reserved.｜`;
};
// #endregion

// #region Private
const getFooterText = (lang: Lang): FooterText =>
{
    const isEn = lang === "en";
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
        };
};
const getSiteTitle = (site: INormSite, lang: Lang): string =>
{
    const currentInfo = site.indexInfoByLang?.[lang];
    const zhTwInfo = site.indexInfoByLang?.["zh-tw"];
    const enInfo = site.indexInfoByLang?.["en"];
    const title = currentInfo?.title || zhTwInfo?.title || enInfo?.title || "";
    return title;
};
const formatViewCount = (value?: number | null): string =>
{
    const count = value ?? 0;
    return String(count).padStart(10, "0");
};
const formatUpdateDate = (value?: string | null): string =>
{
    const dateText = value?.trim();
    return dateText && dateText.length > 0 ? dateText : "-";
};
// #endregion
