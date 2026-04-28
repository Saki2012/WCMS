import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef, useState } from "react";

type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type NewsDateParts = { year: string; monthDay: string; fullDate: string; };

const NEWS_MARGIN = 30;
const AUTOPLAY_MS = 5000;

/** 取得切換按鈕描述 */
const getToggleLabel = (isPlaying: boolean) =>
{
    return isPlaying ? "圖片輪播播放中，點擊暫停" : "圖片輪播已暫停，點擊播放";
};

/** 取得切換按鈕 title */
const getToggleTitle = (isPlaying: boolean) =>
{
    return isPlaying ? "暫停" : "播放";
};

/** 取得目前視窗寬度 */
const getViewportWidth = () =>
{
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
};

/** 依 prototype 斷點取得顯示張數 */
const getItemsPerView = (viewportWidth: number) =>
{
    if (viewportWidth >= 991) return 3;
    if (viewportWidth >= 767) return 2;
    return 1;
};

/** 取得初始外框寬度 */
const getInitialOuterWidth = () =>
{
    const viewportWidth = getViewportWidth();
    if (viewportWidth >= 1400) return 1320;
    if (viewportWidth >= 1200) return 1140;
    if (viewportWidth >= 992) return 960;
    if (viewportWidth >= 768) return 720;
    return Math.max(viewportWidth - 32, 320);
};

/** 限制索引範圍 */
const clampIndex = (value: number, maxValue: number) =>
{
    if (value < 0) return 0;
    if (value > maxValue) return maxValue;
    return value;
};

/** 取得最大起始索引 */
const getMaxStartIndex = (count: number, itemsPerView: number) =>
{
    return Math.max(0, count - itemsPerView);
};

/** 判斷是否在目前可見範圍 */
const isActiveItem = (index: number, startIndex: number, itemsPerView: number) =>
{
    return index >= startIndex && index < startIndex + itemsPerView;
};

/** 取得下一個索引 */
const getNextIndex = (currentIndex: number, maxIndex: number, loop: boolean) =>
{
    if (currentIndex >= maxIndex) return loop ? 0 : maxIndex;
    return currentIndex + 1;
};

/** 整理分類名稱 */
const formatCategoryNames = (value?: string | null, categoryMap?: Record<string, string>) =>
{
    const ids = `${value ?? ""}`.split(",").map(s => s.trim()).filter(Boolean);
    const names = ids.map(id => categoryMap?.[id]).filter((s): s is string => Boolean(s));
    return names.join("、");
};

/** 格式化日期字串 */
const formatNewsDate = (value?: string | null): NewsDateParts =>
{
    const raw = `${value ?? ""}`.trim();
    if (!raw) return { year: "--", monthDay: "--.--", fullDate: "" };

    const datePart = raw.split("T")[0] ?? "";
    const seg = datePart.split("-");
    if (seg.length < 3) return { year: raw, monthDay: "--.--", fullDate: raw };

    const year = seg[0] || "--";
    const month = (seg[1] || "--").padStart(2, "0");
    const day = (seg[2] || "--").padStart(2, "0");
    return { year, monthDay: `${month}.${day}`, fullDate: `${year}-${month}-${day}` };
};

/** 取得圖片預覽網址 */
const getNewsImageUrl = (item: AnnouncementSet) =>
{
    return FileManagementAPI.get_Public_Preview_Url(item.Announcement?.PictureId);
};

/** 取得圖片替代文字 */
const getNewsImageAlt = (item: AnnouncementSet, title?: string) =>
{
    return item.Announcement?.PicDescription ?? title ?? "";
};

/** 取得卡片連結 */
const getNewsLink = (viewMoreLink?: string | null, item?: AnnouncementSet) =>
{
    return LibMerge("/", false, viewMoreLink, item?.Announcement?.InternalId);
};

/** 最新消息輪播 */
export const Section3 = (props: { lang: Lang; homePage: HomePageModel; announcements: AnnouncementSet[]; announcementCategoryMap: Record<string, string>; }) =>
{
    const outerRef = useRef<HTMLDivElement | null>(null);
    const annDetail = props.announcements ?? [];
    const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
    const [outerWidth, setOuterWidth] = useState(getInitialOuterWidth);
    const [startIndex, setStartIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    /** 宣告變數：目前顯示張數 */
    const itemsPerView = useMemo(() => getItemsPerView(viewportWidth), [viewportWidth]);

    /** 宣告變數：最大起始索引 */
    const maxStartIndex = useMemo(() => getMaxStartIndex(annDetail.length, itemsPerView), [annDetail.length, itemsPerView]);

    /** 宣告變數：單張寬度 */
    const itemWidth = useMemo(() =>
    {
        const totalMargin = NEWS_MARGIN * Math.max(0, itemsPerView - 1);
        return Math.max(0, (outerWidth - totalMargin) / itemsPerView);
    }, [outerWidth, itemsPerView]);

    /** 宣告變數：舞台總寬 */
    const stageWidth = useMemo(() =>
    {
        if (annDetail.length === 0) return 0;
        return annDetail.length * itemWidth + Math.max(0, annDetail.length - 1) * NEWS_MARGIN;
    }, [annDetail.length, itemWidth]);

    /** 宣告變數：位移量 */
    const translateX = useMemo(() =>
    {
        return startIndex * (itemWidth + NEWS_MARGIN);
    }, [startIndex, itemWidth]);

    /** 宣告變數：是否可切換 */
    const canNavigate = annDetail.length > itemsPerView;

    /** 宣告變數：上一筆是否禁用 */
    const isPrevDisabled = startIndex <= 0;

    /** 宣告變數：下一筆是否禁用 */
    const isNextDisabled = startIndex >= maxStartIndex;

    /** 執行：同步版寬 */
    useEffect(() =>
    {
        const syncLayout = () =>
        {
            setViewportWidth(getViewportWidth());
            setOuterWidth(outerRef.current?.clientWidth ?? getInitialOuterWidth());
        };

        syncLayout();
        window.addEventListener("resize", syncLayout);
        return () => window.removeEventListener("resize", syncLayout);
    }, []);

    /** 執行：限制目前索引 */
    useEffect(() =>
    {
        setStartIndex(prev => clampIndex(prev, maxStartIndex));
    }, [maxStartIndex]);

    /** 執行：自動播放 */
    useEffect(() =>
    {
        if (!isPlaying) return;
        if (!canNavigate) return;

        const timer = window.setInterval(() =>
        {
            setStartIndex(prev => getNextIndex(prev, maxStartIndex, true));
        }, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [isPlaying, canNavigate, maxStartIndex]);

    /** 執行：切到上一筆 */
    const handlePrev = () =>
    {
        setStartIndex(prev => clampIndex(prev - 1, maxStartIndex));
    };

    /** 執行：切到下一筆 */
    const handleNext = () =>
    {
        setStartIndex(prev => clampIndex(prev + 1, maxStartIndex));
    };

    /** 執行：切換自動播放 */
    const toggleAutoplay = () =>
    {
        setIsPlaying(prev => !prev);
    };

    /** 執行：點擊切換自動播放 */
    const handleToggleAutoplayClick = (e: React.MouseEvent<HTMLAnchorElement>) =>
    {
        e.preventDefault();
        toggleAutoplay();
    };

    /** 執行：鍵盤切換自動播放 */
    const handleToggleAutoplayKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        toggleAutoplay();
    };

    return (
        <section className="LatestNews_section owl-box Layout_Padding_3_top Layout_Padding_3_bottom bg-custom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="Header_Div">
                                    <div className="title-accent font-wt-lg">{props.homePage.AnnouncementSubTitle}</div>
                                    <div className="main-title display-5">
                                        <span>{props.homePage.AnnouncementTitle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="content-box px-0 mb-5">
                                    <div className="DIV-singleBox">
                                        <div className="control-singlebox">
                                            <a
                                                id="News_toggle"
                                                href="#"
                                                className="toggle ms-1"
                                                role="button"
                                                aria-label={getToggleLabel(isPlaying)}
                                                aria-pressed={isPlaying}
                                                title={getToggleTitle(isPlaying)}
                                                onClick={handleToggleAutoplayClick}
                                                onKeyDown={handleToggleAutoplayKeyDown}
                                            >
                                                <div className={`control-toggle ${isPlaying ? "control-pause-icon" : "control-play-icon"}`}>
                                                    <span className="sr-only">{getToggleLabel(isPlaying)}</span>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    <div id="News_owl_carousel" className="owl-carousel owl-theme owl-loaded owl-drag">
                                        <div className="owl-stage-outer" ref={outerRef}>
                                            <div
                                                className="owl-stage"
                                                style={{
                                                    width: stageWidth > 0 ? `${stageWidth}px` : undefined,
                                                    transform: `translate3d(-${translateX}px, 0px, 0px)`,
                                                    transition: "transform 0.35s ease",
                                                }}
                                            >
                                                {annDetail.map((item, index) =>
                                                {
                                                    const detail = item.AnnouncementDetail?.find(p => p.Lang === props.lang);
                                                    const categoryText = formatCategoryNames(item.Announcement?.Categories, props.announcementCategoryMap);
                                                    const dateInfo = formatNewsDate(item.Announcement?.Validate_Start);
                                                    const imageUrl = getNewsImageUrl(item);
                                                    const imageAlt = getNewsImageAlt(item, detail?.Title ?? "");
                                                    const linkUrl = getNewsLink(props.homePage.Announcement_ViewMoreLink, item);
                                                    const activeClass = isActiveItem(index, startIndex, itemsPerView) ? " active" : "";

                                                    return (
                                                        <div
                                                            key={item.Announcement?.InternalId ?? `news-${index}`}
                                                            className={`owl-item${activeClass}`}
                                                            style={{
                                                                width: `${itemWidth}px`,
                                                                marginRight: index === annDetail.length - 1 ? "0px" : `${NEWS_MARGIN}px`,
                                                            }}
                                                            aria-hidden={!isActiveItem(index, startIndex, itemsPerView)}
                                                        >
                                                            <div className="item">
                                                                <LangNavLink to={linkUrl} target="_self" title={detail?.Title ?? ""}>
                                                                    <div className="news-item">
                                                                        <div className="row g-0">
                                                                            <div className="col-6 left_All">
                                                                                <div className="card-cat">
                                                                                    <div className="card-cat-link">
                                                                                        <span className="cat-title font-wt-lg">
                                                                                            <i className="fas fa-tasks-alt me-2" aria-hidden="true"></i>
                                                                                            <span className="sr-only">分類：</span>
                                                                                            {categoryText}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="Date-year">
                                                                                    <div className="Date-year-txt">
                                                                                        <span className="news-year-tt font-wt-lg">
                                                                                            <span className="sr-only">發布年份：</span>
                                                                                            {dateInfo.year}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="Date-day">
                                                                                    <div className="Date-day-txt">
                                                                                        <span className="news-date-tt font-wt-xxl">
                                                                                            <span className="sr-only">日期：</span>
                                                                                            {dateInfo.monthDay}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="col-6">
                                                                                <figure className="figure_Box">
                                                                                    <div className="card_figure">
                                                                                        <div className="img-wrapper">
                                                                                            <img className="card_image" src={imageUrl} alt={imageAlt} />
                                                                                        </div>
                                                                                    </div>
                                                                                </figure>
                                                                            </div>
                                                                        </div>

                                                                        <div className="card_titleDiv">
                                                                            <div className="card_title font-wt-xl">{detail?.Title}</div>
                                                                        </div>
                                                                    </div>
                                                                </LangNavLink>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="owl-nav">
                                            <button
                                                type="button"
                                                className={`owl-prev${isPrevDisabled ? " disabled" : ""}`}
                                                aria-label="上一筆"
                                                title="上一筆"
                                                onClick={handlePrev}
                                                disabled={!canNavigate || isPrevDisabled}
                                            >
                                                <span aria-hidden="true">‹</span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`owl-next${isNextDisabled ? " disabled" : ""}`}
                                                aria-label="下一筆"
                                                title="下一筆"
                                                onClick={handleNext}
                                                disabled={!canNavigate || isNextDisabled}
                                            >
                                                <span aria-hidden="true">›</span>
                                            </button>
                                        </div>

                                        <div className="owl-dots disabled"></div>
                                    </div>

                                    <div className="row w-100 mx-0 text-center">
                                        <div className="col-12 px-0">
                                            <div className="more-link-box">
                                                <LangLink
                                                    to={props.homePage.Announcement_ViewMoreLink ?? ""}
                                                    className="more-link font-wt-lg"
                                                    aria-label="查看更多最新消息"
                                                    title="查看更多"
                                                >
                                                    <span className="ms-1">〉</span>
                                                    <span className="vm">View More</span>
                                                </LangLink>
                                            </div>
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
