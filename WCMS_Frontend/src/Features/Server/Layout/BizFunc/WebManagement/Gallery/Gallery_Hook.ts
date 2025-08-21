import type { RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../../types/api";
import * as SchemaFields from "../../../../../../types/SchemaFields";
import GalleryProvider from "./Gallery_Api";
type GallerySet = components["schemas"]["GallerySet"];
import { useFetchGridListData } from "../../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../../SysCore/Utils/Library/LibData";

export const useGalleryListData = () =>
{
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.GalleryId],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.PageManagementFields.PageId,
            ],
            Condition: "",
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.Gallery ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content: any = "";
                if (col.key === SchemaFields.PageManagementDetailFields.Title)
                {
                    // 專處理 PageManagementDetail.Title (lang: zh-tw)
                    content = "";
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
    });
};
