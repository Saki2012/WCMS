import "swiper/swiper-bundle.css";
import bgImg from "@/SpecFetures/1810/Assets/Client/images/bg/background-image_video_2000x1500.jpg";
import type { HomePageVideoHookResult } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibMedia } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

interface DataProp
{
    internalId: string;
    title: string;
    ResUrl: string;
}

interface VenoBoxInstance
{
    destroy?: () => void;
}

interface VenoBoxConstructor
{
    new(
        options: {
            selector: string;
            autoplay: boolean;
            maxWidth: string;
            border: string;
            titleattr: string;
            numeration: boolean;
            infinigall: boolean;
            share: boolean;
        },
    ): VenoBoxInstance;
}

interface JQueryCarousel
{
    hasClass: (className: string) => boolean;
    owlCarousel: (options: Record<string, unknown>) => void;
    trigger: (eventName: string, args?: unknown[]) => void;
}

interface BootstrapWindow extends Window
{
    VenoBox?: VenoBoxConstructor;
}
// #endregion

// #region Public
export const VideoSession = (props: { lang: Lang; hydrationData: HomePageVideoHookResult; }) =>
{
    // 宣告變數：統一吃 Homepage hydration source
    const source = props.hydrationData;

    // 宣告變數：保留原本資料轉換規則
    const result = useMemo(() =>
    {
        return getDataProps(props.lang, source.webResourceData ?? []);
    }, [props.lang, source.webResourceData]);

    // 宣告變數：用 key 強制 remount，避免 owl 改過的 DOM 與 React 衝突
    const videoKey = useMemo(() =>
    {
        const ids = result.map((p) => p.internalId).join("|");
        return `${props.lang}|${ids || "__empty__"}`;
    }, [props.lang, result]);

    const carouselRef = useRef<HTMLDivElement>(null);
    const venoboxInstanceRef = useRef<VenoBoxInstance | null>(null);
    const initTimerRef = useRef<number | null>(null);
    const isOwlInitedRef = useRef(false);

    useEffect(() =>
    {
        // 宣告變數
        const el = carouselRef.current;
        if (!el) return;

        const $owl = $(el) as unknown as JQueryCarousel;

        const cleanupVenobox = () =>
        {
            // 執行 function：清掉舊的 venobox instance
            if (venoboxInstanceRef.current?.destroy)
            {
                venoboxInstanceRef.current.destroy();
            }

            venoboxInstanceRef.current = null;
        };

        const cleanup = () =>
        {
            // 執行 function：清掉延遲 init
            if (initTimerRef.current !== null)
            {
                window.clearTimeout(initTimerRef.current);
                initTimerRef.current = null;
            }

            // 執行 function：解除事件綁定
            $("#Video_start").off("click.videoSession");
            $("#Video_pause").off("click.videoSession");

            // 執行 function：銷毀 owl carousel
            if (isOwlInitedRef.current && $owl.hasClass("owl-loaded"))
            {
                $owl.trigger("destroy.owl.carousel");
            }

            isOwlInitedRef.current = false;
            cleanupVenobox();
        };

        // 執行 function：先清一輪，避免 StrictMode / 重 mount 殘留
        cleanup();

        // 執行 function：無資料就不初始化
        if (result.length === 0) return;

        initTimerRef.current = window.setTimeout(() =>
        {
            if (!carouselRef.current) return;

            // 執行 function：初始化 owl carousel
            $owl.owlCarousel({
                items: 3,
                loop: true,
                dots: true,
                nav: true,
                margin: 30,
                autoplayTimeout: 3000,
                autoplayHoverPause: true,
                responsive: { 0: { items: 1 }, 767: { items: 2 }, 991: { items: 2 }, 1200: { items: 2 } },
            });

            isOwlInitedRef.current = true;

            // 執行 function：設定 tabindex
            $("#Video .owl-nav button").attr("tabindex", "7");

            // 執行 function：播放與暫停控制
            $("#Video_start").off("click.videoSession").on("click.videoSession", () =>
            {
                $owl.trigger("play.owl.autoplay", [6000]);
            });

            $("#Video_pause").off("click.videoSession").on("click.videoSession", () =>
            {
                $owl.trigger("stop.owl.autoplay");
            });

            // 執行 function：初始化 venobox
            if (typeof window !== "undefined")
            {
                const venoboxWindow = window as BootstrapWindow;
                const VenoBoxCtor = venoboxWindow.VenoBox;

                if (VenoBoxCtor)
                {
                    cleanupVenobox();

                    venoboxInstanceRef.current = new VenoBoxCtor({
                        selector: "#Video .venobox",
                        autoplay: true,
                        maxWidth: "1200px",
                        border: "0px",
                        titleattr: "title",
                        numeration: true,
                        infinigall: true,
                        share: true,
                    });
                }
            }
        }, 0);

        return cleanup;
    }, [videoKey]);

    return (
        // <LoadingErrorHandler loadingList={isLoading} errorList={errors}>
        <section className="Video-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding1">
                <div className="customizeBox">
                    <div className="container">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                    <div id="Video" className="owl-carousel owl-theme px-2" ref={carouselRef} key={videoKey}>
                                        {result.map((item) =>
                                        {
                                            const urlRaw = item?.ResUrl ?? "";
                                            const { url } = LibMedia.resolveYoutubeEmbedUrl(urlRaw);
                                            if (!url) return null;

                                            const thumbUrl = getYoutubeThumbnailFromShort(urlRaw);

                                            return (
                                                <div className="item" key={item.internalId}>
                                                    <div className="wrapper_box">
                                                        <div className="MV-item mb-3 w-100">
                                                            <a
                                                                className="venobox"
                                                                data-autoplay="true"
                                                                data-vbtype="video"
                                                                href={url}
                                                                tabIndex={14}
                                                                title={item.title}
                                                            >
                                                                <div className="img_wrapper">
                                                                    <div className="figure_wrapper">
                                                                        <div
                                                                            style={{
                                                                                position: "relative",
                                                                                width: "100%",
                                                                                paddingTop: "56.25%",
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
                                        <a
                                            id="Video_start"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="play"
                                            tabIndex={14}
                                            title="播放"
                                        >
                                            <div className="control_start">
                                                <span className="control-start-icon">
                                                    <span className="d-none">播放</span>
                                                </span>
                                            </div>
                                        </a>
                                        <a
                                            id="Video_pause"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="stop"
                                            tabIndex={14}
                                            title="暫停"
                                        >
                                            <div className="control_pause">
                                                <span className="control-pause-icon">
                                                    <span className="d-none">暫停</span>
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <LangLink to="/EventHighlights/Event-video" className="Btn_s1" tabIndex={14} title="更多影音">
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangLink>
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
    );
};
// #endregion

// #region Private
const getDataProps = (lang: string, rawData: WebResourceSet[]): DataProp[] =>
{
    const result: DataProp[] = [];

    rawData.forEach((item) =>
    {
        const detail = item.WebResourceInfo?.find((p) => p.Lang === lang);

        result.push({ internalId: item.WebResource?.InternalId ?? "", title: detail?.Title ?? "", ResUrl: detail?.ResUrl ?? "" });
    });

    return result;
};

const getYoutubeThumbnailFromShort = (shortUrl?: string | null): string | null =>
{
    if (!shortUrl) return null;

    const cleanUrl = shortUrl.replace(/&amp;/g, "&");
    const match = cleanUrl.match(/youtu\.be\/([^?&#/]+)/i);
    if (!match) return null;

    const videoId = match[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};
// #endregion
