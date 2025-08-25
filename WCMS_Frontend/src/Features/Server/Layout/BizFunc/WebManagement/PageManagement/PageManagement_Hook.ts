import type { RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../../types/api";
import * as SchemaFields from "../../../../../../types/SchemaFields";
import PageManagementProvider from "./PageManagement_Api";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
import { useFetchGridListData } from "../../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../../SysCore/Utils/Library/LibData";

export const usePageManagementListData = () =>
{
    const provider = PageManagementProvider();
    return useFetchGridListData<PageManagementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.CategoryId],
            [SchemaFields.PageManagementSetFields.PageManagementDetail, SchemaFields.PageManagementDetailFields.Title],
            [SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.ModifyUserId],
            [SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.PageManagementFields.PageId,
                SchemaFields.PageManagementFields.CategoryId,
                // `Category.CategoryDetail.Lang`,
                // `Category.CategoryDetail.CategoryName`,
                // 缺Name
                `${SchemaFields.PageManagementSetFields.PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Lang}`,
                `${SchemaFields.PageManagementSetFields.PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Title}`,
                SchemaFields.PageManagementFields.ModifyUserId,
                // 缺Name
                SchemaFields.PageManagementFields.ModifyTime,
                SchemaFields.PageManagementFields.InternalId,
            ],
            Condition: "",
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.PageManagement ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content: any = "";
                if (col.key === SchemaFields.PageManagementDetailFields.Title)
                {
                    // 專處理 PageManagementDetail.Title (lang: zh-tw)
                    content = item.PageManagementDetail?.find((d: any) => d.Lang === "zh-tw")?.Title ?? "";
                } else if (col.key === SchemaFields.PageManagementFields.ModifyTime)
                {
                    content = FormatDateTime((data as any)[col.key]);
                } else
                {
                    // 一般欄位直接取用
                    content = (data as any)[col.key] ?? "";
                }
                return {
                    col,
                    content,
                };
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
        const res = await PageManagementProvider().deleteData(internalId);
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
