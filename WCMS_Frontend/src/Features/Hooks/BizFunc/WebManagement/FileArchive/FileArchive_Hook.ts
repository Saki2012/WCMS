import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";

export const useFileArchiveList = () =>
{
    const provider = FileArchiveProvider();
    return useFetchGridListData<FileArchiveSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.CategoriesId],
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.ContentStatus],
            [SchemaFields.FileArchiveSetFields.FileArchiveInfo, SchemaFields.FileArchiveInfoFields.Title],
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.ModifyUserId],
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.FileArchiveFields.InternalId,
                SchemaFields.FileArchiveFields.FileArchiveId,
                SchemaFields.FileArchiveFields.CategoriesId,
                SchemaFields.FileArchiveFields.ContentStatus,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Lang}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Title}`,
                SchemaFields.FileArchiveFields.ModifyUserId,
                SchemaFields.FileArchiveFields.ModifyTime,
            ],
            Condition: "",
            OrderBy: [{ Col: SchemaFields.AnnouncementFields.ModifyTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                switch (col.key)
                {
                    case SchemaFields.FileArchiveInfoFields.Title:
                    {
                        content = item.FileArchiveInfo?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                        break;
                    }
                    case SchemaFields.FileArchiveFields.ModifyTime:
                    {
                        content = FormatDateTime(item.FileArchive?.ModifyTime);
                        break;
                    }
                    default:
                    {
                        content = (item.FileArchive as any)[col.key] ?? "";
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
