import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useMemo } from "react";
import type { HomePageRawData } from "../HomePage_Loader";

type QueryListParam = components["schemas"]["QueryListParam"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

interface RelatedLinksSectionProps
{
    lang: Lang;
    relatedLinksParam: QueryListParam;
    initialData: Pick<HomePageRawData, "relatedLinksList">;
}

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

/** 相關連結（Prototype: .RelatedLinks_section） */
export const RelatedLinksSection = (props: RelatedLinksSectionProps) =>
{
    // 宣告變數
    const adapter = useMemo(() => WebResourceAdapter(), []);

    const initial = useMemo(() =>
    {
        return toListInitial(props.relatedLinksParam, props.initialData.relatedLinksList ?? []);
    }, [props.relatedLinksParam, props.initialData.relatedLinksList]);

    const useWebSrc = adapter.hooks.useQueryList({ condition: props.relatedLinksParam, initial, deps: [props.relatedLinksParam.Condition ?? "", props.lang] });

    // 執行 function
    if (!useWebSrc.data || useWebSrc.data.length === 0) return null;

    // return
    return (
        <section className="RelatedLinks_section + Layout_Padding_3_top + Layout_Padding_1_bottom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="col-12">
                                    <div className="headDiv mb-sm-5 mb-4">
                                        <span className="headDiv-subtxt">Related Links</span>
                                        <img className="headDiv-title-line" src={TitleLine} alt="標題裝飾線條圖示" />
                                        <span className="headDiv-txt">相關連結</span>
                                    </div>
                                </div>

                                <div className="imagelink-divbox + mb-5">
                                    <div className="row mx-0">
                                        {useWebSrc.data.map((data) =>
                                        {
                                            // 宣告變數
                                            const id = data.WebResource?.WebResourceId;
                                            const picTitle = data.WebResource?.PicDescription ?? "";
                                            const picSrc = FileManagementAPI.get_Public_Preview_Url(data.WebResource?.PicId, picTitle);
                                            const dt = data.WebResourceInfo?.find(p => p.Lang === props.lang);
                                            const title = dt?.Title ?? "";
                                            const url = dt?.ResUrl ?? "";
                                            const tar = dt?.Url_OpenType === 0 ? "_self" : "_blank";

                                            // return
                                            return (
                                                <div key={id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-6 + mb-4">
                                                    <figure className="figure_Box">
                                                        <LangNavLink
                                                            to={url}
                                                            className="card_image_link"
                                                            title={title}
                                                            target={tar}
                                                            rel={dt?.Url_OpenType === 0 ? undefined : "noopener noreferrer"}
                                                        >
                                                            <div className="card_figure">
                                                                <div className="img-wrapper">
                                                                    <img className="card_image" src={picSrc} alt={picTitle} />
                                                                </div>
                                                            </div>
                                                        </LangNavLink>
                                                    </figure>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="btn-w100-wrapper justify-content-center">
                                    <div className="customize_btn">
                                        <LangNavLink to={"/About/About-others/Links"} className="Btn_a" role="button" target="_self" title="VIEW MORE">
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RelatedLinksSection;
