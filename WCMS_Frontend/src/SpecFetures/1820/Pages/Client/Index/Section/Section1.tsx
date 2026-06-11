import btmImg from "@/SpecFetures/1820/Assets/Client/images/bg/bottom_img_2800x280.jpg";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibNumber } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// #region Property
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];

type BannerModel = components["schemas"]["SpecHomePage1820_BannerMedia_DTO"];

type BannerKind = "image" | "video";

type BannerItem = { keyId: string; rowId: number; src: string; alt: string; kind: BannerKind; delayMs: number; };

type SpecHomePageWeather = components["schemas"]["SpecHomePageWeather_DTO"];
// #endregion

// #region Public
/** Section1 */
export const Section1 = (props: { homePage: HomePageModel; banners: BannerModel[]; weather: SpecHomePageWeather | null; }) =>
{
    const sectionRef = useRef<HTMLElement | null>(null);
    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    const autoplayTimerRef = useRef<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    /** 宣告變數：scroll 進度 */
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    /** 宣告變數：平滑 scroll */
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

    /** 宣告變數：banner 資料 */
    const bannerItems = useMemo(() => buildBannerItems(props.banners), [props.banners]);

    /** 宣告變數：目前 banner */
    const activeBanner = bannerItems[activeIndex] ?? null;

    /** 執行：同步 section 動畫變數 */
    useMotionValueEvent(smoothProgress, "change", (value) =>
    {
        applySectionVars(sectionRef.current, value, !!prefersReducedMotion);
    });

    /** 執行：初始化 section 動畫變數 */
    useEffect(() =>
    {
        applySectionVars(sectionRef.current, 0, !!prefersReducedMotion);
    }, [prefersReducedMotion]);

    /** 執行：切到指定張 */
    const goToSlide = (nextIndex: number) =>
    {
        if (bannerItems.length === 0) return;
        setActiveIndex(nextIndex);
        setIsVideoPaused(false);
    };

    /** 執行：上一張 */
    const handlePrev = () =>
    {
        goToSlide(getPrevIndex(activeIndex, bannerItems.length));
    };

    /** 執行：下一張 */
    const handleNext = () =>
    {
        goToSlide(getNextIndex(activeIndex, bannerItems.length));
    };

    /** 執行：切換輪播播放 */
    const handleToggleCarousel = () =>
    {
        setIsCarouselPaused((prev) => !prev);
    };

    /** 執行：切換影片播放 */
    const handleToggleVideo = () =>
    {
        if (!activeBanner || activeBanner.kind !== "video") return;

        const currentVideo = videoRefs.current[activeBanner.rowId];
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

    /** 執行：同步影片狀態 */
    useEffect(() =>
    {
        if (!activeBanner) return;

        resetInactiveVideos(videoRefs.current, activeBanner.rowId);

        if (activeBanner.kind !== "video")
        {
            setIsVideoPaused(false);
            return;
        }

        const currentVideo = videoRefs.current[activeBanner.rowId];
        if (!currentVideo) return;

        if (isCarouselPaused || isVideoPaused)
        {
            currentVideo.pause();
            return;
        }

        currentVideo.play().catch(() => null);
    }, [activeBanner, isCarouselPaused, isVideoPaused]);

    /** 執行：自動輪播 */
    useEffect(() =>
    {
        if (bannerItems.length <= 1) return;
        if (prefersReducedMotion) return;
        if (isCarouselPaused) return;
        if (!activeBanner) return;

        autoplayTimerRef.current = window.setTimeout(() =>
        {
            goToSlide(getNextIndex(activeIndex, bannerItems.length));
        }, activeBanner.delayMs);

        return () =>
        {
            if (autoplayTimerRef.current == null) return;
            window.clearTimeout(autoplayTimerRef.current);
            autoplayTimerRef.current = null;
        };
    }, [activeIndex, activeBanner, bannerItems.length, isCarouselPaused, prefersReducedMotion]);

    /** 執行：減少動態時停用自動播放 */
    useEffect(() =>
    {
        if (!prefersReducedMotion) return;
        setIsCarouselPaused(true);
        pauseAllVideos(videoRefs.current);
    }, [prefersReducedMotion]);

    if (bannerItems.length === 0) return null;

    return (
        <section id="zoom" className="Zoom-section bg-custom" ref={sectionRef}>
            <div className="sticky">
                <aside className="panel panel-left" aria-hidden="true">
                    <div className="Left_txtbox">
                        <div className="tagline font-wt-xl display-8">
                            <span>{props.homePage.Section1Title_L}</span>
                        </div>
                    </div>
                </aside>

                <aside className="panel panel-right" aria-hidden="true">
                    <div className="Right_txtbox">
                        <div className="right-title font-wt-xl display-5">
                            <div className="tt_box">
                                <span>{props.homePage.Section1Title_R}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="hero-media">
                    <div className="center-vertical">
                        <span>{props.homePage.Section1Title_M}</span>
                    </div>

                    <button
                        id="videoCustomControl"
                        className="video-bottom-control"
                        type="button"
                        role="button"
                        style={{ display: activeBanner?.kind === "video" ? "inline-flex" : "none" }}
                        aria-label={isVideoPaused ? "播放影片" : "暫停影片"}
                        title={isVideoPaused ? "播放影片" : "暫停影片"}
                        onClick={handleToggleVideo}
                    >
                        <i className={`fas ${isVideoPaused ? "fa-play" : "fa-pause"}`} id="videoTopIcon" aria-hidden="true" />
                    </button>

                    <div id="mainCarousel" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            {bannerItems.map((item, index) => (
                                <div
                                    key={item.keyId}
                                    className={`carousel-item${index === activeIndex ? " active" : ""}`}
                                    data-type={item.kind}
                                    data-bs-interval={item.delayMs}
                                    aria-hidden={index !== activeIndex}
                                >
                                    {item.kind === "video"
                                        ? (
                                            <video
                                                id={index === activeIndex ? "itemVideo" : undefined}
                                                ref={(el) =>
                                                {
                                                    videoRefs.current[item.rowId] = el;
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
                                </div>
                            ))}
                        </div>

                        <div className="controls-overlay">
                            <button
                                id="carouselToggle"
                                type="button"
                                role="button"
                                className="btn-custom"
                                aria-label={isCarouselPaused ? "播放輪播" : "暫停輪播"}
                                title={isCarouselPaused ? "播放輪播" : "暫停輪播"}
                                onClick={handleToggleCarousel}
                            >
                                <i className={`fas ${isCarouselPaused ? "fa-play" : "fa-pause"}`} id="carouselIcon" aria-hidden="true" />
                            </button>

                            <button
                                type="button"
                                role="button"
                                className="btn-custom"
                                data-bs-target="#mainCarousel"
                                data-bs-slide="prev"
                                aria-label="上一張"
                                title="上一張"
                                onClick={handlePrev}
                            >
                                <i className="fas fa-chevron-left" aria-hidden="true" />
                            </button>

                            <button
                                type="button"
                                role="button"
                                className="btn-custom"
                                data-bs-target="#mainCarousel"
                                data-bs-slide="next"
                                aria-label="下一張"
                                title="下一張"
                                onClick={handleNext}
                            >
                                <i className="fas fa-chevron-right" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>

                <WeatherBox weather={props.weather} />

                <div className="mv_botom mv_body">
                    <figure className="mv_botom_figure">
                        <img src={btmImg} alt="下方裝飾風景底圖" />
                    </figure>
                </div>

                <div className="scroll-indocator down">
                    <span>SCROLL</span>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Protected
/** 同步 section CSS 變數 */
const applySectionVars = (section: HTMLElement | null, progress: number, prefersReducedMotion: boolean) =>
{
    if (!section) return;

    if (prefersReducedMotion)
    {
        section.style.setProperty("--leftW", "33vw");
        section.style.setProperty("--rightW", "33vw");
        section.style.setProperty("--sideOpacity", "1");
        section.style.setProperty("--mediaScale", "1");
        section.style.setProperty("--heroPadding", "12px");
        section.style.setProperty("--heroBg", "rgba(243, 241, 234, 1)");
        return;
    }

    const p = LibNumber.clamp(progress, 0, 1);
    const sideWidth = lerp(33, 0, p);
    const sideOpacity = LibNumber.clamp(1 - p * 1.5, 0, 1);
    const mediaScale = lerp(1, 1.15, p);
    const heroPadding = lerp(12, 0, p);
    const heroBgOpacity = LibNumber.clamp(1 - p, 0, 1);

    section.style.setProperty("--leftW", `${sideWidth}vw`);
    section.style.setProperty("--rightW", `${sideWidth}vw`);
    section.style.setProperty("--sideOpacity", `${sideOpacity}`);
    section.style.setProperty("--mediaScale", `${mediaScale}`);
    section.style.setProperty("--heroPadding", `${heroPadding}px`);
    section.style.setProperty("--heroBg", `rgba(243, 241, 234, ${heroBgOpacity})`);
};

/** 整理 banner 顯示資料 */
const buildBannerItems = (banners: BannerModel[]): BannerItem[] =>
{
    return [...banners].filter((item) => !!item.BannerFileId).map((item) =>
    {
        const kind = getBannerKind(item);
        return {
            keyId: `${item.HomePageId}_${item.RowId}`,
            rowId: item.RowId ?? 0,
            src: FileManagementAPI.get_Public_Preview_Url(item.BannerFileId),
            alt: item.BannerFileDescription || `banner-${item.RowId}`,
            kind,
            delayMs: getBannerDelay(kind),
        };
    });
};
// #endregion

// #region Private
/** 線性插值 */
const lerp = (from: number, to: number, progress: number) =>
{
    return from + (to - from) * progress;
};



/** 判斷 banner 類型 */
const getBannerKind = (item: BannerModel): BannerKind =>
{
    const fileName = (item.BannerFileDescription ?? "").toLowerCase();
    if (fileName.endsWith(".mp4") || fileName.endsWith(".webm") || fileName.endsWith(".mov")) return "video";
    return "image";
};


/** 取得輪播停留秒數 */
const getBannerDelay = (kind: BannerKind) =>
{
    return kind === "video" ? 8000 : 5000;
};


/** 取得下一張索引 */
const getNextIndex = (currentIndex: number, count: number) =>
{
    if (count <= 1) return 0;
    return (currentIndex + 1) % count;
};


/** 取得上一張索引 */
const getPrevIndex = (currentIndex: number, count: number) =>
{
    if (count <= 1) return 0;
    return (currentIndex - 1 + count) % count;
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


/** 重置非目前影片 */
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


const WeatherBox = (props: { weather: SpecHomePageWeather | null; }) =>
{
    const data = props.weather;
    const tempText = data?.Temperature ?? "--";
    const weatherText = data?.Weather ?? "--";
    const popText = data?.ProbabilityOfPrecipitation ?? "--";
    const apparentTempText = data?.ApparentTemperature ?? "--";
    const humText = data?.RelativeHumidity ?? "--";

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
// #endregion
