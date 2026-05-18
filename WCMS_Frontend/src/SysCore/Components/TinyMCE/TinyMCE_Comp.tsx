// src/components/TinyMCE_Comp.tsx
import { DefaultLang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useMemo, useState } from "react";
import { useTinyMCE, useTinyMceIframeEdit, useTinyMceInternalImage } from "./TinyMCE_Hook";

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

/** 取得 SSR Server 寫入的 CSP nonce，讓後台自架 TinyMCE script 不需要放寬 script-src。 */
const getCspNonce = (): string =>
{
    const script = document.querySelector("script[nonce]") as HTMLScriptElement | null;
    const scriptNonce = script?.nonce?.trim() ?? "";
    if (scriptNonce) return scriptNonce;

    const meta = document.querySelector('meta[property="csp-nonce"]') as HTMLElement | null;
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

/** 使用 nonce 載入 public 內的 TinyMCE，維持 script-src nonce + strict-dynamic。 */
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

/** 後台編輯器使用明確的 nonce script loader，避免 @tinymce/react 自行插入未標記 script。 */
const useTinyMceScript = (src: string): TinyMceScriptState =>
{
    const [state, setState] = useState<TinyMceScriptState>(() => typeof window === "undefined" ? "loading" : hasTinyMceGlobal() ? "ready" : "loading");

    useEffect(() =>
    {
        let disposed = false;
        setState(hasTinyMceGlobal() ? "ready" : "loading");

        loadTinyMceScript(src)
            .then(() => { if (!disposed) setState("ready"); })
            .catch(() => { if (!disposed) setState("error"); });

        return () => { disposed = true; };
    }, [src]);

    return state;
};

const TinyMCE_Comp = ({ args }: Props) =>
{
    const baseUrl = args.baseUrl ?? "/tinymce";
    const tinymceScriptSrc = `${baseUrl}/tinymce.min.js`;
    const scriptState = useTinyMceScript(tinymceScriptSrc);

    const tiny = useTinyMCE({
        id: args.id,
        value: args.value,
        onChange: args.onChange,
        uploadFileApi: args.uploadFileApi ?? FileManagementAPI.Server_UploadTemp,
        makeFileUrl: args.makeFileUrl
            ?? ((id, meta) => meta.kind === "image" ? FileManagementAPI.get_Public_Preview_Url(id) : FileManagementAPI.get_Public_Download_Url(id)),
        languageUrl: args.languageUrl ?? "/tinymce-i18n/langs5/zh_TW.js",
        language: args.language ?? DefaultLang,
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
        const existingInit = tiny.init as any;
        const originalSetup: ((editor: any) => void) | undefined = existingInit?.setup;
        const mergedContentStyle = (existingInit?.content_style ? existingInit.content_style + "\n" : "") + `
   /* 讓 iFrame 在編輯器內可被右鍵/雙擊（事件回到 TinyMCE） */
   iframe {
     pointer-events: none;     /* 右鍵/點擊不進入內嵌頁面 */
     display: block;
     max-width: 100%;
   }
   `;
        const mergedContextMenu = (existingInit?.contextmenu ? existingInit.contextmenu + " " : "") + "wcms-iframe-menu";
        return {
            ...existingInit,
            content_style: mergedContentStyle,
            extended_valid_elements: [
                existingInit?.extended_valid_elements || "",
                // ⬇️ 多了 sandbox
                "iframe[src|title|width|height|style|allow|loading|referrerpolicy|frameborder|allowfullscreen]",
            ].filter(Boolean).join(","),
            contextmenu: mergedContextMenu,
            setup: (editor: any) =>
            {
                if (typeof originalSetup === "function") originalSetup(editor);
                image.setup(editor);
                iframe.setup(editor);
                let composing = false;
                let rafId = 0;
                const setComposing = (v: boolean) =>
                {
                    composing = v;
                    (editor as any)._wcmsComposing = v;
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
        } as const;
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
            <Editor id={args.id} tinymceScriptSrc={tinymceScriptSrc} value={tiny.value} onEditorChange={tiny.onChange} init={init as any} />
            <p style={{ color: "rgba(0,0,0,.3)", textAlign: "right", marginTop: 8, pointerEvents: "none", userSelect: "none", fontSize: 12 }}>
                本網站內容編輯器採用 TinyMCE 開源版 (MIT)
            </p>
        </>
    );
};

export default TinyMCE_Comp;
