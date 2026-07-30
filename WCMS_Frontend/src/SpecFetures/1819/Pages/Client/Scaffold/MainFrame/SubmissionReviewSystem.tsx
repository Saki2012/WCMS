import ScholarOneLogo from "@/SpecFetures/1819/Assets/Client/images/logo/Scholar-One_184x20.svg";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
const STORAGE_KEY = "wcms.srs.dismissed";


type SubmissionReviewSystemProps = {
    /** 目前頁面語系。 */
    lang: Lang;
    /** 連結（預設 ScholarOne） */
    href?: string;
    /** Menu 顯示文字（預設：投審稿系統） */
    label?: string;
};
// #endregion

// #region Public
/**
 * 全站共用：投審稿系統（浮動 + Menu入口）
 *
 * 規則：
 * - Desktop：預設顯示右側浮動；按 X 後 → 浮動隱藏、Menu 出現入口
 * - 點 Menu 入口：會另開視窗 + 還原浮動（同時移除 Menu 入口）
 * - RWD：永遠只顯示 Menu 入口，不顯示右側浮動
 */
export const SubmissionReviewSystem: React.FC<SubmissionReviewSystemProps> = (props) =>
{
    const text = getSubmissionReviewSystemLangText(props.lang);
    const href = props.href ?? "https://mc.manuscriptcentral.com/joemls";
    const label = props.label ?? text.label;

    const isMobile = useIsMobile();
    const { dismissed, dismiss, restore } = useDismissedState();

    const showFloating = useMemo(() =>
    {
        if (isMobile) return false;
        return dismissed === false;
    }, [dismissed, isMobile]);

    const showMenuEntry = useMemo(() =>
    {
        if (isMobile) return true;
        return dismissed === true;
    }, [dismissed, isMobile]);

    return (
        <>
            {showFloating && <FloatingWidget href={href} label={label} closeLabel={text.closeLabel} onClose={dismiss} />}

            {/* Menu 入口：你要放到 Header 的 Menu 區塊時，就 render 這段 */}
            {showMenuEntry && <MenuEntry href={href} label={label} onRestore={restore} isMobile={isMobile} />}
        </>
    );
};
// #endregion

// #region Private
/** 取得 RWD 狀態：小於等於 lg(992) 就視為 Mobile */
const useIsMobile = (): boolean =>
{
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const mq = window.matchMedia("(max-width: 991.98px)");

        const update = () =>
        {
            setIsMobile(mq.matches);
        };

        update();

        // ✅ 標準寫法
        if (typeof mq.addEventListener === "function")
        {
            mq.addEventListener("change", update);
            return () => mq.removeEventListener("change", update);
        }

        // ✅ 舊版 Safari fallback（TS lib 可能沒有定義）
        const legacyMq = mq as any;
        if (typeof legacyMq.addListener === "function")
        {
            legacyMq.addListener(update);
            return () => legacyMq.removeListener(update);
        }

        return;
    }, []);

    return isMobile;
};


/** 讀/寫關閉狀態（跨頁維持） */
const useDismissedState = () =>
{
    const [dismissed, setDismissed] = useState(false);

    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const raw = localStorage.getItem(STORAGE_KEY);
        setDismissed(raw === "1");
    }, []);

    const dismiss = useCallback(() =>
    {
        setDismissed(true);
        if (typeof window === "undefined") return;
        localStorage.setItem(STORAGE_KEY, "1");
    }, []);

    const restore = useCallback(() =>
    {
        setDismissed(false);
        if (typeof window === "undefined") return;
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { dismissed, dismiss, restore };
};


/** 右側浮動：投審稿系統（Prototype: #Fixed_Right_Div.Circle_Div） */
const FloatingWidget = (props: { href: string; label: string; closeLabel: string; onClose: () => void; }) =>
{
    return (
        <div id="Fixed_Right_Div" className="Circle_Div">
            <a
                href="#"
                className="Fixedbtn-close"
                role="button"
                aria-label={`${props.closeLabel}${props.label}`}
                title={`${props.closeLabel}${props.label}`}
                onClick={(e) =>
                {
                    e.preventDefault();
                    props.onClose();
                }}
            >
                <i className="far fa-times" aria-hidden="true" />
            </a>

            <div className="Circle_Outer">
                <LangLink to={props.href} className="Circle_Inner_side" title={props.label}>
                    <div className="Inner_box">
                        <div className="Circle_Icon">
                            <i className="fas fa-file-alt" aria-hidden="true" />
                        </div>
                        <div className="Circle_Img">
                            <img className="card_image" src={ScholarOneLogo} alt="" />
                        </div>
                        <div className="Circle_Txt">{props.label}</div>
                        <div className="Circle_arrow">
                            <i className="far fa-chevron-right" aria-hidden="true" />
                        </div>
                    </div>
                </LangLink>
            </div>
        </div>
    );
};


/**
 * Menu 入口（小圖示 + 文字）
 * - 點擊後：另開視窗 + 還原浮動（Desktop 才會還原；Mobile 永遠只保留 Menu）
 */
const MenuEntry = (props: { href: string; label: string; onRestore: () => void; isMobile: boolean; }) =>
{
    const onClick = useCallback(() =>
    {
        if (!props.isMobile) props.onRestore();
    }, [props.isMobile, props.onRestore]);

    return (
        <li className="nav-item SubmissionReviewSystem_MenuItem">
            <LangLink className="nav-link SubmissionReviewSystem_MenuLink" to={props.href} title={props.label} aria-label={props.label} onClick={onClick}>
                <i className="fas fa-file-alt" aria-hidden="true" />
                <span>{props.label}</span>
            </LangLink>
        </li>
    );
};
// #endregion

// #region LangText
interface SubmissionReviewSystemLangText
{
    closeLabel: string;
    label: string;
}
const SUBMISSION_REVIEW_SYSTEM_LANG_TEXT_MAP: Record<string, SubmissionReviewSystemLangText> = {
    "zh-tw": {
        closeLabel: "關閉",
        label: "投審稿系統",
    },
    en: {
        closeLabel: "Close ",
        label: "Online Submission",
    },
};
/** 取得投審稿系統文字設定。 */
const getSubmissionReviewSystemLangText = (lang: Lang): SubmissionReviewSystemLangText =>
{
    return SUBMISSION_REVIEW_SYSTEM_LANG_TEXT_MAP[lang] ?? SUBMISSION_REVIEW_SYSTEM_LANG_TEXT_MAP[DefaultLang];
};
// #endregion
