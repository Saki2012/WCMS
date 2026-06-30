import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import { formatDate, splitTrimToArray } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { type IGalleryListOptions, useGalleryListData } from "./Client_Gallery_List_Loader";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];
export interface IGalleryListProps
{
    site: INormSite;
    node: INormNode;
    theme: IFETheme;
    lang: Lang;
    options?: IGalleryListOptions;
    title: string;
}
type GalleryListVm = ReturnType<typeof useGalleryListData>;

export interface GalleryListViewProps extends IGalleryListProps
{
    /** Feature List Hook 整理後的相簿清單資料。 */
    vm: GalleryListVm;
    /** 目前列表基準路徑，供明細連結使用。 */
    dirUrl: string;
}

interface GalleryCardViewModel
{
    title: string;
    content: string;
    coverPicDesc: string;
    coverPicUrl: string;
    linkUrl: string;
    categories: string;
    validateStart: string;
    contentStatus: number;
}
// #endregion

// #region Variable
/** Gallery List View 快取，避免每次 render 重複解析 Spec View。 */
let galleryListViewCache: typeof Client_Gallery_List_FeatureView | null = null;
// #endregion

// #region Public
/** 相簿清單完整 Comp，負責取得 Feature Hook 資料，再交給 List Entry。 */
export const Client_Gallery_List_Comp = (props: IGalleryListProps) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const vm = useGalleryListData({ lang: props.lang, opts: props.options });
    return <Client_Gallery_List {...props} vm={vm} dirUrl={dirUrl} />;
};

/** 相簿清單 ListView Entry，正式前台統一從這裡進入 Spec / Feature DOM。 */
export const Client_Gallery_List = (props: GalleryListViewProps) =>
{
    const ListView = getGalleryListView();
    return <ListView {...props} />;
};

/** 相簿清單 Feature 預設 View，只負責輸出 DOM。 */
const Client_Gallery_List_FeatureView = (props: GalleryListViewProps) =>
{
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => ({ mode: "list" }), []);
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} isLoading={props.vm.isLoading} errorList={props.vm.errorList} searchBar={props.vm.searchBar} paginatorProps={props.vm.paginatorProps} viewCountConfig={viewCountConfig}>
            <GallerySection lang={props.lang} data={props.vm.list} categoryMap={props.vm.categoryMap} dirUrl={props.dirUrl} />
        </ModuleContent>
    );
};
// #endregion

// #region Section
const GallerySection = (props: { lang: Lang; data: GallerySet[]; categoryMap: Record<string, string>; dirUrl: string; }) =>
{
    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data.map((item, idx) => <GalleryCard key={item.Gallery?.InternalId ?? idx} lang={props.lang} item={item} categoryMap={props.categoryMap} dirUrl={props.dirUrl} />)}
            </div>
            <hr className="hr-my-4" />
        </>
    );
};
// #endregion

// #region EntityComp
const GalleryCard = (props: { lang: Lang; item: GallerySet; categoryMap: Record<string, string>; dirUrl: string; }) =>
{
    const itemVm = buildGalleryCardViewModel(props);
    return (
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 Standard_ItemDiv">
            <article className="cardbox">
                <div className="card_content">
                    <figure className="figure_Box">
                        <LangLink to={itemVm.linkUrl} className="card_image_link venobox" data-gall="myGallery" title={itemVm.title}>
                            <div className="card_figure">
                                <div className="img-wrapper">
                                    <img className="card_image" src={itemVm.coverPicUrl} alt={itemVm.coverPicDesc} />
                                </div>
                            </div>
                        </LangLink>
                    </figure>
                    <div className="card_catDiv">
                        <div className="card_cat">
                            <div className="card_cat_link">
                                <span className="s-line">▍</span>
                                <span className="s-tle">{itemVm.categories}</span>
                            </div>
                        </div>
                        <div className="card_time">
                            <i className="far fa-clock mr-2"></i>
                            <span className="sr-only">日期</span>
                            {itemVm.validateStart}
                        </div>
                    </div>
                    <div className="card_titleDiv mb-md-4 mb-sm-3 mb-2">
                        <LangLink to={itemVm.linkUrl} className="card_title">{itemVm.content}</LangLink>
                        <GalleryStatusLabels contentStatus={itemVm.contentStatus} />
                    </div>
                    <div className="card_StateDiv">
                        <div className="More customize_btn">
                            <LangLink to={itemVm.linkUrl} className="Btn_s1" type="button" role="button" title="觀看更多">
                                VIEW ALL<span className="ml-2">+</span>
                            </LangLink>
                        </div>
                        <div className="ZoomIn customize_ZoomIn_btn">
                            <LangLink to={itemVm.linkUrl} className="Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="觀看相簿圖片">
                                <i className="fas fa-expand-alt"></i>
                                <span className="sr-only">觀看相簿圖片</span>
                            </LangLink>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
};
const GalleryStatusLabels = (props: { contentStatus: number; }) =>
{
    return (
        <div className="d-flex gap-1 flex-wrap">
            {Boolean(props.contentStatus & 1) && <span className="label label-success">置頂</span>}
            {Boolean(props.contentStatus & 2) && <span className="label label-danger">熱門</span>}
        </div>
    );
};
// #endregion

// #region Protected
/** 取得 Gallery List View，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getGalleryListView = (): typeof Client_Gallery_List_FeatureView =>
{
    if (galleryListViewCache !== null)
    {
        return galleryListViewCache;
    }

    galleryListViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_Gallery_List_Comp"),
        Client_Gallery_List_FeatureView,
        ["Client_Gallery_List"],
    );

    return galleryListViewCache;
};
// #endregion

// #region Private
/** 建立 Gallery 卡片畫面資料 */
const buildGalleryCardViewModel = (p: { lang: Lang; item: GallerySet; categoryMap: Record<string, string>; dirUrl: string; }): GalleryCardViewModel =>
{
    const title = p.item.GalleryInfo?.find(item => item.Lang === p.lang)?.Title ?? "";
    const coverPicDesc = p.item.GalleryPhotos?.find(item => item.PicSrcId)?.GalleryPhotosInfo?.find(item => item.Lang === p.lang)?.Title ?? title;
    const coverPicUrl = FileManagementAPI.get_Public_Preview_Url(p.item.Gallery?.CoverPicSrcId, coverPicDesc);
    const linkUrl = `${p.dirUrl}/${p.item.Gallery?.InternalId}`;
    const categories = buildGalleryCategoryText(p.item.Gallery?.Categories, p.categoryMap);
    const validateStart = formatDate(p.item.Gallery?.Validate_Start);
    const contentStatus = p.item.Gallery?.ContentStatus ?? 0;
    return { title, content: title, coverPicDesc, coverPicUrl, linkUrl, categories, validateStart, contentStatus };
};
/** 建立分類顯示文字 */
const buildGalleryCategoryText = (categoryValue: string | null | undefined, categoryMap: Record<string, string>): string =>
{
    const categoryIds = splitTrimToArray(categoryValue);
    const categories = categoryIds.map(id => categoryMap[id] ?? "").filter((item): item is string => Boolean(item));
    return categories.join("、");
};
// #endregion
