import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import { useGalleryFormFetchData } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryForm_Loader";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { LibLightBox, type LibLightBoxSlide } from "@/SysCore/Components/FormField/LibFormField";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useCallback, useMemo, useState } from "react";

type GallerySet = components["schemas"]["GallerySet_DTO"];
type GalleryPhoto = NonNullable<GallerySet["GalleryPhotos"]>[number];

interface GalleryFormProps
{
    site: INormSite;
    node: INormNode;
    theme: IFETheme;
    lang: Lang;
}
interface GalleryFormListProps
{
    lang: Lang;
    data: GallerySet;
}

/** 相簿圖片 a11y 文案結構 */
type GalleryImageA11yText = { openPreview: string; openImage: (title: string) => string; };

/** 相簿圖片 a11y 文案表（用 xxx[lang] 讀；不足語系會 fallback） */
const GALLERY_IMAGE_A11Y_MAP: Partial<Record<Lang, GalleryImageA11yText>> = {
    "zh-tw": { openPreview: "開啟圖片預覽", openImage: (title) => `開啟圖片：${title}` },
    "zh-cn": { openPreview: "开启图片预览", openImage: (title) => `开启图片：${title}` },
    en: { openPreview: "Open image preview", openImage: (title) => `Open image: ${title}` },
};

/** 取得相簿圖片 a11y 文案（語系不在表內時，回退到 DefaultLang） */
const getGalleryImageA11y = (lang?: Lang): GalleryImageA11yText =>
{
    // 宣告：fallback key
    const key = (lang ?? DefaultLang) as Lang;

    // 執行：依語系取值，取不到就回 default
    const byLang = GALLERY_IMAGE_A11Y_MAP[key];
    const byDefault = GALLERY_IMAGE_A11Y_MAP[DefaultLang];

    // return：保證回傳一份可用文案
    return byLang ?? byDefault ?? { openPreview: "開啟圖片預覽", openImage: (title) => `開啟圖片：${title}` };
};

/** 取得圖片開啟按鈕 aria-label 文案 */
const getOpenImageText = (a11y: GalleryImageA11yText, title?: string): string =>
{
    // 宣告：去除前後空白後的標題
    const safeTitle = title?.trim() ?? "";

    // return：有標題時帶入標題，沒有標題時使用預覽文案
    return safeTitle ? a11y.openImage(safeTitle) : a11y.openPreview;
};

/** 取得圖片按鈕 title 文案 */
const getImageButtonTitle = (title?: string): string | undefined =>
{
    // 宣告：去除前後空白後的標題
    const safeTitle = title?.trim() ?? "";

    // return：title 只顯示圖片標題，沒有標題時不輸出 title
    return safeTitle || undefined;
};

/** 相簿表單頁面 */
const GalleryForm = (props: GalleryFormProps) =>
{
    // 讀取 feature 收斂後的單一資料入口
    const formData = useGalleryFormFetchData({ lang: props.lang });

    // 建立瀏覽次數設定
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Gallery, InternalId: formData.internalId };
        return { mode: "form", contentKey: formData.internalId, request };
    }, [props.site.siteIndex, formData.internalId]);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={formData.title}
            isLoading={formData.isLoading}
            errorList={formData.errorList}
            viewCountConfig={viewCountConfig}
        >
            <NewGalleryFormList lang={props.lang} data={formData.data} />
        </ModuleContent>
    );
};

export default GalleryForm;

/** 建立單張相簿圖片的 Lightbox 資料 */
const buildGallerySlide = (data: GallerySet, item: GalleryPhoto, lang: Lang): LibLightBoxSlide =>
{
    // 依語系取得圖片標題
    const infoDt = data.GalleryPhotosInfo?.find((p) => p.ParentRowId === item.RowId && p.Lang === lang);
    const title = infoDt?.Title ?? "";
    const url = FileManagementAPI.get_Public_Preview_Url(item.PicSrcId);
    // 宣告：圖片描述，後續可改接後端欄位
    const description = infoDt?.Description ?? "";
    // return：回傳 Lightbox slide
    return { src: url, title, description, download: url };
};

/** 取得相簿圖片排序值，沒有 Sort 時放到最後 */
const getGalleryPhotoSort = (item: GalleryPhoto): number =>
{
    return item.Sort ?? Number.MAX_SAFE_INTEGER;
};
/** 依相簿圖片 Sort 排序，Sort 相同時用 RowId 穩定排序 */
const sortGalleryPhotos = (list: GalleryPhoto[] | null | undefined): GalleryPhoto[] =>
{
    return [...(list ?? [])].sort((a, b) =>
    {
        const sortCompare = getGalleryPhotoSort(a) - getGalleryPhotoSort(b);
        return sortCompare !== 0 ? sortCompare : (a.RowId ?? 0) - (b.RowId ?? 0);
    });
};
/** 將相簿圖片資料轉成共用 Lightbox 可吃的格式 */
const buildGallerySlides = (data: GallerySet, lang: Lang): LibLightBoxSlide[] =>
{
    const photos = sortGalleryPhotos(data?.GalleryPhotos);
    return photos.map((item) => buildGallerySlide(data, item, lang));
};

/** 相簿圖片列表 */
const NewGalleryFormList = (props: GalleryFormListProps) =>
{
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    // 依語系取得 a11y 文案
    const a11y = useMemo(() => getGalleryImageA11y(props.lang), [props.lang]);

    // 依資料與語系產生 Lightbox 圖片清單
    const slides = useMemo(() => buildGallerySlides(props.data, props.lang), [props.data, props.lang]);

    // 開啟指定索引的 Lightbox
    const openGallery = useCallback((idx: number) =>
    {
        setIndex(idx);
        setOpen(true);
    }, []);

    // 關閉 Lightbox
    const closeGallery = useCallback(() => setOpen(false), []);

    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {slides.map((slide, idx) =>
                {
                    const buttonTitle = getImageButtonTitle(slide.title);
                    const openImageText = getOpenImageText(a11y, slide.title);

                    return (
                        <div key={`${slide.src}_${idx}`} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="figure_Box">
                                        <button
                                            type="button"
                                            className="card_image_link border-0 bg-transparent p-0 w-100"
                                            onClick={() => openGallery(idx)}
                                            title={buttonTitle}
                                            aria-label={openImageText}
                                        >
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={slide.src} alt={slide.title ?? ""} />
                                                </div>
                                            </div>
                                            <div className="card_titleDiv mb-md-2 mb-sm-1 mb-0 mt-4">
                                                <div className="card_title">{slide.title}</div>
                                                {slide.description && <div className="card_subtitle">{slide.description}</div>}
                                            </div>
                                        </button>
                                    </figure>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>

            <LibLightBox open={open} index={index} slides={slides} lang={props.lang} onClose={closeGallery} />
        </>
    );
};
