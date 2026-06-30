import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { ISubPageLoaderData } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type BannerSet = components["schemas"]["BannerSet_DTO"];
type BannerDetail = components["schemas"]["BannerDetail_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

interface SubBannerCompProps
{
    lang: Lang;
    node: INormNode;
    initialBanner?: ISubPageLoaderData["bannerInitial"] | null;
}
// #endregion

// #region Public
/** 1810 子頁 Banner，使用 background-image 結構對齊原版型 CSS。 */
export const SubBanner_Comp = (props: SubBannerCompProps) =>
{
    // 宣告變數
    const bannerId = props.node.bannerId ?? "";
    const adapter = useMemo(() => BannerSliderAdapter(), []);
    const bannerData = useSubBannerData(adapter, props.lang, bannerId, props.initialBanner ?? null);
    const banner = bannerData.data?.[0];
    const detail = useMemo(() => resolveSubBannerDetail(banner), [banner]);
    const imageUrl = detail?.PicSrcId ? FileManagementAPI.get_Public_Preview_Url(detail.PicSrcId) : "";
    const title = getCurrentMenuTitle(props.node);

    // return
    if (!bannerId || !detail || !imageUrl) return null;
    return <SubBannerContent title={title} imageUrl={imageUrl} />;
};
// #endregion

// #region Section
/** 1810 Banner DOM 區塊。 */
const SubBannerContent = (props: { title: string; imageUrl: string; }) =>
{
    // return
    return (
        <div className="container-fluid-customize px-0">
            <div className="subpage_banner_wrapper" style={{ backgroundImage: `url(${props.imageUrl})` }} role="img" aria-label={props.title}>
                <div className="container-customize1">
                    <div className="banner-content">
                        <div className="content-inner">
                            <div className="titlebar">
                                <div className="titlebar-inner container">
                                    <h1 className="Big-title">{props.title}</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 取得 1810 Banner 資料，優先沿用 SSR loader 初始資料。 */
const useSubBannerData = (
    adapter: ReturnType<typeof BannerSliderAdapter>,
    lang: Lang,
    bannerId: string,
    initial: ApiLoaderData<QueryListParam, BannerSet[]> | null,
) =>
{
    // 宣告變數
    const queryCondition = useMemo<QueryListParam>(() => buildBannerQueryCondition(initial, bannerId), [initial?.args, bannerId]);

    // return
    return adapter.hooks.useQueryList({ condition: queryCondition, initial, deps: [bannerId, lang] });
};

/** 建立 Banner 查詢條件。 */
const buildBannerQueryCondition = (initial: ApiLoaderData<QueryListParam, BannerSet[]> | null, bannerId: string): QueryListParam =>
{
    // 執行 function
    if (initial?.args) return initial.args;
    if (!bannerId) return { Fields: [], Condition: "" };

    // return
    return {
        Fields: [
            BannerFields.BannerId,
            `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
        ],
        Condition: `${BannerFields.BannerId} = ${bannerId}`,
        OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: false }],
    };
};

/** 選出第一張有效 Banner 圖。 */
const resolveSubBannerDetail = (banner: BannerSet | undefined): BannerDetail | null =>
{
    // 宣告變數
    const now = Date.now();
    const list = banner?.BannerDetail ?? [];

    // return
    return [...list].filter(d => isValidBannerDetail(d, now)).sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0))[0] ?? null;
};

/** 判斷 Banner 明細是否可顯示。 */
const isValidBannerDetail = (detail: BannerDetail, now: number): boolean =>
{
    // 宣告變數
    const start = detail.Validate_Start ? new Date(detail.Validate_Start).getTime() : -Infinity;
    const end = detail.Validate_End ? new Date(detail.Validate_End).getTime() : Infinity;

    // return
    return start <= now && now <= end && !!detail.PicSrcId;
};

/** 取得目前選單節點標題，1810 Banner 不使用 Banner 圖片資料內的 Title。 */
const getCurrentMenuTitle = (node: INormNode): string =>
{
    // return
    return (node.title ?? "").toString();
};
// #endregion
