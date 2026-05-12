import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { render } from "dom-serializer";
import type { Element } from "domhandler";
import { DomUtils, parseDocument } from "htmlparser2";
import { INTERNAL_ATTR } from "../TinyMCE/TinyMCE_Hook";
import type { CmsHtmlFileMeta, CmsHtmlTransformOptions } from "./CmsHtml_Types";

const UNSAFE_ELEMENT_NAMES = new Set(["script", "object", "embed", "base"]);
const MEDIA_PREVIEW_ELEMENT_NAMES = new Set(["img", "iframe", "video", "audio", "source"]);
const DANGEROUS_URL_PATTERN = /^\s*(javascript|vbscript|data):/i;

/** 擷取 TinyMCE HTML 內所有 data-internalid。 */
export const extractCmsHtmlInternalIds = (html?: string | null): string[] =>
{
    if (!html) return [];

    const ids = new Set<string>();
    const re = /data-internalid\s*=\s*(["'])(.*?)\1/gi;
    let match: RegExpExecArray | null;

    while ((match = re.exec(html)) !== null)
    {
        const id = `${match[2] ?? ""}`.trim();
        if (id) ids.add(id);
    }

    return Array.from(ids);
};

/** 將 CMS HTML 字串正規化成 SSR / CSR 都可直接輸出的安全格式。 */
export const transformCmsHtml = (html?: string | null, options?: CmsHtmlTransformOptions): string =>
{
    if (!html) return "";

    const doc = parseDocument(html, { decodeEntities: false });
    removeUnsafeElements(doc.children);

    const elements = DomUtils.findAll(isTagElement, doc.children);
    elements.forEach(el => normalizeElement(el, options));

    return render(doc, { encodeEntities: false });
};

/** 依 internalId 建立前台預覽網址。 */
export const buildCmsHtmlPreviewUrl = (internalId: string, meta?: CmsHtmlFileMeta, options?: CmsHtmlTransformOptions): string =>
{
    if (options?.buildPreviewUrl) return options.buildPreviewUrl(internalId, meta);
    if (meta?.url) return meta.url;
    return FileManagementAPI.get_Public_Preview_Url(internalId, getMetaFileName(meta));
};

/** 依 internalId 建立前台下載網址。 */
export const buildCmsHtmlDownloadUrl = (internalId: string, meta?: CmsHtmlFileMeta, options?: CmsHtmlTransformOptions): string =>
{
    if (options?.buildDownloadUrl) return options.buildDownloadUrl(internalId, meta);
    return FileManagementAPI.get_Public_Download_Url(internalId, getMetaFileName(meta));
};

/** 移除不應出現在 CMS HTML 的高風險標籤。 */
const removeUnsafeElements = (nodes: Element["children"]): void =>
{
    for (let i = nodes.length - 1; i >= 0; i--)
    {
        const node = nodes[i];
        if (!isTagElement(node)) continue;

        if (UNSAFE_ELEMENT_NAMES.has(node.name.toLowerCase()))
        {
            nodes.splice(i, 1);
            continue;
        }

        removeUnsafeElements(node.children);
    }
};

/** 正規化單一 HTML Element。 */
const normalizeElement = (el: Element, options?: CmsHtmlTransformOptions): void =>
{
    el.attribs = el.attribs ?? {};
    removeInlineEventAttributes(el);

    if (el.name.toLowerCase() === "a") normalizeAnchor(el, options);
    if (el.name.toLowerCase() === "iframe") normalizeIframe(el, options);
    if (MEDIA_PREVIEW_ELEMENT_NAMES.has(el.name.toLowerCase())) normalizeInternalPreviewElement(el, options);
};

/** 將 data-internalid 的媒體標籤轉成前台預覽網址。 */
const normalizeInternalPreviewElement = (el: Element, options?: CmsHtmlTransformOptions): void =>
{
    const internalId = getInternalId(el);
    if (!internalId) return;

    const meta = options?.fileMetaMap?.[internalId];
    const tagName = el.name.toLowerCase();

    if (tagName === "a") return;

    el.attribs.src = buildCmsHtmlPreviewUrl(internalId, meta, options);
    if (!options?.keepDataInternalId) delete el.attribs[INTERNAL_ATTR];

    if (tagName === "img") normalizeImgAttributes(el, meta);
    if (tagName === "iframe") normalizeIframeAttributes(el, meta);
};

/** 正規化 CMS HTML 內的連結。 */
const normalizeAnchor = (el: Element, options?: CmsHtmlTransformOptions): void =>
{
    const internalId = getInternalId(el);

    if (internalId) normalizeInternalDownloadAnchor(el, internalId, options);

    normalizeAnchorHref(el);
    normalizeBlankAnchorRel(el);
};

/** 將 data-internalid 的 a 轉成前台下載網址。 */
const normalizeInternalDownloadAnchor = (el: Element, internalId: string, options?: CmsHtmlTransformOptions): void =>
{
    const meta = options?.fileMetaMap?.[internalId];
    const label = getAnchorText(el) || getMetaFileName(meta) || "下載檔案";

    el.attribs.href = buildCmsHtmlDownloadUrl(internalId, meta, options);
    el.attribs.download = el.attribs.download ?? "";
    el.attribs["aria-label"] = el.attribs["aria-label"] || label;

    if (options?.downloadInNewWindow !== false) el.attribs.target = "_blank";
    if (!options?.keepDataInternalId) delete el.attribs[INTERNAL_ATTR];
};

/** 移除 javascript: 這類不安全 href。 */
const normalizeAnchorHref = (el: Element): void =>
{
    const href = `${el.attribs.href ?? ""}`.trim();
    if (!href) return;
    if (DANGEROUS_URL_PATTERN.test(href)) el.attribs.href = "#";
};

/** target=_blank 時補齊 noopener noreferrer。 */
const normalizeBlankAnchorRel = (el: Element): void =>
{
    const target = `${el.attribs.target ?? ""}`.toLowerCase();
    if (target !== "_blank") return;
    el.attribs.rel = mergeRel(el.attribs.rel, ["noopener", "noreferrer"]);
};

/** 正規化 iframe 安全與 AA 屬性。 */
const normalizeIframe = (el: Element, options?: CmsHtmlTransformOptions): void =>
{
    const internalId = getInternalId(el);
    const meta = internalId ? options?.fileMetaMap?.[internalId] : undefined;
    normalizeIframeAttributes(el, meta);
};

/** 補圖片必要屬性。 */
const normalizeImgAttributes = (el: Element, meta?: CmsHtmlFileMeta): void =>
{
    if (!hasNonEmptyAttribute(el, "alt")) el.attribs.alt = meta?.alt ?? getMetaFileName(meta) ?? "";
    if (!hasNonEmptyAttribute(el, "loading")) el.attribs.loading = "lazy";
    if (!hasNonEmptyAttribute(el, "decoding")) el.attribs.decoding = "async";
    if (!hasNonEmptyAttribute(el, "width") && meta?.width) el.attribs.width = String(meta.width);
    if (!hasNonEmptyAttribute(el, "height") && meta?.height) el.attribs.height = String(meta.height);
};

/** 補 iframe 必要屬性。 */
const normalizeIframeAttributes = (el: Element, meta?: CmsHtmlFileMeta): void =>
{
    if (!hasNonEmptyAttribute(el, "title")) el.attribs.title = meta?.alt ?? getMetaFileName(meta) ?? "Embedded content";
    if (!hasNonEmptyAttribute(el, "loading")) el.attribs.loading = "lazy";
    if (!hasNonEmptyAttribute(el, "referrerpolicy")) el.attribs.referrerpolicy = "no-referrer";
};

/** 移除 on* inline event，配合 CSP script-src-attr none。 */
const removeInlineEventAttributes = (el: Element): void =>
{
    Object.keys(el.attribs ?? {}).forEach(name =>
    {
        if (/^on/i.test(name)) delete el.attribs[name];
    });
};

/** 取得 data-internalid。 */
const getInternalId = (el: Element): string =>
{
    return `${el.attribs?.[INTERNAL_ATTR] ?? ""}`.trim();
};

/** 取得檔名 fallback。 */
const getMetaFileName = (meta?: CmsHtmlFileMeta): string =>
{
    return `${meta?.fileName ?? meta?.alt ?? ""}`.trim();
};

/** 取得 a 文字內容。 */
const getAnchorText = (el: Element): string =>
{
    return DomUtils.textContent(el).replace(/\s+/g, " ").trim();
};

/** 判斷屬性是否有有效值。 */
const hasNonEmptyAttribute = (el: Element, name: string): boolean =>
{
    return `${el.attribs?.[name] ?? ""}`.trim() !== "";
};

/** 合併 rel token，避免重複。 */
const mergeRel = (source: string | undefined, values: string[]): string =>
{
    const set = new Set(`${source ?? ""}`.split(/\s+/).map(x => x.trim()).filter(Boolean));
    values.forEach(value => set.add(value));
    return Array.from(set).join(" ");
};

/** 判斷是否為 HTML element。 */
const isTagElement = (node: unknown): node is Element =>
{
    return !!node && typeof node === "object" && (node as Element).type === "tag" && typeof (node as Element).name === "string";
};
