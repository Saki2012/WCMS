import SpecResearchProvider from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";

export const useSpecResearchList = () =>
{
    const provider = SpecResearchProvider();
    return useFetchGridListData<SpecResearchSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.CategoryId],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ContentStatus],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ModifyUserId],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.SpecResearchModelFields.ResearchId,
                SchemaFields.SpecResearchModelFields.InternalId,
                SchemaFields.SpecResearchModelFields.CategoryId,
                SchemaFields.SpecResearchModelFields.ContentStatus,
                `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Lang}`,
                // `${SchemaFields.SpecResearchSetFields.SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Title}`,
                SchemaFields.SpecResearchModelFields.ModifyUserId,
                SchemaFields.SpecResearchModelFields.ModifyTime,
            ],
            Condition: "",
            OrderBy: [{ Col: SchemaFields.SpecResearchModelFields.ModifyTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.SpecResearch ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title)
                {
                    //   content = data.CreateTime?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                } else if (col.key === SchemaFields.SpecResearchModelFields.ModifyTime)
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
