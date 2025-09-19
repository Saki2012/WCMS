import { Link, useLocation } from "react-router-dom";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../../SysCore/Components/Paginator/Paginator_Comp";
import { SubPageTitle } from "../../Header/SubPageTitle_Comp";
import type { GridProps } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { IFETheme } from "../../../Theme/ITheme";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

export interface GridViewContentProps {
    Title: string,
    MainContentProps: MainGridContentProp[],
    gridProps: GridProps,
    // PaginatorProp: PaginatorProps,
    LoadingList: boolean[],
    ErrorList: (string | null | undefined)[],
    Theme: IFETheme

}

export const GalleryViewComp = (prop: GridViewContentProps) => {
    return (
        <>
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <SubPageTitle title={prop.Title} />
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
    CreateDate: string;
}

const MainContent = ({ props, gridProps, theme }: { props: MainGridContentProp[]; gridProps: GridProps; theme: IFETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    return (
        <>
            <div className="row margin_0">
                {props.map((prop, idx) => (
                    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <Link key={idx} to={`${dirUrl}/${prop.galleryInternalId}`} title={prop.Title}>
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
                                        <div className="tags-text">{prop.CreateDate}</div>
                                    </div>
                                </div>
                            </figcaption>
                        </Link>
                    </div>
                ))}
            </div>
            {!(gridProps.CurrentPage === 1 && gridProps.TotalPage === 1) &&
                (<Paginator currentPage={gridProps.CurrentPage} totalPages={gridProps.TotalPage} onPageChange={gridProps.onPageChange} style={theme.Paginator} ></Paginator>)}
        </>
    )
}
