// src/core/internalId/transformHtml.ts
import { render } from "dom-serializer";
import type { Element } from "html-react-parser";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
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
    /** 自訂下載網址產生器；預設走 /Service/FileManagement/Download/{id} */
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
    // 若 meta 有現成 downloadUrl 就用，否則走預設路徑
    if (meta?.url) return meta.url;
    const base = import.meta.env.VITE_API_BASE_URL ?? "";
    return `${base}/FileManagement/Download/${id}`;
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
            && !!el.attribs?.["data-internalid"],
        doc.children,
    );

    anchors.forEach((a) =>
    {
        const internalId = a.attribs["data-internalid"]?.trim();
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
            delete a.attribs["data-internalid"];
        }
    });

    return render(doc, { encodeEntities: true });
};

export const transformHtmlWithMeta = (
    html: string,
    metaMap: Record<string, FileMeta>,
    opt?: TransformOptions,
): string =>
{
    if (!html) return html;
    let out = html;
    out = replaceImg(out, metaMap, opt);
    out = replaceAnchorDownload(out, metaMap, opt);
    return out;
};
