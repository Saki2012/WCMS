import { useEffect } from "react";
import type { FC } from "react";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { Lang } from "@/SysCore/i18n/lang";
import "./Accesskey.css";

/**
 * import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
 * <Accesskey type="U" lang={lang} /> 上方導覽連結區
 * <Accesskey type="C" lang={lang} /> 中央內容區塊
 * <Accesskey type="L" lang={lang} /> 左方導覽區塊
 * <Accesskey type="Z" lang={lang} /> 頁尾網站資訊
 */

/* =========================
 * types
 * ========================= */

type AccesskeyType = "U" | "C" | "L" | "Z";

type AccesskeyA11yText = {
    title: string;
};

interface AccesskeyProps {
    type: AccesskeyType;
    lang?: Lang;
    className?: string;
}

/* =========================
 * constants
 * ========================= */

const SITE_HEADER_ID = "Site-Header";
const ACCESSKEY_HEIGHT_CSS_VAR = "--for-accesskey-height";

/* =========================
 * i18n map
 * ========================= */

const ACCESSKEY_MAP: Record<AccesskeyType, Partial<Record<Lang, AccesskeyA11yText>>> = {
    U: {
        "zh-tw": { title: "上方導覽連結區 (Alt+U)" },
        "zh-cn": { title: "上方导览连结区 (Alt+U)" },
        en: { title: "Top Navigation Bar (Alt+U)" },
    },
    C: {
        "zh-tw": { title: "中央內容區塊 (Alt+C)" },
        "zh-cn": { title: "中央内容区块 (Alt+C)" },
        en: { title: "Main Content Block (Alt+C)" },
    },
    L: {
        "zh-tw": { title: "左方導覽區塊 (Alt+L)" },
        "zh-cn": { title: "左方导览区块 (Alt+L)" },
        en: { title: "Left Navigation (Alt+L)" },
    },
    Z: {
        "zh-tw": { title: "頁尾網站資訊 (Alt+Z)" },
        "zh-cn": { title: "页尾网站资讯 (Alt+Z)" },
        en: { title: "Website Footer (Alt+Z)" },
    },
};

/* =========================
 * className map
 * ========================= */

const ACCESSKEY_CLASS_MAP: Record<AccesskeyType, string> = {
    U: "accesskey_header",
    C: "accesskey_main",
    L: "accesskey_left",
    Z: "accesskey_footer",
};

/* =========================
 * shared resize binding
 * ========================= */

let accesskeyBindingCount = 0;
let accesskeyCleanup: (() => void) | null = null;

/** 取得 Accesskey 顯示文案 */
const getAccesskey = (type: AccesskeyType, lang?: Lang): AccesskeyA11yText =>
{
    const key = lang ?? DefaultLang;
    const map = ACCESSKEY_MAP[type];

    return map[key] ?? ACCESSKEY_MAP[type][DefaultLang]!;
};

/** 取得目前 Site Header 高度 */
const getSiteHeaderHeight = (): number =>
{
    const header = document.getElementById(SITE_HEADER_ID);

    return Math.ceil(header?.getBoundingClientRect().height ?? 0);
};

/** 寫入 root CSS 變數 */
const setAccesskeyHeight = (height: number): void =>
{
    document.documentElement.style.setProperty(ACCESSKEY_HEIGHT_CSS_VAR, `${height}px`);
};

/** 同步 Site Header 高度到 CSS root */
const syncAccesskeyHeight = (): void =>
{
    const height = getSiteHeaderHeight();

    setAccesskeyHeight(height);
};

/** 建立共用監聽 */
const bindAccesskeyHeight = (): (() => void) =>
{
    let frameId = 0;

    const sync = (): void =>
    {
        if (frameId > 0) window.cancelAnimationFrame(frameId);

        frameId = window.requestAnimationFrame(() =>
        {
            frameId = 0;
            syncAccesskeyHeight();
        });
    };

    const header = document.getElementById(SITE_HEADER_ID);
    const resizeObserver = header && "ResizeObserver" in window ? new ResizeObserver(sync) : null;

    sync();
    window.addEventListener("load", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("resize", sync);
    resizeObserver?.observe(header!);

    return () =>
    {
        if (frameId > 0) window.cancelAnimationFrame(frameId);

        window.removeEventListener("load", sync);
        window.removeEventListener("pageshow", sync);
        window.removeEventListener("resize", sync);
        resizeObserver?.disconnect();
    };
};

/** 啟用 Accesskey Header 高度同步 */
const useAccesskeyHeaderHeight = (): void =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        accesskeyBindingCount += 1;

        if (accesskeyBindingCount === 1) accesskeyCleanup = bindAccesskeyHeight();

        return () =>
        {
            accesskeyBindingCount = Math.max(0, accesskeyBindingCount - 1);

            if (accesskeyBindingCount > 0) return;

            accesskeyCleanup?.();
            accesskeyCleanup = null;
        };
    }, []);
};

/* =========================
 * component
 * ========================= */

export const Accesskey: FC<AccesskeyProps> = ({ type, lang, className }) =>
{
    useAccesskeyHeaderHeight();

    const a11y = getAccesskey(type, lang);

    return (
        <section className="accesskey_section">
            <a
                accessKey={type}
                id={`A${type}`}
                href={`#A${type}`}
                className={`${ACCESSKEY_CLASS_MAP[type]} ${className ?? ""}`}
                title={a11y.title}
                aria-label={a11y.title}
            >
                :::
            </a>
        </section>
    );
};