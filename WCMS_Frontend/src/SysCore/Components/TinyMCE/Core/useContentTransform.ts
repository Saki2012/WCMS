import { PGID } from "@/types/SchemaFields";
import { useCallback } from "react";
import { INTERNAL_ATTR } from "./tinyMceConstants";

// #region Property
export interface UseContentTransformOptions
{
    /** 來源 API 前綴（以 / 結尾） */
    previewPrefix?: string; // default: /Service/FileManagement/Preview/
    /** 內嵌屬性名稱 */
    attrName?: string; // default: data-internalid
}
// #endregion

// #region Public
/** 內容轉換：<img src="/Service/FileManagement/Preview/{id}"> ⇄ <img data-internalid="{id}"> */
export const useContentTransform = (opts?: UseContentTransformOptions) =>
{
    const rawPrefix = opts?.previewPrefix ?? `/Service/${PGID.FileManagement}/Public_Preview`; // 這邊暫時寫死，後續橋
    const previewPrefix = rawPrefix.endsWith("/") ? rawPrefix : `${rawPrefix}/`;
    const attrName = opts?.attrName ?? INTERNAL_ATTR;

    const esc = useCallback((s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), []);
    const prefixRe = esc(previewPrefix);

    /** Editor → DB：把 src="/Service/.../{id}" 改成 data-internalid="{id}"（保留其他屬性） */
    const toDb = useCallback((html: string) =>
    {
        if (!html) return html;
        const re = new RegExp(String.raw`<img\b([^>]*?)\bsrc=(['"])${prefixRe}([^'"]+)\2([^>]*)>`, "gi");
        // 移除 src，補上 data-internalid
        const out = html.replace(re, (_m, before, _q, id, after) =>
        {
            // 也順便移除可能殘留的相對路徑 ../../ 之類
            const cleanBefore = String(before).replace(/\s*\bsrc\s*=\s*(['"])[^'"]*\1/i, " ");
            return `<img${cleanBefore} ${attrName}="${id}"${after}>`;
        });
        return out;
    }, [attrName, prefixRe]);

    /** DB → Editor：把 data-internalid="{id}" 改回 src="/Service/.../{id}" */
    const toEditor = useCallback((html: string) =>
    {
        if (!html) return html;
        const re = new RegExp(String.raw`<img\b([^>]*?)\b${attrName}\s*=\s*(['"])([^'"]+)\2([^>]*)>`, "gi");
        const out = html.replace(re, (_m, before, _q, id, after) =>
        {
            // 若已有 src 先移除，避免重複
            const cleanBefore = String(before).replace(/\s*\bsrc\s*=\s*(['"])[^'"]*\1/i, " ");
            return `<img${cleanBefore} src="${previewPrefix}${id}"${after}>`;
        });
        return out;
    }, [attrName, previewPrefix]);

    return { toDb, toEditor, previewPrefix, attrName } as const;
};
// #endregion
