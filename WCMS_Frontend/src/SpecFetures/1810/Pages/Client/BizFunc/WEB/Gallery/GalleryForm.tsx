import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import parse from "html-react-parser";
import { type ReactNode, useMemo, useState } from "react";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useGalleryFormFetchData } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryForm_Loader";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

type GallerySet = components["schemas"]["GallerySet_DTO"];

interface PhotoInfos
{
    pictureInternalId: string;
    pictureDescription: string;
}

/** 取得當前語系的相簿資訊 */
const getGalleryInfoByLang = (p: { data: GallerySet; lang: Lang; }) =>
{
    return (p.data.GalleryInfo ?? []).find((item) => item?.Lang?.toLowerCase() === p.lang.toLowerCase()) ?? null;
};

/** 把 categories csv 轉成分類名稱字串 */
const getCategoryText = (p: { categoryIds?: string | null; categoryMap: Record<string, string>; }): string =>
{
    const raw = `${p.categoryIds ?? ""}`.trim();
    if (!raw) return "";
    return raw.split(",").map((item) => item.trim()).filter(Boolean).map((id) => p.categoryMap[id] ?? "").filter(Boolean).join("、");
};

/** 整理相簿照片顯示資料 */
const getPhotoInfoProps = (p: { data: GallerySet; lang: Lang; }): PhotoInfos[] =>
{
    return (p.data.GalleryPhotos ?? []).map((item) =>
    {
        const info = (p.data.GalleryPhotosInfo ?? []).find((row) => row.ParentRowId === item.RowId && row.Lang?.toLowerCase() === p.lang.toLowerCase());
        return { pictureInternalId: item.PicSrcId ?? "", pictureDescription: info?.Title ?? "" };
    }).filter((item) => item.pictureInternalId);
};

const GalleryForm = (prop: { theme: IFETheme; lang: Lang; }) =>
{
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    // 讀取 feature 收斂後的原始資料
    const formData = useGalleryFormFetchData({ lang: prop.lang });
    // 取得目前語系內容
    const galleryInfo = useMemo(() => getGalleryInfoByLang({ data: formData.data, lang: prop.lang }), [formData.data, prop.lang]);

    // 解析內容中的 internal file ids
    const resolved = useResolveInternalIds(galleryInfo?.Content ?? "", { locale: prop.lang });
    // 轉成 1810 畫面要的內容
    const content = useMemo(() => (resolved.html ? parse(resolved.html) : null), [resolved.html]);
    // 轉成 1810 畫面要的分類字串
    const categoryText = useMemo(() => getCategoryText({ categoryIds: formData.data.Gallery?.Categories, categoryMap: formData.categoryMap }), [
        formData.data.Gallery?.Categories,
        formData.categoryMap,
    ]);

    // 轉成 1810 Lightbox 要的照片資料
    const photoInfoProps = useMemo(() => getPhotoInfoProps({ data: formData.data, lang: prop.lang }), [formData.data, prop.lang]);

    // 整理 Lightbox 圖片資料
    const images = useMemo(
        () =>
            photoInfoProps.map((item) => ({
                src: FileManagementAPI.get_Public_Download_Url(item.pictureInternalId, item.pictureDescription),
                description: item.pictureDescription,
            })),
        [photoInfoProps],
    );

    return (
        <LoadingErrorHandler isLoading={formData.isLoading} errorList={formData.errorList}>
            <TitleContentBar title={formData.title} categoryName={categoryText} content={content} />
            <div className="row mt-3">
                {images.map((img, idx) => (
                    <div className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox" key={img.src}>
                        <div className="lightbox">
                            <div
                                className="img-box"
                                style={{ cursor: "pointer" }}
                                title={img.description}
                                onClick={() =>
                                {
                                    setCurrentIndex(idx);
                                    setOpen(true);
                                }}
                            >
                                <img src={img.src} alt={img.description} className="img-fluid" />
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
                    plugins={[Download, Captions, Share, Counter, Fullscreen, Zoom, Thumbnails]}
                    captions={{ descriptionTextAlign: "center" }}
                />
            )}
        </LoadingErrorHandler>
    );
};

export default GalleryForm;

const TitleContentBar = ({ title, categoryName, content }: { title: string; categoryName: string; content: ReactNode; }) => (
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
