import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import DefaultPic from "@/SpecFetures/1810/Assets/Custom/images_960x960.jpg";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { SpecUSRDetailFields } from "@/types/SchemaFields";
import { useLocation } from "react-router-dom";
import { type ISpecUSRListOptions, useSpecUSRListFetchData } from "./SpecUSR_List_Loader";

// #region Property
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];

type SpecUSRDetail = components["schemas"]["SpecUSRDetail_DTO"];

type ColKey =
    | typeof SpecUSRDetailFields.Year
    | typeof SpecUSRDetailFields.ProjectLeader
    | typeof SpecUSRDetailFields.ProjectSubLeader
    | typeof SpecUSRDetailFields.ExternalCooperationUnit
    | typeof SpecUSRDetailFields.Department
    | typeof SpecUSRDetailFields.ProjectItem
    | typeof SpecUSRDetailFields.PlanAmount
    | typeof SpecUSRDetailFields.DuringExecution
    | typeof SpecUSRDetailFields.Cohost1
    | typeof SpecUSRDetailFields.Cohost2
    | typeof SpecUSRDetailFields.Commissioned;


interface ISpecUSRListProps
{
    Theme: IFETheme;
    Lang: string | Lang;
    Options?: ISpecUSRListOptions;
}


const COLS: ColKey[] = [
    SpecUSRDetailFields.Year,
    SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader,
    SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department,
    SpecUSRDetailFields.ProjectItem,
    SpecUSRDetailFields.PlanAmount,
    SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.Cohost1,
    SpecUSRDetailFields.Cohost2,
    SpecUSRDetailFields.Commissioned,
];


const LEADER_GROUP: ColKey[] = [
    SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader,
    SpecUSRDetailFields.Cohost1,
    SpecUSRDetailFields.Cohost2,
];
// #endregion

// #region Public
/** SpecUSR 清單元件 */
export const SpecUSRListComp = (props: ISpecUSRListProps) =>
{
    // 宣告變數：統一由 loader / hook 提供資料
    const getData = useSpecUSRListFetchData({ lang: props.Lang, options: props.Options });

    // return：保留原本 DOM 結構
    return (
        <LoadingErrorHandler isLoading={getData.isLoading} errorList={getData.errorList}>
            <SpecUSRList
                lang={props.Lang}
                rawData={getData.rawData.listData}
                showColumnItems={getData.rawData.showColumnItems}
                showColTitle={getData.rawData.showColTitle}
            />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Private
/** 取得 detail 指定欄位值 */
const getDetailValue = (detail: SpecUSRDetail | undefined, key: ColKey): string =>
{
    const raw = detail?.[key as keyof SpecUSRDetail];
    return raw == null ? "" : String(raw);
};


/** 判斷值是否可顯示 */
const isNonEmpty = (v: string) =>
{
    return v.trim().length > 0;
};


const SpecUSRList = (p: { lang: string | Lang; rawData: SpecUSRSet[]; showColumnItems: string[]; showColTitle: ColumnConfig[]; }) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");

    // return：保留原本 DOM 結構
    return (
        <>
            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                <hr className="mt-1 mb-4" />
                <div className="articles_itemBoxs_2">
                    {p.rawData.map(item =>
                    {
                        const pageLink = `${dirUrl}/${item.SpecUSR?.InternalId}`;
                        const detail = item.SpecUSRDetail?.find(x => x.Lang?.toLowerCase() === p.lang.toLowerCase());
                        const picUrl = FileManagementAPI.get_Public_Preview_Url(item.SpecUSR?.PictureId) ?? DefaultPic;
                        let leaderRendered = false;

                        return (
                            <div key={item.SpecUSR?.InternalId ?? pageLink} className="articles_item col-12">
                                <article className="cardbox">
                                    <div className="card_content_2">
                                        <div className="leftBox d-flex">
                                            <figure className="card_figure w-100 h-100">
                                                <LangLink to={pageLink} className="card_image_link">
                                                    <picture className="w-100 h-100">
                                                        <img className="card_image" src={picUrl} alt={item.SpecUSR?.PicDescription ?? ""} />
                                                    </picture>
                                                </LangLink>
                                            </figure>
                                        </div>

                                        <div className="rightBox ml-xl-4 ml-lg-4 ml-0">
                                            <div className="card_titleDiv">
                                                <LangLink to={pageLink} className="card_title">{detail?.ProjectName}</LangLink>
                                            </div>

                                            <div className="card_catDiv">
                                                <div className="card_cat">
                                                    {COLS.map(col =>
                                                    {
                                                        if (LEADER_GROUP.includes(col))
                                                        {
                                                            if (leaderRendered) return null;
                                                            const enabledInGroup = LEADER_GROUP.filter(k => p.showColumnItems.includes(k));
                                                            if (enabledInGroup.length <= 0)
                                                            {
                                                                leaderRendered = true;
                                                                return null;
                                                            }
                                                            const chosenKey = enabledInGroup.find(k => isNonEmpty(getDetailValue(detail, k)));
                                                            if (!chosenKey)
                                                            {
                                                                leaderRendered = true;
                                                                return null;
                                                            }
                                                            const title = p.showColTitle.find((item) => item.key === chosenKey)?.title ?? "";
                                                            const data = getDetailValue(detail, chosenKey);
                                                            leaderRendered = true;
                                                            return (
                                                                <div key={`leader-${chosenKey}`} className="card_cat_link w-100">
                                                                    <span className="s-line">▍</span>
                                                                    <span className="s-tle">{title}：{data}</span>
                                                                </div>
                                                            );
                                                        }
                                                        if (!p.showColumnItems.includes(col)) return null;
                                                        const title = p.showColTitle.find((item) => item.key === col)?.title ?? "";
                                                        const data = getDetailValue(detail, col);
                                                        if (!isNonEmpty(data)) return null;
                                                        return (
                                                            <div key={col} className="card_cat_link w-100">
                                                                <span className="s-line">▍</span>
                                                                <span className="s-tle">{title}：{data}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="card_PDiv">
                                                <p className="p_txt">{detail?.ContentIntroduction}</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        );
                    })}
                </div>
                {/* <Paginator /> */}
            </div>
        </>
    );
};
// #endregion
