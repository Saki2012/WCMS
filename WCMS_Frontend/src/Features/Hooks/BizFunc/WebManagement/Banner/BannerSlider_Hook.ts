import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import BannerSliderProvider from "./BannerSlider_Api";
type BannerSet = components["schemas"]["BannerSet_DTO"];

export const useBannerListData = (condition?: string) =>
{
    const provider = BannerSliderProvider();
    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.BannerDetailFields.PicSrcId, SchemaFields.BannerDetailFields.PicSrcId],
            [SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.BannerCategoryName],
            [SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.CreateTime],
            [SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.ModifyUserId],
            [SchemaFields.BannerFields.ModifyUser, SchemaFields.UserModelFields.UserName],
            [SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.BannerFields.InternalId,
                SchemaFields.BannerFields.BannerId,
                SchemaFields.BannerFields.BannerCategoryName,
                // 缺Name
                SchemaFields.BannerFields.ModifyUserId,
                // 缺Name
                SchemaFields.BannerFields.CreateTime,
                SchemaFields.BannerFields.ModifyTime,
            ],
            Condition: condition ?? "",
            OrderBy: [
                { Col: SchemaFields.BannerFields.CreateTime, Desc: true },
            ],
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
                    case SchemaFields.BannerFields.CreateTime:
                    case SchemaFields.BannerFields.ModifyTime:
                    {
                        content = FormatDateTime(item.Banner?.ModifyTime) ?? "";
                        break;
                    }
                    default:
                    {
                        content = (item.Banner as any)[col.key] ?? "";
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
