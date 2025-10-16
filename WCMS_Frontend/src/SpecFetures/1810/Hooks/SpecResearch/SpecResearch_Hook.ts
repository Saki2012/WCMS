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

            [SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Year],
            [
                SchemaFields.SpecResearchSetFields.SpecResearchDetail,
                SchemaFields.SpecResearchDetailModelFields.AcademicYear,
            ],
            [
                SchemaFields.SpecResearchSetFields.SpecResearchDetail,
                SchemaFields.SpecResearchDetailModelFields.ProjectName,
            ],
            [
                SchemaFields.SpecResearchSetFields.SpecResearchDetail,
                SchemaFields.SpecResearchDetailModelFields.PaperTitle,
            ],
            [
                SchemaFields.SpecResearchSetFields.SpecResearchDetail,
                SchemaFields.SpecResearchDetailModelFields.CooperationProject,
            ],
            [SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Courses],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.CreateTime],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ModifyUserId],
            [SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.SpecResearchModelFields.ResearchId,
                SchemaFields.SpecResearchModelFields.InternalId,
                SchemaFields.SpecResearchModelFields.CategoryId,
                SchemaFields.SpecResearchModelFields.ContentStatus,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Lang}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Year}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.AcademicYear}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.ProjectName}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.PaperTitle}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.CooperationProject}`,
                `${SchemaFields.SpecResearchModelFields._SpecResearchDetail}.${SchemaFields.SpecResearchDetailModelFields.Courses}`,
                SchemaFields.SpecResearchModelFields.CreateTime,
                SchemaFields.SpecResearchModelFields.ModifyUserId,
                SchemaFields.SpecResearchModelFields.ModifyTime,
            ],
            Condition: "",
            OrderBy: [{ Col: SchemaFields.SpecResearchModelFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.SpecResearch ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                switch (col.key)
                {
                    case SchemaFields.SpecResearchDetailModelFields.Year:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.Year?.toString() ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchDetailModelFields.AcademicYear:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.AcademicYear?.toString()
                            ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchDetailModelFields.ProjectName:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.ProjectName ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchDetailModelFields.PaperTitle:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.PaperTitle ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchDetailModelFields.CooperationProject:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.CooperationProject ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchDetailModelFields.Courses:
                    {
                        content = item.SpecResearchDetail?.find(p => p.Lang === "zh-tw")?.Courses ?? "";
                        break;
                    }
                    case SchemaFields.SpecResearchModelFields.CreateTime:
                    case SchemaFields.SpecResearchModelFields.ModifyTime:
                    {
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    }
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
