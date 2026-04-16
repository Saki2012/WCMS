import type { IGalleryListProps } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryList_Comp";
import { useGalleryListFetchData } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryList_Loader";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { Paginator } from "@/SysCore/Components/Paginator/Paginator_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { useLocation } from "react-router";

type GallerySet = components["schemas"]["GallerySet_DTO"];

interface GalleryPageProps
{
    CurrentPage: number;
    TotalPage: number;
    onPageChange: (page: number) => void;
}

export interface MainGridContentProp
{
    galleryInternalId: string;
    Title: string;
    CoverPicInternlId: string;
    CategoryNames: string;
    Validate_StartDate: string;
}

export interface GridViewContentProps
{
    Title: string;
    MainContentProps: MainGridContentProp[];
    gridProps: GalleryPageProps;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Theme: IFETheme;
}

/** 將 feature 資料轉成 1810 畫面需要的結構 */
const getGridViewContentProps = (
    p: {
        lang: Lang;
        rawData: GallerySet[];
        categoryMap: Record<string, string>;
    },
): MainGridContentProp[] =>
{
    return p.rawData.map((item) =>
    {
        const gly = item.Gallery;
        const galleryId = gly?.InternalId ?? "";
        const title = item.GalleryInfo?.find(
            (row) => row?.Lang?.toLowerCase() === p.lang.toLowerCase(),
        )?.Title ?? "未命名";

        const coverPic = gly?.CoverPicSrcId ?? "";
        const categoryIds = (gly?.Categories ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const categories = categoryIds
            .map((catId) => p.categoryMap[catId] ?? "")
            .filter((x): x is string => Boolean(x))
            .join("、");

        const validateStart = FormatDate(gly?.Validate_Start) ?? "";

        return {
            galleryInternalId: galleryId,
            Title: title,
            CoverPicInternlId: coverPic,
            CategoryNames: categories,
            Validate_StartDate: validateStart,
        };
    });
};

/** 將 feature 分頁資料轉成 1810 paginator 需要的格式 */
const useGalleryPageProps = (
    p: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    },
): GalleryPageProps =>
{
    return useMemo(() =>
    {
        return {
            CurrentPage: p.currentPage,
            TotalPage: p.totalPages,
            onPageChange: p.onPageChange,
        };
    }, [p.currentPage, p.totalPages, p.onPageChange]);
};

const GalleryListComp = (props: IGalleryListProps) =>
{
    // 讀取 feature 收斂後的資料入口
    const galleryData = useGalleryListFetchData({
        lang: props.lang,
        opts: props.options,
    });

    // 整理成 1810 畫面需要的資料
    const compProps = useMemo(() =>
    {
        return getGridViewContentProps({
            lang: props.lang,
            rawData: galleryData.list,
            categoryMap: galleryData.categoryMap,
        });
    }, [props.lang, galleryData.list, galleryData.categoryMap]);

    // 整理成 1810 paginator 需要的格式
    const gridProps = useGalleryPageProps({
        currentPage: galleryData.pageNumber,
        totalPages: galleryData.totalPages,
        onPageChange: galleryData.onPageChange,
    });

    return (
        <LoadingErrorHandler isLoading={galleryData.isLoading} errorList={galleryData.errors}>
            <div className="row">
                <div className="page-header">
                    <h3>{props.title}</h3>
                </div>
            </div>
            <hr className="hr-Css" />
            <MainContent props={compProps} gridProps={gridProps} theme={props.theme} />
        </LoadingErrorHandler>
    );
};

export default GalleryListComp;

const MainContent = (
    {
        props,
        gridProps,
        theme,
    }: {
        props: MainGridContentProp[];
        gridProps: GalleryPageProps;
        theme: IFETheme;
    },
) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);

    return (
        <>
            <div className="row margin_0">
                {props.map((prop, idx) => (
                    <div key={idx} className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <LangLink to={`${dirUrl}/${prop.galleryInternalId}`} title={prop.Title}>
                            <div className="img-box">
                                <img
                                    className="img-fluid"
                                    src={FileManagementAPI.get_Public_Preview_Url(prop.CoverPicInternlId, prop.Title)}
                                    alt={prop.Title}
                                />
                            </div>
                            <figcaption>
                                <div className="category_box">
                                    <div className="m-news_category">
                                        <i className="fa fa-bookmark" aria-hidden="true"></i>
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
            {!(gridProps.CurrentPage === 1 && gridProps.TotalPage === 1) && (
                <Paginator
                    currentPage={gridProps.CurrentPage}
                    totalPages={gridProps.TotalPage}
                    onPageChange={gridProps.onPageChange}
                    style={theme.Paginator}
                />
            )}
        </>
    );
};
