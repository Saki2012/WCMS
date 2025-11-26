/* Banner */
import 'swiper/swiper-bundle.css';
import { BaseCarousel } from '@/SysCore/Components/BaseCarousel'
import { Link } from 'react-router-dom';
import type { components } from '@/types/api';
import * as SchemaFields from "@/types/SchemaFields";
import WebResourceProvider from '@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import { useEffect, useRef } from 'react';
import bgImg from '@/SpecFetures/1810/Assets/Client/images/bg/background-image_video_2000x1500.jpg'
import { resolveYoutubeEmbedUrl } from '@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList';


type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]

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
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Lang}`,
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Title}`,
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.ResUrl}`,
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Url_OpenType}`,
            ],
            Condition: `${SchemaFields.WebResourceFields.Categories} HasAny [29,30,31,32]`,
            OrderBy: [{ Col: SchemaFields.WebResourceFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        }),
        enabled: true,
        deps: [],
    });
};

const getDataProps = (lang: string, rawData: WebResourceSet[]) => {
    const result: DataProp[] = [];
    rawData.forEach(item => {
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

    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result.length > 0 && carouselRef.current) {
            const $owl = $(carouselRef.current);

            // Destroy if exists
            if ($owl.hasClass('owl-loaded')) {
                $owl.trigger('destroy.owl.carousel');
            }

            // Init carousel
            setTimeout(() => {
                $owl.owlCarousel({
                    items: 3,
                    loop: true,
                    dots: true,
                    nav: true,
                    margin: 30,
                    // autoplay: true,
                    autoplayTimeout: 3000,
                    autoplayHoverPause: true,
                    responsive: {
                        0: { items: 1 },
                        767: { items: 2 },
                        991: { items: 2 },
                        1200: { items: 2 }
                    }
                });

                // 設定 tabindex
                $('#Video .owl-nav button').attr('tabindex', '7');

                // 播放與暫停控制
                $('#Video_start').on('click', () => {
                    $owl.trigger('play.owl.autoplay', [6000]);
                });

                $('#Video_pause').on('click', () => {
                    $owl.trigger('stop.owl.autoplay');
                });
            }, 0);

            return () => {
                $('#Video_start').off();
                $('#Video_pause').off();
                if ($owl.hasClass('owl-loaded')) {
                    $owl.trigger('destroy.owl.carousel');
                }
            };
        }
    }, [result]);

    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors}>

            <section className="Video-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
                <div className="Mask-DivBox layout_padding1">
                    <div className="customizeBox">
                        <div className="container">
                            <div className="row">
                                <div className="col-12 + p-0">
                                    <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                        <div id="Video" className="owl-carousel owl-theme px-2" ref={carouselRef}>
                                            {/* <asp:Literal ID="Lit_Video" runat="server" /> */}
                                            {result.map((item) => {
                                                const urlRaw = item?.ResUrl ?? ""
                                                const { url } = resolveYoutubeEmbedUrl(urlRaw);
                                                return item && (
                                                    <div className="item" key={item.internalId}>
                                                        <div className="wrapper_box">
                                                            <div className="MV-item mb-3 w-100">
                                                                {/* <a className="venobox vbox-item" data-autoplay="true" data-vbtype="video" href={item.ResUrl} tabIndex={14} title={`${item.title} (另開視窗)`} target="_blank" rel="noopener noreferrer"> */}
                                                                <div className="img_wrapper">
                                                                    <div className="figure_wrapper">
                                                                        <iframe width="100%" height="315" src={url} allowFullScreen
                                                                            title={item.title} style={{ border: "0" }}
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                            referrerPolicy="strict-origin-when-cross-origin">
                                                                        </iframe>
                                                                        <span className="sr-only">{item.title}</span>
                                                                    </div>
                                                                </div>
                                                                {/* </a> */}
                                                            </div>
                                                        </div>
                                                    </div>)
                                            })}

                                        </div>
                                        {/*// Banner 控制 暫停 / 播放 按鈕 START // */}
                                        <div className="control-box">
                                            <a id="Video_start" href="#" onClick={(e) => { e.preventDefault(); }} className="play" tabIndex={14} title="播放">
                                                <div className="control_start">
                                                    <span className="control-start-icon"><span className="d-none">播放</span></span>
                                                </div>
                                            </a>
                                            <a id="Video_pause" href="#" onClick={(e) => { e.preventDefault(); }} className="stop" tabIndex={14} title="暫停">
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
        </LoadingErrorHandler >
    )
};
