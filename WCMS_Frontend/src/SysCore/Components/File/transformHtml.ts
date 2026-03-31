// src/core/internalId/transformHtml.ts
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { render } from "dom-serializer";
import type { Element } from "html-react-parser";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { INTERNAL_ATTR } from "../TinyMCE/TinyMCE_Hook";
import type { FileMeta } from "./FileResolver_Data";

export interface TransformOptions
{
    locale?: string;
    urlBuilder?: (id: string) => string;
    onNotFoundPlaceholder?: (id: string, tagName: string) => string;
    /** 下載是否開新視窗，預設 true */
    newWindow?: boolean;
    /** 是否保留 data-internalid 屬性，預設 false（處理完會移除） */
    keepDataAttr?: boolean;
    /** 自訂下載網址產生器；預設走 /Service/FileManagement/Server_Download/{id} */
    buildDownloadUrl?: (id: string, meta?: FileMeta) => string;
}

const replaceImg = (
    html: string,
    metaMap: Record<string, FileMeta>,
    opt?: TransformOptions,
): string =>
{
    // 同時吃 ' 與 "，避免某些編輯器輸出單引號
    const reImg = /<img\b([^>]*?)\bdata-internalid\s*=\s*["']([^"']+)["']([^>]*)>/gi;

    return html.replace(reImg, (full, pre, id, post) =>
    {
        const m = metaMap[id];

        // 先把舊的 src 與 data-internalid 拿掉，避免重複
        const cleaned = (pre + post)
            .replace(/\bsrc\s*=\s*["'][^"']*["']/gi, "")
            .replace(/\bdata-internalid\s*=\s*["'][^"']*["']/gi, "")
            .trim();

        const hasAlt = /\balt\s*=/i.test(pre + post);
        const altAttr = hasAlt ? "" : ` alt="${m?.alt ?? ""}"`;

        if (m?.url)
        {
            return `<img src="${m.url}"${altAttr} ${cleaned}>`;
        }
        // 後端還沒回資料時的保底 URL（先讓你看到 src）
        if (opt?.urlBuilder)
        {
            const url = opt.urlBuilder(id);
            return `<img src="${url}"${altAttr} ${cleaned}>`;
        }
        return full; // 最後保底：原樣返回
    });
};

const defaultBuildDownloadUrl = (id: string, meta?: FileMeta) =>
{
    if (meta?.url) return meta.url;
    return FileManagementAPI.get_Public_Download_Url(id);
};

const replaceAnchorDownload = (
    html: string,
    metaMap: Record<string, FileMeta>,
    opt?: TransformOptions,
): string =>
{
    const doc = parseDocument(html);

    const anchors = DomUtils.findAll(
        (el): el is Element =>
            el.type === "tag"
            && el.name === "a"
            && !!el.attribs?.[INTERNAL_ATTR],
        doc.children,
    );

    anchors.forEach((a) =>
    {
        const internalId = a.attribs[INTERNAL_ATTR]?.trim();
        if (!internalId) return;

        const meta = metaMap?.[internalId];
        const buildUrl = opt?.buildDownloadUrl ?? defaultBuildDownloadUrl;
        const href = buildUrl(internalId, meta);

        a.attribs["href"] = href;
        a.attribs["download"] = ""; // 讓瀏覽器以附件下載
        a.attribs["rel"] = "noopener noreferrer";
        if (opt?.newWindow !== false) a.attribs["target"] = "_blank";

        // AA：若沒有 aria-label，用文字內容補上
        if (!a.attribs["aria-label"])
        {
            const txt = DomUtils.textContent(a).trim();
            a.attribs["aria-label"] = txt || "下載檔案";
        }

        if (!opt?.keepDataAttr)
        {
            delete a.attribs[INTERNAL_ATTR];
        }
    });

    return render(doc, { encodeEntities: true });
};

const getDataInternalId = (el: Element): string | undefined =>
{
    // 盡量兼容三種寫法
    // @ts-ignore
    const a = el.attribs || {};
    return a[INTERNAL_ATTR];
};

const buildPreviewUrl = (id: string, opt?: TransformOptions): string =>
{
    if (opt?.urlBuilder) return opt.urlBuilder(id);
    // 後端既有的預覽端點（與 img/a 維持一致的預設）
    return FileManagementAPI.get_Public_Preview_Url(id);
};

const ensureTitleForAA = (el: Element, meta?: FileMeta) =>
{
    // @ts-ignore
    el.attribs = el.attribs || {};
    // @ts-ignore
    if (!el.attribs.title || el.attribs.title.trim() === "")
    {
        // @ts-ignore
        el.attribs.title = meta?.FileName || "Embedded content";
    }
};

const replaceIframe = (
    html: string,
    metaMap: Record<string, FileMeta>,
    opt?: TransformOptions,
): string =>
{
    if (!html) return html;

    const doc = parseDocument(html);
    const nodes = DomUtils.findAll(
        // 只抓 <iframe>
        (el): el is Element => (el as any)?.type === "tag" && (el as any)?.name === "iframe",
        doc.children,
    );

    if (!nodes.length) return html;

    for (const el of nodes)
    {
        const id = getDataInternalId(el);
        if (!id) continue;

        const meta = metaMap?.[id];
        const src = buildPreviewUrl(id, opt);

        // 設定 src
        // @ts-ignore
        el.attribs = el.attribs || {};
        // @ts-ignore
        el.attribs.src = src;

        // AA：補 title（不覆蓋既有）
        ensureTitleForAA(el, meta);

        // @ts-ignore
        delete el.attribs[INTERNAL_ATTR];
    }

    return render(doc, { decodeEntities: true });
};

export const transformHtmlWithMeta = (
    html: string,
    metaMap: Record<string, FileMeta>,
    opt?: TransformOptions,
): string =>
{
    if (!html) return html;
    let out = html;
    out = replaceIframe(out, metaMap, opt);
    out = replaceImg(out, metaMap, opt);
    out = replaceAnchorDownload(out, metaMap, opt);
    return out;
};
