import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

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
            [SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.CreateTime],
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
                `${SchemaFields.PageManagementFields._PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Lang}`,
                `${SchemaFields.PageManagementFields._PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Title}`,
                SchemaFields.PageManagementFields.ModifyUserId,
                // 缺Name
                SchemaFields.PageManagementFields.CreateTime,
                SchemaFields.PageManagementFields.ModifyTime,
                SchemaFields.PageManagementFields.InternalId,
            ],
            Condition: "",
            OrderBy: [
                { Col: SchemaFields.PageManagementFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.PageManagement ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content: any = "";

                switch (col.key)
                {
                    case SchemaFields.PageManagementDetailFields.Title:
                        content = item.PageManagementDetail?.find((d: any) => d.Lang === "zh-tw")?.Title ?? "";
                        break;
                    case SchemaFields.PageManagementFields.CreateTime:
                    case SchemaFields.PageManagementFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    default:
                        content = (data as any)[col.key] ?? "";
                        break;
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

export const usePageListData = () =>
{
    const provider = PageManagementProvider();
    return useFetchGridListData<PageManagementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.PageManagementFields.PageId,
                SchemaFields.PageManagementFields.CategoryId,
                // `Category.CategoryDetail.Lang`,
                // `Category.CategoryDetail.CategoryName`,
                // 缺Name
                `${SchemaFields.PageManagementFields._PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Lang}`,
                `${SchemaFields.PageManagementFields._PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Title}`,
                SchemaFields.PageManagementFields.ModifyUserId,
                // 缺Name
                SchemaFields.PageManagementFields.ModifyTime,
                SchemaFields.PageManagementFields.InternalId,
            ],
            Condition: "",
            OrderBy: [{ Col: SchemaFields.PageManagementFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
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
