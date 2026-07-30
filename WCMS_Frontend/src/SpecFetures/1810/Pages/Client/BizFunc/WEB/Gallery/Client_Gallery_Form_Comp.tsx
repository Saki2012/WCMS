import type { GalleryFormViewProps } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_Form_Comp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { type ReactNode, useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/styles.css";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];

interface PhotoInfo
{
    /** 圖片檔案 ID */
    pictureInternalId: string;

    /** 圖片描述 */
    pictureDescription: string;
}
// #endregion

// #region Public
/** 1810 相簿明細 Form DOM，Feature Entry 會在最後透過 SlotResolver 解析到這裡。 */
export const Client_Gallery_Form = (props: GalleryFormViewProps) =>
{
    const galleryInfo = useMemo(() => getGalleryInfoByLang({ data: props.data, lang: props.lang }), [props.data, props.lang]);
    const content = <CmsHtml_Comp html={galleryInfo?.Content ?? ""} lang={props.lang} />;
    const categoryText = useMemo(() => getCategoryText({ categoryIds: props.data.Gallery?.Categories, categoryMap: props.categoryMap ?? {} }), [
        props.data.Gallery?.Categories,
        props.categoryMap,
    ]);

    return (
        <LoadingErrorHandler isLoading={props.isLoading} errorList={props.errorList}>
            <TitleContentBar title={props.title} categoryName={categoryText} content={content} />
            <GalleryPhotoGrid data={props.data} lang={props.lang} />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Section
/** 相簿照片 Grid 與 Lightbox。 */
const GalleryPhotoGrid = (props: { data: GallerySet; lang: Lang; }) =>
{
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const photoInfoProps = useMemo(() => getPhotoInfoProps({ data: props.data, lang: props.lang }), [props.data, props.lang]);
    const images = useMemo(
        () => photoInfoProps.map((item) => ({
            src: FileManagementAPI.get_Public_Download_Url(item.pictureInternalId, item.pictureDescription),
            description: item.pictureDescription,
        })),
        [photoInfoProps],
    );

    return (
        <>
            <div className="row mt-3">
                {images.map((img, idx) => (
                    <div className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox" key={img.src}>
                        <div className="lightbox">
                            <button
                                type="button"
                                className="img-box border-0 bg-transparent p-0"
                                style={{ cursor: "pointer" }}
                                title={img.description}
                                onClick={() =>
                                {
                                    setCurrentIndex(idx);
                                    setOpen(true);
                                }}
                            >
                                <img src={img.src} alt={img.description} className="img-fluid" />
                                <span className="zoom-plus">
                                    <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                </span>
                            </button>
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
                    plugins={[Download, Captions, Share, Counter, Fullscreen, Zoom, Thumbnails]}
                    captions={{ descriptionTextAlign: "center" }}
                />
            )}
        </>
    );
};
// #endregion

// #region Private
/** 取得當前語系的相簿資訊。 */
const getGalleryInfoByLang = (p: { data: GallerySet; lang: Lang; }) =>
{
    return (p.data.GalleryInfo ?? []).find((item) => item?.Lang?.toLowerCase() === p.lang.toLowerCase()) ?? null;
};

/** 把 categories csv 轉成分類名稱字串。 */
const getCategoryText = (p: { categoryIds?: string | null; categoryMap: Record<string, string>; }): string =>
{
    const raw = `${p.categoryIds ?? ""}`.trim();
    if (!raw) return "";

    return raw.split(",").map((item) => item.trim()).filter(Boolean).map((id) => p.categoryMap[id] ?? "").filter(Boolean).join("、");
};

/** 整理相簿照片顯示資料。 */
const getPhotoInfoProps = (p: { data: GallerySet; lang: Lang; }): PhotoInfo[] =>
{
    const lang = p.lang.toLowerCase();
    const photos = [...(p.data.GalleryPhotos ?? [])].sort((a, b) =>
    {
        const sortCompare = (a.Sort ?? 0) - (b.Sort ?? 0);
        return sortCompare !== 0 ? sortCompare : (a.RowId ?? 0) - (b.RowId ?? 0);
    });

    return photos.map((item) =>
    {
        const info = (p.data.GalleryPhotosInfo ?? []).find((row) => row.ParentRowId === item.RowId && row.Lang?.toLowerCase() === lang);
        return { pictureInternalId: item.PicSrcId ?? "", pictureDescription: info?.Title ?? "" };
    }).filter((item) => item.pictureInternalId);
};

/** 顯示標題、分類與內文。 */
const TitleContentBar = (props: { title: string; categoryName: string; content: ReactNode; }) =>
{
    return (
        <>
            <div className="row">
                <div className="page-header">
                    <h3>{props.title}</h3>
                </div>
                <div className="page_category_box">
                    <div className="page_category">
                        <h4>
                            <i className="fa fa-bookmark" aria-hidden="true"></i> {props.categoryName}
                        </h4>
                    </div>
                </div>
                {props.content}
            </div>
            <hr className="hr-Css" />
        </>
    );
};
// #endregion
