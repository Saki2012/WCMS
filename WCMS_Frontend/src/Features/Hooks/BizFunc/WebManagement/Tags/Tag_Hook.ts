import TagProvider from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { type Lang } from "@/SysCore/i18n/lang";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useCallback, useEffect, useState } from "react";
type TagSet = components["schemas"]["TagSet_DTO"];
type TagDetail = components["schemas"]["TagDetail_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 獲取類別清單 */
export const useGetTagListByProgId = (progId: string, lang: string, pageSize: number = 0) =>
{
    const [data, setData] = useState<Record<string, string>>({});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetch = async (progId: string, lang: string, page: number) =>
    {
        try
        {
            setLoading(true);
            setError(null);
            const queryCondition: QueryListParam = {
                Fields: [
                    SchemaFields.TagDataFields.TagId,
                    SchemaFields.TagDataFields.InternalId,
                    `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                    `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
                ],
                Condition:
                    `${SchemaFields.TagDataFields.ProgId} = \"${progId}\" And ${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang} = \"zh-tw\"`,
                OrderBy: [{ Col: SchemaFields.TagDataFields.CreateTime, Desc: false }],
                PageNumber: page,
                PageSize: pageSize,
            };
            const res = await TagProvider().fetchList(queryCondition);
            if (!res.IsSuccess)
            {
                const errorMsg = res.SysMessage?.map(msg => `${msg.MessageCode}:${msg.Message}`).join(";")
                    ?? "資料查詢失敗";
                throw new Error(errorMsg);
            }
            const result: Record<string, string> = (res.Data as TagSet[] ?? []).reduce((acc, p) =>
            {
                const tagId = p.TagData?.TagId;
                if (!tagId) return acc;
                const matchedDetail = p.TagDetail?.find((detail: TagDetail) => detail.Lang === lang);
                acc[tagId] = matchedDetail?.TagName ?? "";
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

export const useTagListData = (progId: string, lang: Lang) =>
{
    let condition = "";
    if (progId !== "") condition = `${SchemaFields.TagDataFields.ProgId} = ${progId}`;
    const provider = TagProvider();
    const [refreshToken, setRefreshToken] = useState(Symbol());
    const refetch = useCallback(() => setRefreshToken(Symbol()), []);
    const base = useFetchGridListData<TagSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.TagSetFields.TagDetail, SchemaFields.TagDetailFields.TagName],
            [SchemaFields.TagSetFields.TagData, SchemaFields.TagDataFields.ModifyTime],
            [SchemaFields.TagSetFields.TagData, SchemaFields.TagDataFields.ModifyUserId],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.TagDataFields.InternalId,
                SchemaFields.TagDataFields.TagId,
                SchemaFields.TagDataFields.ProgId,
                SchemaFields.TagDataFields.ModifyTime,
                SchemaFields.TagDataFields.ModifyUserId,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.TagDataFields.ModifyTime, Desc: true }],
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
                    case SchemaFields.TagDetailFields.TagName:
                    {
                        content = item.TagDetail?.find(i => i.Lang === lang)?.TagName ?? "";
                        break;
                    }
                    case SchemaFields.TagDataFields.ModifyTime:
                    {
                        content = FormatDateTime(item.TagData?.ModifyTime) ?? "";
                        break;
                    }
                    default:
                    {
                        content = (item.TagData as any)[col.key] ?? "";
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

export const useFormatTagsName = (content: string, tagData: TagSet[], lang: Lang): string =>
{
    if (!content) return "";
    return (content.toString() ?? "")
        .split(",").map(s => s.trim()).filter(Boolean)
        .map(tagId =>
            tagData?.find(s => String(s.TagData?.TagId) === tagId)?.TagDetail?.find(d => d.Lang === lang)?.TagName
        )
        .filter((x): x is string => !!x)
        .join("、");
};
