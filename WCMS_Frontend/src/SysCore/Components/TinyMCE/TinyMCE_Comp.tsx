// src/components/TinyMCE_Comp.tsx
import { DefaultLang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Editor } from "@tinymce/tinymce-react";
import { useMemo } from "react";
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

const TinyMCE_Comp = ({ args }: Props) =>
{
    const tiny = useTinyMCE({
        id: args.id,
        value: args.value,
        onChange: args.onChange,
        uploadFileApi: args.uploadFileApi ?? FileManagementAPI.Server_UploadTemp,
        makeFileUrl: args.makeFileUrl
            ?? ((id, meta) => meta.kind === "image" ? FileManagementAPI.get_Public_Preview_Url(id) : FileManagementAPI.get_Public_Download_Url(id)),
        languageUrl: args.languageUrl ?? "/tinymce-i18n/langs5/zh_TW.js",
        language: args.language ?? DefaultLang,
        baseUrl: args.baseUrl ?? "/tinymce",
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

    return (
        <>
            <Editor id={args.id} tinymceScriptSrc="/tinymce/tinymce.min.js" value={tiny.value} onEditorChange={tiny.onChange} init={init as any} />
            <p style={{ color: "rgba(0,0,0,.3)", textAlign: "right", marginTop: 8, pointerEvents: "none", userSelect: "none", fontSize: 12 }}>
                本網站內容編輯器採用 TinyMCE 開源版 (MIT)
            </p>
        </>
    );
};

export default TinyMCE_Comp;
