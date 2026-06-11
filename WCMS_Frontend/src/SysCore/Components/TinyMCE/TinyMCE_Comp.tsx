// src/components/TinyMCE_Comp.tsx
import { DefaultLang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Editor, type IAllProps } from "@tinymce/tinymce-react";
import { useEffect, useMemo, useState } from "react";
import type { TinyMCEEditor } from "./Core/tinyMceTypes";
import { useTinyMceIframeEdit } from "./Iframe/tinyMceIframeFeature";
import { useTinyMceInternalImage } from "./Image/tinyMceImageFeature";
import { useTinyMCE } from "./TinyMCE_Hook";

// #region Public
type Props = {
    args: {
        id: string;
        value: string;
        onChange: (v: string) => void;
        uploadFileApi?: string;
        makeFileUrl?: (internalId: string, meta: { kind: "file" | "image"; }) => string;
        languageUrl?: string;
        language?: string;
        baseUrl?: string;
        // （可選）若你想自訂預覽圖路徑，不填就用 makeFileUrl('image') 推導
        makeImagePreviewUrl?: (internalId: string) => string;
        // （可選）AA：存檔時補 alt=""
        enforceAlt?: boolean;
    };
};

type TinyMceScriptState = "loading" | "ready" | "error";
type TinyMceWindow = Window & { tinymce?: object; };
type TinyMceReactInit = NonNullable<IAllProps["init"]>;

type WcmsTinyMceInit = Record<string, unknown> & {
    content_style?: string;
    contextmenu?: string;
    extended_valid_elements?: string;
    setup?: (editor: TinyMCEEditor) => void;
    license_key?: string;
    tinymceScriptSrc?: string;
};
type WcmsTinyMceEditor = TinyMCEEditor & { _wcmsComposing?: boolean; };

/** 取得頁面既有 nonce；正式 CSP 改以同站外部 script 為主，保留相容舊設定。 */
const getCspNonce = (): string =>
{
    const script = document.querySelector("script[nonce]") as HTMLScriptElement | null;
    const scriptNonce = script?.nonce?.trim() ?? "";
    if (scriptNonce) return scriptNonce;

    const meta = document.querySelector("meta[property=\"csp-nonce\"]") as HTMLElement | null;
    return meta?.nonce?.trim() ?? "";
};

/** 檢查 TinyMCE 是否已由同站 script 載入完成。 */
const hasTinyMceGlobal = (): boolean =>
{
    const win = window as TinyMceWindow;
    return Boolean(win.tinymce);
};

/** 尋找頁面上已存在的 TinyMCE script，避免重複插入。 */
const findTinyMceScript = (src: string): HTMLScriptElement | null =>
{
    const sourcePath = new URL(src, window.location.origin).pathname;
    const scripts = Array.from(document.scripts);
    return scripts.find(script => new URL(script.src, window.location.origin).pathname === sourcePath) ?? null;
};

/** 載入 public 內的 TinyMCE；正式 CSP 僅允許同站外部 script。 */
const loadTinyMceScript = (src: string): Promise<void> =>
{
    return new Promise((resolve, reject) =>
    {
        if (hasTinyMceGlobal())
        {
            resolve();
            return;
        }

        const existing = findTinyMceScript(src);
        if (existing)
        {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("TinyMCE script load failed")), { once: true });
            return;
        }

        const script = document.createElement("script");
        const nonce = getCspNonce();
        script.src = src;
        script.async = true;
        script.referrerPolicy = "strict-origin-when-cross-origin";
        if (nonce) script.nonce = nonce;

        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => reject(new Error("TinyMCE script load failed")), { once: true });
        document.head.appendChild(script);
    });
};

/** 後台編輯器先載入自架 TinyMCE，避免初始化時重複插入 script。 */
const useTinyMceScript = (src: string): TinyMceScriptState =>
{
    const [state, setState] = useState<TinyMceScriptState>(() => typeof window === "undefined" ? "loading" : hasTinyMceGlobal() ? "ready" : "loading");

    useEffect(() =>
    {
        let disposed = false;
        setState(hasTinyMceGlobal() ? "ready" : "loading");

        loadTinyMceScript(src).then(() =>
        {
            if (!disposed) setState("ready");
        }).catch(() =>
        {
            if (!disposed) setState("error");
        });

        return () =>
        {
            disposed = true;
        };
    }, [src]);

    return state;
};

/** 將 WCMS 語系代碼轉成 TinyMCE 使用的語系代碼。 */
const normalizeTinyMceLangCode = (lang?: string): string =>
{
    const code = (lang ?? DefaultLang).trim().toLowerCase();

    if (code === "zh-tw" || code === "zh_tw") return "zh_TW";
    if (code === "zh-cn" || code === "zh_cn") return "zh_CN";
    if (code === "en-us" || code === "en_us") return "en";

    return code.replace(/-([a-z]{2})$/, (_, region: string) => `_${region.toUpperCase()}`);
};

/** 建立 TinyMCE 語系檔路徑，讓 language 與 language_url 保持一致。 */
const buildTinyMceLanguageUrl = (langCode: string): string =>
{
    return `/tinymce-i18n/langs5/${langCode}.js`;
};

export const TinyMCE_Comp = ({ args }: Props) =>
{
    const baseUrl = args.baseUrl ?? "/tinymce";
    const tinymceScriptSrc = `${baseUrl}/tinymce.min.js`;
    const scriptState = useTinyMceScript(tinymceScriptSrc);
    const tinyMceLang = normalizeTinyMceLangCode(args.language ?? DefaultLang);

    const tiny = useTinyMCE({
        id: args.id,
        value: args.value,
        onChange: args.onChange,
        uploadFileApi: args.uploadFileApi ?? FileManagementAPI.Server_UploadTemp,
        makeFileUrl: args.makeFileUrl
            ?? ((id, meta) => meta.kind === "image" ? FileManagementAPI.get_Public_Preview_Url(id) : FileManagementAPI.get_Public_Download_Url(id)),
        languageUrl: args.languageUrl ?? buildTinyMceLanguageUrl(tinyMceLang),
        language: tinyMceLang,
        baseUrl,
    });

    // const { toEditor, toDb } = useContentTransform({ previewPrefix: `${FileManagementAPI.PREVIEW_URL}`, attrName: INTERNAL_ATTR, });
    // const value = useMemo(() => toEditor(tiny.value ?? ''), [tiny.value, toEditor]);          // 🟢 DB→Editor
    // const onChange = useCallback((html: string) => tiny.onChange?.(toDb(html)), [tiny.onChange, toDb]); // 🟢 Editor→DB

    // 新增：圖片 internalId <-> src 的轉換（預覽用 API 路徑）
    const image = useTinyMceInternalImage({
        resolvePreviewUrl: args.makeImagePreviewUrl
            ?? ((id) => (args.makeFileUrl ? args.makeFileUrl(id, { kind: "image" }) : FileManagementAPI.get_Public_Preview_Url(id))),
        enforceAlt: args.enforceAlt ?? true,
    });

    const iframe = useTinyMceIframeEdit();

    // ✅ 不覆蓋、不修改你原本 init：只是在外層包一個 setup，串上 image.setup
    const init = useMemo(() =>
    {
        const existingInit = tiny.init as WcmsTinyMceInit;
        const {
            license_key: _licenseKey,
            tinymceScriptSrc: _tinymceScriptSrc,
            ...safeInit
        } = existingInit;

        const originalSetup = safeInit.setup;
        const mergedContentStyle = `${safeInit.content_style ? `${safeInit.content_style}\n` : ""}
   /* 讓 iFrame 在編輯器內可被右鍵/雙擊（事件回到 TinyMCE） */
   iframe {
     pointer-events: none;     /* 右鍵/點擊不進入內嵌頁面 */
     display: block;
     max-width: 100%;
   }
   `;
        const mergedContextMenu = `${safeInit.contextmenu ? `${safeInit.contextmenu} ` : ""}wcms-iframe-menu`;
        return {
            ...safeInit,
            content_style: mergedContentStyle,
            extended_valid_elements: [
                safeInit?.extended_valid_elements || "",
                // ⬇️ 多了 sandbox
                "iframe[src|title|width|height|style|allow|loading|referrerpolicy|frameborder|allowfullscreen]",
            ].filter(Boolean).join(","),
            contextmenu: mergedContextMenu,
            setup: (editor: TinyMCEEditor) =>
            {
                if (typeof originalSetup === "function") originalSetup(editor);
                image.setup(editor);
                iframe.setup(editor);
                let composing = false;
                let rafId = 0;
                const setComposing = (v: boolean) =>
                {
                    composing = v;
                    (editor as WcmsTinyMceEditor)._wcmsComposing = v;
                };
                const pushUpstreamNow = () =>
                {
                    if (composing) return; // 🟢 組字中不回推
                    const html = editor.getContent({ format: "html" });
                    if (html !== tiny.value) tiny.onChange?.(html);
                };
                const pushUpstream = () =>
                {
                    if (composing) return; // 🟢 組字中不回推
                    cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(pushUpstreamNow); // 🟢 以 RAF 微節流，降低 re-render 次數
                };
                editor.on("compositionstart compositionupdate", () => setComposing(true));
                editor.on("compositionend", () =>
                {
                    setComposing(false);
                    pushUpstreamNow();
                });

                editor.on("input", pushUpstream);
                editor.on("change", pushUpstream);
                editor.on("SetContent", pushUpstream);
                editor.on("ObjectResized", pushUpstream);
                editor.on("Undo", pushUpstream);
                editor.on("Redo", pushUpstream);
                editor.on("NodeChange", pushUpstream);
                editor.on("Dirty", pushUpstream);
                editor.on("Blur", pushUpstream);
                editor.on("wcms-iframe-updated", pushUpstream);
            },
        } as TinyMceReactInit;
    }, [tiny.init, image, iframe]);

    if (scriptState === "error")
    {
        return <div role="alert" className="text-danger">內容編輯器載入失敗，請重新整理頁面後再試。</div>;
    }

    if (scriptState !== "ready")
    {
        return <div role="status" aria-live="polite">內容編輯器載入中...</div>;
    }

    return (
        <>
            <Editor id={args.id} tinymceScriptSrc={tinymceScriptSrc} licenseKey="gpl" value={tiny.value} onEditorChange={tiny.onChange} init={init} />
            <p style={{ color: "rgba(0,0,0,.3)", textAlign: "right", marginTop: 8, pointerEvents: "none", userSelect: "none", fontSize: 12 }}>
                本網站內容編輯器採用 TinyMCE 開源版 (MIT)
            </p>
        </>
    );
};
// #endregion
