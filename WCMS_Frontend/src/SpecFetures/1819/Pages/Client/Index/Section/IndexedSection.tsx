import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import BgTransparentImg from "@/SpecFetures/1819/Assets/Client/images/bg/background-transparent-image_1920x600.png";
import IndexPic from "@/SpecFetures/1819/Assets/Client/images/Indexed_150x150.svg";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useMemo } from "react";
import { isInValidTimeRange } from "@/SysCore/Utils/Library/DateRangeHelper";
type BannerSet = components["schemas"]["BannerSet_DTO"];
/** 索引（Prototype: .Indexed_section） */
export const IndexedSection = (props: { lang: Lang }) => {

    const pvdr = useMemo(() => { return BannerSliderProvider() }, [])
    const useIndex = bannerFetch(pvdr, "Banner20260113003", props.lang)
    if (!useIndex.rawData || useIndex.rawData.length === 0) return null;
    return (
        <section className="Indexed_section + Layout_Padding_3_top + Layout_Padding_5_bottom"
            style={{ backgroundImage: `url(${BgTransparentImg})` }} >
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

                                    {useIndex.rawData?.[0]?.BannerDetail?.map((dt, idx) => {
                                        if (!isInValidTimeRange(dt.Validate_Start, dt.Validate_End)) return null
                                        const info = dt._BannerDetailInfo?.find(p => p.Lang === props.lang);
                                        const url = info?.URL ?? ""
                                        const tar = info?.URL_Open === 0 ? "_self" : "_blank"
                                        const title = info?.Title
                                        return (
                                            <li key={`${dt.BannerId}-${dt.RowId}-${idx}`}>
                                                <a href={url} target={tar} rel={info?.URL_Open === 0 ? undefined : "noreferrer"}>
                                                    <div className="Item_TextBox">{title}</div>
                                                    <div className="card_arrow">
                                                        <i className="far fa-chevron-double-right" aria-hidden="true" />
                                                    </div>
                                                </a>
                                            </li>)
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

const bannerFetch = (pdvr: IDataProvider<BannerSet>, bannerId: string, lang: Lang) => {
    let condition: string = ``;
    condition = LibMerge(" And ", false, condition, `${BannerFields.BannerId} = ${bannerId}`);
    condition = LibMerge(" And ", false, condition, `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang} = ${lang}`);
    condition = LibMerge(" And ", false, condition, `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title} != ''`);
    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                `${BannerFields._BannerDetail}.${BannerDetailFields.BannerId}`, `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`, `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.ParentRowId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.RowId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: true }],
        }),
        enabled: true,
        deps: [bannerId, lang],
    });
};