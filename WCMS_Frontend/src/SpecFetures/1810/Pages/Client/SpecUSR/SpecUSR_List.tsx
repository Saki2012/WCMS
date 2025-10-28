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
import DefaultPic from "@/Assets/1810/images_960x960.jpg"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { SpecCategoryModelFields, SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from "@/types/SchemaFields";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
const useSpecUSRList = (categoryId: string, tagIds: string) => {
    var condition: string = "";
    condition = `${SpecUSRModelFields.CategoryId} = ${categoryId}`;
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.Tags} HasAllOf (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${SpecUSRModelFields.ContentStatus} !& 4`)//不包含隱藏的資料

    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
        ],
        buildQueryCondition: (page) => ({
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
            PageNumber: page,
            PageSize: 10,
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


const SpecUSRList = ({ lang, rawData, showColumnItems, showColTitle }: { lang: string; rawData: SpecUSRSet[]; showColumnItems: string[]; showColTitle: ColumnConfig[] }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const cols = [SpecUSRDetailFields.Year, SpecUSRDetailFields.ProjectLeader, SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department, SpecUSRDetailFields.ProjectItem, SpecUSRDetailFields.PlanAmount,
    SpecUSRDetailFields.DuringExecution, SpecUSRDetailFields.Cohost1, SpecUSRDetailFields.Cohost2, SpecUSRDetailFields.Commissioned]
    return (
        <>
            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                <hr className="mt-1 mb-4" />
                <div className="articles_itemBoxs_2">
                    {rawData.map((item) => {
                        const pageLink = `${dirUrl}/${item.SpecUSR?.InternalId}`;
                        const detail = item.SpecUSRDetail?.find(p => p.Lang.toLocaleLowerCase() === lang.toLocaleLowerCase());
                        const picUrl = item.SpecUSR?.PictureId ? `${FileManagementAPI.PREVIEW_URL}/${item.SpecUSR?.PictureId}` : DefaultPic
                        return (
                            <div className="articles_item col-12">
                                <article className="cardbox">
                                    <div className="card_content_2">
                                        <div className="leftBox d-flex">
                                            <figure className="card_figure w-100 h-100">
                                                <Link to={pageLink} className="card_image_link">
                                                    <picture className="w-100 h-100"> <img className="card_image" src={picUrl} alt={item.SpecUSR?.PicDescription ?? ""} /> </picture>
                                                </Link>
                                            </figure>
                                        </div>
                                        <div className="rightBox ml-xl-4 ml-lg-4 ml-0">
                                            <div className="card_titleDiv"> <Link to={pageLink} className="card_title">{detail?.ProjectName}</Link> </div>
                                            <div className="card_catDiv">
                                                <div className="card_cat">
                                                    {/* const colTitle = useSpecUsrList.gridProps.columns.find(p => p.key === "Year")?.title; */}
                                                    {cols.map((col) => {
                                                        const title = showColTitle.find(p => p.key === col)?.title ?? ""
                                                        const data = detail ? (detail as Record<string, any>)[col] ?? "" : "";
                                                        return (showColumnItems.includes(col) &&
                                                            <div className="card_cat_link w-100">
                                                                <span className="s-line">▍</span>
                                                                <span className="s-tle">{title}：{data}</span>
                                                            </div>)
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

                        )
                    })}
                </div>
                {/* <Paginator></Paginator> */}
            </div>
        </>
    )

}