/**公告清單 */
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { Link, useLocation } from "react-router-dom";
import type { Lang } from "@/SysCore/i18n/lang";
import SpecUSRProvider from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import SpecCategoryProvider from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import DefaultPic from "@/SpecFetures/1810/Assets/Custom/images_960x960.jpg"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { SpecCategoryModelFields, SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from "@/types/SchemaFields";
import { LangLink } from "@/SysCore/i18n/LangLink";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
const useSpecUSRList = (categoryId: string, tagIds: string) => {
    var condition: string = "";
    condition = `${SpecUSRModelFields.CategoryId} = ${categoryId}`;
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.Tags} HasAllOf [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.ContentStatus} !& 4`)//不包含隱藏的資料

    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SpecUSRModelFields.InternalId,
                SpecUSRModelFields.USRId,
                SpecUSRModelFields.PictureId,
                SpecUSRModelFields.PicDescription,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectItem}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ExternalCooperationUnit}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Department}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.PlanAmount}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.DuringExecution}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectLeader}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectSubLeader}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Cohost1}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Cohost2}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Commissioned}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ContentIntroduction}`,
            ],
            Condition: condition,
            OrderBy: [
                { Col: `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`, Desc: true },
                { Col: `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`, Desc: true },
            ],
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};

export const useGetShowColumnItems = (categoryId: string) => {
    const provider = SpecCategoryProvider();
    return useFetchGridListData<SpecCategorySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SpecCategoryModelFields.InternalId,
                SpecCategoryModelFields.CategoryId,
                SpecCategoryModelFields.ProgId,
                SpecCategoryModelFields.ShowColumnItems,
            ],
            Condition: `${SpecCategoryModelFields.CategoryId} = ${categoryId}`,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [categoryId],
    });
}

export interface ISpecUSRListOptions { Category?: string; Tag?: string; }
interface ISpecUSRListProps { Theme: IFETheme; Lang: string | Lang; Options?: ISpecUSRListOptions; }

export const SpecUSRListComp = (props: ISpecUSRListProps) => {
    const useSpecUsrList = useSpecUSRList(props.Options?.Category ?? "", props.Options?.Tag ?? "");
    const useGetShowColumns = useGetShowColumnItems(props.Options?.Category ?? "");
    const showColumns = useGetShowColumns.rawData?.[0]?.SpecCategory?.ShowColumnItems?.split(',') as string[]

    const isLoading = [useSpecUsrList.isLoading, useGetShowColumns.isLoading];
    const errors = [useSpecUsrList.error, useGetShowColumns.error];
    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
            <SpecUSRList lang={props.Lang} rawData={useSpecUsrList.rawData} showColumnItems={showColumns} showColTitle={useSpecUsrList.gridProps.columns}></SpecUSRList>
        </LoadingErrorHandler>
    );
};


const SpecUSRList = ({
    lang, rawData, showColumnItems, showColTitle
}: { lang: string; rawData: SpecUSRSet[]; showColumnItems: string[]; showColTitle: ColumnConfig[] }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);

    // 欄位順序（含四個群組欄位）
    const cols = [
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
        SpecUSRDetailFields.Commissioned
    ] as const;

    // 群組與優先順序（只顯示一筆）
    const leaderGroup = [
        SpecUSRDetailFields.ProjectLeader,
        SpecUSRDetailFields.ProjectSubLeader,
        SpecUSRDetailFields.Cohost1,
        SpecUSRDetailFields.Cohost2,
    ] as const;

    const isNonEmpty = (v: unknown) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        return true; // number/boolean/其他型別直接視為有值
    };

    return (
        <>
            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                <hr className="mt-1 mb-4" />
                <div className="articles_itemBoxs_2">
                    {rawData.map((item) => {
                        const pageLink = `${dirUrl}/${item.SpecUSR?.InternalId}`;
                        const detail = item.SpecUSRDetail?.find(p => p.Lang.toLowerCase() === lang.toLowerCase());
                        const picUrl = item.SpecUSR?.PictureId ? `${FileManagementAPI.PREVIEW_URL}/${item.SpecUSR?.PictureId}` : DefaultPic;

                        // 這個 flag 讓同一筆 item 只渲染一次群組欄位
                        let leaderRendered = false;

                        return (
                            <div key={item.SpecUSR?.InternalId ?? Math.random()} className="articles_item col-12">
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
                                                    {cols.map((col) => {
                                                        // 若是群組欄位 → 只處理一次
                                                        if (leaderGroup.includes(col as any)) {
                                                            if (leaderRendered) return null;

                                                            // 只在「這組裡有被勾選」時才處理
                                                            const enabledInGroup = leaderGroup.filter(k => showColumnItems.includes(k));
                                                            if (enabledInGroup.length === 0) {
                                                                leaderRendered = true; // 沒勾選這組，視為整組跳過
                                                                return null;
                                                            }

                                                            // 依優先順序找第一個「同時被勾選 & 有值」的欄位
                                                            const chosenKey = leaderGroup.find(k => {
                                                                if (!enabledInGroup.includes(k)) return false;
                                                                const v = detail ? (detail as Record<string, any>)[k] : undefined;
                                                                return isNonEmpty(v);
                                                            });

                                                            if (!chosenKey) {
                                                                leaderRendered = true; // 全無值 → 整組不顯示
                                                                return null;
                                                            }

                                                            const title = showColTitle.find(p => p.key === chosenKey)?.title ?? "";
                                                            const data = detail ? (detail as Record<string, any>)[chosenKey] ?? "" : "";
                                                            leaderRendered = true;

                                                            return (
                                                                <div key={`leader-${chosenKey}`} className="card_cat_link w-100">
                                                                    <span className="s-line">▍</span>
                                                                    <span className="s-tle">{title}：{data}</span>
                                                                </div>
                                                            );
                                                        }

                                                        // 一般欄位：需被勾選才顯示
                                                        if (!showColumnItems.includes(col)) return null;

                                                        const title = showColTitle.find(p => p.key === col)?.title ?? "";
                                                        const data = detail ? (detail as Record<string, any>)[col] ?? "" : "";
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