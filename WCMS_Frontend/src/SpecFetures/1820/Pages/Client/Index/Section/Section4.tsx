import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
type HomePageIntro = components["schemas"]["SpecHomePage1820_Detail_DTO"];

/** 首頁介紹區塊列表 */
export const Section4 = (props: { data: HomePageIntro[]; lang: Lang; }) =>
{
    return (
        <>
            {props.data.map((item, index) =>
            {
                return <HomeIntroSection_Comp key={`${index}-${item.RowId}`} item={item} index={index} lang={props.lang} />;
            })}
        </>
    );
};

/** 渲染連結 */
const renderLink = (link: string, title: string, fontClass = "font-wt-lg") =>
{
    return (
        <div className="more-link-box">
            <LangLink to={link} className={`more-link ${fontClass}`} aria-label={title} title={title}>
                <span className="ms-1">〉</span>
                <span className="vm">{title}</span>
            </LangLink>
        </div>
    );
};

/** 渲染文字區 */
const renderTextBlock = (item: HomePageIntro, isEvenRow: boolean, lang: Lang) =>
{
    const subImageBleedClass = isEvenRow ? "bleed-right" : "bleed-left";
    const subFigureClass = isEvenRow ? "right_figure" : "left_figure";
    const primaryLinkFontClass = isEvenRow ? "font-wt-md" : "font-wt-lg";
    const textColClass = isEvenRow
        ? "col-lg-5 col-md-5 col-sm-12 col-12 order-xl-2 order-lg-2 order-md-2 order-sm-1 order-1"
        : "col-lg-5 col-md-5 col-sm-12 col-12";
    return (
        <div className={textColClass}>
            <div className="bbox d-flex flex-column justify-content-between" style={{ height: "100%" }}>
                <div className="Text_Area">
                    <div className="Text_P">
                        <p className="font-wt-md">
                            <CmsHtml_Comp html={item.Intro ?? ""} lang={lang} />
                        </p>
                    </div>
                    <div className="row w-100 mx-0 text-left">
                        <div className="col-12 px-0">{renderLink(item.MainLink ?? "", item.MainLinkTitle ?? "", primaryLinkFontClass)}</div>
                    </div>
                </div>
                <div className="sub-img-wrapper">
                    <div className={subImageBleedClass}>
                        <div className={subFigureClass}>
                            <div className="img-wrapper">
                                <img
                                    className="card_image"
                                    src={FileManagementAPI.get_Public_Preview_Url(item.SubPictureId)}
                                    alt={item.SubPictureDescription ?? ""}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 渲染圖片區 */
const renderImageBlock = (item: HomePageIntro, isEvenRow: boolean) =>
{
    const mainImageBleedClass = isEvenRow ? "bleed-left" : "bleed-right";
    const mainFigureClass = isEvenRow ? "left_figure" : "right_figure";
    /** 取得圖片欄 class */
    const imageColClass = isEvenRow
        ? "col-lg-6 col-md-6 col-sm-12 col-12 offset-right-1 order-xl-1 order-lg-1 order-md-1 order-sm-2 order-2"
        : "col-lg-6 col-md-6 col-sm-12 col-12 offset-left-1";

    return (
        <div className={imageColClass}>
            <div className="bbox d-flex flex-column" style={{ height: "100%" }}>
                <div className="big-img-wrapper">
                    <div className={mainImageBleedClass}>
                        <div className={mainFigureClass}>
                            <div className="img-wrapper">
                                <img
                                    className="card_image"
                                    src={FileManagementAPI.get_Public_Preview_Url(item.MainPictureId)}
                                    alt={item.MainPictureDescription ?? ""}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row bottom-nav-row text-center">
                        <div className="col-4" key={item.SubLinkTitle1}>{renderLink(item.SubLink1 ?? "", item.SubLinkTitle1 ?? "")}</div>
                        <div className="col-4" key={item.SubLinkTitle2}>{renderLink(item.SubLink2 ?? "", item.SubLinkTitle2 ?? "")}</div>
                        <div className="col-4" key={item.SubLinkTitle3}>{renderLink(item.SubLink3 ?? "", item.SubLinkTitle3 ?? "")}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 首頁介紹單一區塊 */
const HomeIntroSection_Comp = (props: { item: HomePageIntro; index: number; lang: Lang; }) =>
{
    const isEvenRow = (props.index + 1) % 2 === 0;

    const sectionClassName = props.index === 0
        ? "Stay_content_section"
        : props.index === 1
        ? "Experience_content_section"
        : props.index === 2
        ? "Food_content_section"
        : "Common_content_section";
    const boxStyleClass = isEvenRow ? "DivBox_style S2" : "DivBox_style S1";
    return (
        <section className={`${sectionClassName} Layout_Padding_3_top Layout_Padding_3_bottom bg-custom overflow-hidden`}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="Header_Div">
                                    <div className="title-accent font-wt-lg">{props.item.SubTitle}</div>
                                    <div className="main-title display-5">{props.item.Title}</div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className={boxStyleClass}>
                                    <div className="row">
                                        {isEvenRow ? renderImageBlock(props.item, isEvenRow) : renderTextBlock(props.item, isEvenRow, props.lang)}
                                        {isEvenRow ? renderTextBlock(props.item, isEvenRow, props.lang) : renderImageBlock(props.item, isEvenRow)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
