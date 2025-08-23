import { useEffect, useState } from "react";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import type { components } from "../../../../../../types/api";
import * as SchemaFields from "../../../../../../types/SchemaFields";
import WebResourceProvider from "./WebResource_Api";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
import { useFetchGridListData } from "../../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../../SysCore/Utils/Library/LibData";

export const useWebResourceList = () =>
{
    const provider = WebResourceProvider();
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.Categories],
            // [SchemaFields.WebResourceSetFields.WebResourceDetail, SchemaFields.WebResourceDetailFields.Title],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ContentStatus],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ModifyUserId],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.WebResourceFields.WebResourceId,
                SchemaFields.WebResourceFields.Categories,
                SchemaFields.WebResourceFields.ContentStatus,
                // `${SchemaFields.WebResourceSetFields.WebResourceDetail}.${SchemaFields.WebResourceDetailFields.Lang}`,
                // `${SchemaFields.WebResourceSetFields.WebResourceDetail}.${SchemaFields.WebResourceDetailFields.Title}`,
                SchemaFields.WebResourceFields.ModifyUserId,
                SchemaFields.WebResourceFields.ModifyTime,
                SchemaFields.WebResourceFields.InternalId,
            ],
            Condition: "",
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.WebResource ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                if (col.key === SchemaFields.WebResourceInfoFields.Title)
                {
                    // content = data.WebResourceDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                } else if (col.key === SchemaFields.WebResourceFields.ModifyTime)
                {
                    content = FormatDateTime((data as any)[col.key]);
                } else
                {
                    content = (data as any)[col.key] ?? "";
                }
                return { col, content };
            });
            return { cells };
        },
    });
};

export const handleDelete = async (internalId: string) =>
{
    if (!internalId)
    {
        alert("無效的資料");
        return;
    }
    const confirmDelete = window.confirm("確定要刪除嗎？");
    if (!confirmDelete) return;
    try
    {
        const res = await WebResourceProvider().deleteData(internalId);
        if (res.IsSuccess)
        {
            alert("刪除成功");
            window.location.reload(); // 或觸發重新 fetchData
        } else
        {
            alert(res.SysMessage?.map(m => `${m.MessageCode}:${m.Message}`)?.join("\n") ?? "刪除失敗");
        }
    } catch (err)
    {
        alert(`刪除發生錯誤: ${(err as any)?.message}`);
    }
};
