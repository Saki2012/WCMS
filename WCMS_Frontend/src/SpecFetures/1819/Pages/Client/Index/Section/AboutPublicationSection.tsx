import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import AboutBgImg from "@/SpecFetures/1819/Assets/Client/images/bg/About_bg_1920x01440.jpg";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useMemo } from "react";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type BannerSet = components["schemas"]["BannerSet_DTO"];

type BannerDetail = NonNullable<BannerSet["BannerDetail"]>[number];

type BannerDetailInfo = NonNullable<BannerSet["BannerDetailInfo"]>[number];


interface AboutPublicationSectionProps
{
    lang: Lang;
    aboutPublicationParam: QueryListParam;
    initialAboutPublicationBanner: BannerSet | null;
}
// #endregion

// #region Public
/** 關於本刊（Prototype: .AboutPublication_section） */
export const AboutPublicationSection = (props: AboutPublicationSectionProps) =>
{
    // 宣告變數
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    const initial = useMemo(() =>
    {
        return toListInitial(props.aboutPublicationParam, props.initialAboutPublicationBanner ? [props.initialAboutPublicationBanner] : []);
    }, [props.aboutPublicationParam, props.initialAboutPublicationBanner]);

    const useIndex = adapter.hooks.useQueryList({ condition: props.aboutPublicationParam, initial, deps: [props.aboutPublicationParam.Condition ?? ""] });

    const banner = useMemo(() =>
    {
        return getBanner(useIndex.data);
    }, [useIndex.data]);

    const hasData = !!banner;

    const content = useMemo(() =>
    {
        return getBannerContent(banner, props.lang);
    }, [banner, props.lang]);

    const issueImg = useMemo(() =>
    {
        return { Img1: getIssueImage(banner, 0, props.lang), Img2: getIssueImage(banner, 1, props.lang), Img3: getIssueImage(banner, 2, props.lang) };
    }, [banner, props.lang]);

    // 所有 hooks 都跑完後才做 early return
    if (!hasData) return null;

    return (
        <section className="AboutPublication_section" style={{ backgroundImage: `url(${AboutBgImg})` }}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="AP-contact">
                                    <div className="AP_body">
                                        <div className="row mx-0">
                                            <div className="col-xl-5 col-lg-6 + col-customize-100">
                                                <div className="headDiv-left mb-sm-5 mb-4">
                                                    <span className="headDiv-subtxt">About this journal</span>
                                                    <img className="headDiv-title-line" src={TitleLine} alt="標題裝飾線條圖示" />
                                                    <span className="headDiv-txt">關於本刊</span>
                                                </div>

                                                <div className="p_contents mt-0">
                                                    <p className="p_text">{content}</p>
                                                </div>

                                                <div className="btn-w100-wrapper justify-content-sart + mt-5">
                                                    <div className="customize_btn">
                                                        <LangNavLink to="/About/About-people" className="Btn_a" role="button" target="_self" title="VIEW MORE">
                                                            <div className="BtnBox">
                                                                <span>VIEW MORE</span>
                                                                <span className="ml-2">
                                                                    <i className="fas fa-chevron-circle-right" aria-hidden="true" />
                                                                </span>
                                                            </div>
                                                        </LangNavLink>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-xl-6 col-lg-12 col-md-12 col-sm-12 col-12 + offset-md-1">
                                                <div className="AP_slider">
                                                    <div className="left">
                                                        <ul>
                                                            <li>
                                                                <img src={issueImg.Img1.src} alt={issueImg.Img1.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img2.src} alt={issueImg.Img2.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img3.src} alt={issueImg.Img3.title} />
                                                            </li>
                                                        </ul>
                                                        <ul>
                                                            <li>
                                                                <img src={issueImg.Img1.src} alt={issueImg.Img1.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img2.src} alt={issueImg.Img2.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img3.src} alt={issueImg.Img3.title} />
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    <div className="right">
                                                        <ul>
                                                            <li>
                                                                <img src={issueImg.Img1.src} alt={issueImg.Img1.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img2.src} alt={issueImg.Img2.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img3.src} alt={issueImg.Img3.title} />
                                                            </li>
                                                        </ul>
                                                        <ul>
                                                            <li>
                                                                <img src={issueImg.Img1.src} alt={issueImg.Img1.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img2.src} alt={issueImg.Img2.title} />
                                                            </li>
                                                            <li>
                                                                <img src={issueImg.Img3.src} alt={issueImg.Img3.title} />
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* row */}
                                    </div>
                                </div>
                            </div>
                            {/* col-12 */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Private
const toOkEnv = <T,>(data: T): ApiResponse<T> =>
{
    // return：統一成功 env
    return { IsSuccess: true, Data: data, SysMessage: [] };
};


const toListInitial = <T,>(args: QueryListParam, data: T[]) =>
{
    // return：統一 queryList initial 結構
    return { args, apiRes: toOkEnv(data) };
};


const getBanner = (data?: BannerSet[]): BannerSet | null =>
{
    // return
    return data?.[0] ?? null;
};


const getBannerContent = (banner: BannerSet | null, lang: Lang): string =>
{
    // 宣告變數
    const infoList = banner?.BannerDetailInfo ?? [];
    const content = infoList.find((p) => p.Lang === lang && (p.Content ?? "").trim() !== "")?.Content ?? "";

    // return
    return content;
};


const getBannerTitleByParentRowId = (banner: BannerSet | null, parentRowId: BannerDetailInfo["ParentRowId"], lang: Lang): string =>
{
    // 宣告變數
    const infoList = banner?.BannerDetailInfo ?? [];
    const title = infoList.find((p) => p.ParentRowId === parentRowId && p.Lang === lang)?.Title ?? "";

    // return
    return title;
};


const getIssueImage = (banner: BannerSet | null, idx: number, lang: Lang) =>
{
    const detail = banner?.BannerDetail?.[idx];
    const title = detail ? getBannerTitleByParentRowId(banner, detail.RowId, lang) : "";
    const src = FileManagementAPI.get_Public_Preview_Url(detail?.PicSrcId, title);
    return { title, src };
};
// #endregion
