import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { LibLightBox_Comp, type LibLightBoxSlide } from "@/SysCore/Components/FormField/LibFormField";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useGalleryFormData } from "./Client_Gallery_Form_Loader";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];
type GalleryPhoto = NonNullable<GallerySet["GalleryPhotos"]>[number];
export interface GalleryFormProps
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
export interface GalleryFormViewProps extends GalleryFormProps
{
    /** 相簿標題 */
    title: string;
    /** 相簿資料 */
    data: GallerySet;
    /** 分類名稱對照表，提供 Spec View 顯示分類文字 */
    categoryMap?: Record<string, string>;
    /** 是否載入中 */
    isLoading: boolean;
    /** 錯誤訊息 */
    errorList: string[];
    /** 瀏覽次數設定，Preview 不傳入 */
    viewCountConfig?: ModuleViewCountConfig;
}
const emptyData: GallerySet = { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };
/** 相簿圖片 a11y 文案結構 */
type GalleryImageA11yText = { openPreview: string; openImage: (title: string) => string; };
/** 相簿圖片 a11y 文案表（用 xxx[lang] 讀；不足語系會 fallback） */
const GALLERY_IMAGE_A11Y_MAP: Partial<Record<Lang, GalleryImageA11yText>> = {
    "zh-tw": { openPreview: "開啟圖片預覽", openImage: (title) => `開啟圖片：${title}` },
    "zh-cn": { openPreview: "开启图片预览", openImage: (title) => `开启图片：${title}` },
    en: { openPreview: "Open image preview", openImage: (title) => `Open image: ${title}` },
};
// #endregion

// #region Variable
/** Gallery FormView 快取，避免重複解析 Spec View。 */
let galleryFormViewCache: typeof Client_Gallery_Form_FeatureView | null = null;
// #endregion

// #region Public
/** 相簿表單完整 Comp，負責資料 Hook，再交給 FormView Entry。 */
export const Client_Gallery_Form_Comp = (props: GalleryFormProps) =>
{
    const { internalId } = useParams();
    const safeInternalId = LibText.safeTrim(internalId);
    const vm = useGalleryFormData({ lang: props.lang, internalId: safeInternalId, emptyData });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Gallery, InternalId: safeInternalId };
        return { mode: "form", contentKey: safeInternalId, request };
    }, [props.site.siteIndex, safeInternalId]);
    return (
        <Client_Gallery_Form
            {...props}
            title={vm.title}
            data={vm.data}
            categoryMap={vm.categoryMap}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            viewCountConfig={viewCountConfig}
        />
    );
};

/** 相簿表單 FormView Entry，正式前台與 Preview 都從這裡進入。 */
export const Client_Gallery_Form = (props: GalleryFormViewProps) =>
{
    const FormView = getGalleryFormView();
    return <FormView {...props} />;
};

/** 相簿表單 Feature 預設 View，只負責輸出 DOM。 */
const Client_Gallery_Form_FeatureView = (props: GalleryFormViewProps) =>
{
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.title} isLoading={props.isLoading} errorList={props.errorList} viewCountConfig={props.viewCountConfig}>
            <GalleryPhotoList_Section lang={props.lang} data={props.data} />
        </ModuleContent>
    );
};
// #endregion

// #region Protected
/** 建立單張相簿圖片的 Lightbox 資料 */
const buildGallerySlide = (data: GallerySet, item: GalleryPhoto, lang: Lang): LibLightBoxSlide =>
{
    const infoDt = data.GalleryPhotosInfo?.find((p) => p.ParentRowId === item.RowId && p.Lang === lang);
    const title = infoDt?.Title ?? "";
    const url = FileManagementAPI.get_Public_Preview_Url(item.PicSrcId);
    const description = infoDt?.Description ?? "";
    return { src: url, title, description, download: url };
};
/** 將相簿圖片資料轉成共用 Lightbox 可吃的格式 */
const buildGallerySlides = (data: GallerySet, lang: Lang): LibLightBoxSlide[] =>
{
    const photos = sortGalleryPhotos(data?.GalleryPhotos);
    return photos.map((item) => buildGallerySlide(data, item, lang));
};
// #endregion

// #region Private
/** 取得 Gallery FormView，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getGalleryFormView = (): typeof Client_Gallery_Form_FeatureView =>
{
    if (galleryFormViewCache !== null)
    {
        return galleryFormViewCache;
    }

    galleryFormViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_Gallery_Form_Comp"),
        Client_Gallery_Form_FeatureView,
        ["Client_Gallery_Form"],
    );

    return galleryFormViewCache;
};
/** 取得相簿圖片 a11y 文案（語系不在表內時，回退到 DefaultLang） */
const getGalleryImageA11y = (lang?: Lang): GalleryImageA11yText =>
{
    const key = (lang ?? DefaultLang) as Lang;
    const byLang = GALLERY_IMAGE_A11Y_MAP[key];
    const byDefault = GALLERY_IMAGE_A11Y_MAP[DefaultLang];
    return byLang ?? byDefault ?? { openPreview: "開啟圖片預覽", openImage: (title) => `開啟圖片：${title}` };
};
/** 取得圖片開啟按鈕 aria-label 文案 */
const getOpenImageText = (a11y: GalleryImageA11yText, title?: string): string =>
{
    return title ? a11y.openImage(title) : a11y.openPreview;
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
/** 相簿圖片列表 */
const GalleryPhotoList_Section = (props: GalleryFormListProps) =>
{
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const a11y = useMemo(() => getGalleryImageA11y(props.lang), [props.lang]);
    const slides = useMemo(() => buildGallerySlides(props.data, props.lang), [props.data, props.lang]);
    const openGallery = useCallback((idx: number) =>
    {
        setIndex(idx);
        setOpen(true);
    }, []);
    const closeGallery = useCallback(() => setOpen(false), []);
    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {slides.map((slide, idx) =>
                {
                    const buttonTitle = LibText.safeTrim(slide.title);
                    const openImageText = getOpenImageText(a11y, LibText.safeTrim(slide.title));
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
                                                    <img className="card_image" src={slide.src} alt={LibText.getFirstNonEmptyText(slide.title, slide.description)} />
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
            <LibLightBox_Comp open={open} index={index} slides={slides} lang={props.lang} onClose={closeGallery} />
        </>
    );
};
// #endregion
