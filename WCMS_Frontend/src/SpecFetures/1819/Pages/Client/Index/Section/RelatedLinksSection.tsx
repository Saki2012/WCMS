import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import RelatedOpenPointImg from "@/SpecFetures/1819/Assets/Client/images/links/Open_Point_bt_960x324.jpg";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { useMemo } from "react";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
/** 相關連結（Prototype: .RelatedLinks_section） */
export const RelatedLinksSection = (props: { lang: Lang }) => {

    const categoryId = 'Category20260112001'
    const pvdr = useMemo(() => { return WebResourceProvider() }, [])
    const useWebSrc = webSrcFetch(pvdr, categoryId, props.lang)
    if (!useWebSrc.rawData || useWebSrc.rawData.length === 0) return null;

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
                                        {/* TODO: 之後改成 map */}
                                        {
                                            useWebSrc.rawData.map((data) => {
                                                const id = data.WebResource?.WebResourceId
                                                const picSrc = data.WebResource?.PicId ? `${FileManagementAPI.PREVIEW_URL}/${data.WebResource?.PicId}` : ""
                                                const picTitle = data.WebResource?.PicDescription ?? "";
                                                const dt = data.WebResourceInfo?.find(p => p.Lang === props.lang);
                                                const title = dt?.Title ?? ""
                                                const url = dt?.ResUrl ?? ""
                                                const tar = dt?.Url_OpenType === 0 ? "_self" : "_blank"


                                                return (
                                                    <div key={id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-6 + mb-4">
                                                        <figure className="figure_Box">
                                                            <LangNavLink to={url} className="card_image_link" title={title} target={tar} rel={dt?.Url_OpenType === 0 ? undefined : "noopener noreferrer"}>
                                                                <div className="card_figure">
                                                                    <div className="img-wrapper">
                                                                        <img className="card_image" src={picSrc} alt={picTitle} />
                                                                    </div>
                                                                </div>
                                                            </LangNavLink>
                                                        </figure>
                                                    </div>
                                                )
                                            })


                                        }
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




const webSrcFetch = (pdvr: IDataProvider<WebResourceSet>, categoryId: string, lang: Lang) => {
    let condition: string = ``;
    condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAll ${categoryId}`);
    condition = LibMerge(" And ", false, condition, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${lang}`);
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                WebResourceFields.InternalId, WebResourceFields.WebResourceId, WebResourceFields.PicId, WebResourceFields.PicDescription,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: WebResourceFields.ModifyTime, Desc: true }],
            PageNumber: 1,
            PageSize: 8,
        }),
        enabled: true,
        deps: [categoryId, lang],
    });
};