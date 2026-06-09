/*footer模塊*/
import logImg from "@/SpecFetures/1810/Assets/Client/images/logo/logo_Footer_W_225x125.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";

// #region Property
type NavItem = { Title: string; URL: string; TitleAttr?: string; Target?: "_self" | "_blank"; Rel?: string; };
// #endregion

// #region Public
export const Footer = (props: { lang: Lang; }) =>
{
    // NOTE: 預設中文
    const lang: "zh-tw" | "en" = props.lang === "en" ? "en" : "zh-tw";
    const nav = getNavByLang(lang);
    const t = getTextByLang(lang);

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
                                            <div className="footer-widget about-widget mb-3">
                                                <img alt={t.logoAlt} src={logImg} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-5 col-12">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="footer-widget info-widget">
                                                <div className="widget-content w-100">
                                                    <div className="row">
                                                        <div className="col-xl-7 col-lg-6 col-md-6 col-sm-12 col-12 p-0">
                                                            <ul className="list">
                                                                {nav.left.map((x) =>
                                                                {
                                                                    const target = x.Target ?? "_self";
                                                                    const rel = x.Rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
                                                                    return (
                                                                        <li key={`${x.Title}-${x.URL}`}>
                                                                            <LangNavLink
                                                                                to={x.URL}
                                                                                tabIndex={5}
                                                                                title={x.TitleAttr ?? x.Title}
                                                                                target={target}
                                                                                rel={rel}
                                                                            >
                                                                                {x.Title}
                                                                            </LangNavLink>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>

                                                        <div className="col-xl-5 col-lg-6 col-md-6 col-sm-12 col-12 p-0">
                                                            {/* NOTE: 英文版暫時留空，保持原 template 的右欄 */}
                                                            {nav.right.length > 0
                                                                ? (
                                                                    <ul className="list">
                                                                        {nav.right.map((x) => (
                                                                            <li key={`${x.Title}-${x.URL}`}>
                                                                                <LangNavLink to={x.URL} tabIndex={5} title={x.TitleAttr ?? x.Title}>
                                                                                    {x.Title}
                                                                                </LangNavLink>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )
                                                                : <p>&nbsp;</p>}
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
                                                    <div className="TitleDivBox">
                                                        <span className="widget-title">{t.contactTitle}</span>
                                                    </div>
                                                </div>
                                                <div className="widget-content">
                                                    <ul className="list">
                                                        <li>{t.tel}</li>
                                                        <li>{t.fax}</li>
                                                        <li>
                                                            {t.mailLabel}
                                                            <a href="mailto:rd@ntua.edu.tw" title="Mail">rd@ntua.edu.tw</a>
                                                        </li>
                                                        <li>{t.address}</li>
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

                <section className="visitor_section">
                    <div className="container-customize1">
                        <div className="col-12">
                            <div className="row mx-0">
                                <div className="col-xl-5 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <div className="info_contact">
                                        <div className="dbox">
                                            <p>{t.copyright}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <div className="info_contact">
                                        <div className="dbox">
                                            <p>{t.visitors}</p>
                                            <p className="px-2">｜</p>
                                            <p>{t.updated}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <section className="copyright_section justify-content-start">
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="dbox-tb">
                                                    <p>
                                                        <a
                                                            href="http://www.it-easygo.com/Main.aspx"
                                                            title={t.designByTitle}
                                                            rel="noopener noreferrer"
                                                            target="_blank"
                                                            tabIndex={5}
                                                        >
                                                            {t.designByText}
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </footer>
    );
};
// #endregion

// #region Private
const getNavByLang = (lang: Lang) =>
{
    // NOTE: 分離資料，避免 JSX 太肥，也方便後續 DB 化
    const zhLeft: NavItem[] = [
        { Title: "關於本處", URL: "/About/About-Intro", TitleAttr: "關於本處" },
        { Title: "研究企劃組", URL: "/Division-Planning/Division-Planning-About", TitleAttr: "研究企劃組" },
        { Title: "學術發展組", URL: "/Division-Academic/Division-Academic-About", TitleAttr: "學術發展組" },
        { Title: "產學暨育成中心", URL: "/iic/iic-3", TitleAttr: "產學暨育成中心" },
        { Title: "永續發展暨社會責任實踐計畫推動中心", URL: "/usr/usrabout2", TitleAttr: "永續發展暨社會責任實踐計畫推動中心" },
    ];

    const zhRight: NavItem[] = [
        { Title: "最新消息", URL: "/Allnews/All-announcement", TitleAttr: "最新消息" },
        { Title: "計畫徵件", URL: "/Allnews/Project-solicitation/National-Science-Accounting", TitleAttr: "計畫徵件" },
        { Title: "相關法規", URL: "/RelevantRegulations/DownloadsAll1", TitleAttr: "相關法規" },
        { Title: "資料下載", URL: "/All-Downloads/DownloadsAllView", TitleAttr: "資料下載" },
        { Title: "研究亮點", URL: "/research-highlights/rh4/List", TitleAttr: "研究亮點" },
    ];

    const enLeft: NavItem[] = [
        { Title: "About ORD", URL: "/About-ORD-en/Introduction-en", TitleAttr: "About ORD" },
        { Title: "Division of Research & Planning", URL: "/Division-Planning-en", TitleAttr: "Division of Research & Planning" },
        { Title: "Division of Academic Development", URL: "/Division-Academic-en", TitleAttr: "Division of Academic Development" },
        { Title: "Industry Collaboration and Incubation Center", URL: "/IIC-en", TitleAttr: "Industry Collaboration and Incubation Center" },
        { Title: "Think Tank for Taiwan Cultural Policy", URL: "/TTTCP-en", TitleAttr: "Think Tank for Taiwan Cultural Policy" },
        { Title: "Office for USR Project Promotion", URL: "/USR-en", TitleAttr: "Office for USR Project Promotion" },
    ];
    const enRight: NavItem[] = []; // NOTE: 先留空，保持版面結構一致（右欄不塞連結）
    return lang === "en" ? { left: enLeft, right: enRight } : { left: zhLeft, right: zhRight };
};


const getTextByLang = (lang: "zh-tw" | "en") =>
{
    // NOTE: 集中管理文案，後續要接 i18n 也好替換
    if (lang === "en")
    {
        return {
            logoAlt: "National Taiwan University of Arts - Office of Research and Development LOGO",
            contactTitle: "Contact",
            tel: "Tel: (02) 2272-2181",
            fax: "Fax: (02) 2969-4830",
            mailLabel: "Email: ",
            address: "Address: No. 59, Sec. 1, Daguan Rd., Banqiao Dist., New Taipei City 22058, Taiwan",
            copyright: "Copyright © 2025. Office of Research and Development, National Taiwan University of Arts. All rights reserved.",
            visitors: "Visitors : 0000000037",
            updated: "Updated : 2025/09/15",
            designByTitle: "it-easygo (opens in new tab)",
            designByText: "Design by it-easygo.",
        };
    }

    return {
        logoAlt: "國立臺灣藝術大學_研究發展處 LOGO",
        contactTitle: "聯絡資訊",
        tel: "總機 ：( 02 ) 2272-2181",
        fax: "傳真 ：( 02 ) 2969-4830",
        mailLabel: "Mail ：",
        address: "地址 ：22058 新北市板橋區大觀路一段59號",
        copyright: "Copyright © 2025. 國立臺灣藝術大學_研究發展處 All rights reserved.",
        visitors: "瀏覽人數　:　0000000037",
        updated: "更新日期　:　2025/09/15",
        designByTitle: "國際暢行科技有限公司(另開新視窗)",
        designByText: "Design by it-easygo.",
    };
};


export default Footer;
// #endregion
