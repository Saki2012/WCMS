import { useEffect } from "react";
import type { UseFetchFormDataResult } from "../Utils/API/FetchFormData";

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

const DiffMissingLangs = (details: Array<{ Lang?: string | null; }>) =>
{
    const have = new Set(
        details.map(d => (d.Lang ?? "").toLowerCase()).filter(l => l && isSupportedLang(l)),
    );
    const missing = SUPPORTED_LANGS.filter(l => !have.has(l));
    return missing;
};

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
export const useEnsureLangDetails = <TSet = any>(
    formData: UseFetchFormDataResult<TSet>,
    opt: EnsureLangSimpleOptions,
): void =>
{
    useEffect(() =>
    {
        const src: any = formData.data;
        if (!src) return;
        const header: any = src?.[opt.headerName] ?? {};
        const details: any[] = Array.isArray(src?.[opt.detailName]) ? src[opt.detailName] : [];
        // 1) 找出缺少的語系
        const missing = DiffMissingLangs(details as any);
        if (missing.length === 0)
        {
            // 沒缺時，同步一次編輯狀態（避免後續 setField 取不到）
            formData.setFormData(src);
            return;
        }
        // 2) 計算下一個 RowId
        const maxRowId = details.reduce((m, d) => Math.max(m, Number(d?.RowId ?? 0)), 0);
        // 3) 準備主鍵欄位值：先從表頭抓，抓不到就從任一現有明細補；都沒有就不帶
        const parentKeys = opt.parentKeys ?? [];
        const parentVals: Record<string, unknown> = {};
        for (const k of parentKeys)
        {
            const v = header?.[k];
            if (v !== undefined && v !== null)
            {
                parentVals[k] = v;
                continue;
            }
            const fromDetail = details.find(d => d && d[k] !== undefined && d[k] !== null);
            if (fromDetail) parentVals[k] = fromDetail[k];
        }

        // 4) 產生要補的明細
        const toAppend = missing.map((lang: string, i: number) => ({
            ...parentVals,
            RowId: maxRowId + i + 1,
            Lang: lang,
            // 想要預設欄位值可在這裡再加（Title/Content…），不同表可各自更新後端時再填
        }));
        // ---- 新增：先把缺的補上，然後依 preferFirstLang 排序 ----
        const prefer = String(opt.preferFirstLang ?? DefaultLang).toLowerCase();
        const groupKey = (d: any) => (opt.parentKeys ?? []).map(k => String(d?.[k] ?? "")).join("|");

        // 先合併得到最新的明細
        const merged = [...details, ...toAppend];

        // 依 parentKeys 分組後，各組內把 prefer 語系排前面（穩定排序）
        const grouped = new Map<string, any[]>();
        for (const d of merged)
        {
            const key = groupKey(d);
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(d);
        }

        const reorderOneGroup = (list: any[]) =>
        {
            if (!prefer || !isSupportedLang(prefer)) return list;
            const first: any[] = [];
            const rest: any[] = [];
            for (const d of list)
            {
                const lang = String(d?.Lang ?? "").toLowerCase();
                (lang === prefer ? first : rest).push(d);
            }
            return [...first, ...rest]; // 保持相對順序
        };

        const reordered: any[] = [];
        for (const [, list] of grouped) reordered.push(...reorderOneGroup(list));

        // 5) 寫回 formData（只更新明細陣列）
        formData.setFormData({ ...src, [opt.detailName]: reordered });

        // 觀察 data/formData 與外部依賴
    }, [formData.data, opt.headerName, opt.detailName, JSON.stringify(opt.parentKeys ?? []), ...(opt.deps ?? [])]);
};
