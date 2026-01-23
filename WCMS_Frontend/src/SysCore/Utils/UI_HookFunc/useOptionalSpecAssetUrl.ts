import { useMemo } from "react";

/** Spec 下 Server 資產（只會收錄「實際存在」的 pdf） */
const SpecAssetUrlMap = import.meta.glob(
    "/src/SpecFetures/*/Assets/**/**/*.{pdf,png,jpg,jpeg,gif,svg,webp,mp4,webm,mp3,wav,ogg,zip,rar,7z,txt,doc,docx,xls,xlsx,ppt,pptx}",
    { eager: true, as: "url" },
) as Record<string, string>;

export interface UseOptionalSpecAssetUrlArgs
{
    /** ex: Assets/Server/後台操作手冊.pdf */
    relativePath: string;
    /** 找不到時是否 fallback 到 _default，預設 true */
    fallbackToDefault?: boolean;
}

/** 統一路徑格式，避免多個 / 造成 key 對不上 */
const normalizeRelativePath = (relativePath: string): string =>
{
    const s = (relativePath ?? "").trim();
    return s.replace(/^\/+/, "");
};

/** 組出 glob map 的 key */
const buildSpecAssetKey = (spec: string, relativePath: string): string =>
{
    const rel = normalizeRelativePath(relativePath);
    return `/src/SpecFetures/${spec}/${rel}`;
};

/** 嘗試取得 url，找不到就回 null */
const tryGetUrl = (spec: string, relativePath: string): string | null =>
{
    const key = buildSpecAssetKey(spec, relativePath);
    return SpecAssetUrlMap[key] ?? null;
};

export const useOptionalSpecAssetUrl = (args: UseOptionalSpecAssetUrlArgs): string | null =>
{
    const spec = (import.meta.env.VITE_SPEC_CODE || "_default").toString();
    const relativePath = args.relativePath;
    const fallbackToDefault = args.fallbackToDefault ?? true;

    const url = useMemo(() =>
    {
        const hit = tryGetUrl(spec, relativePath);
        if (hit) return hit;
        if (!fallbackToDefault) return null;
        return tryGetUrl("_default", relativePath);
    }, [spec, relativePath, fallbackToDefault]);

    return url;
};
