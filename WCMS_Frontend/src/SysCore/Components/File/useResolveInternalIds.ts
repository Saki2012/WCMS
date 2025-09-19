// SysCore/Components/File/useResolveInternalIds.ts
import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import { fetchFileMetaMap } from "./fetchFileMeta";
import { GetFileInternalIds } from "./LibFileParser";
import { transformHtmlWithMeta } from "./transformHtml";

export interface UseResolveOptions
{
    locale?: string;
}
export interface UseResolveResult
{
    html: string;
    loading: boolean;
    error?: unknown;
}

const buildFileUrlById = (id: string) => `/Service/FileManagement/Preview/${encodeURIComponent(id)}`;

const createPermissiveSanitizer = () =>
{
    if (typeof window === "undefined")
    {
        // SSR：回傳一個簡單 wrapper（不用實際消毒，避免 server-side DOM 操作）
        return {
            sanitize: (html: string) => html ?? "",
        } as const;
    }

    // Add global hooks once (safe to call multiple times)
    // - 移除所有 on* 事件屬性（onclick, onerror, ...）
    // - 強制把 iframe 的 src 限制成安全協定（http/https/data/blob）
    try
    {
        // Remove any previously registered hook duplicates by checking a marker
        // (This prevents double-binding in HMR dev envs)
        const marker = "__DOMPURIFY_PERMISSIVE_INITIALIZED__" as any;
        if (!(DOMPurify as any)[marker])
        {
            DOMPurify.addHook("uponSanitizeAttribute", (node, data) =>
            {
                const name = (data.attrName || "").toLowerCase();
                const val = (data.attrValue || "") + "";

                // 移除所有事件屬性：on*
                if (name.startsWith("on"))
                {
                    data.keepAttr = false;
                    return;
                }

                // 阻擋 javascript: 與 vbscript:
                if (
                    (name === "href" || name === "src" || name === "xlink:href")
                    && /^\s*javascript:|^\s*vbscript:/i.test(val)
                )
                {
                    data.keepAttr = false;
                    return;
                }

                // 如果是 iframe 的 src，僅允許 http(s)/data/blob 協定
                if (node.nodeName && node.nodeName.toLowerCase() === "iframe" && name === "src")
                {
                    if (!/^(https?:|data:|blob:)/i.test(val))
                    {
                        data.keepAttr = false;
                        return;
                    }
                }

                // 其它可再加條件 (例如限制 target, rel 等)
            });

            // Optional: 移除 <form action="...javascript:..."> 或其它高風險屬性
            DOMPurify.addHook("uponSanitizeElement", (node) =>
            {
                const tag = node.nodeName?.toLowerCase();
                if (tag === "script" || tag === "style")
                {
                    // DOMPurify 通常會移除 script/style，但多一層保險
                    // （保留空處理，DOMPurify 會把 script 移除）
                }
            });

            // Mark initialized to avoid re-adding hooks in HMR
            (DOMPurify as any)[marker] = true;
        }
    } catch (e)
    {
        // 若 hook 註冊失敗，不阻斷流程（開發環境 HMR 可能重複）
        // console.warn("DOMPurify hook init failed", e);
    }

    const options = {
        // 幾乎所有常見標籤（寬鬆）
        ALLOWED_TAGS: [
            "a",
            "abbr",
            "address",
            "area",
            "article",
            "aside",
            "b",
            "bdi",
            "bdo",
            "big",
            "blockquote",
            "br",
            "button",
            "canvas",
            "caption",
            "cite",
            "code",
            "col",
            "colgroup",
            "data",
            "datalist",
            "dd",
            "del",
            "details",
            "dfn",
            "dialog",
            "div",
            "dl",
            "dt",
            "em",
            "fieldset",
            "figcaption",
            "figure",
            "footer",
            "form",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "header",
            "hgroup",
            "hr",
            "i",
            "iframe",
            "img",
            "input",
            "ins",
            "kbd",
            "label",
            "legend",
            "li",
            "main",
            "map",
            "mark",
            "menu",
            "meter",
            "nav",
            "ol",
            "optgroup",
            "option",
            "output",
            "p",
            "picture",
            "pre",
            "progress",
            "q",
            "rp",
            "rt",
            "ruby",
            "s",
            "samp",
            "section",
            "select",
            "small",
            "source",
            "span",
            "strong",
            "sub",
            "summary",
            "sup",
            "table",
            "tbody",
            "td",
            "textarea",
            "tfoot",
            "th",
            "thead",
            "time",
            "title",
            "tr",
            "track",
            "u",
            "ul",
            "var",
            "video",
            "wbr",
        ],
        // 常見且必要的屬性（寬鬆）
        ALLOWED_ATTR: [
            // 通用
            "class",
            "id",
            "title",
            "role",
            "aria-label",
            "aria-hidden",
            "data-*",
            "itemprop",
            "itemscope",
            // href / links
            "href",
            "target",
            "rel",
            "download",
            // 圖片
            "src",
            "srcset",
            "sizes",
            "alt",
            "width",
            "height",
            "loading",
            "decoding",
            "referrerpolicy",
            // 媒體
            "controls",
            "autoplay",
            "loop",
            "muted",
            "poster",
            "preload",
            // 表單
            "name",
            "value",
            "placeholder",
            "type",
            "checked",
            "disabled",
            "multiple",
            "selected",
            "min",
            "max",
            "step",
            // <source>/<track>
            "media",
            "type",
            // iframe
            "allow",
            "allowfullscreen",
            "frameborder",
            "sandbox",
            "scrolling",
            "referrerpolicy",
            // table
            "colspan",
            "rowspan",
            // style-related attributes (注意：允許 style 會帶來額外風險)
            "style",
        ],
        // 允許的 URI 協定（允許 data/blob/http/https/mailto）
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // 如果你要保留 style 屬性，建議同時處理 CSS 以防 XSS（可用 CSS sanitizer）
    };

    return {
        sanitize: (html: string) => DOMPurify.sanitize(html ?? "", options),
    } as const;
};

export const useResolveInternalIds = (rawHtml: string, opt?: UseResolveOptions): UseResolveResult =>
{
    const [resolvedHtml, setResolvedHtml] = useState<string>(rawHtml ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>();
    const ids = useMemo(() => GetFileInternalIds(rawHtml ?? ""), [rawHtml]);

    useEffect(() =>
    {
        let alive = true;
        // 先把預設值設為原字串（任何情況都不會掉成空）
        setResolvedHtml(rawHtml ?? "");

        if (!rawHtml || ids.length === 0)
        {
            setLoading(false);
            setError(undefined);
            return; // ★ 直接返回原字串
        }

        const run = async () =>
        {
            try
            {
                setLoading(true);
                setError(undefined);
                const metaMap = await fetchFileMetaMap(ids, opt?.locale).catch(() => ({}));
                const out = transformHtmlWithMeta(rawHtml, metaMap, { urlBuilder: buildFileUrlById });
                if (!alive) return;
                // const sanitizer = createPermissiveSanitizer();
                // sanitizer.sanitize(out ?? rawHtml)之後處理安全嵌入問題
                setResolvedHtml(out ?? rawHtml);
            } catch (e)
            {
                if (alive)
                {
                    setError(e);
                    setResolvedHtml(rawHtml); // ★ 失敗也回原字串
                }
            } finally
            {
                if (alive) setLoading(false);
            }
        };
        run();
        return () =>
        {
            alive = false;
        };
    }, [rawHtml, opt?.locale, ids]);

    return { html: resolvedHtml, loading, error };
};
