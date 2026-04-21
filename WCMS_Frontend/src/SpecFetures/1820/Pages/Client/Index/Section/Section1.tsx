import type { components } from "@/types/api";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { A11y, Autoplay, Keyboard, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useCwaTownWeather } from "@/SpecFetures/1820/Hooks/CWA_Weather_Api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type BannerModel = components["schemas"]["SpecHomePage1820_BannerMedia_DTO"];

/** 判斷是否為影片 */
const getBannerKind = (item: BannerModel): "image" | "video" =>
{
    const fileName = (item.BannerFileDescription ?? "").toLowerCase();

    if (fileName.endsWith(".mp4") || fileName.endsWith(".webm") || fileName.endsWith(".mov"))
    {
        return "video";
    }

    return "image";
};

const buildBannerItems = (banners: BannerModel[]) =>
{
    return [...banners]
        .filter((item) => !!item.BannerFileId)
        .map((item) =>
        {
            const kind = getBannerKind(item);

            return {
                keyId: `${item.HomePageId}_${item.RowId}`,
                rowId: item.RowId,
                src: FileManagementAPI.get_Server_Preview_Url(item.BannerFileId),
                alt: item.BannerFileDescription || `banner-${item.RowId}`,
                kind,
                delayMs: getBannerDelay(kind),
            };
        });
};

/** 取得輪播停留秒數 */
const getBannerDelay = (kind: "image" | "video") =>
{
    return kind === "video" ? 8000 : 5000;
};

/** 暫停所有影片 */
const pauseAllVideos = (videoRefs: Record<number, HTMLVideoElement | null>) =>
{
    Object.values(videoRefs).forEach((video) =>
    {
        if (!video) return;
        video.pause();
    });
};

/** 重置非當前影片 */
const resetInactiveVideos = (videoRefs: Record<number, HTMLVideoElement | null>, activeRowId: number) =>
{
    Object.entries(videoRefs).forEach(([key, video]) =>
    {
        if (!video) return;
        if (Number(key) === activeRowId) return;

        video.pause();
        video.currentTime = 0;
    });
};

/** 1820 Zoom 區塊 */
export const Section1 = (props: { homePage: HomePageModel; banners: BannerModel[]; }) =>
{
    const sectionRef = useRef<HTMLElement | null>(null);
    const swiperRef = useRef<SwiperType | null>(null);
    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    /** 宣告變數：scroll 進度 */
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    /** 宣告變數：整理 banner 資料 */
    const bannerItems = useMemo(() => buildBannerItems(props.banners), [props.banners]);

    /** 宣告變數：目前顯示 banner */
    const activeBanner = bannerItems[activeIndex] ?? null;

    /** 宣告變數：平滑化進度 */
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
    /** 宣告變數：左右 panel 寬度 */
    const panelWidth = useTransform(smoothProgress, [0, 1], ["33vw", "0vw"]);
    /** 宣告變數：左右 panel 透明度 */
    const panelOpacity = useTransform(smoothProgress, [0, 0.7], [1, 0]);
    /** 宣告變數：中間 media 縮放 */
    const mediaScale = useTransform(smoothProgress, [0, 1], [1, 1.15]);
    /** 宣告變數：hero padding */
    const heroPadding = useTransform(smoothProgress, [0, 1], ["12px", "0px"]);
    /** 宣告變數：hero 背景透明度 */
    const heroBackground = useTransform(
        smoothProgress,
        [0, 1],
        ["rgba(243, 241, 234, 1)", "rgba(243, 241, 234, 0)"],
    );

    /** 執行：切到上一張 */
    const handlePrev = () => swiperRef.current?.slidePrev();

    /** 執行：切到下一張 */
    const handleNext = () => swiperRef.current?.slideNext();

    /** 執行：切換輪播播放狀態 */
    const handleToggleCarousel = () =>
    {
        const swiper = swiperRef.current;
        if (!swiper) return;

        if (isCarouselPaused)
        {
            swiper.autoplay.start();
            setIsCarouselPaused(false);
            return;
        }

        swiper.autoplay.stop();
        setIsCarouselPaused(true);
    };

    /** 執行：切換影片播放狀態 */
    const handleToggleVideo = () =>
    {
        if (!activeBanner || activeBanner.kind !== "video") return;

        const currentVideo = videoRefs.current[activeBanner.rowId ?? 0];
        if (!currentVideo) return;

        if (currentVideo.paused)
        {
            currentVideo.play().catch(() => null);
            setIsVideoPaused(false);
            return;
        }

        currentVideo.pause();
        setIsVideoPaused(true);
    };

    /** 執行：同步影片播放狀態 */
    useEffect(() =>
    {
        if (!activeBanner) return;

        resetInactiveVideos(videoRefs.current, activeBanner.rowId ?? 0);

        if (activeBanner.kind !== "video")
        {
            setIsVideoPaused(false);
            return;
        }

        const currentVideo = videoRefs.current[activeBanner.rowId ?? 0];
        if (!currentVideo) return;

        if (isCarouselPaused || isVideoPaused)
        {
            currentVideo.pause();
            return;
        }

        currentVideo.play().catch(() => null);
    }, [activeBanner, isCarouselPaused, isVideoPaused]);

    /** 執行：減少動態時停用自動輪播 */
    useEffect(() =>
    {
        const swiper = swiperRef.current;
        if (!swiper) return;

        if (prefersReducedMotion)
        {
            swiper.autoplay.stop();
            setIsCarouselPaused(true);
            pauseAllVideos(videoRefs.current);
        }
    }, [prefersReducedMotion]);

    if (bannerItems.length === 0) return null;

    return (
        <>
            <style>
                {`
                .Zoom-section {
                    position: relative;
                    height: 220svh;
                    background: var(--zoom-bg, #f3f1ea);
                }

                .Zoom-section .sticky {
                    position: sticky;
                    top: 0;
                    height: 100svh;
                    overflow: hidden;
                }

                .Zoom-section .panel {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    pointer-events: none;
                    overflow: hidden;
                }

                .Zoom-section .panel-left {
                    left: 0;
                    justify-content: flex-start;
                }

                .Zoom-section .panel-right {
                    right: 0;
                    justify-content: flex-end;
                    text-align: right;
                }

                .Zoom-section .Left_txtbox,
                .Zoom-section .Right_txtbox {
                    padding: 2rem;
                    width: 100%;
                }

                .Zoom-section .tagline,
                .Zoom-section .right-title {
                    color: #ffffff;
                    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
                    white-space: pre-line;
                }

                .Zoom-section .hero-shell {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                }

                .Zoom-section .hero-media {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .Zoom-section .center-vertical {
                    position: absolute;
                    top: 7rem;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 4;
                    color: #ffffff;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
                }

                .Zoom-section .center-vertical-link,
                .Zoom-section .center-vertical-text {
                    color: inherit;
                    text-decoration: none;
                    font-size: 1rem;
                    letter-spacing: 0.08em;
                }

                .Zoom-section .swiper,
                .Zoom-section .swiper-wrapper,
                .Zoom-section .swiper-slide {
                    width: 100%;
                    height: 100%;
                }

                .Zoom-section .media-content {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .Zoom-section .controls-overlay {
                    position: absolute;
                    left: 50%;
                    bottom: 5rem;
                    transform: translateX(-50%);
                    z-index: 5;
                    display: flex;
                    gap: 0.75rem;
                }

                .Zoom-section .btn-custom,
                .Zoom-section .video-bottom-control {
                    width: 48px;
                    height: 48px;
                    border: 0;
                    border-radius: 9999px;
                    background: rgba(0, 0, 0, 0.45);
                    color: #ffffff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .Zoom-section .video-bottom-control {
                    position: absolute;
                    top: 6.5rem;
                    right: 2rem;
                    z-index: 5;
                }

                .Zoom-section .weatherBox {
                    position: absolute;
                    left: 2rem;
                    bottom: 4rem;
                    z-index: 4;
                    min-width: 320px;
                    background: rgba(0, 0, 0, 0.32);
                    backdrop-filter: blur(8px);
                    color: #ffffff;
                    border-radius: 1rem;
                    padding: 1rem 1.25rem;
                }

                .Zoom-section .weatherInner {
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-start;
                }

                .Zoom-section .temperature .degree {
                    font-size: 2rem;
                    line-height: 1;
                }

                .Zoom-section .detailList {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .Zoom-section .detailList li {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: space-between;
                    white-space: nowrap;
                }

                .Zoom-section .mv_botom {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 3;
                }

                .Zoom-section .mv_botom_figure,
                .Zoom-section .mv_botom_figure img {
                    width: 100%;
                    margin: 0;
                    display: block;
                }

                .Zoom-section .scroll-indocator {
                    position: absolute;
                    right: 2rem;
                    bottom: 2rem;
                    z-index: 4;
                    color: #ffffff;
                    letter-spacing: 0.2em;
                    writing-mode: vertical-rl;
                }

                @media (max-width: 991.98px) {
                    .Zoom-section {
                        height: 160svh;
                    }

                    .Zoom-section .panel-left,
                    .Zoom-section .panel-right {
                        display: none;
                    }

                    .Zoom-section .weatherBox {
                        left: 1rem;
                        right: 1rem;
                        bottom: 5rem;
                        min-width: 0;
                    }

                    .Zoom-section .weatherInner {
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .Zoom-section .video-bottom-control {
                        right: 1rem;
                    }

                    .Zoom-section .controls-overlay {
                        bottom: 1.5rem;
                    }

                    .Zoom-section .scroll-indocator {
                        right: 1rem;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .Zoom-section {
                        height: 100svh;
                    }
                }
            `}
            </style>

            <section id="zoom" className="Zoom-section bg-custom" ref={sectionRef}>
                <div className="sticky">
                    <motion.aside
                        className="panel panel-left"
                        style={prefersReducedMotion
                            ? { width: "33vw", opacity: 1 }
                            : { width: panelWidth, opacity: panelOpacity }}
                    >
                        <div className="Left_txtbox">
                            <div className="tagline font-wt-xl display-8">
                                <span>{props.homePage.Section1Title_L}</span>
                            </div>
                        </div>
                    </motion.aside>

                    <motion.aside
                        className="panel panel-right"
                        style={prefersReducedMotion
                            ? { width: "33vw", opacity: 1 }
                            : { width: panelWidth, opacity: panelOpacity }}
                    >
                        <div className="Right_txtbox">
                            <div className="right-title font-wt-xl display-5">
                                <div className="tt_box">
                                    <span>{props.homePage.Section1Title_R}</span>
                                </div>
                            </div>
                        </div>
                    </motion.aside>

                    <div className="hero-shell">
                        <motion.div
                            className="hero-media"
                            style={prefersReducedMotion
                                ? { padding: "0px", backgroundColor: "rgba(243,241,234,0)" }
                                : { padding: heroPadding, backgroundColor: heroBackground }}
                        >
                            <motion.div
                                style={prefersReducedMotion ? { scale: 1 } : { scale: mediaScale }}
                                className="w-100 h-100"
                            >
                                <div className="center-vertical">
                                    {props.homePage.Section1Title_M}
                                </div>

                                {activeBanner?.kind === "video" && (
                                    <button
                                        type="button"
                                        className="video-bottom-control"
                                        aria-label={isVideoPaused ? "播放影片" : "暫停影片"}
                                        title={isVideoPaused ? "播放影片" : "暫停影片"}
                                        onClick={handleToggleVideo}
                                    >
                                        <i
                                            className={`fas ${isVideoPaused ? "fa-play" : "fa-pause"}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                )}

                                <Swiper
                                    modules={[Autoplay, Navigation, Keyboard, A11y]}
                                    onSwiper={(swiper) =>
                                    {
                                        swiperRef.current = swiper;
                                    }}
                                    onSlideChange={(swiper) =>
                                    {
                                        setActiveIndex(swiper.realIndex);
                                        setIsVideoPaused(false);
                                    }}
                                    loop={bannerItems.length > 1}
                                    keyboard={{ enabled: true }}
                                    allowTouchMove={true}
                                    autoplay={prefersReducedMotion
                                        ? false
                                        : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: false }}
                                    className="zoom-swiper"
                                >
                                    {bannerItems.map((item) => (
                                        <SwiperSlide key={item.keyId} data-swiper-autoplay={item.delayMs}>
                                            {item.kind === "video"
                                                ? (
                                                    <video
                                                        ref={(el) =>
                                                        {
                                                            videoRefs.current[item.rowId ?? 0] = el;
                                                        }}
                                                        className="media-content"
                                                        playsInline
                                                        muted
                                                        loop
                                                        preload="metadata"
                                                        aria-label={item.alt}
                                                    >
                                                        <source src={item.src} />
                                                    </video>
                                                )
                                                : <img src={item.src} className="media-content" alt={item.alt} />}
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                <div className="controls-overlay">
                                    <button
                                        type="button"
                                        className="btn-custom"
                                        aria-label={isCarouselPaused ? "播放輪播" : "暫停輪播"}
                                        title={isCarouselPaused ? "播放輪播" : "暫停輪播"}
                                        onClick={handleToggleCarousel}
                                    >
                                        <i
                                            className={`fas ${isCarouselPaused ? "fa-play" : "fa-pause"}`}
                                            aria-hidden="true"
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-custom"
                                        aria-label="上一張"
                                        title="上一張"
                                        onClick={handlePrev}
                                    >
                                        <i className="fas fa-chevron-left" aria-hidden="true" />
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-custom"
                                        aria-label="下一張"
                                        title="下一張"
                                        onClick={handleNext}
                                    >
                                        <i className="fas fa-chevron-right" aria-hidden="true" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    <WeatherBox />

                    <div className="mv_botom mv_body">
                        <figure className="mv_botom_figure">
                            <img src="/images/bg/bottom_img_2800x280.jpg" alt="下方裝飾風景底圖" />
                        </figure>
                    </div>

                    <div className="scroll-indocator down">
                        <span>SCROLL</span>
                    </div>
                </div>
            </section>
        </>
    );
};

const WeatherBox = () =>
{
    // 宣告變數：讀取新化區天氣
    const { data, isLoading } = useCwaTownWeather({ locationName: "新化區" });

    // 宣告變數：整理顯示值
    const tempText = data?.temperature ?? (isLoading ? "..." : "--");
    const weatherText = data?.weather ?? "--";
    const popText = data?.probabilityOfPrecipitation ?? "--";
    const apparentTempText = data?.apparentTemperature ?? "--";
    const humText = data?.relativeHumidity ?? "--";

    // return：保留你原本 DOM 結構
    return (
        <div className="weatherBox">
            <div className="weatherInner">
                <div className="leftBox">
                    <div className="location">
                        <span className="city">Tainan</span>
                        <br />
                        <span className="town">Xinhua</span>
                    </div>
                    <div className="temperature">
                        <span id="temp-val" className="degree">{tempText}</span>
                        <sup className="unit">°C</sup>
                    </div>
                </div>

                <div className="rightBox">
                    <ul className="detailList">
                        <li>
                            <span className="title">天氣狀態</span>
                            <span id="wx-val" className="data">{weatherText}</span>
                        </li>
                        <li>
                            <span className="title">降雨機率</span>
                            <span id="pop-val" className="data">{popText}%</span>
                        </li>
                        <li>
                            <span className="title">體感溫度</span>
                            <span id="apparent-temp-val" className="data">{apparentTempText}°C</span>
                        </li>
                        <li>
                            <span className="title">相對濕度</span>
                            <span id="hum-val" className="data">{humText}%</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
