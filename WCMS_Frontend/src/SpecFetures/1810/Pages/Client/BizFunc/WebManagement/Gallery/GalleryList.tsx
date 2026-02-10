import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
import type { GridProps, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { GalleryFields, GallerySetFields, GalleryInfoFields, PGID } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { useLocation } from "react-router";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Paginator } from "@/SysCore/Components/Paginator/Paginator_Comp";
import type { IGalleryListProps } from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList";
import { LangLink } from "@/SysCore/i18n/LangLink";

const useGalleryList = (lang: string, categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Categories} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Tags} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${GalleryFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [GallerySetFields.Gallery, GalleryFields.InternalId],
            [GallerySetFields.Gallery, GalleryFields.Categories],
            [GallerySetFields.Gallery, GalleryFields.CoverPicSrcId],
            [GallerySetFields.Gallery, GalleryFields.CreateTime],
            [GallerySetFields.Gallery, GalleryFields.Validate_Start],
            [GallerySetFields.GalleryInfo, GalleryInfoFields.Lang],
            [GallerySetFields.GalleryInfo, GalleryInfoFields.Title],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                GalleryFields.InternalId,
                GalleryFields.Categories,
                GalleryFields.CoverPicSrcId,
                GalleryFields.CreateTime,
                GalleryFields.Validate_Start,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
            ],
            Condition: condition,
            RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: GalleryFields.Validate_Start, Desc: true }, { Col: GalleryFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const data = item.Gallery ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";

                switch (col.key) {
                    case GalleryInfoFields.Title:
                        // content = data?.find(d => d.Lang === lang)?.Title ?? "";
                        break;
                    case GalleryFields.CreateTime:
                    case GalleryFields.ModifyTime:
                    case GalleryFields.Validate_Start:
                        content = FormatDate((data as any)[col.key]);
                        break;
                    default:
                        content = (data as any)[col.key] ?? "";
                        break;
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, categoryIds, tagIds],
    });
};

const GalleryListComp = (props: IGalleryListProps) => {
    const useCategoryList = useCategoryListData(PGID.Gallery, props.lang)
    const useListData = useGalleryList(props.lang, props.options?.Category ?? "", props.options?.Tag ?? "");
    const isLoading = [useListData.isLoading, useCategoryList.isLoading, useCategoryList.isLoading];
    const errors = [useListData.error, useCategoryList.error, useCategoryList.error];
    const CompProps: MainGridContentProp[] = GetGridViewContentProps(props.lang, useListData.rawData, useCategoryList.rawData)
    return <GalleryViewComp Title={props.title} MainContentProps={CompProps} gridProps={useListData.gridProps} Theme={props.theme} LoadingList={isLoading} ErrorList={errors} />;
};

export default GalleryListComp

const GetGridViewContentProps = (lang: string, rawData: GallerySet[], categoryList: CategorySet[]): MainGridContentProp[] => {
    if (!rawData) return [];
    let result: MainGridContentProp[] = [];
    rawData.map(item => {
        const gly = item.Gallery;
        const galleryId = gly?.InternalId ?? "";
        const title = item.GalleryInfo?.find(p => p?.Lang?.toLocaleLowerCase() === lang.toLocaleLowerCase())?.Title ?? "未命名";
        const coverPic = gly?.CoverPicSrcId ?? "";
        const categorys = (gly?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const categories = categorys.map(catId => categoryList?.find(s => String(s.Category?.CategoryId) === catId)?.CategoryDetail?.find(d => d.Lang === lang)?.CategoryName).filter((x): x is string => !!x).join("、");
        const validate_Start = FormatDate(gly?.Validate_Start) ?? "";
        result.push({
            galleryInternalId: galleryId,
            Title: title,
            CoverPicInternlId: coverPic,
            CategoryNames: categories,
            Validate_StartDate: validate_Start,
        });
    });
    return result;
};




export interface GridViewContentProps {
    Title: string,
    MainContentProps: MainGridContentProp[],
    gridProps: GridProps,
    // PaginatorProp: PaginatorProps,
    LoadingList: boolean[],
    ErrorList: (string | null | undefined)[],
    Theme: IFETheme

}

const GalleryViewComp = (prop: GridViewContentProps) => {
    return (
        <>
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <div className="row"><div className="page-header"><h3>{prop.Title}</h3></div></div>
                <hr className="hr-Css" />
                <MainContent props={prop.MainContentProps} gridProps={prop.gridProps} theme={prop.Theme} />
            </LoadingErrorHandler>
        </>
    );
}

export interface MainGridContentProp {
    galleryInternalId: string;
    Title: string;
    CoverPicInternlId: string;
    CategoryNames: string;
    Validate_StartDate: string;
}

const MainContent = ({ props, gridProps, theme }: { props: MainGridContentProp[]; gridProps: GridProps; theme: IFETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <>
            <div className="row margin_0">
                {props.map((prop, idx) => (
                    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <LangLink key={idx} to={`${dirUrl}/${prop.galleryInternalId}`} title={prop.Title}>
                            <div className="img-box">
                                <img className="img-fluid" src={`${FileManagementAPI.PREVIEW_URL}/${prop.CoverPicInternlId}`} alt={prop.Title} />
                            </div>
                            <figcaption>
                                <div className="category_box">
                                    <div className="m-news_category">
                                        <i className="fa fa-bookmark" aria-hidden="true">
                                        </i>
                                        <div className="tags-text">{prop.CategoryNames}</div>
                                    </div>
                                </div>
                                <h3 className="title mt-0 mb-0">{prop.Title}</h3>
                                <div className="category_box">
                                    <div className="m-date_category mt-2">
                                        <i className="fa fa-clock-o" aria-hidden="true"></i>
                                        <div className="tags-text">{prop.Validate_StartDate}</div>
                                    </div>
                                </div>
                            </figcaption>
                        </LangLink>
                    </div>
                ))}
            </div>
            {!(gridProps.CurrentPage === 1 && gridProps.TotalPage === 1) &&
                (<Paginator currentPage={gridProps.CurrentPage} totalPages={gridProps.TotalPage} onPageChange={gridProps.onPageChange} style={theme.Paginator} ></Paginator>)}
        </>
    )
}
