import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import HomepageVideo from "@/SpecFetures/1818/Assets/Client/Spec/HomepageVideo.mp4";
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";
import { AdmissionsCarouselData } from "@/SpecFetures/1818/Pages/Client/Index/Section/AdmissionsCarouselData";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import { useMemo } from "react";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

type BannerSet = components["schemas"]["BannerSet_DTO"];
// #endregion

// #region Public
export const AboutPage = (
    props: {
        lang: Lang;

        webInternalId: string;
        pageInternalId: string;
        admissionsInternalId: string;

        initialWebResource: WebResourceSet | null;
        initialPage: PageManagementSet | null;
        initialAdmissionsBanner: BannerSet | null;
    },
) =>
{
    // 宣告變數：adapters
    const pageAdapter = useMemo(() => PageManagementAdapter(), []);
    const pageInitial = useMemo(() =>
    {
        if (!props.initialPage) return undefined;
        return toInitial(props.pageInternalId, props.initialPage);
    }, [props.pageInternalId, props.initialPage]);
    // 執行 function：CSR hooks 接手（SSR 有 initial → 不重抓；CSR 無 initial → 會自動抓）
    const pageQ = pageAdapter.hooks.useQueryData({ internalId: props.pageInternalId, initial: pageInitial, deps: [props.pageInternalId] });
    // 宣告變數：依語系取對應 detail
    const pageDt = pageQ.data?.PageManagementDetail?.find(p => p.Lang === props.lang);
    // 執行 function：解析內容（含 internal file ids 轉預覽 url）
    return (
        <section className="About_section">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="iMG-Shape-1" />
                    <div className="container-customize3">
                        <div className="row Layout_Padding_1_bottom">
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <video className="about-video" controls loop playsInline preload="metadata">
                                    <source src={HomepageVideo} type="video/mp4" />
                                    {
                                        /* <track default kind="subtitles" label="中文" src="subs/zh-TW.vtt" srcLang="zh-TW" />
									<track kind="subtitles" label="English" src="subs/en.vtt" srcLang="en" /> */
                                    }
                                    你的瀏覽器不支援 HTML5 視訊，請更新瀏覽器或下載檔案播放。
                                </video>
                            </div>

                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mt-lg-5 pt-lg-5 mt-0 pt-4">
                                <div className="offset-3 col-6">
                                    <div className="headDiv mb-lg-5 mb-4">
                                        <span className="headDiv-txt-2 tw">{IndexLabel(props.lang).AboutUsTitle}</span>
                                    </div>
                                </div>

                                <div className="about-left">
                                    <div className="about-txt">
                                        <CmsHtml_Comp html={pageDt?.Content ?? ""} lang={props.lang} />
                                    </div>

                                    <div className="btn-w100-wrapper justify-content-start mt-sm-5 mt-4">
                                        <div className="customize_btn">
                                            <LangNavLink
                                                className="Btn_a"
                                                to="/about/about-01"
                                                role="button"
                                                tabIndex={0}
                                                target="_self"
                                                title="MORE INFO"
                                                type="button"
                                            >
                                                <div className="BtnBox">
                                                    <span>{IndexLabel(props.lang).MoreInfo}</span>
                                                </div>
                                            </LangNavLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Admissions 也一起改成吃 loader initial + adapter hook */}
                        <AdmissionsCarouselData lang={props.lang} internalId={props.admissionsInternalId} initialBanner={props.initialAdmissionsBanner} />
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Private
const toInitial = <TArgs, TData>(args: TArgs, data: TData) =>
{
    // return：符合 adapter hook 的 initial 結構（SSR loader 轉成 CSR hook 初始資料）
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};
// #endregion
