import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountModelFields, CategoryDetailFields, CategoryFields, MaterialFields, MaterialLangInfoFields, MaterialSetFields } from "@/types/SchemaFields";
import { useEffect, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];

export interface MaterialListRawData
{
    list: MaterialSet[];
    modelDisplayName: ModelDisplaySchema | null;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface UseMaterialListFetchDataResult
{
    adapter: { Material: ReturnType<typeof MaterialAdapter>; };
    rawData: MaterialListRawData;
    isLoading: boolean;
    errors: string[];
    refetchData: () => Promise<void>;
}

const PAGE_SIZE = 10;

/** 建立物件列表查詢參數 */
const buildBaseParam = (kw: string): QueryListParam =>
{
    // 宣告變數
    const condition = "";

    // return
    return {
        Fields: [
            MaterialFields.InternalId,
            MaterialFields.MaterialId,
            MaterialFields.CategoryId,
            MaterialFields.ModifyTime,
            MaterialFields.ModifyUserId,
            `${MaterialFields.ModifyUser}.${AccountModelFields.AccountName}`,
            `${MaterialFields.Category}.${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${MaterialFields.Category}.${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            `${MaterialFields._MaterialLangInfo}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: MaterialFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: PAGE_SIZE,
    };
};

/** 統一提供 Material List 所需資料 */
export const useMaterialListFetchData = (p: { lang: Lang | string; kw?: string; }): UseMaterialListFetchDataResult =>
{
    // 宣告變數
    const kw = p.kw ?? "";
    const adapter = useMemo(() => ({ Material: MaterialAdapter() }), []);
    const baseParam = useMemo(() => buildBaseParam(kw), [kw]);

    const grid = adapter.Material.hooks.useQueryGridData({ baseParam, deps: [kw, p.lang], modelDeps: [] });

    // 執行 function：搜尋條件變更時回第一頁
    useEffect(() =>
    {
        grid.onPageChange(1);
    }, [kw, p.lang]);

    const rawData = useMemo<MaterialListRawData>(() =>
    {
        // return
        return {
            list: grid.list ?? [],
            modelDisplayName: grid.modelDisplayName,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
        };
    }, [grid.list, grid.modelDisplayName, grid.pageNumber, grid.totalPages, grid.onPageChange]);

    // return
    return { adapter, rawData, isLoading: grid.isLoading, errors: grid.errors, refetchData: grid.refetchData };
};
