import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useCallback, useEffect, useState } from "react";
import SpecCategoryProvider from "./SpecCategory_Api";
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type SpecCategoryDetail = components["schemas"]["SpecCategoryDetailModel_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
export const useGetShowColumnItems = (categoryId: string) =>
{
    const provider = SpecCategoryProvider();
    return useFetchGridListData<SpecCategorySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.SpecCategoryModelFields.InternalId,
                SchemaFields.SpecCategoryModelFields.CategoryId,
                SchemaFields.SpecCategoryModelFields.ProgId,
                SchemaFields.SpecCategoryModelFields.ShowColumnItems,
            ],
            Condition: `${SchemaFields.SpecCategoryModelFields.CategoryId} = ${categoryId}`,
            OrderBy: [{ Col: SchemaFields.SpecCategoryModelFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [categoryId],
    });
};

/** 獲取類別清單 */
export const useGetSpecCategoryListByProgId = (progId: string, lang: string) =>
{
    const [data, setData] = useState<Record<string, string>>({});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetch = async (progId: string, lang: string) =>
    {
        try
        {
            setLoading(true);
            setError(null);
            const queryCondition: QueryListParam = {
                Fields: [
                    SchemaFields.SpecCategoryModelFields.CategoryId,
                    `${SchemaFields.SpecCategorySetFields.SpecCategoryDetail}.${SchemaFields.SpecCategoryDetailModelFields.Lang}`,
                    `${SchemaFields.SpecCategorySetFields.SpecCategoryDetail}.${SchemaFields.SpecCategoryDetailModelFields.CategoryName}`,
                ],
                Condition: `${SchemaFields.SpecCategoryModelFields.ProgId} = ${progId}`,
                PageNumber: 0,
                PageSize: 0,
            };
            const res = await SpecCategoryProvider().fetchList(queryCondition);
            if (!res.IsSuccess)
            {
                const errorMsg = res.SysMessage?.map(msg => `${msg.MessageCode}:${msg.Message}`).join(";")
                    ?? "資料查詢失敗";
                throw new Error(errorMsg);
            }
            const result: Record<string, string> = (res.Data as SpecCategorySet[] ?? []).reduce((acc, p) =>
            {
                const categoryId = p.SpecCategory?.CategoryId;
                if (!categoryId) return acc;
                const matchedDetail = p.SpecCategoryDetail?.find((detail: SpecCategoryDetail) => detail.Lang === lang);
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
        fetch(progId, lang);
    }, [progId, lang]);
    return { data, isLoading, error };
};

export const useSpecCateListData = (progId: string, lang: Lang) =>
{
    let condition = "";
    if (progId !== "") condition = `${SchemaFields.SpecCategoryModelFields.ProgId} = ${progId}`;
    const provider = SpecCategoryProvider();
    const [refreshToken, setRefreshToken] = useState(Symbol());
    const refetch = useCallback(() => setRefreshToken(Symbol()), []);
    const base = useFetchGridListData<SpecCategorySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.SpecCategoryModelFields.InternalId,
                SchemaFields.SpecCategoryModelFields.ProgId,
                SchemaFields.SpecCategoryModelFields.CategoryId,
                SchemaFields.SpecCategoryModelFields.ModifyTime,
                SchemaFields.SpecCategoryModelFields.ModifyUserId,
                `${SchemaFields.SpecCategorySetFields.SpecCategoryDetail}.${SchemaFields.SpecCategoryDetailModelFields.Lang}`,
                `${SchemaFields.SpecCategorySetFields.SpecCategoryDetail}.${SchemaFields.SpecCategoryDetailModelFields.CategoryName}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.SpecCategoryModelFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [progId, lang, refreshToken],
    });
    return { ...base, refetch };
};

/** 根據id獲取顯示名稱 */
export const useFormatSpecCategoriesName = (
    content: string,
    categoryData: SpecCategorySet[],
    lang: string = "zh-tw",
): string =>
{
    if (!content) return "";
    return (content.toString() ?? "").split(",").map(s => s.trim()).filter(Boolean)
        .map(catId =>
            categoryData?.find(s => String(s.SpecCategory?.CategoryId) === catId)?.SpecCategoryDetail?.find(d =>
                d.Lang === lang
            )?.CategoryName
        )
        .filter((x): x is string => !!x).join("、");
};
