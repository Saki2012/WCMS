import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

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
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Validate_Start],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.CreateTime],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyUserId],
            [SchemaFields.AnnouncementFields.ModifyUser, SchemaFields.UserModelFields.UserName],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.Categories,
                SchemaFields.AnnouncementFields.ContentStatus,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.AnnouncementFields.Validate_Start,
                SchemaFields.AnnouncementFields.ModifyUserId,
                `${SchemaFields.AnnouncementFields.ModifyUser}.${SchemaFields.UserModelFields.UserName}`,
                SchemaFields.AnnouncementFields.CreateTime,
                SchemaFields.AnnouncementFields.ModifyTime,
                SchemaFields.AnnouncementFields.InternalId,
            ],
            Condition: "",
            OrderBy: [
                { Col: SchemaFields.AnnouncementFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";

                switch (col.key)
                {
                    case SchemaFields.AnnouncementDetailFields.Title:
                        content = item.AnnouncementDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                        break;
                    case SchemaFields.AnnouncementFields.Validate_Start:
                        content = FormatDate((data as any)[col.key]);
                        break;
                    case SchemaFields.AnnouncementFields.CreateTime:
                    case SchemaFields.AnnouncementFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;

                    case SchemaFields.AnnouncementFields.ModifyUserId:
                        content = item.Announcement?.ModifyUser?.UserName ?? "";
                        break;
                    default:
                        content = (data as any)[col.key] ?? "";
                        break;
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [],
    });
};
