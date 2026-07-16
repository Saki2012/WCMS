import { CMS_HTML_VIEWER_ATTR, CMS_HTML_VIEWER_PDF } from "@/SysCore/Components/CmsHtml/CmsHtml_Types";
import { INTERNAL_ATTR } from "../../Core/tinyMceConstants";

// #region Property
const EDITOR_PDF_PLACEHOLDER_ATTR = "data-wcms-editor-pdf-placeholder";
const EDITOR_PDF_SOURCE_ATTR = "data-wcms-editor-pdf-source";
const CMS_FILE_PREVIEW_URL_FRAGMENT = "/service/filemanagement/public_preview/";
// #endregion

// #region Public
/** 將 canonical PDF iframe 轉成只存在於 TinyMCE 畫面中的可辨識 placeholder。 */
export const toTinyMcePdfEditorHtml = (html: string, iconUrl: string): string =>
{
    const doc = parseHtml(html);
    if (!doc) return html;

    let changed = false;
    doc.body.querySelectorAll("iframe").forEach(iframe =>
    {
        if (!isPdfIframe(iframe)) return;

        const placeholder = buildPdfPlaceholder(doc, iframe, iconUrl);
        iframe.replaceWith(placeholder);
        changed = true;
    });

    return changed ? doc.body.innerHTML : html;
};

/** 將 TinyMCE 的 PDF placeholder 還原為存入 DB 的 canonical iframe。 */
export const fromTinyMcePdfEditorHtml = (html: string): string =>
{
    const doc = parseHtml(html);
    if (!doc) return html;

    let changed = false;
    doc.body.querySelectorAll(`[${EDITOR_PDF_PLACEHOLDER_ATTR}]`).forEach(placeholder =>
    {
        const iframe = restorePdfIframe(doc, placeholder.getAttribute(EDITOR_PDF_SOURCE_ATTR));
        if (!iframe) return;

        placeholder.replaceWith(iframe);
        changed = true;
    });

    return changed ? doc.body.innerHTML : html;
};
// #endregion

// #region Private
const parseHtml = (html: string): Document | null =>
{
    if (!html || typeof DOMParser === "undefined") return null;
    return new DOMParser().parseFromString(html, "text/html");
};

const isPdfIframe = (iframe: HTMLIFrameElement): boolean =>
{
    const viewer = `${iframe.getAttribute(CMS_HTML_VIEWER_ATTR) ?? ""}`.trim().toLowerCase();
    const src = `${iframe.getAttribute("src") ?? ""}`.trim().toLowerCase();
    const internalId = `${iframe.getAttribute(INTERNAL_ATTR) ?? ""}`.trim();

    if (viewer === CMS_HTML_VIEWER_PDF) return true;
    if (src.includes(".pdf")) return true;
    return Boolean(internalId) && src.includes(CMS_FILE_PREVIEW_URL_FRAGMENT);
};

const buildPdfPlaceholder = (doc: Document, iframe: HTMLIFrameElement, iconUrl: string): HTMLSpanElement =>
{
    const title = `${iframe.getAttribute("title") ?? ""}`.trim() || "PDF 文件";
    const label = title.toLowerCase().endsWith(".pdf") ? title : `${title}.pdf`;
    const canonicalIframe = iframe.cloneNode(true) as HTMLIFrameElement;
    Array.from(canonicalIframe.attributes).forEach(attribute =>
    {
        if (/^on/i.test(attribute.name) || attribute.name.toLowerCase() === "srcdoc") canonicalIframe.removeAttribute(attribute.name);
    });
    canonicalIframe.setAttribute(CMS_HTML_VIEWER_ATTR, CMS_HTML_VIEWER_PDF);

    const placeholder = doc.createElement("span");
    placeholder.setAttribute(EDITOR_PDF_PLACEHOLDER_ATTR, "");
    placeholder.setAttribute(EDITOR_PDF_SOURCE_ATTR, encodeURIComponent(canonicalIframe.outerHTML));
    placeholder.setAttribute("contenteditable", "false");
    placeholder.setAttribute("role", "group");
    placeholder.setAttribute("aria-label", `PDF：${label}`);
    placeholder.setAttribute("title", label);

    const icon = doc.createElement("img");
    icon.setAttribute("src", iconUrl);
    icon.setAttribute("alt", "");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("width", "32");
    icon.setAttribute("height", "43");

    const type = doc.createElement("strong");
    type.textContent = "PDF";

    placeholder.append(icon, " ", type, ` ${label}`);
    return placeholder;
};

const restorePdfIframe = (targetDoc: Document, encodedSource: string | null): HTMLIFrameElement | null =>
{
    if (!encodedSource) return null;

    try
    {
        const sourceDoc = parseHtml(decodeURIComponent(encodedSource));
        const iframe = sourceDoc?.body.querySelector("iframe");
        return iframe ? targetDoc.importNode(iframe, true) : null;
    } catch
    {
        return null;
    }
};
// #endregion
