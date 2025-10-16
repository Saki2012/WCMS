import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
type GallerySet = components["schemas"]["GallerySet_DTO"];

export const useGalleryListData = () =>
{
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.CoverPicSrcId],
            [SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.CreateTime],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.ModifyTime],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.ModifyUserId],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.GalleryFields.InternalId,
                SchemaFields.GalleryFields.GalleryId,
                SchemaFields.GalleryFields.CoverPicSrcId,
                `${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
                `${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
                SchemaFields.GalleryFields.CreateTime,
                SchemaFields.GalleryFields.ModifyTime,
                SchemaFields.GalleryFields.ModifyUserId,
            ],
            Condition: "",
            OrderBy: [
                { Col: SchemaFields.GalleryFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.Gallery ?? {};
            const dt = item.GalleryInfo?.find(p => p.Lang === "zh-tw");
            const cells: RowCell[] = columns.map(col =>
            {
                let content: any = "";
                switch (col.key)
                {
                    case SchemaFields.PageManagementDetailFields.Title:
                        content = dt?.Title;
                        break;
                    case SchemaFields.PageManagementFields.CreateTime:
                    case SchemaFields.PageManagementFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
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
