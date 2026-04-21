import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useMemo, useState } from "react";
type Marquee = components["schemas"]["SpecHomePage1820_Marquee_DTO"];

/** 取得跑馬燈渲染資料 */
const buildRenderItems = (data: Marquee[]) =>
{
    const source = data.map((item) => ({ ...item, KeyId: `origin-${item.RowId}`, IsClone: false }));
    const clone = data.map((item) => ({ ...item, KeyId: `clone-${item.RowId}`, IsClone: true }));
    return [...source, ...clone];
};

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

/** 渲染單一圖片 */
const renderPhotoItem = (item: Marquee, isClone: boolean, onFocusEnter: () => void, onFocusLeave: () => void) =>
{
    return (
        <li className="scrolling-photo-item" key={`${item.HomePageId}_${item.RowId}`} aria-hidden={isClone}>
            {isClone
                ? (
                    <img
                        className="scrolling-photo-image"
                        src={FileManagementAPI.get_Public_Preview_Url(item.PictureId)}
                        alt={item.PictureTitle ?? ""}
                    />
                )
                : (
                    <button
                        type="button"
                        className="scrolling-photo-button"
                        title={item.PictureTitle ?? ""}
                        onFocus={onFocusEnter}
                        onBlur={onFocusLeave}
                    >
                        <img
                            className="scrolling-photo-image"
                            src={FileManagementAPI.get_Public_Preview_Url(item.PictureId)}
                            alt={item.PictureTitle ?? ""}
                        />
                    </button>
                )}
        </li>
    );
};

/** 1820 首頁跑馬燈 */
export const Section5 = (props: { data: Marquee[]; durationSec?: number; }) =>
{
    const data = props.data;
    const durationSec = props.durationSec ?? 32;
    if (data?.length === 0) return null;

    const [isManualPaused, setIsManualPaused] = useState(false);
    const [isHoverPaused, setIsHoverPaused] = useState(false);
    const [isFocusPaused, setIsFocusPaused] = useState(false);

    /** 宣告變數：建立無縫循環資料 */
    const renderItems = useMemo(() => buildRenderItems(data), [data]);
    /** 宣告變數：實際是否暫停 */
    const isPaused = isManualPaused || isHoverPaused || isFocusPaused;
    /** 執行：切換手動暫停 */
    const handleToggle = () => setIsManualPaused((prev) => !prev);
    /** 執行：滑鼠移入暫停 */
    const handleMouseEnter = () => setIsHoverPaused(true);
    /** 執行：滑鼠移出恢復 */
    const handleMouseLeave = () => setIsHoverPaused(false);
    /** 執行：焦點進入暫停 */
    const handleFocusEnter = () => setIsFocusPaused(true);
    /** 執行：焦點離開恢復 */
    const handleFocusLeave = () => setIsFocusPaused(false);
    /** 宣告變數：控制鈕說明 */
    const controlText = getControlText(isManualPaused);
    const controlTitle = getControlTitle(isManualPaused);
    const controlIconClass = getControlIconClass(isManualPaused);

    return (
        <>
            <style>
                {`
                .Scrolling_section .institution { overflow: hidden; width: 100%; }
                .Scrolling_section .institution-wrapper { overflow: hidden; width: 100%; }
                .Scrolling_section .Photo-list {
                    display: flex;
                    gap: 24px;
                    width: max-content;
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    animation: scrolling-marquee ${durationSec}s linear infinite;
                    will-change: transform;
                }
                .Scrolling_section .Photo-list.is-paused { animation-play-state: paused; }
                .Scrolling_section .scrolling-photo-item { flex: 0 0 auto; }
                .Scrolling_section .scrolling-photo-button {
                    display: block;
                    padding: 0;
                    border: 0;
                    background: transparent;
                    cursor: pointer;
                }
                .Scrolling_section .scrolling-photo-image {
                    display: block;
                    width: clamp(220px, 24vw, 360px);
                    height: clamp(160px, 18vw, 260px);
                    object-fit: cover;
                }
                @keyframes scrolling-marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .Scrolling_section .Photo-list {
                        animation: none;
                        transform: none;
                    }
                }
            `}
            </style>

            <section className="Scrolling_section Layout_Padding_3 bg-custom">
                <div className="Mask-DivBox">
                    <div className="customizeBox">
                        <div className="container-customize2">
                            <div className="row">
                                <div className="col-12">
                                    <div className="MarqueeDIV-singleBox">
                                        <div className="Marquee-control-singlebox">
                                            <button
                                                type="button"
                                                className="MCtoggle ms-1"
                                                aria-label={controlText}
                                                aria-pressed={isManualPaused}
                                                title={controlTitle}
                                                onClick={handleToggle}
                                            >
                                                <div className={controlIconClass}>
                                                    <span className="sr-only">{controlText}</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="institution" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                            <div className="institution-wrapper">
                                <ul className={`Photo-list ${isPaused ? "is-paused" : ""}`}>
                                    {renderItems.map((item) =>
                                        renderPhotoItem(item, false, handleFocusEnter, handleFocusLeave) // Clone那塊怪怪的，晚點再Debug
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
