import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from "react";

// #region Property
type Marquee = components["schemas"]["SpecHomePage1820_Marquee_DTO"];

type RenderMarquee = Marquee & { KeyId: string; IsClone: boolean; };
// #endregion

// #region Public
/** 1820 首頁跑馬燈 */
export const Section5 = (props: { data: Marquee[]; durationSec?: number; }) =>
{
    const data = props.data ?? [];
    if (data.length === 0) return null;

    const durationSec = props.durationSec ?? 32;
    const [isManualPaused, setIsManualPaused] = useState(false);
    const [isHoverPaused, setIsHoverPaused] = useState(false);
    const [isFocusPaused, setIsFocusPaused] = useState(false);

    /** 宣告變數：建立無縫循環資料 */
    const renderItems = useMemo(() => buildRenderItems(data), [data]);

    /** 宣告變數：實際是否暫停 */
    const isPaused = isManualPaused || isHoverPaused || isFocusPaused;

    /** 宣告變數：控制鈕說明 */
    const controlText = getControlText(isManualPaused);
    const controlTitle = getControlTitle(isManualPaused);
    const controlIconClass = getControlIconClass(isManualPaused);

    /** 執行：切換手動暫停 */
    const togglePaused = () =>
    {
        setIsManualPaused((prev) => !prev);
    };

    /** 執行：點擊切換 */
    const handleToggleClick = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        e.preventDefault();
        togglePaused();
    };

    /** 執行：鍵盤切換 */
    const handleToggleKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) =>
    {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        togglePaused();
    };

    /** 執行：滑鼠移入暫停 */
    const handleMouseEnter = () =>
    {
        setIsHoverPaused(true);
    };

    /** 執行：滑鼠移出恢復 */
    const handleMouseLeave = () =>
    {
        setIsHoverPaused(false);
    };

    /** 執行：焦點進入暫停 */
    const handleFocusEnter = () =>
    {
        setIsFocusPaused(true);
    };

    /** 執行：焦點離開恢復 */
    const handleFocusLeave = () =>
    {
        setIsFocusPaused(false);
    };

    return (
        <section className="Scrolling_section Layout_Padding_3 bg-custom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="MarqueeDIV-singleBox">
                                    <div className="Marquee-control-singlebox">
                                        <a
                                            id="marqueeCtrl"
                                            href="#"
                                            className="MCtoggle ms-1"
                                            role="button"
                                            aria-label={controlText}
                                            aria-pressed={isManualPaused}
                                            title={controlTitle}
                                            onClick={handleToggleClick}
                                            onKeyDown={handleToggleKeyDown}
                                        >
                                            <div id="ctrlIcon" className={controlIconClass}>
                                                <span id="ctrlText" className="sr-only">{controlText}</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="institution"
                        id="marqueeContainer"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onFocusCapture={handleFocusEnter}
                        onBlurCapture={handleFocusLeave}
                    >
                        <div className="institution-wrapper">
                            <ul id="A1" className={`Photo-list${isPaused ? " is-paused" : ""}`} style={{ animationDuration: `${durationSec}s` }}>
                                {renderItems.map(renderPhotoItem)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 建立跑馬燈渲染資料 */
const buildRenderItems = (data: Marquee[]): RenderMarquee[] =>
{
    const source = data.map((item) => ({ ...item, KeyId: `origin-${item.RowId}`, IsClone: false }));
    const clone = data.map((item) => ({ ...item, KeyId: `clone-${item.RowId}`, IsClone: true }));
    return [...source, ...clone];
};


/** 渲染單一圖片 */
const renderPhotoItem = (item: RenderMarquee) =>
{
    return (
        <li key={item.KeyId} aria-hidden={item.IsClone}>
            <img src={FileManagementAPI.get_Public_Preview_Url(item.PictureId)} alt={getPictureAlt(item)} />
        </li>
    );
};
// #endregion

// #region Private
/** 取得控制鈕 aria 文字 */
const getControlText = (isManualPaused: boolean) =>
{
    return isManualPaused ? "圖片輪播已暫停，點擊播放" : "圖片輪播播放中，點擊暫停";
};


/** 取得控制鈕 title */
const getControlTitle = (isManualPaused: boolean) =>
{
    return isManualPaused ? "播放" : "暫停";
};


/** 取得控制鈕 icon class */
const getControlIconClass = (isManualPaused: boolean) =>
{
    return isManualPaused ? "MControl-toggle control-play-icon" : "MControl-toggle control-pause-icon";
};


/** 取得圖片替代文字 */
const getPictureAlt = (item: RenderMarquee) =>
{
    if (item.IsClone) return "";
    return item.PictureTitle ?? "";
};
// #endregion
