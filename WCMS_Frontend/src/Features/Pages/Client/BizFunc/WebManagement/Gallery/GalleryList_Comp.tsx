import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useLocation } from "react-router";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { useMemo } from "react";
import type { components } from "@/types/api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangLink } from "@/SysCore/i18n/LangLink";

// ✅ 新架構：Adapter + LoaderData initial
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import type { GalleryListLoaderData } from "./GalleryList_Hook";

type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

export interface IGalleryListOptions { Title: string; Category?: string; Tag?: string; Style: number; }
export interface IGalleryListProps { node: INormNode; theme: IFETheme; lang: Lang; options?: IGalleryListOptions; title: string }

const GalleryList = (props: IGalleryListProps) => {
    // 宣告變數
    const loaderData = useLoaderData() as GalleryListLoaderData | null;

    const adapter = useMemo(() => {
        return {
            gallery: GalleryAdapter(),
            category: CategoryAdapter(),
        };
    }, []);

    const categoryIds = props.options?.Category ?? "";
    const tagIds = props.options?.Tag ?? "";

    const useListData = useGalleryList(adapter.gallery, props.lang, categoryIds, tagIds, loaderData);
    const useCategoryList = useCategory(adapter.category, props.lang, loaderData);

    const loadingList = [useListData.isLoading, useCategoryList.isLoading];
    const errorList = [useListData.error, useCategoryList.errorText];

    const paginprops: PaginatorProps =
    {
        currentPage: useListData.pageNumber,
        totalPages: useListData.totalPages,
        onPageChange: useListData.onPageChange,
    };

    const children = useMemo(() => {
        return <Gallery key="grid" lang={props.lang} data={useListData.data} cateData={useCategoryList.data} />;
    }, [useListData.data, props.lang, props.options, useCategoryList.data]);

    // return（不改 div 結構）
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} isLoading={loadingList.some(Boolean)} errorList={errorList} paginatorProps={paginprops}>
            {children}
        </ModuleContent>
    );
};

export default GalleryList;

// ✅ categories：固定條件已由 loader 做，CSR 用 initial 接手
const useCategory = (adapter: ReturnType<typeof CategoryAdapter>, lang: Lang, loaderData: GalleryListLoaderData | null) => {
    // 宣告變數
    const cateParam = loaderData?.args?.cateParam ?? { Fields: [], Condition: "1=0", PageNumber: 0, PageSize: 0 };

    const initial = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], CategorySet[]> | null>(() => {
        if (!loaderData?.args?.cateParam) return null;

        return {
            args: loaderData.args.cateParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.cateRes ?? [], SysMessage: [] },
        };
    }, [loaderData]);

    // 執行 function
    const hook = adapter.hooks.useQueryList({
        condition: cateParam,
        initial,
        deps: [lang],
    });

    // return
    return {
        data: hook.data ?? [],
        isLoading: hook.isLoading,
        errorText: hook.errorText,
    };
};

// ✅ gallery list/count：固定條件已由 loader 做，CSR 用 initial 接手 + 分頁互動
const useGalleryList = (
    adapter: ReturnType<typeof GalleryAdapter>,
    lang: Lang,
    categoryIds: string,
    tagIds: string,
    loaderData: GalleryListLoaderData | null,
) => {
    // 宣告變數：baseParam 優先使用 loader 的（SSR 首屏一致）
    const baseParam = useMemo(() => {
        if (loaderData?.args?.lang === lang && loaderData?.args?.categoryIds === categoryIds && loaderData?.args?.tagIds === tagIds)
            return loaderData.args.baseParam;

        // 若 CSR 條件和 SSR 不一致，先回空，讓 hook 自己重撈（避免錯用 initial）
        return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 12 } as components["schemas"]["QueryListParam"];
    }, [loaderData, lang, categoryIds, tagIds]);

    const initialCount = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], number> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        // 確保 initial 的條件與目前一致，才使用
        if (loaderData.args.lang !== lang) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.tagIds !== tagIds) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] },
        };
    }, [loaderData, lang, categoryIds, tagIds]);

    const initialList = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], GallerySet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        if (loaderData.args.lang !== lang) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.tagIds !== tagIds) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData, lang, categoryIds, tagIds]);

    // 執行 function：count
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [lang, categoryIds, tagIds],
    });

    // 執行 function：paged list
    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [lang, categoryIds, tagIds],
    });

    // return
    return {
        data: useList.data ?? [],
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
        pageNumber: useList.pageNumber,
        totalPages: useList.totalPages,
        onPageChange: useList.onPageChange,
    };
};

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
                    const contentStatus = item.Gallery?.ContentStatus ?? 0;
                    return (
                        <div key={idx} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">

                                    <figure className="figure_Box">
                                        <LangLink to={linkUrl} className="card_image_link venobox" data-gall="myGallery" title={title}>
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={coverPicUrl} alt={coverPicDesc} />
                                                </div>
                                            </div>
                                        </LangLink>
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
                                        <LangLink to={linkUrl} className="card_title">
                                            {content}
                                        </LangLink>
                                        <div className="d-flex gap-1 flex-wrap">
                                            {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                                            {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
                                        </div>
                                    </div>

                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <LangLink to={linkUrl} className="Btn_s1" type="button" role="button" title="觀看更多">
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangLink>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            <LangLink to={linkUrl} className="Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </LangLink>
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
};
