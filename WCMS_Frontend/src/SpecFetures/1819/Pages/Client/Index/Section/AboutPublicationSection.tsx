import type { Lang } from "@/SysCore/i18n/lang";
import AboutBgImg from "@/SpecFetures/1819/Assets/Client/images/bg/About_bg_1920x01440.jpg";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

type BannerSet = components["schemas"]["BannerSet_DTO"];

/** 關於本刊（Prototype: .AboutPublication_section） */
export const AboutPublicationSection = (props: { lang: Lang }) => {
    // ✅ provider 只建立一次
    const pvdr = useMemo(() => {
        return BannerSliderProvider();
    }, []);

    // ✅ hook 不能被條件跳過
    const useIndex = bannerFetch(pvdr, "Banner20260113004", props.lang);

    // ✅ 資料是否就緒（只用於 render 判斷，不影響 hooks 呼叫順序）
    const hasData = !!useIndex.rawData && useIndex.rawData.length > 0;

    // ✅ 內容：沒資料就給空字串
    const content = useMemo(() => {
        const row = useIndex.rawData?.[0];
        const text = row?.BannerDetailInfo?.find((p) => p.Lang === props.lang && p.Content !== "")?.Content;
        return text ?? "";
    }, [useIndex.rawData, props.lang]);

    // ✅ 圖片：沒資料就給空 src/alt，避免 /undefined
    const issueImg = useMemo(() => {
        const details = useIndex.rawData?.[0]?.BannerDetail ?? [];

        const pick = (idx: number) => {
            const d = details[idx];
            const title = d?._BannerDetailInfo?.find((p) => p.Lang === props.lang)?.Title ?? "";
            const picId = d?.PicSrcId;
            const src = picId ? `${FileManagementAPI.PREVIEW_URL}/${picId}` : "";
            return { title, src };
        };

        return {
            Img1: pick(0),
            Img2: pick(1),
            Img3: pick(2),
        };
    }, [useIndex.rawData, props.lang]);

    // ✅ 所有 hooks 都跑完後才做 early return（安全）
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

const bannerFetch = (pdvr: IDataProvider<BannerSet>, bannerId: string, lang: Lang) => {
    let condition: string = ``;
    condition = LibMerge(" And ", false, condition, `${BannerFields.BannerId} = ${bannerId}`);
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang} = ${lang}`
    );

    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                `${BannerFields._BannerDetail}.${BannerDetailFields.BannerId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.ParentRowId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.RowId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Content}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: true }],
        }),
        enabled: true,
        deps: [bannerId, lang],
    });
};
