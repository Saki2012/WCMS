import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { type CSSProperties, type MouseEvent, useCallback, useEffect, useState } from "react";
import Lightbox, { createIcon, useLightboxState } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import type { LibLightBoxProps as BaseLibLightBoxProps, LibLightBoxRootStyle, LibLightBoxSlide } from "./LibLightBox_Data";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

// #region Property
export type LibLightBoxProps = BaseLibLightBoxProps & { lang?: Lang; };

export type { LibLightBoxSlide };

interface LibLightBoxCaptionOverlayProps
{
    captionVisible: boolean;
}

interface LibLightBoxCaptionToggleButtonProps
{
    captionVisible: boolean;
    a11y: LightBoxA11yText;
    onToggleCaption: () => void;
}

interface LibLightBoxCaptionIconButtonProps
{
    label: string;
    icon: ReturnType<typeof createIcon>;
    disabled?: boolean;
    onClick: () => void;
}

/** Lightbox a11y 文案結構 */
type LightBoxA11yText = {
    close: string;
    prev: string;
    next: string;
    download: string;
    share: string;
    showCaption: string;
    hideCaption: string;
};

/** Lightbox a11y 文案表（用 xxx[lang] 讀；不足語系會 fallback） */
const LIGHTBOX_A11Y_MAP: Partial<Record<Lang, LightBoxA11yText>> = {
    "zh-tw": {
        close: "關閉",
        prev: "上一張",
        next: "下一張",
        download: "下載圖片",
        share: "分享圖片",
        showCaption: "顯示圖片說明",
        hideCaption: "隱藏圖片說明",
    },
    "zh-cn": {
        close: "关闭",
        prev: "上一张",
        next: "下一张",
        download: "下载图片",
        share: "分享图片",
        showCaption: "显示图片说明",
        hideCaption: "隐藏图片说明",
    },
    en: {
        close: "Close",
        prev: "Previous slide",
        next: "Next slide",
        download: "Download image",
        share: "Share image",
        showCaption: "Show captions",
        hideCaption: "Hide captions",
    },
};

const lightBoxPlugins = [Counter, Download, Share];

const lightBoxRootStyle: LibLightBoxRootStyle = {
    "--yarl__navigation_button_padding": "2px",
    "--yarl__counter_left": "5px",
    "--yarl__icon_size": "28px",
};

const captionPanelStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    padding: "15px 40px",
    boxSizing: "border-box",
    pointerEvents: "auto",
};

const captionTitleStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: "1.2rem",
    marginBottom: "8px",
};

const captionDescriptionStyle: CSSProperties = {
    margin: 0,
    padding: 0,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
    maxHeight: "65vh",
    overflowY: "auto",
};

/** Caption 顯示圖示 */
const CaptionIcon = createIcon(
    "LibLightBoxCaptionIcon",
    (
        <>
            <defs>
                <mask id="strike">
                    <path d="M0 0h24v24H0z" fill="white"></path>
                    <path d="M0 0L24 24" stroke="black" strokeWidth="4"></path>
                </mask>
            </defs>
            <path d="M0.70707 2.121320L21.878680 23.292883" stroke="currentColor" strokeWidth="2"></path>
            <g fill="currentColor" mask="url(#strike)">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path strokeWidth="2" stroke="currentColor" strokeLinejoin="round" fill="none" d="M3 5l18 0l0 14l-18 0l0-14z"></path>
                <path d="M7 15h3c.55 0 1-.45 1-1v-1H9.5v.5h-2v-3h2v.5H11v-1c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm7 0h3c.55 0 1-.45 1-1v-1h-1.5v.5h-2v-3h2v.5H18v-1c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1z"></path>
            </g>
        </>
    ),
);

/** Caption 隱藏圖示 */
const CaptionHideIcon = createIcon(
    "LibLightBoxCaptionHideIcon",
    (
        <g fill="currentColor">
            <path d="M0 0h24v24H0z" fill="none"></path>
            <path strokeWidth="2" stroke="currentColor" strokeLinejoin="round" fill="none" d="M3 5l18 0l0 14l-18 0l0-14z"></path>
            <path d="M7 15h3c.55 0 1-.45 1-1v-1H9.5v.5h-2v-3h2v.5H11v-1c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm7 0h3c.55 0 1-.45 1-1v-1h-1.5v.5h-2v-3h2v.5H18v-1c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1z"></path>
        </g>
    ),
);
// #endregion

// #region Public
/** 共用圖片 Lightbox 元件 */
export const LibLightBox_Comp = (props: LibLightBoxProps) =>
{
    const [captionVisible, setCaptionVisible] = useState(true);
    const a11y = getLightBoxA11y(props.lang);

    /** 切換 caption 顯示/隱藏 */
    const onToggleCaption = useCallback(() =>
    {
        setCaptionVisible(prev => !prev);
    }, []);

    /** 開啟 Lightbox 時重設 caption 顯示狀態 */
    useEffect(() =>
    {
        if (!props.open) return;
        setCaptionVisible(true);
    }, [props.open]);

    if (props.slides.length === 0) return null;

    return (
        <Lightbox
            className="custom-lightbox"
            open={props.open}
            close={props.onClose}
            index={props.index}
            slides={props.slides}
            plugins={lightBoxPlugins}
            toolbar={{
                buttons: [
                    <LibLightBoxCaptionToggleButton
                        key="lib-caption-toggle"
                        captionVisible={captionVisible}
                        a11y={a11y}
                        onToggleCaption={onToggleCaption}
                    />,
                    "download",
                    "share",
                    "close",
                ],
            }}
            render={{ controls: () => <LibLightBoxCaptionOverlay captionVisible={captionVisible} /> }}
            styles={{
                root: lightBoxRootStyle,
                toolbar: { top: 0, bottom: "unset" },
                slide: { top: 0, bottom: "unset" },
                button: { zIndex: 10000 },
            }}
            labels={{
                Close: a11y.close,
                Previous: a11y.prev,
                Next: a11y.next,
                Download: a11y.download,
                Share: a11y.share,
            }}
            counter={{ container: { style: { top: 0, bottom: "unset" } } }}
        />
    );
};
// #endregion

// #region EntityComp
/** Lightbox 自訂 toolbar 按鈕，支援自訂 aria-label 多語系文案。 */
const LibLightBoxCaptionIconButton = (props: LibLightBoxCaptionIconButtonProps) =>
{
    const Icon = props.icon;

    return (
        <button type="button" className="yarl__button" title={props.label} aria-label={props.label} disabled={props.disabled} onClick={props.onClick}>
            <Icon />
        </button>
    );
};

/** 自訂 Caption 顯示/隱藏 toolbar 按鈕 */
const LibLightBoxCaptionToggleButton = (props: LibLightBoxCaptionToggleButtonProps) =>
{
    const { currentSlide } = useLightboxState();
    const slide = currentSlide as LibLightBoxSlide | undefined;
    const hasCaption = getHasCaption(slide);

    return (
        <LibLightBoxCaptionIconButton
            label={props.captionVisible ? props.a11y.hideCaption : props.a11y.showCaption}
            icon={props.captionVisible ? CaptionHideIcon : CaptionIcon}
            disabled={!hasCaption}
            onClick={props.onToggleCaption}
        />
    );
};

/** 自訂 Lightbox Caption 區塊 */
const LibLightBoxCaptionOverlay = (props: LibLightBoxCaptionOverlayProps) =>
{
    const { currentSlide } = useLightboxState();
    const activeSlide = currentSlide as LibLightBoxSlide | undefined;
    const activeTitle = normalizeCaptionText(activeSlide?.title);
    const activeDescription = normalizeCaptionText(activeSlide?.description);
    const hasCaption = activeTitle.length > 0 || activeDescription.length > 0;

    /** 防止點擊 caption 區域觸發 Lightbox 底層事件 */
    const onClickCaptionPanel = (e: MouseEvent<HTMLDivElement>) =>
    {
        e.stopPropagation();
    };

    if (!props.captionVisible || !hasCaption) return null;

    return (
        <div className="custom-lightbox-caption-panel" style={captionPanelStyle} onClick={onClickCaptionPanel}>
            {activeTitle && (
                <div className="custom-lightbox-caption-title" style={captionTitleStyle}>
                    {activeTitle}
                </div>
            )}

            {activeDescription && (
                <p className="custom-lightbox-caption-description" style={captionDescriptionStyle}>
                    {activeDescription}
                </p>
            )}
        </div>
    );
};
// #endregion

// #region Private
/** 取得 Lightbox a11y 文案（語系不在表內時，回退到 DefaultLang） */
const getLightBoxA11y = (lang?: Lang): LightBoxA11yText =>
{
    const key = (lang ?? DefaultLang) as Lang;
    const byLang = LIGHTBOX_A11Y_MAP[key];
    const byDefault = LIGHTBOX_A11Y_MAP[DefaultLang];

    return byLang ?? byDefault ?? {
        close: "關閉",
        prev: "上一張",
        next: "下一張",
        download: "下載圖片",
        share: "分享圖片",
        showCaption: "顯示圖片說明",
        hideCaption: "隱藏圖片說明",
    };
};

/** 正規化文字，避免空白內容影響顯示 */
const normalizeCaptionText = (value?: string | null): string =>
{
    return (value ?? "").trim();
};

/** 判斷目前 slide 是否有 caption */
const getHasCaption = (slide?: LibLightBoxSlide): boolean =>
{
    const title = normalizeCaptionText(slide?.title);
    const description = normalizeCaptionText(slide?.description);

    return title.length > 0 || description.length > 0;
};
// #endregion