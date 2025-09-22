import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import SpecUSRProvider from "./SpecUSR_Api";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";

export const useSpecUSRProjList = () =>
{
    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.CategoryId],
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.Tags],
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.ContentStatus],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Year],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.AcademicYear],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectName],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectConcept],
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.ModifyUserId],
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.SpecUSRModelFields.CategoryId,
                SchemaFields.SpecUSRModelFields.Tags,
                SchemaFields.SpecUSRModelFields.ContentStatus,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Year}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.AcademicYear}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ProjectName}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ProjectConcept}`,
                SchemaFields.SpecUSRModelFields.ModifyUserId,
                SchemaFields.SpecUSRModelFields.ModifyTime,
                SchemaFields.SpecUSRModelFields.InternalId,
            ],
            Condition: "",
            OrderBy: [{ Col: SchemaFields.SpecUSRModelFields.ModifyTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.SpecUSR ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";

                switch (col.key)
                {
                    case SchemaFields.SpecUSRDetailFields.Year:
                    {
                        content = item.SpecUSRDetail?.find(p => p.Lang === "zh-tw")?.Year ?? "";
                        break;
                    }
                    case SchemaFields.SpecUSRDetailFields.AcademicYear:
                    {
                        content = item.SpecUSRDetail?.find(p => p.Lang === "zh-tw")?.AcademicYear?.toString() ?? "";
                        break;
                    }
                    case SchemaFields.SpecUSRDetailFields.ProjectName:
                    {
                        content = item.SpecUSRDetail?.find(p => p.Lang === "zh-tw")?.ProjectName ?? "";
                        break;
                    }
                    case SchemaFields.SpecUSRDetailFields.ProjectConcept:
                    {
                        content = item.SpecUSRDetail?.find(p => p.Lang === "zh-tw")?.ProjectConcept ?? "";
                        break;
                    }
                    case SchemaFields.SpecUSRModelFields.ModifyTime:
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
