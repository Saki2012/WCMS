import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AccountModelFields,
    CategoryDetailFields,
    CategoryFields,
    MatCategoryDataSetFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    PGID,
} from "@/types/SchemaFields";
import { useEffect, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];

export interface MatCategoryListRawData
{
    list: MatCategorySet[];
    modelDisplayName: ModelDisplaySchema | null;
    categoryMap: Record<string, string>;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface UseMatCategoryListFetchDataResult
{
    adapter: { MatCategory: ReturnType<typeof MatCategoryAdapter>; };
    rawData: MatCategoryListRawData;
    isLoading: boolean;
    errors: string[];
    refetchData: () => Promise<void>;
}

const PAGE_SIZE = 10;
const EMPTY_CATEGORY_MAP: Record<string, string> = {};

/** 建立列表查詢參數 */
const buildBaseParam = (kw: string): QueryListParam =>
{
    // 宣告變數
    // const keywordCond = buildKeywordCondition(kw);
    let condition = LibMerge(" And ", false, `${CategoryFields.ProgId} = ${PGID.Material}`);
    // return
    return {
        Fields: [
            CategoryFields.InternalId,
            CategoryFields.CategoryId,
            CategoryFields.ModifyTime,
            CategoryFields.ModifyUserId,
            `${CategoryFields.ModifyUser}.${AccountModelFields.AccountName}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.Lang}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.FieldDisplayName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: PAGE_SIZE,
    };
};

/** 統一提供 MatCategory List 所需資料 */
export const useMatCategoryListFetchData = (p: { lang: Lang | string; kw?: string; }): UseMatCategoryListFetchDataResult =>
{
    // 宣告變數
    const kw = p.kw ?? "";
    const adapter = useMemo(() => ({ MatCategory: MatCategoryAdapter() }), []);
    const baseParam = useMemo(() => buildBaseParam(kw), [kw]);

    const grid = adapter.MatCategory.hooks.useQueryGridData({ baseParam, deps: [kw, p.lang], modelDeps: [] });

    // 執行 function：搜尋條件變更時回第一頁
    useEffect(() =>
    {
        grid.onPageChange(1);
    }, [kw, p.lang]);

    const rawData = useMemo<MatCategoryListRawData>(() =>
    {
        // return
        return {
            list: grid.list ?? [],
            modelDisplayName: grid.modelDisplayName,
            categoryMap: EMPTY_CATEGORY_MAP,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
        };
    }, [grid.list, grid.modelDisplayName, grid.pageNumber, grid.totalPages, grid.onPageChange]);

    // return
    return { adapter, rawData, isLoading: grid.isLoading, errors: grid.errors, refetchData: grid.refetchData };
};
