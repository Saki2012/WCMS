import { useBannerSliderHydrationData } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import clsx from "clsx";
import { useEffect, useMemo } from "react";

type BannerSliderHydrationData = ReturnType<typeof useBannerSliderHydrationData>;
type BannerSet = NonNullable<BannerSliderHydrationData["banner"]>;

interface BannerSliderProps
{
    lang: Lang;
    hydrationData: BannerSliderHydrationData;
}
interface CarouselInstance
{
    cycle: () => void;
    pause: () => void;
    dispose?: () => void;
}
interface CarouselStatic
{
    getOrCreateInstance: (element: Element, options?: { interval?: number; }) => CarouselInstance;
    getInstance?: (element: Element) => CarouselInstance | null;
}
interface BootstrapWindow extends Window
{
    bootstrap?: { Carousel?: CarouselStatic; };
}

const SLIDE_INTERVAL = 5000;

const emptyData: BannerSet = {
    Banner: {},
    BannerDetail: [{ RowId: 1, Validate_Start: "", Validate_End: "", PicSrcId: "", FontColor: "" }],
    BannerDetailInfo: [{ ParentRowId: 1, RowId: 1, Lang: "zh-tw", Title: "", Content: "", URL: "", URL_Open: 1 }, {
        ParentRowId: 1,
        RowId: 2,
        Lang: "en",
        Title: "",
        Content: "",
        URL: "",
        URL_Open: 1,
    }],
};

/// 取得 bootstrap carousel 類別
const getBootstrapCarousel = (): CarouselStatic | null =>
{
    if (typeof window === "undefined") return null;
    return (window as BootstrapWindow).bootstrap?.Carousel ?? null;
};

/// 清除舊 carousel instance
const disposeCarousel = (id: string) =>
{
    if (typeof window === "undefined") return;

    const root = document.getElementById(id);
    const Carousel = getBootstrapCarousel();
    if (!root || !Carousel?.getInstance) return;

    Carousel.getInstance(root)?.dispose?.();
};

/// 初始化 carousel
const initCarousel = (id: string) =>
{
    if (typeof window === "undefined") return;

    disposeCarousel(id);

    const root = document.getElementById(id);
    const Carousel = getBootstrapCarousel();
    if (!root || !Carousel) return;

    const instance = Carousel.getOrCreateInstance(root, { interval: SLIDE_INTERVAL });
    instance.cycle();
};

/// 控制 carousel 播放與暫停
const handleCarouselControl = (id: string, action: "play" | "pause") =>
{
    if (typeof window === "undefined") return;

    const root = document.getElementById(id);
    const Carousel = getBootstrapCarousel();
    if (!root || !Carousel) return;

    const instance = Carousel.getOrCreateInstance(root);
    if (action === "play")
    {
        instance.cycle();
        return;
    }
    instance.pause();
};

/// 依排序欄位整理 banner 明細
const getSortedDetails = (bannerData: BannerSet) =>
{
    const list = bannerData?.BannerDetail ?? [];

    return [...list].sort((a, b) =>
    {
        const aSort = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
        const bSort = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
        if (aSort !== bSort) return aSort - bSort;

        const aRowId = Number.isFinite(a?.RowId) ? Number(a.RowId) : Number.MAX_SAFE_INTEGER;
        const bRowId = Number.isFinite(b?.RowId) ? Number(b.RowId) : Number.MAX_SAFE_INTEGER;
        return aRowId - bRowId;
    });
};

/// 依語系取得 banner 文字資料
const getBannerInfo = (bannerData: BannerSet, rowId?: number | null, bannerId?: string | null, lang?: Lang) =>
{
    return bannerData?.BannerDetailInfo?.find((item) => item.BannerId === bannerId && item.ParentRowId === rowId && item.Lang === lang) ?? null;
};

/// 組出圖片預覽網址
const getPreviewUrl = (picSrcId?: string | null) =>
{
    const id = picSrcId ?? "";
    if (!id) return "";
    return FileManagementAPI.get_Public_Preview_Url(id);
};

const PCBanner = (props: { bannerData: BannerSet; lang: Lang; sortedDetails: BannerSet["BannerDetail"]; }) =>
{
    return (
        <div
            className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-block d-lg-block d-md-block d-sm-none d-none"
            data-wow-delay="0.05s"
        >
            <div id="carousel-Controls" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">
                <div className="carousel-inner">
                    {props.sortedDetails?.map((item, index) =>
                    {
                        const info = getBannerInfo(props.bannerData, item.RowId, item.BannerId, props.lang);
                        const alt = info?.Title ?? "";
                        const url = info?.URL ?? "";
                        const target = info?.URL_Open === 0 ? "_self" : "_blank";
                        const src = getPreviewUrl(item.PicSrcId);

                        return (
                            <div key={`${item.RowId}-${index}`} className={clsx("carousel-item", index === 0 && "active")} data-bs-interval={SLIDE_INTERVAL}>
                                {!url ? <img src={src} className="d-block w-100" alt={alt} /> : (
                                    <a href={url} target={target} rel="noopener noreferrer">
                                        <img src={src} className="d-block w-100" alt={alt} />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="control-box">
                    <div className="carousel_btn-icon-prev">
                        <a
                            className="carousel-control-prev"
                            href="#carousel-Controls"
                            data-bs-target="#carousel-Controls"
                            role="button"
                            data-bs-slide="prev"
                            title="上一張"
                            tabIndex={1}
                        >
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="sr-only">Previous</span>
                        </a>
                    </div>
                    <div className="carousel_btn-icon-next">
                        <a
                            className="carousel-control-next"
                            href="#carousel-Controls"
                            data-bs-target="#carousel-Controls"
                            role="button"
                            data-bs-slide="next"
                            title="下一張"
                            tabIndex={1}
                        >
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="sr-only">Next</span>
                        </a>
                    </div>
                    <div id="cycleCarousel" className="control-start">
                        <a
                            type="button"
                            href="#"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                handleCarouselControl("carousel-Controls", "play");
                            }}
                            data-bs-target="#carousel-Controls"
                            title="播放"
                            tabIndex={1}
                        >
                            <span className="control-start-icon"></span>
                            <span className="sr-only">播放</span>
                        </a>
                    </div>
                    <div id="pauseCarousel" className="control-pause">
                        <a
                            type="button"
                            href="#"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                handleCarouselControl("carousel-Controls", "pause");
                            }}
                            data-bs-target="#carousel-Controls"
                            title="暫停"
                            tabIndex={1}
                        >
                            <span className="control-pause-icon"></span>
                            <span className="sr-only">暫停</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MobileBanner = (props: { bannerData: BannerSet; lang: Lang; sortedDetails: BannerSet["BannerDetail"]; }) =>
{
    return (
        <div className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-none d-lg-none d-md-none d-sm-block" data-wow-delay="0.05s">
            <div id="carousel-Controls_MB" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">
                <div className="carousel-inner">
                    {props.sortedDetails?.map((item, index) =>
                    {
                        const alt = getBannerInfo(props.bannerData, item.RowId, item.BannerId, props.lang)?.Title ?? "";
                        const src = getPreviewUrl(item.PicSrcId);

                        return (
                            <div key={`${item.RowId}-${index}`} className={clsx("carousel-item", index === 0 && "active")} data-bs-interval={SLIDE_INTERVAL}>
                                <img src={src} className="d-block w-100" alt={alt} />
                            </div>
                        );
                    })}
                </div>

                <div className="control-box">
                    <div className="carousel_btn-icon-prev">
                        <a
                            className="carousel-control-prev"
                            href="#carousel-Controls_MB"
                            type="button"
                            data-bs-target="#carousel-Controls_MB"
                            data-bs-slide="prev"
                            title="上一張"
                            tabIndex={1}
                        >
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="sr-only">Previous</span>
                        </a>
                    </div>
                    <div className="carousel_btn-icon-next">
                        <a
                            className="carousel-control-next"
                            href="#carousel-Controls_MB"
                            type="button"
                            data-bs-target="#carousel-Controls_MB"
                            data-bs-slide="next"
                            title="下一張"
                            tabIndex={1}
                        >
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="sr-only">Next</span>
                        </a>
                    </div>
                    <div id="cycleCarousel_MB" className="control-start">
                        <a
                            type="button"
                            href="#carousel-Controls_MB"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                handleCarouselControl("carousel-Controls_MB", "play");
                            }}
                            title="播放"
                            tabIndex={1}
                        >
                            <span className="control-start-icon"></span>
                            <span className="sr-only">播放</span>
                        </a>
                    </div>
                    <div id="pauseCarousel_MB" className="control-pause">
                        <a
                            type="button"
                            href="#carousel-Controls_MB"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                handleCarouselControl("carousel-Controls_MB", "pause");
                            }}
                            title="暫停"
                            tabIndex={1}
                        >
                            <span className="control-pause-icon"></span>
                            <span className="sr-only">暫停</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const BannerSlider = (props: BannerSliderProps) =>
{
    // 宣告變數：改由 loader / hydration 提供 banner 資料
    const bannerData = props.hydrationData.banner ?? emptyData;

    // 宣告變數：維持舊版 detail 排序規則
    const sortedDetails = useMemo(() => getSortedDetails(bannerData), [bannerData]);

    useEffect(() =>
    {
        if (!sortedDetails.length) return;

        initCarousel("carousel-Controls");
        initCarousel("carousel-Controls_MB");

        return () =>
        {
            disposeCarousel("carousel-Controls");
            disposeCarousel("carousel-Controls_MB");
        };
    }, [sortedDetails]);

    return (
        <section className="carousel_slide_section">
            <div className="sidebar-index">
                <div className="scroll_Down">
                    <a href="#content" className="eng_font">SCROLL</a>
                </div>
            </div>

            <PCBanner bannerData={bannerData} lang={props.lang} sortedDetails={sortedDetails} />
            <MobileBanner bannerData={bannerData} lang={props.lang} sortedDetails={sortedDetails} />
        </section>
    );
};
