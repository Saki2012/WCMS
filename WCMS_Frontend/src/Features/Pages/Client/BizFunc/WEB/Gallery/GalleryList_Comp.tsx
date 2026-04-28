import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { type IGalleryListOptions, useGalleryListFetchData } from "./GalleryList_Loader";
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

const GalleryList = (props: IGalleryListProps) =>
{
    const galleryData = useGalleryListFetchData({ lang: props.lang, opts: props.options });

    const paginatorProps = useMemo<PaginatorProps>(() =>
    {
        return { currentPage: galleryData.pageNumber, totalPages: galleryData.totalPages, onPageChange: galleryData.onPageChange };
    }, [galleryData.pageNumber, galleryData.totalPages, galleryData.onPageChange]);

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        return { mode: "list" };
    }, []);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={""}
            isLoading={galleryData.isLoading}
            errorList={galleryData.errors}
            paginatorProps={paginatorProps}
            viewCountConfig={viewCountConfig}
        >
            <Gallery lang={props.lang} data={galleryData.list} categoryMap={galleryData.categoryMap} />
        </ModuleContent>
    );
};

export default GalleryList;

const Gallery = (props: { lang: Lang; data: GallerySet[]; categoryMap: Record<string, string>; }) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data.map((item, idx) =>
                {
                    const catId = item.Gallery?.Categories;
                    const title = item.GalleryInfo?.find((p) => p.Lang === props.lang)?.Title ?? "";
                    const coverPicDesc = item.GalleryPhotos?.find((p) => p.PicSrcId)?.GalleryPhotosInfo?.find((p) => p.Lang === props.lang)?.Title ?? title;

                    const coverPicUrl = FileManagementAPI.get_Public_Preview_Url(item.Gallery?.CoverPicSrcId, coverPicDesc);

                    const linkUrl = `${dirUrl}/${item.Gallery?.InternalId}`;

                    const categoryIds = (catId ?? "").split(",").map((s) => s.trim()).filter(Boolean);

                    const categories = categoryIds.map((id) => props.categoryMap[id] ?? "").filter((x): x is string => Boolean(x)).join("、");

                    const validateStart = FormatDate(item.Gallery?.Validate_Start);
                    const content = item.GalleryInfo?.find((p) => p.Lang === props.lang)?.Title ?? "";
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
                                            <i className="far fa-clock mr-2"></i>
                                            <span className="sr-only">日期</span>
                                            {validateStart}
                                        </div>
                                    </div>

                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                        <LangLink to={linkUrl} className="card_title">{content}</LangLink>
                                        <div className="d-flex gap-1 flex-wrap">
                                            {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                            {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                                        </div>
                                    </div>

                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <LangLink to={linkUrl} className="Btn_s1" type="button" role="button" title="觀看更多">
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangLink>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            <LangLink
                                                to={linkUrl}
                                                className="Btn_zm1 venobox"
                                                data-gall="myGallery"
                                                type="button"
                                                role="button"
                                                title="放大圖片"
                                            >
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </LangLink>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
            <hr className="hr-my-4" />
        </>
    );
};
