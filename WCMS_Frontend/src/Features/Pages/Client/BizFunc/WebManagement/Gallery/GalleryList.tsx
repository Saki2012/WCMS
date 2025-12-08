import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useLocation } from "react-router";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { ProgId } from "@/Features/Hooks/Common/ProgId";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { GalleryFields, GalleryInfoFields, GallerySetFields } from "@/types/SchemaFields";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { useMemo } from "react";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import type { components } from "@/types/api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Link } from "react-router-dom";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";

type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

export interface IGalleryListOptions { Title: string, Category?: string; Tag?: string; Style: number; }
export interface IGalleryListProps { node: INormNode; theme: IFETheme; lang: Lang; options?: IGalleryListOptions; title: string }
const GalleryList = (props: IGalleryListProps) => {
    // <Gallery {...props} />
    const useCategoryList = useCategoryListData(ProgId.Gallery, props.lang)
    const provider = useMemo(() => { return GalleryProvider() }, [])
    const useListData = useGalleryList(provider, props.lang, props.options?.Category ?? "", props.options?.Tag ?? "");
    const loadingList = [useListData.isLoading, useCategoryList.isLoading, useCategoryList.isLoading];
    const errorList = [useListData.error, useCategoryList.error, useCategoryList.error];
    const paginprops: PaginatorProps = { currentPage: useListData.gridProps.CurrentPage, totalPages: useListData.gridProps.TotalPage, onPageChange: useListData.gridProps.onPageChange };
    const children = useMemo(() => { return <Gallery key="grid" lang={props.lang} data={useListData.rawData} cateData={useCategoryList.rawData} />; }, [useListData.rawData, props.lang, props.options, useCategoryList.rawData]);

    return (
        <ModuleContent nodeTitle={props.node.title} title={""} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops}>
            {children}
        </ModuleContent>
    )
};
export default GalleryList

const Gallery = (props: { lang: Lang; data: GallerySet[]; cateData: CategorySet[] }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data.map((item, idx) => {
                    const catId = item.Gallery?.Categories;
                    const title = item.GalleryInfo?.find(p => p.Lang === props.lang)?.Title ?? ""
                    const coverPicUrl = `${FileManagementAPI.PREVIEW_URL}/${item.Gallery?.CoverPicSrcId}`
                    const coverPicDesc = item.GalleryPhotos?.find(p => p.PicSrcId)?.GalleryPhotosInfo?.find(p => p.Lang === props.lang)?.Title ?? title
                    const linkUrl = `${dirUrl}/${item.Gallery?.InternalId}`
                    const categorys = (catId ?? "").split(",").map(s => s.trim()).filter(Boolean);
                    const categories = categorys.map(catId => props.cateData?.find(s => String(s.Category?.CategoryId) === catId)?.CategoryDetail?.find(d => d.Lang === props.lang)?.CategoryName).filter((x): x is string => !!x).join("、");
                    const validate_Start = FormatDate(item.Gallery?.Validate_Start)
                    const content = item.GalleryInfo?.find(p => p.Lang === props.lang)?.Title ?? ""
                    return (
                        <div key={idx} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">

                                    <figure className="figure_Box">
                                        <Link to={linkUrl} className="card_image_link venobox" data-gall="myGallery" title={title}>
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={coverPicUrl} alt={coverPicDesc} />
                                                </div>
                                            </div>
                                        </Link>
                                    </figure>

                                    <div className="card_catDiv">
                                        <div className="card_cat">
                                            <div className="card_cat_link">
                                                <span className="s-line">▍</span>
                                                <span className="s-tle">{categories}</span>
                                            </div>
                                        </div>
                                        <div className="card_time">
                                            <i className="far fa-clock mr-2"></i><span className="sr-only">日期</span>{validate_Start}
                                        </div>
                                    </div>

                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                        <Link to={linkUrl} className="card_title">
                                            {content}
                                        </Link>
                                    </div>

                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <a href="javascript:void(0);" className="Btn_s1" type="button" role="button" title="觀看更多">VIEW ALL<span className="ml-2">+</span></a>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            <a href="images/media_reports/images_960x960.jpg" className="Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )
                })}
            </div>
            <hr className="hr-my-4" />
        </>
    )
}




const useGalleryList = (provider: IDataProvider<GallerySet>, lang: string, categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Categories} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Tags} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${GalleryFields.ContentStatus} !& 4`)//不包含隱藏的資料
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
