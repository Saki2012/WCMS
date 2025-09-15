import { useState } from "react";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Video from "yet-another-react-lightbox/plugins/video";

import type { ReactNode } from "react";
import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";

export interface GalleryFormViewProps {
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

const prefix = "/Service/FileManagement/Preview/";

export const GalleryFormViewComp = (prop: GalleryFormViewProps) => {
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const images = prop.photoInfoProps.map((item) => ({
        src: `${prefix}${item.pictureInternalId}`,
        title: item.pictureInternalId,
    }));

    return (
        <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList}>
            <TitleContentBar
                title={prop.Title}
                categoryName={prop.CategoryName}
                content={prop.Content}
            />

            <div className="row mt-3">
                {images.map((img, idx) => (
                    <div
                        className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox"
                        key={img.src}
                    >
                        <div className="lightbox">
                            <div
                                className="img-box"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    setOpen(true);
                                }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.title}
                                    className="img-fluid"
                                />
                                <div className="zoom-plus">
                                    <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {open && (
                <Lightbox
                    open={open}
                    close={() => setOpen(false)}
                    slides={images}
                    index={currentIndex}
                    plugins={[Download, Share, Fullscreen, Zoom, Thumbnails]}
                // plugins={[Download, Share, Captions, Counter, Fullscreen, Inline, Slideshow, Thumbnails, Video, Zoom]}
                />
            )}
        </LoadingErrorHandler>
    );
};

const TitleContentBar = ({
    title,
    categoryName,
    content,
}: {
    title: string;
    categoryName: string;
    content: ReactNode;
}) => (
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
