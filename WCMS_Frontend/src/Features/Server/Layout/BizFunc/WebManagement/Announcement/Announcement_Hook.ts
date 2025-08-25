import { useEffect, useState } from "react";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import type { components } from "../../../../../../types/api";
import * as SchemaFields from "../../../../../../types/SchemaFields";
import AnnouncementProvider from "./Announcement_Api";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
import { useFetchGridListData } from "../../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../../SysCore/Utils/Library/LibData";

export const useAnnouncementList = () =>
{
    const provider = AnnouncementProvider();
    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Categories],
            [SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ContentStatus],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyUserId],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.Categories,
                SchemaFields.AnnouncementFields.ContentStatus,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.AnnouncementFields.ModifyUserId,
                SchemaFields.AnnouncementFields.ModifyTime,
                SchemaFields.AnnouncementFields.InternalId,
            ],
            Condition: "",
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title)
                {
                    content = item.AnnouncementDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                } else if (col.key === SchemaFields.AnnouncementFields.ModifyTime)
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
        enabled: true,
        deps: [],
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
        const res = await AnnouncementProvider().deleteData(internalId);
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
