import { useEffect, useState } from "react";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import type { components } from "../../../../../../types/api";
import TagProvider from "./Tag_Api";

type TagSet = components["schemas"]["TagSet_DTO"];
type TagDetail = components["schemas"]["TagDetail_DTO"];

import * as SchemaFields from "../../../../../../types/SchemaFields";

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
            const queryCondition: QueryListCondition = {
                Fields: [
                    SchemaFields.TagDataFields.TagId,
                    SchemaFields.TagDataFields.InternalId,
                    `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                    `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
                ],
                Condition:
                    `${SchemaFields.TagDataFields.ProgId} = \"${progId}\" And ${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.Lang} = \"zh-tw\"`,
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
