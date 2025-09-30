import CategoryProvider from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import type { components } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type CategoryDetail = components["schemas"]["CategoryDetail_DTO"];
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import * as SchemaFields from "@/types/SchemaFields";
type QueryListParam = components["schemas"]["QueryListParam"];

/** 獲取類別清單 */
export const useGetCategoryListByProgId = (progId: string, lang: string, pageSize: number = 0) =>
{
    const [data, setData] = useState<Record<string, string>>({});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const fetch = async (progId: string, lang: string, page: number) =>
    {
        try
        {
            setLoading(true);
            setError(null);
            const queryCondition: QueryListParam = {
                Fields: [
                    SchemaFields.CategoryFields.CategoryId,
                    `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                    `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
                ],
                Condition:
                    `${SchemaFields.CategoryFields.ProgId} = \"${progId}\" And ${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang} = \"zh-TW\"`,
                PageNumber: page,
                PageSize: pageSize,
            };
            const res = await CategoryProvider().fetchList(queryCondition);
            if (!res.IsSuccess)
            {
                const errorMsg = res.SysMessage?.map(msg => `${msg.MessageCode}:${msg.Message}`).join(";")
                    ?? "資料查詢失敗";
                throw new Error(errorMsg);
            }
            const result: Record<string, string> = (res.Data as CategoryDataSet[] ?? []).reduce((acc, p) =>
            {
                const categoryId = p.Category?.CategoryId;
                if (!categoryId) return acc;
                const matchedDetail = p.CategoryDetail?.find((detail: CategoryDetail) => detail.Lang === lang);
                acc[categoryId] = matchedDetail?.CategoryName ?? "";
                return acc;
            }, {} as Record<string, string>);
            setData(result);
        } catch (err: any)
        {
            setError(err.message ?? "資料錯誤");
        } finally
        {
            setLoading(false);
        }
    };
    useEffect(() =>
    {
        fetch(progId, lang, currentPage);
    }, [currentPage, progId, lang]);

    return { data, isLoading, error };
};

export const useCategoryListData = (progId: string, lang: Lang) =>
{
    let condition = "";
    if (progId !== "") condition = `${SchemaFields.CategoryFields.ProgId} = ${progId}`;
    const provider = CategoryProvider();
    const [refreshToken, setRefreshToken] = useState(Symbol());
    const refetch = useCallback(() => setRefreshToken(Symbol()), []);
    const base = useFetchGridListData<CategoryDataSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.CategoryDataSetFields.CategoryDetail, SchemaFields.CategoryDetailFields.CategoryName],
            [SchemaFields.CategoryDataSetFields.Category, SchemaFields.CategoryFields.CreateTime],
            [SchemaFields.CategoryDataSetFields.Category, SchemaFields.CategoryFields.ModifyTime],
            [SchemaFields.CategoryDataSetFields.Category, SchemaFields.CategoryFields.ModifyUserId],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.CategoryFields.InternalId,
                SchemaFields.CategoryFields.CategoryId,
                SchemaFields.CategoryFields.ProgId,
                SchemaFields.CategoryFields.CreateTime,
                SchemaFields.CategoryFields.ModifyTime,
                SchemaFields.CategoryFields.ModifyUserId,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
            ],
            // 如果 progId 是字串型別且後端期望字串，記得加引號：
            // Condition: `${SchemaFields.CategoryFields.ProgId} = '${progId.replace(/'/g,"''")}'`,
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.CategoryFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        }),
        parseRow: (item, columns) =>
        {
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                switch (col.key)
                {
                    case SchemaFields.CategoryDetailFields.CategoryName:
                    {
                        content = item.CategoryDetail?.find(i => i.Lang === lang)?.CategoryName ?? "";
                        break;
                    }
                    case SchemaFields.CategoryFields.ModifyTime:
                    {
                        content = FormatDateTime(item.Category?.ModifyTime) ?? "";
                        break;
                    }
                    default:
                    {
                        content = (item.Category as any)[col.key] ?? "";
                        break;
                    }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [progId, lang, refreshToken],
    });
    return { ...base, refetch };
};
/** 根據id獲取顯示名稱 */
export const useFormatCategoriesName = (
    content: string,
    categoryData: CategoryDataSet[],
    lang: string = "zh-tw",
): string =>
{
    if (!content) return "";
    return (content.toString() ?? "").split(",").map(s => s.trim()).filter(Boolean)
        .map(catId =>
            categoryData?.find(s => String(s.Category?.CategoryId) === catId)?.CategoryDetail?.find(d =>
                d.Lang === lang
            )?.CategoryName
        )
        .filter((x): x is string => !!x).join("、");
};
