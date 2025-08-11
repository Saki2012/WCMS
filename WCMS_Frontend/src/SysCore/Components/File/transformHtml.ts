// src/core/internalId/transformHtml.ts
import type { FileMeta } from "./FileResolver_Data";

export interface TransformOptions {
  locale?: string;
  // ★ 新增：後端還沒回資料時，用這個規則先組一個可用的 URL
  urlBuilder?: (id: string) => string;
  onNotFoundPlaceholder?: (id: string, tagName: string) => string;
}

const replaceImg = (
  html: string,
  metaMap: Record<string, FileMeta>,
  opt?: TransformOptions
): string => {
  // 同時吃 ' 與 "，避免某些編輯器輸出單引號
  const reImg = /<img\b([^>]*?)\bdata-internalid\s*=\s*["']([^"']+)["']([^>]*)>/gi;

  return html.replace(reImg, (full, pre, id, post) => {
    const m = metaMap[id];

    // 先把舊的 src 與 data-internalid 拿掉，避免重複
    const cleaned = (pre + post)
      .replace(/\bsrc\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\bdata-internalid\s*=\s*["'][^"']*["']/gi, "")
      .trim();

    const hasAlt = /\balt\s*=/i.test(pre + post);
    const altAttr = hasAlt ? "" : ` alt="${m?.alt ?? ""}"`;

    if (m?.url) {
      return `<img src="${m.url}"${altAttr} ${cleaned}>`;
    }
    // 後端還沒回資料時的保底 URL（先讓你看到 src）
    if (opt?.urlBuilder) {
      const url = opt.urlBuilder(id);
      return `<img src="${url}"${altAttr} ${cleaned}>`;
    }
    return full; // 最後保底：原樣返回
  });
};

export const transformHtmlWithMeta = (
  html: string,
  metaMap: Record<string, FileMeta>,
  opt?: TransformOptions
): string => {
  if (!html) return html;
  let out = html;
  out = replaceImg(out, metaMap, opt);
  return out;
};
