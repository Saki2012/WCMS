import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import img from "@/SpecFetures/1817/Assets/Client/images/Tradition_and_Art_900x210.svg";
import { LinkData } from "@/SpecFetures/1817/Pages/Client/Index/Section/LinkData";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { PerformancesPage } from "./PerformancesPage";

// #region Property
type BannerSet = components["schemas"]["BannerSet_DTO"];

type BannerDetail = NonNullable<BannerSet["BannerDetail"]>[number];

type BannerDetailInfo = NonNullable<BannerSet["BannerDetailInfo"]>[number];


interface CarouselDataProps
{
    lang: Lang;
    internalId: string;
    initialBanner: BannerSet | null;
}


type BootstrapCarouselConfig = { interval: number; ride: "carousel"; pause: false; };


type BootstrapCarouselInstance = { cycle: () => void; pause: () => void; dispose?: () => void; };


type BootstrapCarouselStatic = { getOrCreateInstance: (element: HTMLElement, config: BootstrapCarouselConfig) => BootstrapCarouselInstance; };


type SlideEvent = Event & { to?: number; };
// #endregion

// #region Public
export const CarouselData = (props: CarouselDataProps) =>
{
    // 宣告變數：adapter
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    // 宣告變數：SSR initial
    const initial = useMemo(() =>
    {
        if (!props.initialBanner) return null;
        return toInitial(props.internalId, props.initialBanner);
    }, [props.initialBanner, props.internalId]);

    // 執行 function：Banner QueryData
    const query = adapter.hooks.useQueryData({ internalId: props.internalId, initial, deps: [props.internalId] });

    // 宣告變數：資料來源
    const banner = query.data ?? null;

    // 宣告變數：排序後 banner 明細
    const sortedDetails = useMemo(() =>
    {
        return sortBannerDetails(banner);
    }, [banner]);

    // 宣告變數：輪播間隔
    const intervalMs = useMemo(() =>
    {
        return resolveIntervalMs(banner);
    }, [banner]);

    // 宣告變數：目前索引 / 播放狀態
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);

    // 宣告變數：bootstrap instance
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const carouselInsRef = useRef<BootstrapCarouselInstance | null>(null);
    const isPlayingRef = useRef<boolean>(true);

    // 宣告變數：安全索引與當前明細
    const safeIndex = getSafeIndex(currentIndex, sortedDetails.length);
    const currentDetail = sortedDetails[safeIndex];

    // 宣告變數：下方展演資訊
    const performanceData = useMemo(() =>
    {
        return getPerformanceData(banner, currentDetail, props.lang);
    }, [banner, currentDetail, props.lang]);

    // 宣告變數：播放按鈕文字
    const toggleLabel = buildToggleLabel(isPlaying);

    useEffect(() =>
    {
        // 執行 function：同步最新播放狀態
        isPlayingRef.current = isPlaying;
        applyPlayState(carouselInsRef.current, isPlaying);
    }, [isPlaying]);

    useEffect(() =>
    {
        // 執行 function：interval 變更時重建 instance
        const element = carouselRef.current;
        if (!element) return;

        let disposed = false;

        const run = async () =>
        {
            const ins = await initBootstrapCarousel(element, intervalMs);

            if (disposed)
            {
                ins.dispose?.();
                return;
            }

            carouselInsRef.current = ins;
            applyPlayState(ins, isPlayingRef.current);
        };

        run();

        return () =>
        {
            disposed = true;
            carouselInsRef.current?.dispose?.();
            carouselInsRef.current = null;
        };
    }, [intervalMs]);

    useEffect(() =>
    {
        // 執行 function：監聽 bootstrap 輪播後事件
        const element = carouselRef.current;
        if (!element) return;

        const handler = (event: Event) =>
        {
            const slideEvent = event as SlideEvent;
            if (typeof slideEvent.to !== "number") return;
            setCurrentIndex(slideEvent.to);
        };

        element.addEventListener("slid.bs.carousel", handler);

        return () =>
        {
            element.removeEventListener("slid.bs.carousel", handler);
        };
    }, []);

    useEffect(() =>
    {
        // 執行 function：資料量變動時校正索引
        if (currentIndex < sortedDetails.length) return;
        setCurrentIndex(0);
    }, [currentIndex, sortedDetails.length]);

    const onTogglePlay = (event?: MouseEvent<HTMLElement>) =>
    {
        // 執行 function：切換播放 / 暫停
        event?.preventDefault();
        setIsPlaying((prev) => !prev);
    };

    const onTogglePlayKeyDown = (event: KeyboardEvent<HTMLElement>) =>
    {
        // 執行 function：鍵盤切換播放 / 暫停
        if (!isToggleKey(event)) return;
        event.preventDefault();
        setIsPlaying((prev) => !prev);
    };

    return (
        <>
            <section className="TraditionArt_section + Layout_Padding_3_top + bg-custom-Customize_color">
                <div className="Mask-DivBox">
                    <div className="customizeBox">
                        <div className="Top_Div_All">
                            <div className="Top_inner">
                                <div className="LineIMG-0 iMG-Shape-0" />

                                <p className="P_head">
                                    <span>與世界交朋友</span>
                                    <br />
                                    <span>從臺灣的傳統音樂出發，</span>
                                </p>

                                <div className="Top_title_wrap">
                                    <div className="Top_Font_Img">
                                        <img alt="傳統 . 藝術" src={img} />
                                    </div>
                                </div>

                                <div className="Top_banner_wrap">
                                    <div className="Carousel_slide_section">
                                        <div
                                            className="carousel slide"
                                            id="B5_default_carousel"
                                            ref={carouselRef}
                                            data-bs-ride="carousel"
                                            data-bs-interval={intervalMs}
                                        >
                                            <div className="control-singlebox">
                                                <div className="control-toggle">
                                                    <a
                                                        aria-label={toggleLabel}
                                                        aria-pressed={isPlaying ? "true" : "false"}
                                                        className="carousel-toggle-btn"
                                                        id="toggleCarousel"
                                                        role="button"
                                                        tabIndex={0}
                                                        title={toggleLabel}
                                                        href="#"
                                                        onClick={onTogglePlay}
                                                        onKeyDown={onTogglePlayKeyDown}
                                                    >
                                                        <span className={clsx("control-icon", isPlaying ? "pause" : "play")} />
                                                        <span className="sr-only">{toggleLabel}</span>
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="carousel-inner">
                                                {sortedDetails.map((detail, index) =>
                                                {
                                                    const info = findBannerInfo(banner, detail, props.lang);
                                                    const alt = info?.Title ?? "";
                                                    const url = info?.URL;
                                                    const target = info?.URL_Open === 0 ? "_self" : "_blank";
                                                    const imageUrl = FileManagementAPI.get_Public_Preview_Url(detail.PicSrcId, alt);

                                                    return (
                                                        <div
                                                            key={`${detail.BannerId}-${detail.RowId}-${index}`}
                                                            className={clsx("carousel-item", index === 0 ? "active" : "")}
                                                        >
                                                            {url
                                                                ? (
                                                                    <LangNavLink
                                                                        to={url}
                                                                        target={target}
                                                                        rel={target === "_blank" ? "noopener noreferrer" : undefined}
                                                                        aria-label={alt || "banner link"}
                                                                    >
                                                                        <img src={imageUrl} className="d-block w-100" alt={alt} />
                                                                    </LangNavLink>
                                                                )
                                                                : <img src={imageUrl} className="d-block w-100" alt={alt} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="carousel-indicators">
                                                {sortedDetails.map((_, index) =>
                                                {
                                                    return (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            data-bs-target="#B5_default_carousel"
                                                            data-bs-slide-to={index}
                                                            className={clsx(index === safeIndex && "active")}
                                                            aria-current={index === safeIndex ? "true" : undefined}
                                                            aria-label={`Slide ${index + 1}`}
                                                            title={`第 ${index + 1} 張`}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            <div className="carousel_btn-icon-prev">
                                                <a
                                                    data-bs-slide="prev"
                                                    data-bs-target="#B5_default_carousel"
                                                    role="button"
                                                    tabIndex={0}
                                                    title="上一張"
                                                    href="#"
                                                    onClick={preventDefault}
                                                >
                                                    <div className="carousel-control-prev">
                                                        <span aria-hidden="true" className="carousel-control-prev-icon" />
                                                        <span className="sr-only">Previous</span>
                                                    </div>
                                                </a>
                                            </div>

                                            <div className="carousel_btn-icon-next">
                                                <a
                                                    data-bs-slide="next"
                                                    data-bs-target="#B5_default_carousel"
                                                    role="button"
                                                    tabIndex={0}
                                                    title="下一張"
                                                    href="#"
                                                    onClick={preventDefault}
                                                >
                                                    <div className="carousel-control-next">
                                                        <span aria-hidden="true" className="carousel-control-next-icon" />
                                                        <span className="sr-only">Next</span>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <LinkData lang={props.lang} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="container-customize3" style={{ height: "0px" }}>
                <Accesskey type="C" lang={props.lang} />
            </div>
            <PerformancesPage title={performanceData.title} subTitle={performanceData.subTitle} showtime={performanceData.showtime} />
        </>
    );
};
// #endregion

// #region EntityComp
const buildToggleLabel = (isPlaying: boolean): string =>
{
    // return：播放按鈕文字
    return isPlaying ? "暫停" : "播放";
};
// #endregion

// #region Private
const toOkEnv = <T,>(data: T): ApiResponse<T> =>
{
    // return：統一成功 env
    return { IsSuccess: true, SysMessage: [], Data: data };
};


const toInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // return：SSR hydration 初始資料
    return { args, apiRes: toOkEnv(data) };
};


const resolveIntervalMs = (banner: BannerSet | null): number =>
{
    // 宣告變數：後端 interval 單位為秒
    const sec = banner?.Banner?.Interval;
    const num = Number(sec);

    // return：前端 Bootstrap 需要毫秒
    if (!Number.isFinite(num) || num <= 0) return 5000;
    return Math.round(num * 1000);
};


const sortBannerDetails = (banner: BannerSet | null): BannerDetail[] =>
{
    // 宣告變數：原始明細
    const list = banner?.BannerDetail ?? [];

    // return：依 Sort 與 RowId 穩定排序
    return [...list].sort((a, b) =>
    {
        const aSort = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
        const bSort = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;

        return aSort - bSort || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
};


const findBannerInfo = (banner: BannerSet | null, detail: BannerDetail | undefined, lang: Lang): BannerDetailInfo | undefined =>
{
    // return：依當前 slide + 語系找對應資訊
    if (!detail) return undefined;

    return banner?.BannerDetailInfo?.find((item) =>
    {
        return (item.BannerId === detail.BannerId && item.ParentRowId === detail.RowId && item.Lang === lang);
    });
};


const getSafeIndex = (index: number, total: number): number =>
{
    // return：避免索引超界
    if (total <= 0) return 0;
    if (index < 0) return 0;
    if (index >= total) return 0;
    return index;
};


const getPerformanceData = (banner: BannerSet | null, detail: BannerDetail | undefined, lang: Lang) =>
{
    // 宣告變數：語系明細
    const info = findBannerInfo(banner, detail, lang);

    // return：下方展演資訊
    return { title: info?.SpecLatestShows ?? "", subTitle: info?.SpecShowLocation ?? "", showtime: info?.SpecShowDate ?? "" };
};


const applyPlayState = (carousel: BootstrapCarouselInstance | null, isPlaying: boolean): void =>
{
    // 執行 function：切換播放狀態
    if (!carousel) return;
    if (isPlaying) carousel.cycle();
    else carousel.pause();
};


const initBootstrapCarousel = async (element: HTMLElement, intervalMs: number): Promise<BootstrapCarouselInstance> =>
{
    // 宣告變數：動態載入 bootstrap carousel
    const mod = await import("bootstrap/js/dist/carousel");
    const CarouselClass = mod.default as BootstrapCarouselStatic;

    // return：建立或取得 carousel instance
    return CarouselClass.getOrCreateInstance(element, { interval: intervalMs, ride: "carousel", pause: false });
};


const preventDefault = (event: MouseEvent<HTMLElement>): void =>
{
    // 執行 function：阻止 a 標籤預設跳轉
    event.preventDefault();
};


const isToggleKey = (event: KeyboardEvent<HTMLElement>): boolean =>
{
    // return：支援 Enter / Space
    return event.key === "Enter" || event.key === " ";
};
// #endregion
