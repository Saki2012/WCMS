import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type CategoryDetail = components["schemas"]["CategoryDetail_DTO"];

class CategoryService extends ApiDataService<CategorySet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Category, apiInstance);
    }
}

const escapeQueryString = (value: string): string =>
{
    // 宣告變數：Query 字串常用雙引號包值，需 escape
    const escaped = value.replace(/"/g, `""`);

    // return
    return escaped;
};

export const buildCategoryQueryByProgIdParam = (
    opt: { progId: string; lang?: Lang; pageSize?: number; },
): QueryListParam =>
{
    // 宣告變數
    const progId = escapeQueryString(opt.progId);
    const lang = opt.lang ? escapeQueryString(opt.lang) : null;

    const fields: string[] = [
        SchemaFields.CategoryFields.CategoryId,
        `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
        `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
    ];

    const condLang = lang
        ? ` And ${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang} = "${lang}"`
        : "";

    // return
    return {
        Fields: fields,
        Condition: `${SchemaFields.CategoryFields.ProgId} = "${progId}"${condLang}`,
        OrderBy: [{ Col: SchemaFields.CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 0,
        PageSize: opt.pageSize ?? 0,
    };
};

/**
 * ✅ 命名不變
 * - 擴充 adapter.hooks：useMapByProgId（後台 CSR 用，先不做 loader）
 */
export const CategoryAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<CategorySet, CategoryService>(
        (api?: AxiosInstance) => new CategoryService(api ?? apiInstance),
    );

    const useMapByProgId = (opt: {
        progId: string;
        lang: Lang;
        pageSize?: number;
        apiInstance?: AxiosInstance;
        deps?: EffectDeps;
    }) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize];

        // 執行 function：沿用基底 useQueryList
        const query = adapter.hooks.useQueryList({
            condition: buildCategoryQueryByProgIdParam({
                progId: opt.progId,
                lang: opt.lang,
                pageSize: opt.pageSize,
            }),
            deps,
            apiInstance: opt.apiInstance,
        });

        const map = useMemo<Record<string, string>>(() =>
        {
            const rows = query.data ?? [];
            return rows.reduce((acc, p) =>
            {
                const id = p.Category?.CategoryId;
                if (!id) return acc;

                const matched = (p.CategoryDetail ?? []).find((d: CategoryDetail) => d.Lang === opt.lang);
                acc[String(id)] = matched?.CategoryName ?? "";
                return acc;
            }, {} as Record<string, string>);
        }, [query.data, opt.lang]);

        // return
        return { ...query, map };
    };
    const extAdapter = adapter as ApiDataAdapter<CategorySet, CategoryService> & {
        hooks: typeof adapter.hooks & { useMapByProgId: typeof useMapByProgId; };
    };

    extAdapter.hooks = {
        ...adapter.hooks,
        useMapByProgId,
    };
    // return：回傳擴充 hooks 後的 adapter
    return extAdapter;
};

/** 純格式化：把 "1,2,3" 轉成 "分類A、分類B"（先放同檔案外層，後續你再抽） */
export const formatCategoriesName = (content: string, categoryData: CategorySet[], lang: Lang): string =>
{
    // 宣告變數
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";

    // return
    return raw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(catId =>
            categoryData?.find(s => String(s.Category?.CategoryId) === catId)
                ?.CategoryDetail?.find(d => d.Lang === lang)
                ?.CategoryName
        )
        .filter((x): x is string => Boolean(x))
        .join("、");
};
