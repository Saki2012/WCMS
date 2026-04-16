import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];
type BannerDetail = NonNullable<BannerSet["BannerDetail"]>[number];
type BannerDetailInfo = NonNullable<BannerSet["BannerDetailInfo"]>[number];
type SlideDirection = "next" | "prev";

interface CarouselDataProps
{
    lang: Lang;
    internalId: string;
    initialBanner: BannerSet | null;
}

interface SlideState
{
    fromIndex: number;
    toIndex: number;
    direction: SlideDirection;
    phase: "prepare" | "animate";
}

const toOkEnv = <T,>(data: T): ApiResponse<T> =>
{
    // return：統一成功 env
    return { IsSuccess: true, SysMessage: [], Data: data };
};

const toInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // return：SSR initial data
    return { args, apiRes: toOkEnv(data) };
};

const buildBannerSetting = (banner: BannerSet | null) =>
{
    // 宣告變數：後端 interval 為秒，前端轉 ms
    const intervalRaw = banner?.Banner?.Interval;
    const speedRaw = banner?.Banner?.Speed;
    const intervalNum = typeof intervalRaw === "number" ? intervalRaw : Number(intervalRaw);
    const speedNum = typeof speedRaw === "number" ? speedRaw : Number(speedRaw);

    // return：停留時間 + 動畫時間
    return {
        interval: Number.isFinite(intervalNum) && intervalNum > 0 ? intervalNum * 1000 : 5000,
        speed: Number.isFinite(speedNum) && speedNum > 0 ? speedNum : 600,
    };
};

const sortBannerDetails = (banner: BannerSet | null): BannerDetail[] =>
{
    // 宣告變數
    const list = banner?.BannerDetail ?? [];

    // return：依 Sort 穩定排序
    return [...list].sort((a, b) =>
    {
        const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
        const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
        return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
};

const findBannerInfo = (banner: BannerSet | null, detail: BannerDetail, lang: Lang): BannerDetailInfo | undefined =>
{
    // return：找對應語系資料
    return banner?.BannerDetailInfo?.find(
        (x) => x.BannerId === detail.BannerId && x.ParentRowId === detail.RowId && x.Lang === lang,
    );
};

const clampIndex = (index: number, total: number): number =>
{
    // return：避免索引超界
    if (total <= 0) return 0;
    if (index < 0) return 0;
    if (index >= total) return 0;
    return index;
};

const getNextIndex = (index: number, total: number): number =>
{
    // return：下一張索引
    if (total <= 0) return 0;
    return (index + 1) % total;
};

const getPrevIndex = (index: number, total: number): number =>
{
    // return：上一張索引
    if (total <= 0) return 0;
    return (index - 1 + total) % total;
};

const buildIdleItemClass = (itemIndex: number, activeIndex: number): string =>
{
    // return：非動畫中 class
    return clsx("carousel-item", itemIndex === activeIndex ? "active" : "");
};

const buildSlidingItemClass = (itemIndex: number, activeIndex: number, slideState: SlideState): string =>
{
    // 宣告變數
    const isFrom = itemIndex === slideState.fromIndex;
    const isTo = itemIndex === slideState.toIndex;
    const isNext = slideState.direction === "next";

    // 執行 function：不在本次切換內的 slide
    if (!isFrom && !isTo)
    {
        return clsx("carousel-item", itemIndex === activeIndex ? "active" : "");
    }

    // 執行 function：prepare 階段
    if (slideState.phase === "prepare")
    {
        if (isFrom) return "carousel-item active";
        if (isTo)
        {
            return clsx("carousel-item", isNext ? "carousel-item-next" : "carousel-item-prev");
        }
    }

    // 執行 function：animate 階段
    if (isFrom)
    {
        return clsx(
            "carousel-item",
            "active",
            isNext ? "carousel-item-start" : "carousel-item-end",
        );
    }

    if (isTo)
    {
        return clsx(
            "carousel-item",
            isNext ? "carousel-item-next" : "carousel-item-prev",
            isNext ? "carousel-item-start" : "carousel-item-end",
        );
    }

    // return：保底
    return "carousel-item";
};

const buildItemClass = (itemIndex: number, activeIndex: number, slideState: SlideState | null): string =>
{
    // return：依是否動畫中決定 class
    if (!slideState) return buildIdleItemClass(itemIndex, activeIndex);
    return buildSlidingItemClass(itemIndex, activeIndex, slideState);
};

export const CarouselData = (props: CarouselDataProps) =>
{
    // 宣告變數：adapter
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    // 宣告變數：SSR initial
    const initial = useMemo(() =>
    {
        if (!props.initialBanner) return null;
        return toInitial(props.internalId, props.initialBanner);
    }, [props.internalId, props.initialBanner]);

    // 執行 function：QueryData（SSR 有 initial → hydration 不重抓）
    const q = adapter.hooks.useQueryData({
        internalId: props.internalId,
        initial,
        deps: [props.internalId],
    });

    // 宣告變數：統一資料來源
    const banner = q.data ?? null;

    // 宣告變數：排序資料
    const sortedDetails = useMemo(() =>
    {
        return sortBannerDetails(banner);
    }, [banner]);

    // 宣告變數：輪播設定
    const bannerSetting = useMemo(() =>
    {
        return buildBannerSetting(banner);
    }, [banner]);

    // 宣告變數：indicator 先維持目前 DOM 風格，最多三顆
    const indicatorCount = useMemo(() =>
    {
        return Math.min(3, sortedDetails.length);
    }, [sortedDetails.length]);

    // 宣告變數：當前索引 / 暫停狀態 / 動畫狀態
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [slideState, setSlideState] = useState<SlideState | null>(null);
    const finalizeTimerRef = useRef<number | null>(null);

    const activeIndicatorIndex = useMemo(() =>
    {
        // return：目前亮起 indicator
        if (indicatorCount <= 0) return 0;
        return activeIndex % indicatorCount;
    }, [activeIndex, indicatorCount]);

    const clearFinalizeTimer = useCallback((): void =>
    {
        // 執行 function：清掉動畫 finalize timer
        if (finalizeTimerRef.current === null) return;
        window.clearTimeout(finalizeTimerRef.current);
        finalizeTimerRef.current = null;
    }, []);

    const startSlide = useCallback((direction: SlideDirection): void =>
    {
        // 宣告變數
        const total = sortedDetails.length;

        // 執行 function：基本防呆
        if (total <= 1) return;
        if (slideState) return;

        const toIndex = direction === "next"
            ? getNextIndex(activeIndex, total)
            : getPrevIndex(activeIndex, total);

        // 執行 function：進入 prepare 階段
        setSlideState({
            fromIndex: activeIndex,
            toIndex,
            direction,
            phase: "prepare",
        });
    }, [activeIndex, slideState, sortedDetails.length]);

    const goToIndex = useCallback((targetIndex: number): void =>
    {
        // 宣告變數
        const total = sortedDetails.length;
        const safeIndex = clampIndex(targetIndex, total);

        // 執行 function：基本防呆
        if (total <= 1) return;
        if (slideState) return;
        if (safeIndex === activeIndex) return;

        const direction: SlideDirection = safeIndex > activeIndex ? "next" : "prev";

        // 執行 function：進入 prepare 階段
        setSlideState({
            fromIndex: activeIndex,
            toIndex: safeIndex,
            direction,
            phase: "prepare",
        });
    }, [activeIndex, slideState, sortedDetails.length]);

    const handleToggle = useCallback((): void =>
    {
        // 執行 function：切換播放/暫停
        setIsPaused((prev) => !prev);
    }, []);

    const handlePrev = useCallback((): void =>
    {
        // 執行 function：切上一張
        startSlide("prev");
    }, [startSlide]);

    const handleNext = useCallback((): void =>
    {
        // 執行 function：切下一張
        startSlide("next");
    }, [startSlide]);

    const handleIndicator = useCallback((index: number): void =>
    {
        // 執行 function：切到指定張數
        goToIndex(index);
    }, [goToIndex]);

    const preventDefaultClick = useCallback((event: MouseEvent<HTMLElement>, action: () => void): void =>
    {
        // 執行 function：阻止預設行為並執行動作
        event.preventDefault();
        action();
    }, []);

    const handleActionKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, action: () => void): void =>
    {
        // 執行 function：支援 Enter / Space
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        action();
    }, []);

    // 執行 function：資料數量變動時校正索引
    useEffect(() =>
    {
        setActiveIndex((prev) => clampIndex(prev, sortedDetails.length));
    }, [sortedDetails.length]);

    // 執行 function：prepare → animate（讓瀏覽器先吃到起始 class）
    useEffect(() =>
    {
        if (!slideState) return;
        if (slideState.phase !== "prepare") return;

        const rafId = window.requestAnimationFrame(() =>
        {
            setSlideState((prev) =>
            {
                if (!prev) return prev;
                if (prev.phase !== "prepare") return prev;
                return { ...prev, phase: "animate" };
            });
        });

        return () =>
        {
            window.cancelAnimationFrame(rafId);
        };
    }, [slideState]);

    // 執行 function：動畫結束後 finalize
    useEffect(() =>
    {
        if (!slideState) return;
        if (slideState.phase !== "animate") return;

        clearFinalizeTimer();
        finalizeTimerRef.current = window.setTimeout(() =>
        {
            setActiveIndex(slideState.toIndex);
            setSlideState(null);
            finalizeTimerRef.current = null;
        }, bannerSetting.speed);

        return () =>
        {
            clearFinalizeTimer();
        };
    }, [bannerSetting.speed, clearFinalizeTimer, slideState]);

    // 執行 function：自動輪播
    useEffect(() =>
    {
        if (isPaused) return;
        if (sortedDetails.length <= 1) return;
        if (slideState) return;

        const timer = window.setInterval(() =>
        {
            startSlide("next");
        }, bannerSetting.interval);

        return () =>
        {
            window.clearInterval(timer);
        };
    }, [bannerSetting.interval, isPaused, slideState, sortedDetails.length, startSlide]);

    // 執行 function：unmount 清 timer
    useEffect(() =>
    {
        return () =>
        {
            clearFinalizeTimer();
        };
    }, [clearFinalizeTimer]);

    // return：保留原本 DOM 結構
    return (
        <div className="col-xxl-6 col-xl-c1 col-12 Carousel_slide_section Layout_Padding_4_top Layout_Padding_5_bottom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="circle-1" />
                    <div className="container-customize4 px-0">
                        <div
                            className="carousel slide"
                            id="B5_default_carousel"
                            style={{ ["--bs-carousel-transition-duration" as never]: `${bannerSetting.speed}ms` }}
                        >
                            <div className="carousel-inner">
                                {sortedDetails.map((p, i) =>
                                {
                                    const info = findBannerInfo(banner, p, props.lang);
                                    const alt = info?.Title ?? "";
                                    const url = info?.URL;
                                    const tar = info?.URL_Open === 0 ? "_self" : "_blank";
                                    const isActive = i === activeIndex;
                                    const itemClassName = buildItemClass(i, activeIndex, slideState);
                                    const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId);
                                    return (
                                        <div
                                            key={`${p.BannerId}-${p.RowId}-${i}`}
                                            className={itemClassName}
                                            aria-hidden={!isActive && !(slideState && i === slideState.toIndex)
                                                ? true
                                                : undefined}
                                        >
                                            {url
                                                ? (
                                                    <LangNavLink
                                                        to={url}
                                                        target={tar}
                                                        rel={tar === "_blank" ? "noopener noreferrer" : undefined}
                                                        aria-label={alt || "banner link"}
                                                        tabIndex={isActive ? 0 : -1}
                                                    >
                                                        <img src={imgUrl} className="d-block w-100" alt={alt} />
                                                    </LangNavLink>
                                                )
                                                : <img src={imgUrl} className="d-block w-100" alt={alt} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="control-singlebox">
                                <div className="control-toggle">
                                    <a
                                        aria-label={isPaused ? "播放" : "暫停"}
                                        aria-pressed={isPaused ? "true" : "false"}
                                        className="carousel-toggle-btn"
                                        id="toggleCarousel"
                                        role="button"
                                        tabIndex={0}
                                        title={isPaused ? "播放" : "暫停"}
                                        type="button"
                                        onClick={(event) =>
                                        {
                                            preventDefaultClick(event, handleToggle);
                                        }}
                                        onKeyDown={(event) =>
                                        {
                                            handleActionKeyDown(event, handleToggle);
                                        }}
                                    >
                                        <span className={clsx("control-icon", isPaused ? "play" : "pause")} />
                                        <span className="sr-only">{isPaused ? "播放" : "暫停"}</span>
                                    </a>
                                </div>
                            </div>

                            <div className="carousel-indicators">
                                {Array.from({ length: indicatorCount }).map((_, i) =>
                                {
                                    const isCurrent = i === activeIndicatorIndex;
                                    return (
                                        <a
                                            key={i}
                                            tabIndex={0}
                                            title="上一張"
                                            onClick={(event) =>
                                            {
                                                preventDefaultClick(event, () =>
                                                {
                                                    handleIndicator(i);
                                                });
                                            }}
                                            onKeyDown={(event) =>
                                            {
                                                handleActionKeyDown(event, () =>
                                                {
                                                    handleIndicator(i);
                                                });
                                            }}
                                        >
                                            <button
                                                aria-current={isCurrent ? "true" : undefined}
                                                aria-label={`Slide ${i + 1}`}
                                                className={clsx(isCurrent ? "active" : "")}
                                                type="button"
                                            />
                                        </a>
                                    );
                                })}
                            </div>

                            <div className="carousel_btn-icon-prev">
                                <a
                                    role="button"
                                    tabIndex={0}
                                    title="上一張"
                                    type="button"
                                    onClick={(event) =>
                                    {
                                        preventDefaultClick(event, handlePrev);
                                    }}
                                    onKeyDown={(event) =>
                                    {
                                        handleActionKeyDown(event, handlePrev);
                                    }}
                                >
                                    <div className="carousel-control-prev">
                                        <span aria-hidden="true" className="carousel-control-prev-icon" />
                                        <span className="sr-only">Previous</span>
                                    </div>
                                </a>
                            </div>

                            <div className="carousel_btn-icon-next">
                                <a
                                    role="button"
                                    tabIndex={0}
                                    title="下一張"
                                    type="button"
                                    onClick={(event) =>
                                    {
                                        preventDefaultClick(event, handleNext);
                                    }}
                                    onKeyDown={(event) =>
                                    {
                                        handleActionKeyDown(event, handleNext);
                                    }}
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
            </div>
        </div>
    );
};
