import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../types/api";
import * as SchemaFields from "../../../../../types/SchemaFields";
import SpecUSR_Provider from "./USRProj_Api";
type SpecUSRSet = components["schemas"]["SpecUSRSet"];
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../SysCore/Utils/Library/LibData";

export const useUSRProjList = () =>
{
    const provider = SpecUSR_Provider();
    return useFetchGridListData<SpecUSRSet>({
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
            const data = item.SpecUSR ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title)
                {
                    //   content = data.CreateTime?.find(d => d.Lang === "zh-tw")?.Title ?? "";
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
    });
};
