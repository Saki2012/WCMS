/**公告清單 */
import type { components } from "../../../../types/api";
import type { IFETheme } from "../../../../Features/Client/Layout/Theme/ITheme";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
import { Link, useLocation } from "react-router-dom";
import type { Lang } from "../../../../SysCore/i18n/lang";
import * as SchemaFields from "../../../../types/SchemaFields"
import SpecUSRProvider from "../../Server/BizFunc/SpecUSR/SpecUSR_Api";
import { useFetchGridListData } from "../../../../SysCore/Utils/API/FetchGridListData";
import type { ColumnConfig } from "../../../../SysCore/Components/Grid/Grid_Data";
import LoadingErrorHandler from "../../../../SysCore/Components/LoadingErrorHandler";
import SpecCategoryProvider from "../../Server/BizFunc/SpecCategory/SpecCategory_Api";


const useSpecUSRList = (categoryId: string, tagIds: string) => {
    var condition: string = "";
    condition = `${SchemaFields.SpecUSRModelFields.CategoryId} = ${categoryId}`;
    // if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} In (${tagIds})`)
    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Year],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ExternalCooperationUnit],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Department],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.PlanAmount],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.DuringExecution],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectLeader],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost1],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost2],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Commissioned],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.SpecUSRModelFields.InternalId,
                SchemaFields.SpecUSRModelFields.USRId,
                SchemaFields.SpecUSRModelFields.PictureId,
                SchemaFields.SpecUSRModelFields.PicDescription,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Lang}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Year}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ProjectName}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ExternalCooperationUnit}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Department}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.PlanAmount}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.DuringExecution}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ProjectLeader}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Cohost1}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Cohost2}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.Commissioned}`,
                `${SchemaFields.SpecUSRSetFields.SpecUSRDetail}.${SchemaFields.SpecUSRDetailFields.ProjectConcept}`,
            ],
            Condition: condition,
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
                SchemaFields.SpecCategoryModelFields.InternalId,
                SchemaFields.SpecCategoryModelFields.CategoryId,
                SchemaFields.SpecCategoryModelFields.ProgId,
                SchemaFields.SpecCategoryModelFields.ShowColumnItems,
            ],
            Condition: `${SchemaFields.SpecCategoryModelFields.CategoryId} = ${categoryId}`,
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
    const cols = ["Year", "ExternalCooperationUnit", "Department", "PlanAmount", "DuringExecution", "ProjectLeader", "Cohost1", "Cohost2", "Commissioned"]
    return (
        <>
            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 px-0">
                <hr className="mt-1 mb-4" />
                <div className="articles_itemBoxs_2">

                    {rawData.map((item) => {
                        const pageLink = `${dirUrl}/${item.SpecUSR?.InternalId}`;
                        const detail = item.SpecUSRDetail?.find(p => p.Lang.toLocaleLowerCase() === lang.toLocaleLowerCase());
                        return (
                            <div className="articles_item col-12">
                                <article className="cardbox">
                                    <div className="card_content_2">
                                        <div className="leftBox">
                                            <figure className="card_figure">
                                                <Link to={pageLink} className="card_image_link">
                                                    <picture> <img className="card_image" src={`/Service/FileManagement/Preview/${item.SpecUSR?.PictureId}`} alt={item.SpecUSR?.PicDescription ?? ""} /> </picture>
                                                </Link>
                                            </figure>
                                        </div>
                                        <div className="rightBox ml-xl-5 ml-lg-5 ml-0">
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
                                                <p className="p_txt">{detail?.ProjectConcept}</p>
                                            </div>
                                            <div className="col-12 text-right p-0">
                                                <div className="customize_btn mt-2"> <Link to={pageLink} className="Btn_s1" tabIndex={1} title="E">VIEW ALL<span className="ml-2">+</span></Link></div>
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