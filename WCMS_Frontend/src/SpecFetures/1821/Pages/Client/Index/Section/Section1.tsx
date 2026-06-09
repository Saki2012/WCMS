import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
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
            <div className="spec1821-banner__media">{renderBannerMedia(activeItem, props.lang)}</div>
            {renderBannerText(activeItem)}
            {banners.length > 1 && renderBannerControls({ banners, safeIndex, onPrev: handlePrev, onNext: handleNext, onSelect: setActiveIndex })}
        </section>
    );
};
// #endregion

// #region EntityComp
/** 渲染 Banner 圖片或連結 */
const renderBannerMedia = (item: BannerModel, lang: Lang) =>
{
    const image = <img src={FileManagementAPI.get_Public_Preview_Url(item.BannerFileId)} alt={getBannerAlt(item)} />;
    if (!hasLink(item.Link)) return image;

    return (
        <LangLink to={item.Link ?? ""} lang={lang} title={item.Title ?? ""} aria-label={getBannerLinkLabel(item)}>
            {image}
        </LangLink>
    );
};

/** 渲染 Banner 文字 */
const renderBannerText = (item: BannerModel) =>
{
    if (!item.Title && !item.SubTitle) return null;

    return (
        <div className="spec1821-banner__caption">
            {item.SubTitle && <div className="spec1821-banner__subtitle">{item.SubTitle}</div>}
            {item.Title && <h2 className="spec1821-banner__title">{item.Title}</h2>}
        </div>
    );
};

/** 渲染 Banner 控制列 */
const renderBannerControls = (p: { banners: BannerModel[]; safeIndex: number; onPrev: () => void; onNext: () => void; onSelect: (index: number) => void; }) =>
{
    return (
        <div className="spec1821-banner__controls" aria-label="Banner控制列">
            <button type="button" onClick={p.onPrev} aria-label="上一張 Banner">‹</button>
            {p.banners.map((item, index) => renderIndicator({ item, index, active: index === p.safeIndex, onSelect: p.onSelect }))}
            <button type="button" onClick={p.onNext} aria-label="下一張 Banner">›</button>
        </div>
    );
};

/** 渲染 Banner 指示鈕 */
const renderIndicator = (p: { item: BannerModel; index: number; active: boolean; onSelect: (index: number) => void; }) =>
{
    const title = p.item.Title || `第 ${p.index + 1} 張 Banner`;
    return <button key={`${p.item.HomePageId}-${p.item.RowId}`} type="button" aria-label={`切換至${title}`} aria-current={p.active} onClick={() => p.onSelect(p.index)} />;
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

/** 判斷是否有連結 */
const hasLink = (link?: string | null) =>
{
    return !!link?.trim();
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
