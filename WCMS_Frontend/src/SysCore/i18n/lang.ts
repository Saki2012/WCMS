import type { components } from "@/types/api";
import { useEffect } from "react";

export type Lang = components["schemas"]["LangCode"]; // ← 以後端 Swagger 為準

/**應該可以從後端提供顯示名稱，暫時寫死 */
export const LangLabelMap: Record<Lang, string> = { "zh-tw": "中文", "zh-cn": "简体中文", "en": "English" };
export const getLangLabel = (code?: string) =>
{
    const key = (code ?? "").trim() as Lang;
    return (LangLabelMap as any)[key] ?? (code ?? "");
};
/** 下面這三個應該要從SiteInfo讀出來的結果來處理，後續再看如何移除 */
export const DefaultLang: Lang = "zh-tw";
export const SUPPORTED_LANGS: Lang[] = ["zh-tw", "en"]; /** 支援語系，之後做參數設定 */
export const isSupportedLang = (x?: Lang | string | null): x is Lang => SUPPORTED_LANGS.includes(x as Lang);

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
    formData: { data?: any; setFormData: (updater: (prev: any) => any) => void; },
    opt: { headerName: string; detailName: string; parentKeys: string[]; langs?: Lang[]; preferFirstLang?: Lang; },
) =>
{
    const langs = (opt.langs && opt.langs.length > 0) ? opt.langs : (["zh-tw", "en"] as Lang[]);

    useEffect(() =>
    {
        const data = formData?.data;
        if (!data) return;

        const parents: any[] = Array.isArray(data[opt.headerName]) ? data[opt.headerName] : (data[opt.headerName] ? [data[opt.headerName]] : []);
        const details: any[] = Array.isArray(data[opt.detailName]) ? data[opt.detailName] : (data[opt.detailName] ? [data[opt.detailName]] : []);
        if (parents.length === 0) return;
        const buildGroupKey = (item: any): string =>
        {
            return opt.parentKeys.map((k) => String(item?.[k] ?? "")).join("|");
        };
        const buildDetailUniqueKey = (item: any): string =>
        {
            const parentPart = buildGroupKey(item);
            const langPart = String(item?.Lang ?? "").trim().toLowerCase();
            return `${parentPart}||${langPart}`;
        };
        const mapParentToDetailFK = (parent: any): Record<string, any> =>
        {
            return opt.parentKeys.reduce((acc, k) =>
            {
                acc[k] = /(parentrowid|itemrowid)/i.test(String(k)) ? (parent?.RowId ?? 0) : (parent?.[k] ?? null);
                return acc;
            }, {} as Record<string, any>);
        };
        const calcNeedReorder = (rows: any[]): boolean =>
        {
            if (!opt.preferFirstLang) return false;
            const preferLang = String(opt.preferFirstLang).toLowerCase();
            const grouped = new Map<string, any[]>();

            for (const row of rows)
            {
                const key = buildGroupKey(row);
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(row);
            }
            for (const [, list] of grouped)
            {
                const idx = list.findIndex((x) => String(x?.Lang ?? "").toLowerCase() === preferLang);
                if (idx > 0) return true;
            }
            return false;
        };
        const grouped = new Map<string, any[]>();
        for (const d of details)
        {
            const key = buildGroupKey(d);
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(d);
        }
        let hasMissing = false;
        for (const p of parents)
        {
            const fkObj = mapParentToDetailFK(p);
            const key = buildGroupKey(fkObj);
            const siblings = grouped.get(key) ?? [];
            const existLang = new Set(siblings.map((s) => String(s?.Lang ?? "").trim().toLowerCase()));
            const missing = langs.filter((l) => !existLang.has(String(l).toLowerCase()));
            if (missing.length > 0)
            {
                hasMissing = true;
                break;
            }
        }
        const needReorder = !hasMissing && calcNeedReorder(details);
        if (!hasMissing && !needReorder) return;
        formData.setFormData((prev) =>
        {
            const draft = { ...(prev ?? {}) };
            const prevParents: any[] = Array.isArray(draft[opt.headerName]) ? draft[opt.headerName] : (draft[opt.headerName] ? [draft[opt.headerName]] : []);
            const prevDetails: any[] = Array.isArray(draft[opt.detailName]) ? draft[opt.detailName] : (draft[opt.detailName] ? [draft[opt.detailName]] : []);
            const prevGrouped = new Map<string, any[]>();
            for (const d of prevDetails)
            {
                const key = buildGroupKey(d);
                if (!prevGrouped.has(key)) prevGrouped.set(key, []);
                prevGrouped.get(key)!.push(d);
            }
            const existingUnique = new Set<string>(prevDetails.map((d) => buildDetailUniqueKey(d)));
            const toAppend: any[] = [];
            for (const p of prevParents)
            {
                const fkObj = mapParentToDetailFK(p);
                const groupKey = buildGroupKey(fkObj);
                const siblings = prevGrouped.get(groupKey) ?? [];
                const existLang = new Set(siblings.map((s) => String(s?.Lang ?? "").trim().toLowerCase()));
                const missing = langs.filter((l) => !existLang.has(String(l).toLowerCase()));
                if (missing.length === 0) continue;
                const baseRowId = siblings.reduce((m, s) => Math.max(m, Number(s?.RowId || 0)), 0);
                missing.forEach((lang, idx) =>
                {
                    const newRow = { ...fkObj, RowId: baseRowId + idx + 1, Lang: lang };
                    const uniqueKey = buildDetailUniqueKey(newRow);
                    if (existingUnique.has(uniqueKey)) return;
                    existingUnique.add(uniqueKey);
                    toAppend.push(newRow);
                });
            }
            let merged = [...prevDetails, ...toAppend];
            // 保險：最後再用 parentKeys + Lang 去重一次
            const dedupMap = new Map<string, any>();
            for (const row of merged)
            {
                const uniqueKey = buildDetailUniqueKey(row);
                if (!dedupMap.has(uniqueKey)) dedupMap.set(uniqueKey, row);
            }
            merged = Array.from(dedupMap.values());
            // 偏好語系置頂（同 group 內）
            if (opt.preferFirstLang)
            {
                const preferLang = String(opt.preferFirstLang).toLowerCase();
                const groupedForSort = new Map<string, any[]>();
                for (const row of merged)
                {
                    const key = buildGroupKey(row);
                    if (!groupedForSort.has(key)) groupedForSort.set(key, []);
                    groupedForSort.get(key)!.push(row);
                }
                const sorted: any[] = [];
                for (const [, list] of groupedForSort)
                {
                    const copy = [...list];
                    copy.sort((a, b) =>
                    {
                        const aIsPrefer = String(a?.Lang ?? "").toLowerCase() === preferLang ? 0 : 1;
                        const bIsPrefer = String(b?.Lang ?? "").toLowerCase() === preferLang ? 0 : 1;
                        if (aIsPrefer !== bIsPrefer) return aIsPrefer - bIsPrefer;
                        return Number(a?.RowId ?? 0) - Number(b?.RowId ?? 0);
                    });
                    sorted.push(...copy);
                }
                merged = sorted;
            }
            const sameLength = merged.length === prevDetails.length;
            const sameOrder = sameLength && merged.every((x, i) => x === prevDetails[i]);
            if (sameOrder) return prev;
            draft[opt.detailName] = merged;
            return draft;
        });
    }, [formData?.data, opt.headerName, opt.detailName, opt.parentKeys.join("|"), langs.join("|"), opt.preferFirstLang ?? ""]);
};
