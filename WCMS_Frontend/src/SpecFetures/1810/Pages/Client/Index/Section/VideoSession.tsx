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
    const venoboxInstanceRef = useRef<any | null>(null);

    useEffect(() => {
        if (result.length > 0 && carouselRef.current) {
            const $owl = $(carouselRef.current);

            // Destroy if exists
            if ($owl.hasClass('owl-loaded')) {
                $owl.trigger('destroy.owl.carousel');
            }

            setTimeout(() => {
                // 初始化 owl carousel
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

                // ★ 初始化 VenoBox（燈箱）
                if (typeof window !== 'undefined' && (window as any).VenoBox) {
                    // 先清掉舊的 instance，避免重複 bind
                    if (venoboxInstanceRef.current &&
                        typeof venoboxInstanceRef.current.destroy === 'function') {
                        venoboxInstanceRef.current.destroy();
                    }

                    venoboxInstanceRef.current = new (window as any).VenoBox({
                        selector: '#Video .venobox',
                        autoplay: true,
                        maxWidth: '1200px',
                        border: '0px',
                        titleattr: 'title',
                        numeration: true,
                        infinigall: true,
                        share: true,
                    });
                }
            }, 0);

            return () => {
                $('#Video_start').off();
                $('#Video_pause').off();
                if ($owl.hasClass('owl-loaded')) {
                    $owl.trigger('destroy.owl.carousel');
                }

                if (venoboxInstanceRef.current &&
                    typeof venoboxInstanceRef.current.destroy === 'function') {
                    venoboxInstanceRef.current.destroy();
                    venoboxInstanceRef.current = null;
                }
            };
        }
    }, [result]);

    return (
        // <LoadingErrorHandler loadingList={isLoading} errorList={errors}>
        <section className="Video-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding1">
                <div className="customizeBox">
                    <div className="container">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                    <div id="Video" className="owl-carousel owl-theme px-2" ref={carouselRef}>
                                        {result.map((item) => {
                                            const urlRaw = item?.ResUrl ?? "";
                                            const { url } = resolveYoutubeEmbedUrl(urlRaw); // 這裡是 embed 版
                                            if (!url) return null;
                                            // 用短網址算出縮圖
                                            const thumbUrl = getYoutubeThumbnailFromShort(urlRaw);

                                            return (
                                                <div className="item" key={item.internalId}>
                                                    <div className="wrapper_box">
                                                        <div className="MV-item mb-3 w-100">
                                                            {/* venobox 只吃 href，真正影片在燈箱裡播 */}
                                                            <a
                                                                className="venobox"
                                                                data-autoplay="true"
                                                                data-vbtype="video"
                                                                href={url}
                                                                tabIndex={14}
                                                                title={item.title}
                                                            // target="_blank"
                                                            // rel="noopener noreferrer"
                                                            >
                                                                <div className="img_wrapper">
                                                                    <div className="figure_wrapper">
                                                                        {/* 縮圖區塊：16:9 比例 */}
                                                                        <div
                                                                            style={{
                                                                                position: "relative",
                                                                                width: "100%",
                                                                                paddingTop: "56.25%", // 16:9
                                                                                overflow: "hidden",
                                                                            }}
                                                                        >
                                                                            {thumbUrl && (
                                                                                <img
                                                                                    src={thumbUrl}
                                                                                    alt={`${item.title} 預覽圖`}
                                                                                    style={{
                                                                                        position: "absolute",
                                                                                        inset: 0,
                                                                                        width: "100%",
                                                                                        height: "100%",
                                                                                        objectFit: "cover",
                                                                                    }}
                                                                                />
                                                                            )}

                                                                            {/* 播放按鈕覆蓋在縮圖上，對齊 prototype 的寫法 */}
                                                                            <div
                                                                                className="popup-video play-btn style1"
                                                                                style={{
                                                                                    position: "absolute",
                                                                                    inset: 0,
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                }}
                                                                            >
                                                                                <i className="fa fa-play" aria-hidden="true" />
                                                                                <span className="sr-only">播放 {item.title}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
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
        // </LoadingErrorHandler >
    )
};

const getYoutubeThumbnailFromShort = (shortUrl?: string | null): string | null => {
    if (!shortUrl) return null;

    const cleanUrl = shortUrl.replace(/&amp;/g, "&");
    // 只處理 https://youtu.be/{id} 這種
    const match = cleanUrl.match(/youtu\.be\/([^?&#/]+)/i);
    if (!match) return null;

    const videoId = match[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; // 官方縮圖
};