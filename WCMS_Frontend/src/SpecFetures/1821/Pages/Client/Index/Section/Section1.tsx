import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useState } from "react";

// #region Property
type BannerModel = components["schemas"]["SpecHomePage1821_Banner_DTO"];
// #endregion

// #region Public
/** Section1：首頁 Banner List */
export const Section1 = (props: { lang: Lang; data: BannerModel[]; }) =>
{
    const banners = props.data ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const safeIndex = getSafeIndex(activeIndex, banners.length);
    const activeItem = banners[safeIndex] ?? null;

    if (!activeItem) return null;

    const handlePrev = () => setActiveIndex(getPrevIndex(safeIndex, banners.length));
    const handleNext = () => setActiveIndex(getNextIndex(safeIndex, banners.length));

    return (
        <section className="spec1821-banner" aria-label="首頁主視覺輪播">
            <div className="spec1821-banner__media"><BannerMediaSection item={activeItem} lang={props.lang} /></div>
            <BannerCaptionSection item={activeItem} />
            {banners.length > 1 && <BannerControlsSection banners={banners} safeIndex={safeIndex} onPrev={handlePrev} onNext={handleNext} onSelect={setActiveIndex} />}
        </section>
    );
};
// #endregion

// #region Section
/** Banner 圖片或連結區塊 */
const BannerMediaSection = (props: { item: BannerModel; lang: Lang; }) =>
{
    const image = <img src={FileManagementAPI.get_Public_Preview_Url(props.item.BannerFileId)} alt={getBannerAlt(props.item)} />;
    if (!LibText.isNonEmptyString(props.item.Link)) return image;

    return (
        <LangLink to={props.item.Link ?? ""} lang={props.lang} title={props.item.Title ?? ""} aria-label={getBannerLinkLabel(props.item)}>
            {image}
        </LangLink>
    );
};

/** Banner 文字區塊 */
const BannerCaptionSection = (props: { item: BannerModel; }) =>
{
    if (!props.item.Title && !props.item.SubTitle) return null;

    return (
        <div className="spec1821-banner__caption">
            {props.item.SubTitle && <div className="spec1821-banner__subtitle">{props.item.SubTitle}</div>}
            {props.item.Title && <h2 className="spec1821-banner__title">{props.item.Title}</h2>}
        </div>
    );
};

/** Banner 控制列區塊 */
const BannerControlsSection = (props: { banners: BannerModel[]; safeIndex: number; onPrev: () => void; onNext: () => void; onSelect: (index: number) => void; }) =>
{
    return (
        <div className="spec1821-banner__controls" aria-label="Banner控制列">
            <button type="button" onClick={props.onPrev} aria-label="上一張 Banner">‹</button>
            {props.banners.map((item, index) => (
                <BannerIndicator key={`${item.HomePageId}-${item.RowId}`} item={item} index={index} active={index === props.safeIndex} onSelect={props.onSelect} />
            ))}
            <button type="button" onClick={props.onNext} aria-label="下一張 Banner">›</button>
        </div>
    );
};
// #endregion

// #region EntityComp
/** Banner 指示鈕 */
const BannerIndicator = (props: { item: BannerModel; index: number; active: boolean; onSelect: (index: number) => void; }) =>
{
    const title = props.item.Title || `第 ${props.index + 1} 張 Banner`;
    return <button type="button" aria-label={`切換至${title}`} aria-current={props.active} onClick={() => props.onSelect(props.index)} />;
};
// #endregion

// #region Private
/** 取得安全索引 */
const getSafeIndex = (index: number, total: number) =>
{
    if (total <= 0) return 0;
    return Math.min(Math.max(index, 0), total - 1);
};

/** 取得上一張索引 */
const getPrevIndex = (index: number, total: number) =>
{
    return total <= 1 ? 0 : (index - 1 + total) % total;
};

/** 取得下一張索引 */
const getNextIndex = (index: number, total: number) =>
{
    return total <= 1 ? 0 : (index + 1) % total;
};

/** 取得 Banner 圖片替代文字 */
const getBannerAlt = (item: BannerModel) =>
{
    return item.BannerFileDescription || item.Title || "";
};

/** 取得 Banner 連結說明 */
const getBannerLinkLabel = (item: BannerModel) =>
{
    return item.Title || item.BannerFileDescription || "Banner連結";
};
// #endregion
