import BgTransparentImg from "@/SpecFetures/1819/Assets/Client/images/bg/background-transparent-image_1920x600.png";
import IndexPic from "@/SpecFetures/1819/Assets/Client/images/Indexed_150x150.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { isInValidTimeRange } from "@/SysCore/Utils/Library/DateRangeHelper";
import type { components } from "@/types/api";
import { useMemo } from "react";
import type { HomePageRawData } from "../HomePage_Loader";

// #region Property
type BannerSet = components["schemas"]["BannerSet_DTO"];

type BannerDetail = NonNullable<BannerSet["BannerDetail"]>[number];

type BannerDetailInfo = NonNullable<BannerDetail["_BannerDetailInfo"]>[number];


interface IndexedSectionProps
{
    lang: Lang;
    initialData: Pick<HomePageRawData, "indexedBanner">;
}
// #endregion

// #region Public
/** 索引（Prototype: .Indexed_section） */
export const IndexedSection = (props: IndexedSectionProps) =>
{
    // 宣告變數
    const banner = props.initialData.indexedBanner;

    const visibleDetails = useMemo(() =>
    {
        return getVisibleDetails(banner, props.lang);
    }, [banner, props.lang]);

    // 執行 function
    if (!banner || visibleDetails.length === 0) return null;

    // return
    return (
        <section className="Indexed_section + Layout_Padding_3_top + Layout_Padding_5_bottom" style={{ backgroundImage: `url(${BgTransparentImg})` }}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="rowInner">
                            <div className="IndexedRowHead">
                                <img className="IndexedLogo" src={IndexPic} alt="Information Icon" />
                                <div className="TW_Title">索引</div>
                                <div className="EN_Title">Indexed by</div>
                            </div>

                            <div className="IndexedRowBody">
                                <ul className="IndexedRowMenu">
                                    {visibleDetails.map((dt, idx) =>
                                    {
                                        // 宣告變數
                                        const info = getBannerInfo(dt, props.lang);
                                        const url = info?.URL ?? "";
                                        const tar = info?.URL_Open === 0 ? "_self" : "_blank";
                                        const title = info?.Title ?? "";

                                        // return
                                        return (
                                            <li key={`${dt.BannerId}-${dt.RowId}-${idx}`}>
                                                <LangLink to={url} target={tar} title={title}>
                                                    <div className="Item_TextBox">{title}</div>
                                                    <div className="card_arrow">
                                                        <i className="far fa-chevron-double-right" aria-hidden="true" />
                                                    </div>
                                                </LangLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Private
/** 取得對應語系的索引資訊 */
const getBannerInfo = (dt: BannerDetail, lang: Lang): BannerDetailInfo | null =>
{
    // 宣告變數
    const info = dt._BannerDetailInfo?.find(p => p.Lang === lang) ?? null;

    // return
    return info;
};


/** 過濾可顯示的索引項目 */
const getVisibleDetails = (banner: BannerSet | null, lang: Lang): BannerDetail[] =>
{
    // 宣告變數
    const details = banner?.BannerDetail ?? [];

    // return
    return details.filter(dt =>
    {
        const inRange = isInValidTimeRange(dt.Validate_Start, dt.Validate_End);
        const info = getBannerInfo(dt, lang);
        const hasTitle = Boolean(info?.Title && info.Title.trim() !== "");

        return inRange && hasTitle;
    });
};


export default IndexedSection;
// #endregion
