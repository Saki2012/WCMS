import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { getFirstNonEmptyText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMaterialFormData } from "./Client_Material_Form_Loader";

// #region Property
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialFormRawData = ReturnType<typeof useMaterialFormData>["rawData"];
type MaterialInfoJson = Record<string, string | number | boolean | null | undefined>;
interface VenoBoxOption
{
    selector?: string;
    autoplay?: boolean;
    maxWidth?: string;
    border?: string;
    titleattr?: string;
    titlePosition?: string;
    numeration?: boolean;
    infinigall?: boolean;
    share?: boolean;
    spinner?: string;
}
interface VenoBoxInstance
{
    destroy?: () => void;
}
interface VenoBoxConstructor
{
    new(option: VenoBoxOption): VenoBoxInstance;
}
declare global
{
    interface Window
    {
        VenoBox?: VenoBoxConstructor;
        __materialVenoBox?: VenoBoxInstance;
    }
}
interface IMaterialFormProps
{
    theme: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
}
// #endregion

// #region Public
export const Client_Material_Form_Comp = (props: IMaterialFormProps) =>
{
    const params = useParams();
    const internalId = `${params.internalId ?? ""}`;
    const emptyData = useMemo<MaterialSet>(() => ({ Material: {}, MaterialLangInfo: [], MaterialPicture: [], MaterialTags: [] }), []);
    const vm = useMaterialFormData({ lang: props.lang, internalId, emptyData });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Material, InternalId: internalId };
        return { mode: "form", contentKey: internalId, request };
    }, [props.site.siteIndex, internalId]);

    return (
        <ModuleContent nodeTitle={props.node.title} isLoading={vm.isLoading} errorList={vm.errorList} viewCountConfig={viewCountConfig}>
            <MaterialDetailContent_Comp rawData={vm.rawData} lang={props.lang} />
            <MaterialInfoContent_Comp rawData={vm.rawData} lang={props.lang} />
        </ModuleContent>
    );
};
// #endregion

// #region Section
/** 物件主要內容區 */
const MaterialDetailContent_Comp = (props: { rawData: MaterialFormRawData; lang: Lang; }) =>
{
    const formData = props.rawData.formData;
    const langInfo = getLangInfo(formData, props.lang);
    const json = parseMaterialInfoJson(langInfo?.MaterialInfoJson);
    const title = langInfo?.MaterialName ?? "";
    const price = getFirstNonEmptyText(formData.Material?.Price, json.Price);
    const description = getFirstNonEmptyText(json.Description);
    const pictures = buildPictures(formData, title);
    const specRows = buildSpecRows(props.rawData, json);
    return (
        <>
            <div className="page-header">
                <div className="Div_H3_Title">{title}</div>
            </div>
            <hr className="hr-my-4" />
            <div className="commodity_details_content + Layout_Padding_2_bottom">
                <div className="row">
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                        <MaterialImageGallery_Comp title={title} pictures={pictures} />
                    </div>
                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-12 col-12 + offset-xxl-1 offset-xl-1 offset-lg-1">
                        <MaterialRightContent_Comp title={title} price={price} description={description} specRows={specRows} />
                    </div>
                </div>
            </div>
        </>
    );
};
/** 左側圖片區 */
const MaterialImageGallery_Comp = (props: { title: string; pictures: Array<{ url: string; alt: string; title: string; }>; }) =>
{
    const mainOuterRef = useRef<HTMLDivElement | null>(null);
    const thumbOuterRef = useRef<HTMLDivElement | null>(null);
    const lightboxRefs = useRef<Array<HTMLAnchorElement | null>>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [mainWidth, setMainWidth] = useState(0);
    const [thumbOuterWidth, setThumbOuterWidth] = useState(0);
    const safePictures = props.pictures;
    const count = Math.max(safePictures.length, 1);
    const activePic = safePictures[activeIndex] ?? safePictures[0];
    const thumbGap = 10;
    const thumbVisibleCount = 3;
    const thumbItemWidth = Math.max((thumbOuterWidth - (thumbGap * (thumbVisibleCount - 1))) / thumbVisibleCount, 0);
    const thumbStep = thumbItemWidth + thumbGap;
    const thumbStartIndex = Math.floor(activeIndex / thumbVisibleCount) * thumbVisibleCount;
    const mainTransform = `translate3d(-${activeIndex * mainWidth}px, 0px, 0px)`;
    const thumbTransform = `translate3d(-${thumbStartIndex * thumbStep}px, 0px, 0px)`;

    useEffect(() =>
    {
        const updateSize = () =>
        {
            setMainWidth(mainOuterRef.current?.clientWidth ?? 0);
            setThumbOuterWidth(thumbOuterRef.current?.clientWidth ?? 0);
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    useEffect(() =>
    {
        if (activeIndex < safePictures.length) return;
        setActiveIndex(0);
    }, [activeIndex, safePictures.length]);

    useEffect(() =>
    {
        initMaterialVenoBox();
        return () => window.__materialVenoBox?.destroy?.();
    }, [safePictures.length]);

    return (
        <div className="Commodity_Change_Image_Area">
            <div className="commodity_wrapper">
                <div className="commodity_big_image_box + owl-box">
                    <div className="ZoomIn commodity_ZoomIn_btn">
                        <a
                            href={activePic?.url ?? "#"}
                            className="Btn_zm1"
                            role="button"
                            title="放大圖片"
                            onClick={(e) => openMaterialLightbox(e, activeIndex, lightboxRefs.current)}
                        >
                            <i className="fas fa-expand-alt"></i>
                            <span className="sr-only">放大圖片</span>
                        </a>

                        <div style={{ display: "none" }}>
                            {safePictures.map((pic, index) => (
                                <a
                                    key={`lightbox_${pic.url}_${index}`}
                                    ref={(el) =>
                                    {
                                        lightboxRefs.current[index] = el;
                                    }}
                                    href={pic.url}
                                    className="material-venobox venobox"
                                    data-gall="materialGallery"
                                    title={pic.title || props.title}
                                >
                                    {pic.title || props.title}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="owl-carousel + main-carousel owl-loaded owl-drag">
                        <div ref={mainOuterRef} className="owl-stage-outer">
                            <div className="owl-stage" style={{ width: `${mainWidth * count}px`, transform: mainTransform, transition: "all 0.5s ease 0s" }}>
                                {safePictures.map((pic, index) => (
                                    <div
                                        key={`${pic.url}_${index}`}
                                        className={`owl-item ${index === activeIndex ? "active" : ""}`}
                                        style={{ width: `${mainWidth}px` }}
                                    >
                                        <div className="item">
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={pic.url} alt={pic.alt || props.title} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="owl-nav disabled">
                            <button type="button" role="presentation" className="owl-prev disabled">
                                <span aria-label="Previous">‹</span>
                            </button>
                            <button type="button" role="presentation" className="owl-next disabled">
                                <span aria-label="Next">›</span>
                            </button>
                        </div>
                        <div className="owl-dots disabled"></div>
                    </div>
                </div>
                <div className="commodity_slider_box + owl-box">
                    <div className="owl-carousel + thumb-carousel owl-loaded owl-drag">
                        <div ref={thumbOuterRef} className="owl-stage-outer">
                            <div className="owl-stage" style={{ width: `${thumbStep * count}px`, transform: thumbTransform, transition: "all 0.3s ease 0s" }}>
                                {safePictures.map((pic, index) => (
                                    <div
                                        key={`${pic.url}_${index}`}
                                        className={`owl-item ${index === activeIndex ? "active" : ""}`}
                                        style={{ width: `${thumbItemWidth}px`, marginRight: `${thumbGap}px` }}
                                    >
                                        <div
                                            className={`item ${index === activeIndex ? "active" : ""}`}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`切換圖片：${pic.title || props.title}`}
                                            onClick={() => setActiveIndex(index)}
                                            onKeyDown={(e) => handleThumbKeyDown(e, index, setActiveIndex)}
                                        >
                                            <img src={pic.url} alt={pic.alt} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="owl-nav">
                            <button
                                type="button"
                                role="presentation"
                                className={`owl-prev ${safePictures.length <= 1 ? "disabled" : ""}`}
                                onClick={() => setActiveIndex(p => getLoopPictureIndex(p - 1, safePictures.length))}
                            >
                                <span aria-label="Previous">‹</span>
                            </button>
                            <button
                                type="button"
                                role="presentation"
                                className={`owl-next ${safePictures.length <= 1 ? "disabled" : ""}`}
                                onClick={() => setActiveIndex(p => getLoopPictureIndex(p + 1, safePictures.length))}
                            >
                                <span aria-label="Next">›</span>
                            </button>
                        </div>
                        <div className="owl-dots disabled"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
/** 右側價格與規格區 */
const MaterialRightContent_Comp = (props: { title: string; price: string; description: string; specRows: Array<{ label: string; value: string; }>; }) =>
{
    return (
        <div className="details_RightContent">
            <div className="commodity_title">
                <div className="tit">{props.title}</div>
            </div>

            {props.price && props.price !== "0" && (
                <div className="Pricing_Meta">
                    <ul>
                        <li>
                            <div className="Price">NT$ {props.price} 元</div>
                        </li>
                    </ul>
                </div>
            )}

            <div className="Specifications">
                <ul>
                    {props.specRows.map(row => (
                        <li key={row.label}>
                            <div className="list-group-item">
                                <span className="mr-2">{row.label} ：</span>
                                {row.value}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="Description_Text + mb-5">
                <div className="open_wrapper">
                    <div className="message_text">
                        <span>{props.description}</span>
                    </div>
                    <a href="#more-content" className="label_btn + + d-none" role="button" aria-label="[全文展開]" title="[ 全文展開 ]"></a>
                </div>
            </div>

            <hr className="hr-my-4" />
        </div>
    );
};
/** 下方資訊說明 */
const MaterialInfoContent_Comp = (props: { rawData: MaterialFormRawData; lang: Lang; }) =>
{
    const langInfo = getLangInfo(props.rawData.formData, props.lang);
    const json = parseMaterialInfoJson(langInfo?.MaterialInfoJson);
    const content = getFirstNonEmptyText(json.InfoContent, langInfo?.Memo);

    return (
        <>
            <div className="page-header">
                <div className="Div_H3_Title">資訊說明：</div>
            </div>
            <hr className="hr-my-4" />
            <div className="SubInfoDivBox_Style + Layout_Padding_4_bottom">
                <div className="row w-100">
                    <div className="col-12">
                        <div className="content">
                            <div className="Editor_All_Content">
                                <CmsHtml_Comp html={content ?? ""} lang={props.lang} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion

// #region EntityComp
/** 建立圖片清單 */
const buildPictures = (data: MaterialSet, title: string): Array<{ url: string; alt: string; title: string; }> =>
{
    const list = (data.MaterialPicture ?? []).map(pic =>
    {
        const alt = pic.PictureName ?? title;
        const url = FileManagementAPI.get_Public_Preview_Url(pic.PictureId, alt) ?? "";
        return url ? { url, alt, title: pic.PictureName ?? title } : null;
    }).filter((p): p is { url: string; alt: string; title: string; } => Boolean(p));
    return list;
};
/** 建立規格列 */
const buildSpecRows = (rawData: MaterialFormRawData, json: MaterialInfoJson): Array<{ label: string; value: string; }> =>
{
    const baseRows = [{ label: "分類", value: rawData.categoryNameText }, { label: "標籤", value: rawData.tagNameText }];
    const dynamicRows = buildDynamicSpecRows(rawData.matCateInfoFieldsMap, json);
    return [...baseRows, ...dynamicRows].filter(p => p.value);
};

/** 建立動態規格列 */
const buildDynamicSpecRows = (
    fieldMap: Map<string, string> | Record<string, string> | Array<[string, string]> | null | undefined,
    json: MaterialInfoJson,
): Array<{ label: string; value: string; }> =>
{
    return getFieldEntries(fieldMap).map(([fieldId, label]) =>
    {
        const value = getSpecFieldValue(fieldId, json[fieldId]);
        return { label, value };
    });
};
// #endregion

// #region Private
/** 初始化 Material 圖片燈箱 */
const initMaterialVenoBox = (): void =>
{
    if (typeof window === "undefined" || !window.VenoBox) return;
    window.__materialVenoBox?.destroy?.();
    window.__materialVenoBox = new window.VenoBox({
        selector: ".material-venobox",
        autoplay: false,
        maxWidth: "1200px",
        border: "0px",
        titleattr: "title",
        titlePosition: "top",
        numeration: true,
        infinigall: true,
        share: true,
        spinner: "rotating-bounce",
    });
};
/** 開啟指定圖片燈箱 */
const openMaterialLightbox = (e: MouseEvent<HTMLAnchorElement>, index: number, refs: Array<HTMLAnchorElement | null>): void =>
{
    e.preventDefault();
    refs[index]?.click();
};
/** 取得循環圖片索引 */
const getLoopPictureIndex = (index: number, total: number): number =>
{
    if (total <= 0) return 0;
    return ((index % total) + total) % total;
};
/** 處理縮圖鍵盤切換 */
const handleThumbKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number, setActiveIndex: (index: number) => void): void =>
{
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setActiveIndex(index);
};
/** 取得目前語系資料 */
const getLangInfo = (data: MaterialSet, lang: Lang) =>
{
    const list = data.MaterialLangInfo ?? [];
    return list.find(p => p.Lang === lang) ?? list[0];
};
/** 取得動態欄位項目 */
const getFieldEntries = (fieldMap: Map<string, string> | Record<string, string> | Array<[string, string]> | null | undefined): Array<[string, string]> =>
{
    if (!fieldMap) return [];
    if (fieldMap instanceof Map) return Array.from(fieldMap.entries());
    if (Array.isArray(fieldMap)) return fieldMap;
    return Object.entries(fieldMap);
};
/** 取得規格欄位顯示值 */
const getSpecFieldValue = (fieldId: string, value: string | number | boolean | null | undefined): string =>
{
    const safeFieldId = fieldId.toLowerCase();
    if (safeFieldId.includes("price")) return formatPrice(value);
    return getFirstNonEmptyText(value);
};
/** 解析 MaterialInfoJson */
const parseMaterialInfoJson = (jsonText?: string | null): MaterialInfoJson =>
{
    try
    {
        return jsonText ? JSON.parse(jsonText) as MaterialInfoJson : {};
    } catch
    {
        return {};
    }
};
/** 價格格式 */
const formatPrice = (value?: string | number | boolean | null): string =>
{
    const text = getFirstNonEmptyText(value);
    return text ? `NT$ ${text} 元` : "";
};
// #endregion
