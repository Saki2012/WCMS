import { Link, useLocation } from "react-router-dom";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../../SysCore/Components/Paginator/Paginator_Comp";
import type { PaginatorProps } from "../../../../../../SysCore/Components/Paginator/Paginator_Data";
import { SubPageTitle } from "../../Header/SubPageTitle_Comp";

export interface GridViewContentProps {
    Title: string,
    MainContentProps: MainGridContentProp[],
    // PaginatorProp: PaginatorProps,
    LoadingList: boolean[],
    ErrorList: (string | null | undefined)[],
}

export const GalleryViewComp = (prop: GridViewContentProps) => {
    return (
        <>
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <SubPageTitle title={prop.Title} />
                <MainContent props={prop.MainContentProps} />
                {/* <Paginator {...prop.PaginatorProp}></Paginator> */}
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

const MainContent = ({ props }: { props: MainGridContentProp[] }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);

    return (
        <div className="row margin_0">
            {props.map((prop, idx) => (
                <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12 photo_standardbox">
                    <Link key={idx} to={`${dirUrl}/${prop.galleryInternalId}`} title={prop.Title}>
                        <div className="img-box">
                            <img className="img-fluid" src={`/Service/Filemanagement/Preview/${prop.CoverPicInternlId}`} alt={prop.Title} />
                        </div>
                        <figcaption>
                            <div className="category_box">
                                <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                    <div className="tags-text">{prop.CategoryNames}</div>
                                </div>
                            </div>
                            <h3 className="title mt-0 mb-0">{prop.Title}</h3>
                            <div className="category_box">
                                <div className="m-date_category mt-2"> <i className="fa fa-clock-o" aria-hidden="true"></i>
                                    <div className="tags-text">{prop.CreateDate}</div>
                                </div>
                            </div>
                        </figcaption>
                    </Link>
                </div>
            ))}
        </div>
    )
}
