import { Link, useLocation } from "react-router-dom";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { useMemo } from "react";
import type { components } from "@/types/api";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import SpecMusicalProvider from "@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { SpecMusicalModelFields } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LangLink } from "@/SysCore/i18n/LangLink";
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"]

export interface ISpecMusicalOptions { Category?: string; }
export interface ISpecMusicalProps { options?: ISpecMusicalOptions; node: INormNode }
const SpecMusicalList = (props: ISpecMusicalProps) => {
    const pageSize = 9;
    const pvdr = useMemo(() => { return SpecMusicalProvider() }, [])
    const useList = dataFetch(pvdr, props.options?.Category ?? "", pageSize);
    const loadingList = [useList.isLoading];
    const errorList = [useList.error];
    const paginprops: PaginatorProps = { currentPage: useList.gridProps.CurrentPage, totalPages: useList.gridProps.TotalPage, onPageChange: useList.gridProps.onPageChange };
    return (
        <ModuleContent nodeTitle={props.node.title} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops}>
            <GridList_Comp title={""} data={useList.rawData} />
        </ModuleContent>
    )
};
export default SpecMusicalList

const GridList_Comp = (props: { title: string; data: SpecMusicalSet[] }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <div id="Row_Colitem" className="SubPage_Musical_Instrument_itemBoxs">
            {props.data.map((item) => {
                const internalId = item.SpecMusical?.InternalId;
                const picSrc = `${FileManagementAPI.PREVIEW_URL}/${item.SpecMusical?.CoverPicId}`;
                const title = item.SpecMusical?.MusicalName ?? "";
                const href = `${dirUrl}/${internalId}`;
                return (
                    <div key={internalId} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-6 + Standard_ItemDiv">
                        <article className="cardbox">
                            <div className="card_content">
                                <LangLink to={href} className="card_image_link" title={title}>
                                    <figure className="figure_Box">
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={picSrc} alt={title} />
                                            </div>
                                        </div>
                                    </figure>
                                    <div className="card_titleDiv + my-4">
                                        <span className="card_title">{title}</span>
                                    </div>
                                    <div className="card_StateDiv + justify-content-center">
                                        <div className="More customize_btn mb-3">
                                            <LangLink to={href} className="Btn_s1" type="button" role="button" title="觀看更多">
                                                VIEW ALL
                                                <span className="ml-2">+</span>
                                            </LangLink>
                                        </div>
                                    </div>
                                </LangLink>
                            </div>
                        </article>
                    </div>
                )
            })}
        </div>
    )
}

const dataFetch = (pvdr: IDataProvider<SpecMusicalSet>, categoryIds: string, pageSize: number) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SpecMusicalModelFields.CategoryId} HasAny [${categoryIds}]`)
    return useFetchGridListData<SpecMusicalSet>({
        getModelDisplayName: () => pvdr.getModelDisplayName(),
        fetchList: (cond) => pvdr.fetchList(cond),
        fetchListCount: (cond) => pvdr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecMusicalModelFields.MusicalName,
                SpecMusicalModelFields.CoverPicId,
                SpecMusicalModelFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: pageSize,
        }),
        enabled: true,
        deps: [categoryIds, condition, pageSize],
    });
};