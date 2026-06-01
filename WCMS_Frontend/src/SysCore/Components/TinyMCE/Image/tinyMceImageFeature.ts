import { INTERNAL_ATTR } from "../Core/tinyMceConstants";
import type { TinyMCEEditor } from "../Core/tinyMceTypes";
import { getIframeReferrerPolicy } from "../Iframe/tinyMceIframeUtils";
import { normalizeImageHtmlBeforeSave, normalizeImageHtmlForEditor, syncResponsiveImageElement } from "./tinyMceImageUtils";

export interface UseTinyMceInternalImageOptions
{
    resolvePreviewUrl: (internalId: string) => string;
    enforceAlt?: boolean;
}

export interface UseTinyMceInternalImageResult
{
    setup: (editor: TinyMCEEditor) => void;
    transformForEditor: (html: string) => string;
    transformForDb: (html: string) => string;
}

type TinyMceContentEvent = { content: string; format?: string; };
type TinyMceDomEvent = { target?: EventTarget | null; };
type TinyMceSerializerNode = { attr: (name: string, value?: string | null) => string; parent?: TinyMceSerializerNode; };
type TinyMceSerializer = { addNodeFilter?: (name: string, callback: (nodes: TinyMceSerializerNode[]) => void) => void; };
type TinyMceEditorWithSerializer = TinyMCEEditor & { serializer?: TinyMceSerializer; };

const doTransformForEditor = (html: string, makeSrc: (id: string) => string) =>
{
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll<HTMLImageElement>("img").forEach(img =>
    {
        const id = img.getAttribute(INTERNAL_ATTR) || "";
        if (!id) return;
        const want = makeSrc(id);
        if (img.getAttribute("src") !== want) img.setAttribute("src", want);
    });
    return normalizeImageHtmlForEditor(doc.body.innerHTML, INTERNAL_ATTR);
};

const doTransformForDb = (html: string, enforceAlt: boolean) =>
{
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll<HTMLImageElement>("img").forEach(img =>
    {
        if (img.hasAttribute(INTERNAL_ATTR))
        {
            img.removeAttribute("src");
        }
        if (enforceAlt && !img.hasAttribute("alt")) img.setAttribute("alt", "");
    });
    return normalizeImageHtmlBeforeSave(doc.body.innerHTML, INTERNAL_ATTR);
};

export const registerInternalImageSync = (editor: TinyMCEEditor, resolvePreviewUrl: (internalId: string) => string, internalAttr = INTERNAL_ATTR) =>
{
    editor.on("ObjectSelected", (e) =>
    {
        const elm = e.target as HTMLElement;
        if (elm instanceof HTMLImageElement)
        {
            syncResponsiveImageElement(elm, internalAttr);
        }
    });

    editor.on("NodeChange", () =>
    {
        const imgs = editor.dom.select("img");
        imgs.forEach((img) =>
        {
            const internalId = img.getAttribute(internalAttr);
            if (!internalId) return;
            const expect = resolvePreviewUrl(internalId);
            if (img.getAttribute("src") !== expect) editor.dom.setAttrib(img, "src", expect);
            syncResponsiveImageElement(img as HTMLImageElement, internalAttr);
        });
    });
};

export const useTinyMceInternalImage = (opts: UseTinyMceInternalImageOptions): UseTinyMceInternalImageResult =>
{
    const { resolvePreviewUrl, enforceAlt = true } = opts;

    const transformForEditor = (html: string) => doTransformForEditor(html, resolvePreviewUrl);

    const transformForDb = (html: string) => doTransformForDb(html, enforceAlt);

    const setup = (editor: TinyMCEEditor) =>
    {
        editor.on("BeforeSetContent", (e: TinyMceContentEvent) =>
        {
            if (typeof e.content === "string" && e.content.includes("<img"))
            {
                e.content = transformForEditor(e.content);
            }
        });
        editor.on("GetContent", (e: TinyMceContentEvent) =>
        {
            if (!e.format || e.format === "html")
            {
                e.content = transformForDb(e.content);
            }
        });
        editor.on("DblClick", (e: TinyMceDomEvent) =>
        {
            const el = e?.target as HTMLElement | null;
            const img = el?.closest?.("img");
            if (img)
            {
                editor.selection.select(img);
                editor.execCommand("mceImage");
            }
            const a = el?.closest?.("a[href]");
            if (a)
            {
                editor.selection.select(a);
                editor.execCommand("mceLink", false, { dialog: true });
                return;
            }
        });
        editor.on("PreInit", () =>
        {
            const ser = (editor as TinyMceEditorWithSerializer).serializer;
            if (ser?.addNodeFilter)
            {
                ser.addNodeFilter("iframe", (nodes) =>
                {
                    nodes.forEach((node) =>
                    {
                        const referrerPolicy = getIframeReferrerPolicy(node.attr("src") || "");
                        node.attr("sandbox", null);
                        node.attr("loading", "lazy");
                        node.attr("referrerpolicy", referrerPolicy);
                        node.attr("allowfullscreen", "");

                        const wrap = node.parent;
                        if (wrap)
                        {
                            wrap.attr("data-mce-p-sandbox", null);
                            wrap.attr("data-mce-p-loading", "lazy");
                            wrap.attr("data-mce-p-referrerpolicy", referrerPolicy);
                            wrap.attr("data-mce-p-allowfullscreen", "");
                        }
                    });
                });
            }
        });
    };

    return { setup, transformForEditor, transformForDb } as const;
};
