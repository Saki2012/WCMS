import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

type BannerSet = components["schemas"]["BannerSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export interface ISubPageLoaderData
{
    bannerInitial: ApiLoaderData<QueryListParam, BannerSet[]> | null;
}

const buildBannerQueryCondition = (bannerId: string): QueryListParam =>
{
    // 宣告變數
    const cond = `${BannerFields.BannerId} = ${bannerId}`;

    // return
    return {
        Fields: [
            BannerFields.BannerId,
            BannerFields.Width,
            BannerFields.Height,
            BannerFields.Interval,
            BannerFields.Speed,
            `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
        ],
        Condition: cond,
        OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: false }],
    };
};

const canLoadBanner = (node: INormNode): boolean =>
{
    // 宣告變數
    const bannerId = (node.bannerId ?? "").trim();

    // return
    return bannerId.length > 0;
};

/** SubPage 外框 loader：只負責 BannerData（SSR 首屏用） */
export const SubPageLoader = (ctx: { lang: Lang; site: INormSite; node: INormNode; }) =>
{
    return async (args: LoaderFunctionArgs): Promise<ISubPageLoaderData> =>
    {
        // 宣告變數
        const node = ctx.node;
        const bannerId = (node.bannerId ?? "").trim();

        // 執行 function：沒 bannerId 就不撈
        if (!canLoadBanner(node)) return { bannerInitial: null };

        const adapter = BannerSliderAdapter();
        const loader = adapter.loader.createQueryListLoader({ getCondition: () => buildBannerQueryCondition(bannerId) });

        const bannerInitial = await loader(args);

        // 執行 function：API 失敗就回 null（避免錯誤狀態污染 Banner_Comp）
        if (!bannerInitial.apiRes?.IsSuccess) return { bannerInitial: null };

        // return
        return { bannerInitial };
    };
};
