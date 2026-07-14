import { useMemo } from "react";

// #region Property
/**
 * 用 Vite glob 建「可選用」資產 URL。
 *
 * 重要：
 * - 只掃描「目前 build 的 SpecFeature（由 VITE_SPEC_CODE 決定）」與 SpecDefault
 * - 避免用 /src/SpecFetures/* 的 wildcard，否則會把所有 case 的 Assets 都打進 bundle
 */

export interface UseOptionalSpecAssetUrlArgs
{
    /** ex: Assets/Server/後台操作手冊.pdf */
    relativePath: string;

    /** 找不到時是否 fallback 到 _default，預設 true */
    fallbackToDefault?: boolean;
}

// #endregion

// #region Initialization
/** 目前 Spec（vite.config.ts: alias SpecFeature -> /src/SpecFetures/{VITE_SPEC_CODE}） */
const RawSpecAssetUrlMap = import.meta.glob("SpecFeature/Assets/**/**/*.{pdf,png,jpg,jpeg,gif,svg,webp,mp4,webm,mp3,wav,ogg,zip,rar,7z,txt,doc,docx,xls,xlsx,ppt,pptx}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
/** _default（vite.config.ts: alias SpecDefault -> /src/SpecFetures/_default） */
const RawDefaultAssetUrlMap = import.meta.glob("SpecDefault/Assets/**/**/*.{pdf,png,jpg,jpeg,gif,svg,webp,mp4,webm,mp3,wav,ogg,zip,rar,7z,txt,doc,docx,xls,xlsx,ppt,pptx}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
/** 從 glob key 抽出我們想要的 key：一律使用 `Assets/...` */
const tryGetAssetsRelativeKey = (globKey: string): string | null =>
{
    const idx = globKey.indexOf("/Assets/");
    if (idx < 0) return null;
    return globKey.slice(idx + 1);
};
/** 將 glob map 轉為 `{ 'Assets/xxx': 'url' }` 的形式 */
const toAssetsRelativeMap = (raw: Record<string, string>): Record<string, string> =>
{
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw))
    {
        const rel = tryGetAssetsRelativeKey(k);
        if (!rel) continue;
        out[rel] = v;
    }
    return out;
};
const SpecAssetUrlMap = toAssetsRelativeMap(RawSpecAssetUrlMap);
const DefaultAssetUrlMap = toAssetsRelativeMap(RawDefaultAssetUrlMap);
// #endregion

// #region Public
/** 依 `relativePath` 取得資產 URL。
 * - 先找當前 Spec
 * - 找不到且 fallbackToDefault=true 時，再找 _default
 */
export const useOptionalSpecAssetUrl = (args: UseOptionalSpecAssetUrlArgs): string | null =>
{
    const relativePath = normalizeRelativePath(args.relativePath);
    const fallbackToDefault = args.fallbackToDefault ?? true;
    const url = useMemo(() =>
    {
        const hit = SpecAssetUrlMap[relativePath];
        if (hit) return hit;

        if (!fallbackToDefault) return null;
        return DefaultAssetUrlMap[relativePath] ?? null;
    }, [relativePath, fallbackToDefault]);
    return url;
};
// #endregion

// #region Private
/** 統一路徑格式，避免多個 / 造成 key 對不上 */
const normalizeRelativePath = (relativePath: string): string =>
{
    const s = (relativePath ?? "").trim();
    return s.replace(/^\/+/, "");
};
// #endregion
