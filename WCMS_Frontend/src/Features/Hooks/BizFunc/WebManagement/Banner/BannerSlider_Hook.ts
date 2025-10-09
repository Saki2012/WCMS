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
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.BannerFields.InternalId,
                SchemaFields.BannerFields.BannerId,
                SchemaFields.BannerFields.BannerCategoryName,
                // 缺Name
                SchemaFields.BannerFields.ModifyUserId,
                // 缺Name
                SchemaFields.BannerFields.ModifyTime,
            ],
            Condition: condition ?? "",
            OrderBy: [
                { Col: SchemaFields.BannerFields.CreateTime, Desc: true },
                { Col: SchemaFields.BannerFields.ModifyTime, Desc: true },
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

export const handleDelete = async (internalId: string) =>
{
    if (!internalId)
    {
        alert("無效的資料");
        return;
    }

    const confirmDelete = window.confirm("確定要刪除嗎？");
    if (!confirmDelete) return;
    try
    {
        const res = await BannerSliderProvider().deleteData(internalId);
        if (res.IsSuccess)
        {
            alert("刪除成功");
            window.location.reload(); // 或觸發重新 fetchData
        } else
        {
            alert(res.SysMessage?.map(m => `${m.MessageCode}:${m.Message}`)?.join("\n") ?? "刪除失敗");
        }
    } catch (err)
    {
        alert(`刪除發生錯誤: ${(err as any)?.message}`);
    }
};
