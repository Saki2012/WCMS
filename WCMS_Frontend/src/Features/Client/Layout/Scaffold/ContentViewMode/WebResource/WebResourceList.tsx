import { Link, useLocation } from "react-router-dom";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";

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
                <TitleBar title={prop.Title} />
                <MainContent props={prop.MainContentProps} />
                {/* <Paginator {...prop.PaginatorProp}></Paginator> */}
            </LoadingErrorHandler>
        </>
    );
}

const TitleBar = ({ title }: { title: string }) => {
    return <>
        <div className="row"><div className="page-header"><h3>{title}</h3></div></div>
        <hr className="hr-Css" />
    </>
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
                <div className="col-lg-4 col-md-6 col-sm-6 col-12 photo_standardbox">
                    <a className="venobox vbox-item" data-autoplay="true" data-vbtype="video" href="https://www.youtube.com/embed/pkIHsOtB17M?si=NW8ZkYG2A7ozGkrN" title="地方創生藝術共榮 記憶畫像(另開新視窗)" target="_blank" rel="noopener noreferrer">
                        <div className="img-box">
                            <iframe width="100%" height="275" src="https://www.youtube.com/embed/pkIHsOtB17M?si=NW8ZkYG2A7ozGkrN" title="地方創生藝術共榮 記憶畫像" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
                        </div>
                        <figcaption>
                            <h3 className="title mt-0 mb-0">地方創生藝術共榮 記憶畫像</h3>
                        </figcaption>
                    </a>
                </div>
            ))}
        </div>
    )
}
