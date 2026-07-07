import "swiper/swiper-bundle.css";
import bgImg from "@/SpecFetures/1810/Assets/Client/images/bg/background-image_video_2000x1500.jpg";
import type { HomePageVideoHookResult } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibMedia } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { type MutableRefObject, useEffect, useMemo, useRef } from "react";

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
    new(options: Record<string, unknown>): VenoBoxInstance;
}

interface VideoSessionGlobal
{
    $?: unknown;
    jQuery?: unknown;
    VenoBox?: unknown;
}
interface JQueryCarousel
{
    hasClass: (className: string) => boolean;
    owlCarousel?: (options: Record<string, unknown>) => JQueryCarousel;
    trigger: (eventName: string, args?: unknown[]) => JQueryCarousel;
    off: (eventName: string) => JQueryCarousel;
    on: (eventName: string, handler: () => void) => JQueryCarousel;
    attr: (name: string, value: string) => JQueryCarousel;
}

type JQueryFactory = (selector: Element | string) => JQueryCarousel;

/** Plugin 初始化重試間隔。 */
const PluginReadyRetryMs = 80;

/** Plugin 初始化最大重試次數。 */
const PluginReadyMaxRetry = 30;
// #endregion

// #region Public
/** 首頁影音專區。 */
export const VideoSession = (props: { lang: Lang; hydrationData: HomePageVideoHookResult; }) =>
{
    const source = props.hydrationData;
    const result = useMemo(() =>
    {
        return getDataProps(props.lang, source.webResourceData ?? []);
    }, [props.lang, source.webResourceData]);

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
        const el = carouselRef.current;
        if (!el) return;

        let retryCount = 0;

        const queueInit = (handler: () => void): void =>
        {
            clearInitTimer(initTimerRef);
            initTimerRef.current = window.setTimeout(handler, PluginReadyRetryMs);
        };

        const cleanup = (): void =>
        {
            const jquery = getWindowJQuery();
            const $owl = jquery ? jquery(el) : null;

            clearInitTimer(initTimerRef);
            cleanupVideoEvents(jquery);
            cleanupOwlCarousel($owl, isOwlInitedRef);
            cleanupVenobox(venoboxInstanceRef);
        };

        const tryInit = (): void =>
        {
            const jquery = getWindowJQuery();

            if (!jquery)
            {
                retryCount += 1;

                if (retryCount <= PluginReadyMaxRetry)
                {
                    queueInit(tryInit);
                    return;
                }
                return;
            }

            const $owl = jquery(el);

            if (!isOwlReady($owl))
            {
                retryCount += 1;

                if (retryCount <= PluginReadyMaxRetry)
                {
                    queueInit(tryInit);
                    return;
                }
                return;
            }

            cleanupVideoEvents(jquery);
            initOwlCarousel($owl);
            isOwlInitedRef.current = true;
            setupVideoControls(jquery, $owl);
            setupVenobox(venoboxInstanceRef);
        };

        cleanup();

        if (result.length === 0) return cleanup;

        queueInit(tryInit);

        return cleanup;
    }, [videoKey, result.length]);

    return (
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
    );
};
// #endregion

// #region Private
/** 轉換影音資料為畫面使用格式。 */
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

/** 從 YouTube 短網址取得縮圖網址。 */
const getYoutubeThumbnailFromShort = (shortUrl?: string | null): string | null =>
{
    if (!shortUrl) return null;

    const cleanUrl = shortUrl.replace(/&amp;/g, "&");
    const match = cleanUrl.match(/youtu\.be\/([^?&#/]+)/i);
    if (!match) return null;

    const videoId = match[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/** 取得全域 jQuery，避免外部 script 尚未載入時造成頁面崩潰。 */
const getWindowJQuery = (): JQueryFactory | null =>
{
    const win = window as unknown as VideoSessionGlobal;
    const jquery = typeof win.$ === "function" ? win.$ : win.jQuery;

    return typeof jquery === "function"
        ? jquery as JQueryFactory
        : null;
};
/** 取得全域 VenoBox 建構子。 */
const getWindowVenoBox = (): VenoBoxConstructor | null =>
{
    const win = window as unknown as VideoSessionGlobal;

    return typeof win.VenoBox === "function"
        ? win.VenoBox as VenoBoxConstructor
        : null;
};

/** 清除延遲初始化 timer。 */
const clearInitTimer = (initTimerRef: MutableRefObject<number | null>): void =>
{
    if (initTimerRef.current === null) return;

    window.clearTimeout(initTimerRef.current);
    initTimerRef.current = null;
};

/** 檢查 owlCarousel 是否已經可用。 */
const isOwlReady = ($owl: JQueryCarousel | null): $owl is JQueryCarousel =>
{
    return Boolean($owl && typeof $owl.owlCarousel === "function");
};

/** 解除影音控制按鈕事件。 */
const cleanupVideoEvents = (jquery: JQueryFactory | null): void =>
{
    if (!jquery) return;

    jquery("#Video_start").off("click.videoSession");
    jquery("#Video_pause").off("click.videoSession");
};

/** 銷毀 owlCarousel，避免切頁或重掛時殘留舊 DOM。 */
const cleanupOwlCarousel = ($owl: JQueryCarousel | null, isOwlInitedRef: MutableRefObject<boolean>): void =>
{
    if (isOwlInitedRef.current && $owl?.hasClass("owl-loaded"))
    {
        $owl.trigger("destroy.owl.carousel");
    }

    isOwlInitedRef.current = false;
};

/** 初始化 owlCarousel 輪播。 */
const initOwlCarousel = ($owl: JQueryCarousel): void =>
{
    $owl.owlCarousel?.({
        items: 3,
        loop: true,
        dots: true,
        nav: true,
        margin: 30,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        responsive: { 0: { items: 1 }, 767: { items: 2 }, 991: { items: 2 }, 1200: { items: 2 } },
    });
};

/** 綁定影音播放與暫停控制。 */
const setupVideoControls = (jquery: JQueryFactory, $owl: JQueryCarousel): void =>
{
    jquery("#Video .owl-nav button").attr("tabindex", "7");

    jquery("#Video_start").off("click.videoSession").on("click.videoSession", () =>
    {
        $owl.trigger("play.owl.autoplay", [6000]);
    });

    jquery("#Video_pause").off("click.videoSession").on("click.videoSession", () =>
    {
        $owl.trigger("stop.owl.autoplay");
    });
};

/** 清除 venobox instance。 */
const cleanupVenobox = (venoboxInstanceRef: MutableRefObject<VenoBoxInstance | null>): void =>
{
    if (venoboxInstanceRef.current?.destroy)
    {
        venoboxInstanceRef.current.destroy();
    }

    venoboxInstanceRef.current = null;
};

/** 初始化 venobox 影片燈箱。 */
const setupVenobox = (venoboxInstanceRef: MutableRefObject<VenoBoxInstance | null>): void =>
{
    const VenoBoxCtor = getWindowVenoBox();

    if (!VenoBoxCtor) return;

    cleanupVenobox(venoboxInstanceRef);

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
};
// #endregion
