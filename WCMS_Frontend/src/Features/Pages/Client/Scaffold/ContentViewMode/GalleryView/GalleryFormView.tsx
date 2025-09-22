import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";


import type { ReactNode } from "react";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

interface GalleryFormViewProps {
    Title: string;
    CategoryName: string;
    Content: ReactNode;
    photoInfoProps: PhotoInfos[];
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
}

export interface PhotoInfos {
    pictureInternalId: string;
}


export const GalleryFormViewComp = (prop: GalleryFormViewProps) => {
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const images = prop.photoInfoProps.map((item) => ({ src: `${FileManagementAPI.PREVIEW_URL}/${item.pictureInternalId}`, title: item.pictureInternalId }));

    return (
        <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList}>
            <TitleContentBar title={prop.Title} categoryName={prop.CategoryName} content={prop.Content} />
            <div className="row mt-3">
                {images.map((img, idx) => (
                    <div className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox" key={img.src}>
                        <div className="lightbox">
                            <div className="img-box" style={{ cursor: "pointer" }} onClick={() => { setCurrentIndex(idx); setOpen(true); }} title={img.title}>
                                <img src={img.src} alt={img.title} className="img-fluid" />
                                <div className="zoom-plus">
                                    <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {open && (<Lightbox open={open} close={() => setOpen(false)} slides={images} index={currentIndex} plugins={[Download, Share, Fullscreen, Zoom, Thumbnails]} />
            )}
        </LoadingErrorHandler>
    );
};

const TitleContentBar = ({ title, categoryName, content, }: { title: string; categoryName: string; content: ReactNode; }) => (
    <>
        <div className="row">
            <div className="page-header">
                <h3>{title}</h3>
            </div>
            <div className="page_category_box">
                <div className="page_category">
                    <h4>
                        <i className="fa fa-bookmark" aria-hidden="true"></i> {categoryName}
                    </h4>
                </div>
            </div>
            {content}
        </div>
        <hr className="hr-Css" />
    </>
);
