import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { components as apiComponents } from "@/types/api";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import type { SpecMusicalListLoaderData } from "./SpecMusicalList_Loader";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

export interface ISpecMusicalOptions
{
    Category?: string;
}

const SpecMusicalList = (props: { options?: ISpecMusicalOptions; site: INormSite; node: INormNode; }) =>
{
    // 宣告變數
    const loaderData = useLoaderData() as SpecMusicalListLoaderData | null;
    const pageSize = 9;

    const adapter = useMemo(() => SpecMusicalAdapter(), []);

    // 執行 function：list/count（SSR initial → CSR 接手）
    const useList = useSpecMusicalList(adapter, props.options?.Category ?? "", pageSize, loaderData);

    const errorList = [useList.error];

    const paginprops: PaginatorProps = { currentPage: useList.pageNumber, totalPages: useList.totalPages, onPageChange: useList.onPageChange };
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    // return（DOM 不改）
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            isLoading={useList.isLoading}
            errorList={errorList}
            paginatorProps={paginprops}
            viewCountConfig={viewCountConfig}
        >
            <GridList_Comp title={""} data={useList.rawData} />
        </ModuleContent>
    );
};
export default SpecMusicalList;

const GridList_Comp = (props: { title: string; data: SpecMusicalSet[]; }) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <div id="Row_Colitem" className="SubPage_Musical_Instrument_itemBoxs">
            {props.data.map((item) =>
            {
                const internalId = item.SpecMusical?.InternalId;
                const picSrc = FileManagementAPI.get_Public_Preview_Url(item.SpecMusical?.CoverPicId);
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
                );
            })}
        </div>
    );
};

const useSpecMusicalList = (
    adapter: ReturnType<typeof SpecMusicalAdapter>,
    categoryIds: string,
    pageSize: number,
    loaderData: SpecMusicalListLoaderData | null,
) =>
{
    // 宣告變數：baseParam 以 loader 為主，確保 SSR/CSR 一致
    const baseParam = useMemo(() =>
    {
        if (!loaderData?.args?.baseParam)
        {
            return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize } as apiComponents["schemas"]["QueryListParam"];
        }
        if (loaderData.args.categoryIds !== categoryIds)
        {
            return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize } as apiComponents["schemas"]["QueryListParam"];
        }
        if (loaderData.args.pageSize !== pageSize)
        {
            return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize } as apiComponents["schemas"]["QueryListParam"];
        }
        return loaderData.args.baseParam;
    }, [loaderData, categoryIds, pageSize]);

    const initialCount = useMemo<ApiLoaderData<apiComponents["schemas"]["QueryListParam"], number> | null>(() =>
    {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return { args: loaderData.args.baseParam, apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] } };
    }, [loaderData, categoryIds, pageSize]);

    const initialList = useMemo<ApiLoaderData<apiComponents["schemas"]["QueryListParam"], SpecMusicalSet[]> | null>(() =>
    {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return { args: loaderData.args.baseParam, apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] } };
    }, [loaderData, categoryIds, pageSize]);

    // 執行 function：count/list（SSR initial → CSR 接手）
    const useCount = adapter.hooks.useQueryCount({ condition: baseParam, initial: initialCount, deps: [categoryIds, pageSize] });

    const useList = adapter.hooks.usePagedQueryList({ baseParam, count: useCount.data ?? 0, initial: initialList, deps: [categoryIds, pageSize] });

    // return
    return {
        rawData: useList.data ?? [],
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
        pageNumber: useList.pageNumber,
        totalPages: useList.totalPages,
        onPageChange: useList.onPageChange,
    };
};
