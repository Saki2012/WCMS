import Lightbox, { IconButton, createIcon, useLightboxState } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import type { LibLightBoxProps as BaseLibLightBoxProps, LibLightBoxRootStyle, LibLightBoxSlide } from "./LibLightBox_Data";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

// #region Property
export type LibLightBoxProps = BaseLibLightBoxProps & { lang?: Lang; };

export type { LibLightBoxSlide };


interface LibLightBoxCaptionOverlayProps {
    captionVisible: boolean;
    captionExpanded: boolean;
    onCanExpandChange: (value: boolean) => void;
}


interface LibLightBoxCaptionToggleButtonProps {
    captionVisible: boolean;
    a11y: LightBoxA11yText;
    onToggleCaption: () => void;
}


interface LibLightBoxCaptionExpandButtonProps {
    captionVisible: boolean;
    captionExpanded: boolean;
    canCaptionExpand: boolean;
    a11y: LightBoxA11yText;
    onToggleCaptionExpand: () => void;
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
    expandCaption: string;
    collapseCaption: string;
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
        expandCaption: "展開圖片說明",
        collapseCaption: "收合圖片說明",
    },
    "zh-cn": {
        close: "关闭",
        prev: "上一张",
        next: "下一张",
        download: "下载图片",
        share: "分享图片",
        showCaption: "显示图片说明",
        hideCaption: "隐藏图片说明",
        expandCaption: "展开图片说明",
        collapseCaption: "收合图片说明",
    },
    en: {
        close: "Close",
        prev: "Previous slide",
        next: "Next slide",
        download: "Download image",
        share: "Share image",
        showCaption: "Show captions",
        hideCaption: "Hide captions",
        expandCaption: "Expand captions",
        collapseCaption: "Collapse captions",
    },
};


const lightBoxPlugins = [Counter, Download, Share];


const lightBoxRootStyle: LibLightBoxRootStyle = {
    "--yarl__navigation_button_padding": "2px",
    "--yarl__counter_left": "5px",
    "--yarl__icon_size": "28px"
};


const captionPreviewLineCount = 7;


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


const captionDescriptionBaseStyle: CSSProperties = {
    margin: 0,
    padding: 0,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
};


const captionDescriptionClampStyle: CSSProperties = {
    ...captionDescriptionBaseStyle,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: captionPreviewLineCount,
    overflow: "hidden",
};


const captionDescriptionExpandedStyle: CSSProperties = {
    ...captionDescriptionBaseStyle,
    display: "block",
    maxHeight: "65vh",
    overflowY: "auto",
};


/** Caption 顯示圖示 */
const CaptionIcon = createIcon("LibLightBoxCaptionIcon", (
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
));


/** Caption 隱藏圖示 */
const CaptionHideIcon = createIcon("LibLightBoxCaptionHideIcon", (
    <g fill="currentColor">
        <path d="M0 0h24v24H0z" fill="none"></path>
        <path strokeWidth="2" stroke="currentColor" strokeLinejoin="round" fill="none" d="M3 5l18 0l0 14l-18 0l0-14z"></path>
        <path d="M7 15h3c.55 0 1-.45 1-1v-1H9.5v.5h-2v-3h2v.5H11v-1c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm7 0h3c.55 0 1-.45 1-1v-1h-1.5v.5h-2v-3h2v.5H18v-1c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1z"></path>
    </g>
));


/** Caption 展開圖示 */
const CaptionExpandIcon = createIcon("LibLightBoxCaptionExpandIcon", (
    <g fill="currentColor">
        <path d="M4 5h16v2H4z"></path>
        <path d="M4 10h16v2H4z"></path>
        <path d="M4 15h10v2H4z"></path>
        <path d="M17 14l3 3l-3 3l-1.4-1.4l1.6-1.6l-1.6-1.6z"></path>
    </g>
));


/** Caption 收合圖示 */
const CaptionCollapseIcon = createIcon("LibLightBoxCaptionCollapseIcon", (
    <g fill="currentColor">
        <path d="M4 5h16v2H4z"></path>
        <path d="M4 10h16v2H4z"></path>
        <path d="M4 15h10v2H4z"></path>
        <path d="M20 14l-3 3l3 3l1.4-1.4l-1.6-1.6l1.6-1.6z"></path>
    </g>
));
// #endregion

// #region Section
/** 共用圖片 Lightbox 元件 */
const LibLightBox_Comp = (props: LibLightBoxProps) =>
{
    const [captionVisible, setCaptionVisible] = useState(true);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const [canCaptionExpand, setCanCaptionExpand] = useState(false);

    const a11y = getLightBoxA11y(props.lang);

    /** 切換 caption 顯示/隱藏 */
    const onToggleCaption = useCallback(() =>
    {
        setCaptionVisible(prev =>
        {
            const nextValue = !prev;
            if (!nextValue) setCaptionExpanded(false);
            return nextValue;
        });
    }, []);

    /** 切換 caption 展開/收合 */
    const onToggleCaptionExpand = useCallback(() =>
    {
        setCaptionExpanded(prev => !prev);
    }, []);

    /** 開啟 Lightbox 時重設 caption 狀態 */
    useEffect(() =>
    {
        if (!props.open) return;

        setCaptionVisible(true);
        setCaptionExpanded(false);
        setCanCaptionExpand(false);
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
                    <LibLightBoxCaptionExpandButton
                        key="lib-caption-expand"
                        captionVisible={captionVisible}
                        captionExpanded={captionExpanded}
                        canCaptionExpand={canCaptionExpand}
                        a11y={a11y}
                        onToggleCaptionExpand={onToggleCaptionExpand}
                    />,
                    "download",
                    "share",
                    "close",
                ],
            }}
            on={{
                view: () =>
                {
                    setCaptionExpanded(false);
                    setCanCaptionExpand(false);
                },
            }}
            render={{
                controls: () => (
                    <LibLightBoxCaptionOverlay
                        captionVisible={captionVisible}
                        captionExpanded={captionExpanded}
                        onCanExpandChange={setCanCaptionExpand}
                    />
                ),
            }}
            styles={{
                root: lightBoxRootStyle,
                toolbar: { top: 0, bottom: "unset" },
                slide: { top: 0, bottom: "unset" },
                button: { zIndex: 10000 }
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

// #region Private
/** 取得 Lightbox a11y 文案（語系不在表內時，回退到 DefaultLang） */
const getLightBoxA11y = (lang?: Lang): LightBoxA11yText =>
{
    // 宣告：fallback key
    const key = (lang ?? DefaultLang) as Lang;

    // 執行：依語系取值，取不到就回 default
    const byLang = LIGHTBOX_A11Y_MAP[key];
    const byDefault = LIGHTBOX_A11Y_MAP[DefaultLang];

    // return：保證回傳一份可用文案
    return byLang ?? byDefault ?? {
        close: "關閉",
        prev: "上一張",
        next: "下一張",
        download: "下載圖片",
        share: "分享圖片",
        showCaption: "顯示圖片說明",
        hideCaption: "隱藏圖片說明",
        expandCaption: "展開圖片說明",
        collapseCaption: "收合圖片說明",
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


/** 判斷目前 slide 是否有 description */
const getHasDescription = (slide?: LibLightBoxSlide): boolean =>
{
    return normalizeCaptionText(slide?.description).length > 0;
};


/** 取得元素 line-height */
const getElementLineHeight = (element: HTMLElement): number =>
{
    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight);

    if (Number.isFinite(lineHeight)) return lineHeight;

    const fontSize = Number.parseFloat(style.fontSize);
    return Number.isFinite(fontSize) ? fontSize * 1.6 : 24;
};


/** 複製 description 量自然高度，避免 line-clamp 影響判斷 */
const getNaturalDescriptionHeight = (element: HTMLElement): number =>
{
    const rect = element.getBoundingClientRect();

    if (rect.width <= 0) return 0;

    const clone = element.cloneNode(true) as HTMLElement;

    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    clone.style.width = `${rect.width}px`;
    clone.style.height = "auto";
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";
    clone.style.display = "block";
    clone.style.pointerEvents = "none";
    clone.style.setProperty("-webkit-line-clamp", "unset");
    clone.style.setProperty("-webkit-box-orient", "initial");

    document.body.appendChild(clone);

    const height = clone.scrollHeight;

    clone.remove();

    return height;
};


/** 判斷描述是否超過預覽行數 */
const getCanExpandDescription = (element: HTMLElement): boolean =>
{
    const lineHeight = getElementLineHeight(element);
    const naturalHeight = getNaturalDescriptionHeight(element);
    const maxPreviewHeight = lineHeight * captionPreviewLineCount;

    return naturalHeight > maxPreviewHeight + Math.ceil(lineHeight * 0.35);
};


/** 自訂 Caption 顯示/隱藏 toolbar 按鈕 */
const LibLightBoxCaptionToggleButton = (props: LibLightBoxCaptionToggleButtonProps) =>
{
    const { currentSlide } = useLightboxState();
    const slide = currentSlide as LibLightBoxSlide | undefined;
    const hasCaption = getHasCaption(slide);

    return (
        <IconButton
            label={props.captionVisible ? props.a11y.hideCaption : props.a11y.showCaption}
            icon={props.captionVisible ? CaptionHideIcon : CaptionIcon}
            disabled={!hasCaption}
            onClick={props.onToggleCaption}
        />
    );
};


/** 自訂 Caption 展開/收合 toolbar 按鈕 */
const LibLightBoxCaptionExpandButton = (props: LibLightBoxCaptionExpandButtonProps) =>
{
    const { currentSlide } = useLightboxState();
    const slide = currentSlide as LibLightBoxSlide | undefined;
    const hasDescription = getHasDescription(slide);
    const disabled = !props.captionVisible || !hasDescription || !props.canCaptionExpand;

    return (
        <IconButton
            label={props.captionExpanded ? props.a11y.collapseCaption : props.a11y.expandCaption}
            icon={props.captionExpanded ? CaptionCollapseIcon : CaptionExpandIcon}
            disabled={disabled}
            onClick={props.onToggleCaptionExpand}
        />
    );
};


/** 自訂 Lightbox Caption 區塊 */
const LibLightBoxCaptionOverlay = (props: LibLightBoxCaptionOverlayProps) =>
{
    const { currentIndex, currentSlide } = useLightboxState();

    const recalcFrameRef = useRef<number | null>(null);
    const descriptionRef = useRef<HTMLParagraphElement | null>(null);

    const activeSlide = currentSlide as LibLightBoxSlide | undefined;
    const activeTitle = normalizeCaptionText(activeSlide?.title);
    const activeDescription = normalizeCaptionText(activeSlide?.description);
    const hasCaption = activeTitle.length > 0 || activeDescription.length > 0;
    const hasDescription = activeDescription.length > 0;

    /** 計算目前描述是否可展開 */
    const updateCaptionExpandState = useCallback(() =>
    {
        if (typeof window === "undefined") return;

        const element = descriptionRef.current;

        if (!props.captionVisible || !element || !hasDescription)
        {
            props.onCanExpandChange(false);
            return;
        }

        props.onCanExpandChange(getCanExpandDescription(element));
    }, [props.captionVisible, props.onCanExpandChange, hasDescription, activeDescription]);

    /** 延後計算，避免 DOM 尚未完成渲染 */
    const scheduleCaptionRecalc = useCallback(() =>
    {
        if (typeof window === "undefined") return;

        if (recalcFrameRef.current !== null) window.cancelAnimationFrame(recalcFrameRef.current);

        recalcFrameRef.current = window.requestAnimationFrame(() =>
        {
            recalcFrameRef.current = window.requestAnimationFrame(() =>
            {
                recalcFrameRef.current = null;
                updateCaptionExpandState();
            });
        });
    }, [updateCaptionExpandState]);

    /** slide / 顯示狀態改變時重算是否可展開 */
    useEffect(() =>
    {
        props.onCanExpandChange(false);

        window.requestAnimationFrame(() =>
        {
            scheduleCaptionRecalc();
        });
    }, [currentIndex, activeTitle, activeDescription, props.captionVisible, props.onCanExpandChange, scheduleCaptionRecalc]);

    /** resize 時重新計算是否超過 7 行 */
    useEffect(() =>
    {
        scheduleCaptionRecalc();

        window.addEventListener("resize", scheduleCaptionRecalc);

        return () =>
        {
            if (recalcFrameRef.current !== null)
            {
                window.cancelAnimationFrame(recalcFrameRef.current);
                recalcFrameRef.current = null;
            }

            window.removeEventListener("resize", scheduleCaptionRecalc);
        };
    }, [scheduleCaptionRecalc]);

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

            {hasDescription && (
                <p
                    ref={descriptionRef}
                    className="custom-lightbox-caption-description"
                    style={props.captionExpanded ? captionDescriptionExpandedStyle : captionDescriptionClampStyle}
                >
                    {activeDescription}
                </p>
            )}
        </div>
    );
};


export default LibLightBox_Comp;
// #endregion
