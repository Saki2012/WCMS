import { Link, useLocation } from "react-router-dom";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../../SysCore/Components/Paginator/Paginator_Comp";
import type { PaginatorProps } from "../../../../../../SysCore/Components/Paginator/Paginator_Data";
import type { ReactNode } from "react";

export interface GalleryFormViewProps {
    Title: string,
    CategoryName: string;
    Content: ReactNode;
    photoInfoProps: PhotoInfos[],
    LoadingList: boolean[],
    ErrorList: (string | null | undefined)[],
}

export const GalleryFormViewComp = (prop: GalleryFormViewProps) => {
    return (
        <>
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <TitleContentBar title={prop.Title} categoryName={prop.CategoryName} content={prop.Content} />
                <GalleryContent props={prop.photoInfoProps} />
            </LoadingErrorHandler>
        </>
    );
}

const TitleContentBar = ({ title, categoryName, content }: { title: string; categoryName: string, content: ReactNode }) => {
    return <>
        <div className="row">
            <div className="page-header">
                <h3>{title}</h3>
            </div>
            <div className="page_category_box">
                <div className="page_category">
                    <h4><i className="fa fa-bookmark" aria-hidden="true"></i> {categoryName}</h4>
                </div>
            </div>
            {content}
        </div>
        <hr className="hr-Css" />
    </>
}

export interface PhotoInfos {
    pictureInternalId: string;
}

const GalleryContent = ({ props }: { props: PhotoInfos[] }) => {
    const prefix = '/Service/FileManagement/Preview/'
    // 把資料切成每 4 個一組
    const chunkArray = (arr: PhotoInfos[], size: number) => {
        return arr.reduce((acc: PhotoInfos[][], _, index) => {
            if (index % size === 0) { acc.push(arr.slice(index, index + size)); }
            return acc;
        }, []);
    };
    const rows = chunkArray(props, 4);
    return (
        <>
            {rows.map((row, rowIndex) => (
                <div className="row mt-5" key={rowIndex}>
                    {row.map((item, idx) => (
                        <div className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox" key={idx}>
                            <a className="venobox vbox-item" href={`${prefix}${item.pictureInternalId}`} data-gall="myGallery" data-caption={item.pictureInternalId ?? ""}
                                title={item.pictureInternalId ?? ""}>
                                <div className="img-box">
                                    <img className="img-fluid"
                                        src={`${prefix}${item.pictureInternalId}`}
                                        alt={item.pictureInternalId ?? ""} />
                                    <div className="zoom-plus">
                                        <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}
