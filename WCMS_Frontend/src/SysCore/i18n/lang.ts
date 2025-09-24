import { useEffect } from "react";

// src/SysCore/i18n/lang.ts
export type Lang =
    | "zh-tw" // 繁體中文（台灣）
    | "zh-cn" // 簡體中文（中國）
    | "en" // 英文
    | "ja" // 日文
    | "ko" // 韓文
    | "fr" // 法文
    | "de" // 德文
    | "es" // 西班牙文
    | "pt" // 葡萄牙文
    | "ru" // 俄文
    | "ar" // 阿拉伯文
    | "it" // 義大利文
    | "nl" // 荷蘭文
    | "th" // 泰文
    | "vi" // 越南文
    | "id" // 印尼文
    | "ms"; // 馬來文

export const LangLabelMap: Record<Lang, string> = {
    "zh-tw": "繁體中文",
    "zh-cn": "简体中文",
    "en": "English",
    "ja": "日本語",
    "ko": "한국어",
    "fr": "Français",
    "de": "Deutsch",
    "es": "Español",
    "pt": "Português",
    "ru": "Русский",
    "ar": "العربية",
    "it": "Italiano",
    "nl": "Nederlands",
    "th": "ไทย",
    "vi": "Tiếng Việt",
    "id": "Bahasa Indonesia",
    "ms": "Bahasa Melayu",
};

export const DefaultLang: Lang = "zh-tw";

export const normalizeLang = (x?: Lang): string => LangLabelMap[x ?? DefaultLang];
export const isSupportedLang = (x?: string | null): x is Lang => SUPPORTED_LANGS.includes(x as Lang);
export const SUPPORTED_LANGS: Lang[] = ["zh-tw", "en"]; /** 支援語系，之後做參數設定 */

export interface EnsureLangSimpleOptions
{
    /** 表頭物件名稱，例如 "PageManagement"、"Banner" */
    headerName: string;
    /** 明細陣列名稱，例如 "PageManagementDetail"、"BannerDetail" */
    detailName: string;
    /** 需要帶入新明細的主鍵欄位，例如 ["PageId"] 或 ["PageId","ParentRowId"] */
    parentKeys?: string[];
    /** 額外依賴（例如當前的 parentRowId 是由 UI 狀態決定時） */
    deps?: unknown[];
    preferFirstLang?: Lang; // 或用你的 Lang 型別：preferFirstLang?: Lang;
}

/** 自動匹配並補齊「多語系明細列（detail）」的 Hook。
 * useEnsureLangDetails
 * --------------------
 *
 * 核心功能：
 * 1) 依據系統支援語系（由 DiffMissingLangs 判定，典型為 zh-tw / en），找出當前明細缺少的 Lang。
 * 2) 自動為缺少的 Lang 產生對應明細列（row），並：
 *    - 將 `RowId` 以現有最大值遞增（自增 1）
 *    - 將指定的主鍵欄位（例如 PageId / ParentRowId）自動帶入
 * 3) 只需提供：formData（useFetchFormData 結果）、表頭物件名稱、明細陣列名稱、主鍵欄位名稱陣列。
 *
 * 為什麼需要這個 Hook？
 * - 在多語系資料維護畫面中，後端回傳的明細可能只包含部分語系。
 * - 前端若希望「畫面一定出齊所有支援語系的編輯頁籤/欄位」，可透過本 Hook 在載入時自動補齊。
 * - 可減少重複樣板程式（同一套補齊邏輯可套用於 Page、Banner、Announcement... 等多種表單）。
 *
 * 何時執行？
 * - 在 CSR/SSR 混合專案裡，建議於資料載入完成且進入「編輯狀態」前（PageFormComp 層級）使用。
 * - 本 Hook 會以「formData.formData ?? formData.data」為基準計算並寫回，確保 DetailComp 渲染時拿到的就是「已補齊」資料。
 *
 * 參數：
 * - formData：UseFetchFormDataResult<TSet>
 *   由 useFetchFormData 取得的表單資料與 setter。
 *
 * - opt: {
 *     headerName:   string;   // 表頭物件名稱（如 "PageManagement"、"Banner"）
 *     detailName:   string;   // 明細陣列名稱（如 "PageManagementDetail"、"BannerDetail"）
 *     parentKeys?:  string[]; // 主鍵欄位名稱陣列（如 ["PageId"] 或 ["PageId","ParentRowId"]）
 *     deps?:        unknown[];// 額外依賴（如 parentRowId 來自 UI 狀態時可放進來）
 *   }
 *
 * 行為細節：
 * - 找缺邏輯由 `DiffMissingLangs(details)` 負責；請在 lang.ts 中維護「系統支援語系」以利統一管理。
 * - RowId 計算：以明細中現有最大 RowId 為基底，從 max+1 開始遞增。
 * - 主鍵回填：先嘗試從 header 取值；若 header 沒有，改從既有任一筆明細推回；都沒有則略過該鍵。
 * - 若無缺語系：仍會將原資料寫入 formData（確保進入編輯狀態，後續 setField 能正常綁定）。
 *
 * 注意事項：
 * - 本 Hook 只負責補齊「Lang/RowId/主鍵」；其他欄位（如 Title / Content / PicSrcId）預設不帶值。
 *   若需要預設值，建議在實際提交時由後端處理，或於畫面儲存前另行補齊。
 * - 若 Tab 組件有 memo/cache，第一次補完仍未重繪，可在該組件加上 key（例如 key=`tabs-${details.length}`）強制刷新。
 *
 * 範例：
 *   // PageManagement（只有 PageId）
 *   useEnsureLangDetails(formData, {
 *     headerName: "PageManagement",
 *     detailName: "PageManagementDetail",
 *     parentKeys: ["PageId"],
 *   });
 *
 *   // Banner（需要 BannerId + ParentRowId）
 *   useEnsureLangDetails(formData, {
 *     headerName: "Banner",
 *     detailName: "BannerDetail",
 *     parentKeys: ["BannerId", "ParentRowId"],
 *     // 若 ParentRowId 由 UI 狀態決定，記得把該狀態放到 deps 中
 *     // deps: [currentParentRowId],
 *   });
 */
export const useEnsureLangDetails = (
    formData: {
        data?: any;
        setFormData: (updater: (prev: any) => any) => void;
    },
    opt: {
        headerName: string;
        detailName: string;
        parentKeys: string[]; // <<<<<< 明細表的欄位名稱（不是父表）
        langs?: string[]; // 例如 ["zh-tw","en"]
        preferFirstLang?: string;
    },
) =>
{
    const langs = (opt.langs && opt.langs.length > 0) ? opt.langs : ["zh-tw", "en"];

    useEffect(() =>
    {
        const data = formData?.data;
        if (!data) return;

        // 取父表/明細集合（皆視為陣列）
        const parents: any[] = Array.isArray(data[opt.headerName])
            ? data[opt.headerName]
            : (data[opt.headerName] ? [data[opt.headerName]] : []);
        const details: any[] = Array.isArray(data[opt.detailName])
            ? data[opt.detailName]
            : (data[opt.detailName] ? [data[opt.detailName]] : []);

        // 依明細的 FK 值建立分組 key
        const keyFromDetail = (d: any) => opt.parentKeys.map(k => String(d?.[k] ?? "")).join("|");

        // 先把既有明細分組，以便快速查找兄弟節點
        const groupMap = new Map<string, any[]>();
        for (const d of details)
        {
            const k = keyFromDetail(d);
            if (!groupMap.has(k)) groupMap.set(k, []);
            groupMap.get(k)!.push(d);
        }

        // 從父表建立對應到明細的 FK 物件：
        // - ParentRowId 從父表 RowId 來
        // - 其他 FK 欄位（如 GalleryId）直接抄父表同名欄位
        const mapParentToDetailFK = (parent: any) =>
            opt.parentKeys.reduce((acc, k) =>
            {
                acc[k] = /parentrowid/i.test(k) ? (parent?.RowId ?? 0) : (parent?.[k] ?? null);
                return acc;
            }, {} as Record<string, any>);

        const toAppend: any[] = [];

        for (const p of parents)
        {
            const fkObj = mapParentToDetailFK(p); // 例如 { GalleryId: '36', ParentRowId: 3 }
            const gkey = opt.parentKeys.map(k => String(fkObj[k] ?? "")).join("|");
            const siblings = groupMap.get(gkey) ?? [];
            // 現有語系
            const exist = new Set(siblings.map(s => String(s?.Lang ?? "").toLowerCase()));
            // 待補語系
            const missing = langs.filter(l => !exist.has(String(l).toLowerCase()));
            if (missing.length === 0) continue;
            // 在「同一組」內計算當前最大 RowId，再往後遞增
            const baseRowId = siblings.reduce((m, s) => Math.max(m, Number(s?.RowId || 0)), 0) || 0;
            missing.forEach((lang, idx) =>
            {
                toAppend.push({
                    ...fkObj, // <<<<<< 帶入 GalleryId + ParentRowId（= 父表 RowId）
                    RowId: baseRowId + idx + 1,
                    Lang: lang,
                    // 其餘欄位的預設值可視需求補上（例如 Title: ""）
                });
            });
        }
        // 若無需新增則不寫回，避免無限 re-render
        if (toAppend.length === 0) return;

        // 在 effect 內寫回（安全）
        formData.setFormData(prev =>
        {
            const draft: any = { ...(prev ?? {}) };
            const curr: any[] = Array.isArray(draft[opt.detailName])
                ? draft[opt.detailName]
                : (draft[opt.detailName] ? [draft[opt.detailName]] : []);
            let next = [...curr, ...toAppend];

            // （可選）每一組把 preferFirstLang 排到第一位，保持相對順序
            if (opt.preferFirstLang)
            {
                const kfd = (d: any) => opt.parentKeys.map(k => String(d?.[k] ?? "")).join("|");
                const grouped2 = new Map<string, any[]>();
                for (const d of next)
                {
                    const k = kfd(d);
                    if (!grouped2.has(k)) grouped2.set(k, []);
                    grouped2.get(k)!.push(d);
                }
                const rebuilt: any[] = [];
                for (const [, list] of grouped2)
                {
                    const first: any[] = [];
                    const rest: any[] = [];
                    const pref = String(opt.preferFirstLang).toLowerCase();
                    for (const d of list)
                    {
                        const lang = String(d?.Lang ?? "").toLowerCase();
                        (lang === pref ? first : rest).push(d);
                    }
                    rebuilt.push(...first, ...rest);
                }
                next = rebuilt;
            }

            draft[opt.detailName] = next;
            return draft;
        });
        // 依賴：資料內容與設定
    }, [
        formData?.data,
        opt.headerName,
        opt.detailName,
        opt.parentKeys.join("|"),
        (opt.langs ?? []).join("|"),
        opt.preferFirstLang ?? "",
    ]);
};
