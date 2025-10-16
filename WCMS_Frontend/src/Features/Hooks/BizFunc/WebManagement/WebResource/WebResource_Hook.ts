import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";

export const useWebResourceListData = () =>
{
    const provider = WebResourceProvider();
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.Categories],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ContentStatus],
            [SchemaFields.WebResourceSetFields.WebResourceInfo, SchemaFields.WebResourceInfoFields.Title],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.CreateTime],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ModifyUserId],
            [SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.WebResourceFields.InternalId,
                SchemaFields.WebResourceFields.WebResourceId,
                SchemaFields.WebResourceFields.Categories,
                SchemaFields.WebResourceFields.ContentStatus,
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Lang}`,
                `${SchemaFields.WebResourceFields._WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Title}`,
                SchemaFields.WebResourceFields.ModifyUserId,
                SchemaFields.WebResourceFields.CreateTime,
                SchemaFields.WebResourceFields.ModifyTime,
                SchemaFields.WebResourceFields.InternalId,
            ],
            Condition: "",
            OrderBy: [
                { Col: SchemaFields.WebResourceFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.WebResource ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";

                switch (col.key)
                {
                    case SchemaFields.WebResourceInfoFields.Title:
                    {
                        content = item.WebResourceInfo?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                        break;
                    }
                    case SchemaFields.WebResourceFields.CreateTime:
                    case SchemaFields.WebResourceFields.ModifyTime:
                    {
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    }
                    default:
                    {
                        content = (data as any)[col.key] ?? "";
                        break;
                    }
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
