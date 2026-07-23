import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";

// #region Property
type HomePageIntro = components["schemas"]["SpecHomePage1820_Detail"];
// #endregion

// #region Public
/** 首頁介紹區塊列表 */
export const Section4 = (props: { data: HomePageIntro[]; lang: Lang; }) =>
{
    return (
        <>
            {props.data.map((item, index) => <HomeIntroSection key={`${index}-${item.RowId}`} item={item} index={index} lang={props.lang} />)}
        </>
    );
};
// #endregion

// #region Section
/** 首頁介紹單一區塊 */
const HomeIntroSection = (props: { item: HomePageIntro; index: number; lang: Lang; }) =>
{
    const isEvenRow = (props.index + 1) % 2 === 0;
    const sectionClassName = getSectionClassName(props.index);
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
                                        {isEvenRow ? <ImageBlockSection item={props.item} isEvenRow={isEvenRow} /> : <TextBlockSection item={props.item} isEvenRow={isEvenRow} lang={props.lang} />}
                                        {isEvenRow ? <TextBlockSection item={props.item} isEvenRow={isEvenRow} lang={props.lang} /> : <ImageBlockSection item={props.item} isEvenRow={isEvenRow} />}
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

/** 首頁介紹文字區塊 */
const TextBlockSection = (props: { item: HomePageIntro; isEvenRow: boolean; lang: Lang; }) =>
{
    const subImageBleedClass = props.isEvenRow ? "bleed-right" : "bleed-left";
    const subFigureClass = props.isEvenRow ? "right_figure" : "left_figure";
    const primaryLinkFontClass = props.isEvenRow ? "font-wt-md" : "font-wt-lg";
    const textColClass = props.isEvenRow
        ? "col-lg-5 col-md-5 col-sm-12 col-12 order-xl-2 order-lg-2 order-md-2 order-sm-1 order-1"
        : "col-lg-5 col-md-5 col-sm-12 col-12";

    return (
        <div className={textColClass}>
            <div className="bbox d-flex flex-column justify-content-between" style={{ height: "100%" }}>
                <div className="Text_Area">
                    <div className="Text_P">
                        <p className="font-wt-md">
                            <CmsHtml_Comp html={props.item.Intro ?? ""} lang={props.lang} />
                        </p>
                    </div>
                    <div className="row w-100 mx-0 text-left">
                        <div className="col-12 px-0"><MoreLink link={props.item.MainLink ?? ""} title={props.item.MainLinkTitle ?? ""} fontClass={primaryLinkFontClass} /></div>
                    </div>
                </div>
                <div className="sub-img-wrapper">
                    <div className={subImageBleedClass}>
                        <div className={subFigureClass}>
                            <div className="img-wrapper">
                                <img className="card_image" src={FileManagementAPI.get_Public_Preview_Url(props.item.SubPictureId)} alt={props.item.SubPictureDescription ?? ""} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 首頁介紹圖片區塊 */
const ImageBlockSection = (props: { item: HomePageIntro; isEvenRow: boolean; }) =>
{
    const mainImageBleedClass = props.isEvenRow ? "bleed-left" : "bleed-right";
    const mainFigureClass = props.isEvenRow ? "left_figure" : "right_figure";
    const imageColClass = props.isEvenRow
        ? "col-lg-6 col-md-6 col-sm-12 col-12 offset-right-1 order-xl-1 order-lg-1 order-md-1 order-sm-2 order-2"
        : "col-lg-6 col-md-6 col-sm-12 col-12 offset-left-1";

    return (
        <div className={imageColClass}>
            <div className="bbox d-flex flex-column" style={{ height: "100%" }}>
                <div className="big-img-wrapper">
                    <div className={mainImageBleedClass}>
                        <div className={mainFigureClass}>
                            <div className="img-wrapper">
                                <img className="card_image" src={FileManagementAPI.get_Public_Preview_Url(props.item.MainPictureId)} alt={props.item.MainPictureDescription ?? ""} />
                            </div>
                        </div>
                    </div>

                    <div className="row bottom-nav-row text-center">
                        <div className="col-4" key={props.item.SubLinkTitle1}><MoreLink link={props.item.SubLink1 ?? ""} title={props.item.SubLinkTitle1 ?? ""} /></div>
                        <div className="col-4" key={props.item.SubLinkTitle2}><MoreLink link={props.item.SubLink2 ?? ""} title={props.item.SubLinkTitle2 ?? ""} /></div>
                        <div className="col-4" key={props.item.SubLinkTitle3}><MoreLink link={props.item.SubLink3 ?? ""} title={props.item.SubLinkTitle3 ?? ""} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 更多連結項目 */
const MoreLink = (props: { link: string; title: string; fontClass?: string; }) =>
{
    const fontClass = props.fontClass ?? "font-wt-lg";

    return (
        <div className="more-link-box">
            <LangLink to={props.link} className={`more-link ${fontClass}`} aria-label={props.title} title={props.title}>
                <span className="ms-1">〉</span>
                <span className="vm">{props.title}</span>
            </LangLink>
        </div>
    );
};
// #endregion

// #region Private
/** 取得首頁介紹區塊樣式 */
const getSectionClassName = (index: number) =>
{
    if (index === 0) return "Stay_content_section";
    if (index === 1) return "Experience_content_section";
    if (index === 2) return "Food_content_section";
    return "Common_content_section";
};
// #endregion
