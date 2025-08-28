/* Banner */
import 'swiper/swiper-bundle.css';
import { BaseCarousel } from '../../../../SysCore/Components/BaseCarousel'
import { Link } from 'react-router-dom';
import type { components } from '../../../../types/api';
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
import * as SchemaFields from "../../../../types/SchemaFields";
import WebResourceProvider from '../../../../Features/Server/Layout/BizFunc/WebManagement/WebResource/WebResource_Api';
import { useFetchGridListData } from '../../../../SysCore/Utils/API/FetchGridListData';
import LoadingErrorHandler from '../../../../SysCore/Components/LoadingErrorHandler';

interface DataProp { internalId: string; title: string; ResUrl: string; }

const useWebResourceList = () => {
    const provider = WebResourceProvider();
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.WebResourceFields.InternalId,
                SchemaFields.WebResourceFields.WebResourceId,
                SchemaFields.WebResourceFields.Categories,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Lang}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Title}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.ResUrl}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Url_OpenType}`,
            ],
            Condition: "",
            PageNumber: 1,
            PageSize: 10,
        }),
        enabled: true,
        deps: [],
    });
};

const getDataProps = (lang: string, rawData: WebResourceSet[],) => {
    const allowCategories = ["29", "30", "31", "32"];
    const result: DataProp[] = [];
    rawData.filter(item => {
        const cats = (item.WebResource?.Categories ?? "").split(",").map(c => c.trim());
        return cats.some(c => allowCategories.includes(c));
    }).forEach(item => {
        const detail = item.WebResourceInfo?.find(p => p.Lang === lang);
        result.push({
            internalId: item.WebResource?.InternalId ?? "",
            title: detail?.Title ?? "",
            ResUrl: detail?.ResUrl ?? ""
        });
    });
    return result
}

export const VideoSession = () => {

    BaseCarousel({ selectorId: '#Video', itemCount: 3 });
    const lang = "zh-tw"
    const useData = useWebResourceList()
    const result: DataProp[] = getDataProps(lang, useData.rawData);

    const isLoading = [useData.isLoading]
    const errors = [useData.error]


    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors}>

            <section className="Vedio-section owl-box" style={{ backgroundImage: "url(/Legacy/Client/Images/bg/background-image_video_2000x1500.jpg)" }}>
                <div className="Mask-DivBox layout_padding1">
                    <div className="customizeBox">
                        <div className="container">
                            <div className="row">
                                <div className="col-12 + p-0">
                                    <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                        <div id="Vedio" className="owl-carousel owl-theme px-2">
                                            {/* <asp:Literal ID="Lit_Video" runat="server" /> */}

                                            <div className="owl-stage-outer">
                                                <div className="owl-stage">
                                                    {result.map((item) => {
                                                        return (<div className="owl-item">
                                                            <div className="item">
                                                                <div className="wrapper_box">
                                                                    <div className="MV-item mb-3 w-100">
                                                                        <a className="venobox vbox-item" data-autoplay="true" data-vbtype="video" href={item.ResUrl} tabIndex={14} title={`${item.title} (另開視窗)`} target="_blank" rel="noopener noreferrer">
                                                                            <div className="img_wrapper">
                                                                                <div className="figure_wrapper">
                                                                                    <iframe width="100%" height="315" src={item.ResUrl} allowFullScreen
                                                                                        title={item.title} style={{ border: "0" }}
                                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                                        referrerPolicy="strict-origin-when-cross-origin">
                                                                                    </iframe>
                                                                                    <span className="sr-only">{item.title}</span>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>)
                                                    })}
                                                </div>
                                            </div>

                                            <div className="owl-nav">
                                                <button type="button" role="presentation" className="owl-prev" tabIndex={7}>
                                                    <span aria-label="Previous" title="上一張">
                                                        <span className="d-none">上一張</span>
                                                    </span>
                                                </button>
                                                <button type="button" role="presentation" className="owl-next" tabIndex={7}>
                                                    <span aria-label="Next" title="下一張">
                                                        <span className="d-none">下一張</span>
                                                    </span>
                                                </button>
                                            </div>
                                            <div className="owl-dots">
                                                <button role="button" className="owl-dot">
                                                    <span></span>
                                                </button>
                                                <button role="button" className="owl-dot active">
                                                    <span></span>
                                                </button>
                                            </div>
                                        </div>
                                        {/*// Banner 控制 暫停 / 播放 按鈕 START // */}
                                        <div className="control-box">
                                            <a id="Vedio_start" href="#" onClick={(e) => { e.preventDefault(); }} className="play" tabIndex={14} title="播放">
                                                <div className="control_start">
                                                    <span className="control-start-icon"><span className="d-none">播放</span></span>
                                                </div>
                                            </a>
                                            <a id="Vedio_pause" href="#" onClick={(e) => { e.preventDefault(); }} className="stop" tabIndex={14} title="暫停">
                                                <div className="control_pause">
                                                    <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                                </div>
                                            </a>
                                        </div>
                                        <div className="btn_Div justify-content-end px-2">
                                            <div className="customize_btn my-3">
                                                <Link to="/EventHighlights/Event-video" className="Btn_s1" tabIndex={14} title="更多影音">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LoadingErrorHandler>
    )
};
