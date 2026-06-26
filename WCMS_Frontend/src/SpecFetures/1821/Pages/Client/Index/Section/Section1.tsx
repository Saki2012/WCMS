import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { useState } from "react";

// #region Property
type BannerModel = components["schemas"]["SpecHomePage1821_Banner_DTO"];
const CAROUSEL_ID = "B5_default_carousel";
// #endregion

// #region Public
/** Section1：對標 prototype 的首頁 Banner 輪播 DOM。 */
export const Section1 = (props: { lang: Lang; data: BannerModel[]; }) =>
{
    const banners = props.data ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const safeIndex = getSafeIndex(activeIndex, banners.length);
    if (banners.length === 0) return null;

    return (
        <div className="Carousel_slide_section">
            <div id={CAROUSEL_ID} className="carousel slide">
                <CarouselToggle isPlaying={isPlaying} onToggle={() => setIsPlaying(!isPlaying)} />
                <CarouselInner lang={props.lang} banners={banners} safeIndex={safeIndex} />
                <CarouselIndicators banners={banners} safeIndex={safeIndex} onSelect={setActiveIndex} />
                <CarouselArrow direction="prev" label="上一張" onClick={() => setActiveIndex(getPrevIndex(safeIndex, banners.length))} />
                <CarouselArrow direction="next" label="下一張" onClick={() => setActiveIndex(getNextIndex(safeIndex, banners.length))} />
            </div>
        </div>
    );
};
// #endregion

// #region Section
/** Banner 播放 / 暫停控制。 */
const CarouselToggle = (props: { isPlaying: boolean; onToggle: () => void; }) =>
{
    const label = props.isPlaying ? "暫停" : "播放";
    const iconClass = props.isPlaying ? "pause" : "play";
    return (
        <div className="control-singlebox">
            <div className="control-toggle">
                <a href="#" role="button" className="carousel-toggle-btn" aria-pressed={props.isPlaying} aria-label={label} title={label} onClick={(e) => { e.preventDefault(); props.onToggle(); }}>
                    <span className={`control-icon ${iconClass}`}></span>
                    <span className="sr-only">{label}</span>
                </a>
            </div>
        </div>
    );
};

/** Banner 圖片列表。 */
const CarouselInner = (props: { lang: Lang; banners: BannerModel[]; safeIndex: number; }) =>
{
    return (
        <div className="carousel-inner">
            {props.banners.map((item, index) => <CarouselItem key={`${item.HomePageId}-${item.RowId}`} lang={props.lang} item={item} active={index === props.safeIndex} />)}
        </div>
    );
};

/** Banner 指示點列表。 */
const CarouselIndicators = (props: { banners: BannerModel[]; safeIndex: number; onSelect: (index: number) => void; }) =>
{
    if (props.banners.length <= 1) return null;
    return (
        <div className="carousel-indicators d-none">
            {props.banners.map((item, index) => <CarouselIndicator key={`${item.HomePageId}-${item.RowId}`} item={item} index={index} active={index === props.safeIndex} onSelect={props.onSelect} />)}
        </div>
    );
};
// #endregion

// #region EntityComp
/** Banner 單張圖片。 */
const CarouselItem = (props: { lang: Lang; item: BannerModel; active: boolean; }) =>
{
    const content = <BannerImages item={props.item} />;
    return (
        <div className={`carousel-item${props.active ? " active" : ""}`}>
            {LibText.isNonEmptyString(props.item.Link)
                ? <LangLink to={props.item.Link ?? ""} lang={props.lang} title={getBannerLinkLabel(props.item)}>{content}</LangLink>
                : content}
        </div>
    );
};

/** Banner PC / Mobile 圖片。 */
const BannerImages = (props: { item: BannerModel; }) =>
{
    const imageUrl = FileManagementAPI.get_Public_Preview_Url(props.item.BannerFileId);
    const alt = getBannerAlt(props.item);
    return (
        <>
            <img src={imageUrl} className="d-xl-block d-lg-block d-md-block d-sm-none d-none w-100" alt={alt} />
            <img src={imageUrl} className="d-xl-none d-lg-none d-md-none d-sm-block d-block w-100" alt={alt} />
        </>
    );
};

/** Banner 指示點。 */
const CarouselIndicator = (props: { item: BannerModel; index: number; active: boolean; onSelect: (index: number) => void; }) =>
{
    return (
        <a href="#" title={`切換至第 ${props.index + 1} 張`} onClick={(e) => { e.preventDefault(); props.onSelect(props.index); }}>
            <button type="button" className={props.active ? "active" : ""} aria-current={props.active || undefined} aria-label={getSlideLabel(props.item, props.index)}></button>
        </a>
    );
};

/** Banner 左右切換按鈕。 */
const CarouselArrow = (props: { direction: "prev" | "next"; label: string; onClick: () => void; }) =>
{
    const isPrev = props.direction === "prev";
    return (
        <div className={isPrev ? "carousel_btn-icon-prev" : "carousel_btn-icon-next"}>
            <a href="#" role="button" title={props.label} onClick={(e) => { e.preventDefault(); props.onClick(); }}>
                <div className={isPrev ? "carousel-control-prev" : "carousel-control-next"}>
                    <span className={isPrev ? "carousel-control-prev-icon" : "carousel-control-next-icon"} aria-hidden="true"></span>
                    <span className="sr-only">{props.label}</span>
                </div>
            </a>
        </div>
    );
};
// #endregion

// #region Private
/** 取得安全索引。 */
const getSafeIndex = (index: number, total: number) =>
{
    if (total <= 0) return 0;
    return Math.min(Math.max(index, 0), total - 1);
};

/** 取得上一張索引。 */
const getPrevIndex = (index: number, total: number) =>
{
    return total <= 1 ? 0 : (index - 1 + total) % total;
};

/** 取得下一張索引。 */
const getNextIndex = (index: number, total: number) =>
{
    return total <= 1 ? 0 : (index + 1) % total;
};

/** 取得 Banner 圖片替代文字。 */
const getBannerAlt = (item: BannerModel) =>
{
    return item.BannerFileDescription || item.Title || "首頁 Banner";
};

/** 取得 Banner 連結說明。 */
const getBannerLinkLabel = (item: BannerModel) =>
{
    return item.Title || item.BannerFileDescription || "Banner連結";
};

/** 取得指示點說明。 */
const getSlideLabel = (item: BannerModel, index: number) =>
{
    return item.Title || `Slide ${index + 1}`;
};
// #endregion
