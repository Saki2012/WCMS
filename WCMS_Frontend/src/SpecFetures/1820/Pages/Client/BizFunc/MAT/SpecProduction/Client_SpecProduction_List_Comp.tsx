import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { Module_SpecProduction_OptionsJson } from "@/SpecFetures/1820/Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { findTextByKey } from "@/SysCore/Utils/Library/LibData";
import { type AnchorActionEvent, useAnchorButtonAction } from "@/SysCore/Utils/UI_HookFunc/useAnchorPreventDefaultClick";
import type { components } from "@/types/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useClientSpecProductionListFetchData } from "./Client_SpecProduction_List_Loader";

// #region Property
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialPicture = components["schemas"]["MaterialPicture_DTO"];
type MaterialTag = components["schemas"]["MaterialTags_DTO"];
type MatCategoryInfoField = components["schemas"]["MatCategoryInfoField_DTO"];
export interface ClientSpecProductionListProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    opts?: Module_SpecProduction_OptionsJson;
}
type MaterialInfoJsonValue = string | number | boolean | null;
type MaterialInfoJsonMap = Record<string, MaterialInfoJsonValue>;

interface ProductionTabsProps
{
    lang: Lang;
    tagList: MaterialTag[];
    activeTabId: string;
    onChange: (id: string) => void;
}

interface ProductionTabKeyboardHandlers
{
    registerTab: (id: string, element: HTMLAnchorElement | null) => void;
    onClick: React.MouseEventHandler<HTMLAnchorElement>;
    onKeyDown: React.KeyboardEventHandler<HTMLAnchorElement>;
}
// #endregion

// #region Public
/// <summary>
/// 前台情境圖文導覽列表頁，ModuleContent 負責共用內頁外框。
/// </summary>
export const Client_SpecProduction_List_Comp = (props: ClientSpecProductionListProps) =>
{
    const fetchData = useClientSpecProductionListFetchData({ lang: props.lang, options: props.opts });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => ({ mode: "list" }), []);
    return (
        <ModuleContent nodeTitle={props.node.title} isLoading={fetchData.isLoading} errorList={fetchData.errorList} viewCountConfig={viewCountConfig}>
            <SpecProductionContent lang={props.lang} intro={fetchData.rawData.pageContent} catName={fetchData.rawData.catName} matDataList={fetchData.rawData.prodData} viewMoreText={"View More"} />
        </ModuleContent>
    );
};
// #endregion

// #region Protected
/// <summary>
/// 依類別欄位設定產生動態資訊列。
/// </summary>
const buildMaterialInfoRows = (item: MaterialSet, lang: Lang) =>
{
    const langInfo = getMaterialLangInfo(item, lang);
    const infoJson = parseMaterialInfoJson(langInfo?.MaterialInfoJson);
    const fields = sortMaterialInfoFields(item.Material?.Category?._MatCategoryInfoField ?? []);
    return fields.map((field) =>
    {
        const fieldKey = field.Field ?? "";
        const displayName = field._MatCategoryInfoFieldDisplay?.find((p) => p.Lang === lang)?.FieldDisplayName ?? fieldKey;
        const valueText = formatInfoValue(infoJson[fieldKey] ?? null);
        return { fieldKey, displayName, valueText };
    }).filter((p) => p.fieldKey && p.valueText);
};

/// <summary>
/// 依 RowNo、RowId 穩定排序自定義欄位。
/// </summary>
const sortMaterialInfoFields = (fields: MatCategoryInfoField[]): MatCategoryInfoField[] =>
{
    return [...fields].sort((left, right) => getMaterialInfoFieldOrder(left) - getMaterialInfoFieldOrder(right) || Number(left.RowId ?? 0) - Number(right.RowId ?? 0));
};

/// <summary>
/// 取得排序值，未設定 RowNo 的舊資料排到最後。
/// </summary>
const getMaterialInfoFieldOrder = (field: MatCategoryInfoField): number =>
{
    const rowNo = Number(field.RowNo ?? 0);
    return rowNo > 0 ? rowNo : Number.MAX_SAFE_INTEGER;
};
// #endregion

// #region Private
/// <summary>
/// 渲染情境圖文導覽主要內容。
/// </summary>
const SpecProductionContent = (props: { lang: Lang; intro?: string; catName?: string; matDataList: Map<MaterialTag, MaterialSet[]>; viewMoreText: string; }) =>
{
    const tagList = useMemo<MaterialTag[]>(() => Array.from(props.matDataList.keys()).filter((tag) => Boolean(tag.TagId)), [props.matDataList]);
    const defaultActiveTabId = tagList[0]?.TagId ?? "";
    const [activeTabId, setActiveTabId] = useState<string>(defaultActiveTabId);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const currentActiveTabId = activeTabId || defaultActiveTabId;

    /// <summary>
    /// 切換 Tab 時先淡出，再更新目前分類。
    /// </summary>
    const changeTab = (id: string) =>
    {
        if (!id || id === currentActiveTabId) return;

        setIsTabVisible(false);
        window.setTimeout(() =>
        {
            setActiveTabId(id);
            window.requestAnimationFrame(() => setIsTabVisible(true));
        }, 160);
    };

    /// <summary>
    /// 資料更新時，確保目前選取的 Tab 仍存在。
    /// </summary>
    useEffect(() =>
    {
        if (!defaultActiveTabId)
        {
            setActiveTabId("");
            setIsTabVisible(true);
            return;
        }

        setActiveTabId((current) => tagList.some((tag) => tag.TagId === current) ? current : defaultActiveTabId);
        setIsTabVisible(true);
    }, [tagList, defaultActiveTabId]);

    const activeTab = useMemo(() => tagList.find((p) => p.TagId === currentActiveTabId), [tagList, currentActiveTabId]);

    const activeItems = useMemo<MaterialSet[]>(() =>
    {
        if (!activeTab) return [];
        return props.matDataList.get(activeTab) ?? [];
    }, [props.matDataList, activeTab]);

    const titleText = `查看${props.catName ?? ""}類型`;

    return (
        <>
            <div className="SubDivBox_style + Sub + Layout_Padding_4">
                <CmsHtml_Comp html={props.intro ?? ""} lang={props.lang} />
            </div>

            <div className="page-header mb-3">
                <div className="Div_H3_Title">{titleText}</div>
            </div>

            <hr className="hr-my-4" />

            <div className="SubInfoDivBox_Style + Layout_Padding_4_bottom + SharedCarouselDivBox owl-box">
                <div id="Horizontal" className="H-nav-tabs-content-box">
                    {props.matDataList.size > 0 && (
                        <>
                            <ProductionTabs lang={props.lang} tagList={tagList} activeTabId={currentActiveTabId} onChange={changeTab} />
                            <div style={{ opacity: isTabVisible ? 1 : 0, transition: "opacity 220ms ease" }}>
                                {activeTab && <ProductionTabPanel lang={props.lang} activeTab={activeTab} items={activeItems} viewMoreText={props.viewMoreText} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

/// <summary>
/// 取得 Tag 顯示名稱。
/// </summary>
const getTagName = (tag: MaterialTag, lang: Lang): string =>
{
    return findTextByKey(tag.Tag?._TagDetail, (p) => p?.Lang, lang, (p) => p?.TagName);
};

/// <summary>
/// 依方向鍵、Home、End 計算下一個應聚焦的頁籤位置。
/// </summary>
const getProductionTabTargetIndex = (key: string, currentIndex: number, tabCount: number): number | null =>
{
    if (currentIndex < 0 || tabCount <= 0) return null;
    if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
    if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
    if (key === "Home") return 0;
    if (key === "End") return tabCount - 1;
    return null;
};

/// <summary>
/// 管理頁籤方向鍵焦點，以及 Enter、Space 手動切換內容。
/// </summary>
const useProductionTabKeyboard = (tabIds: string[], onChange: (id: string) => void): ProductionTabKeyboardHandlers =>
{
    const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const handleTabAction = useCallback((event: AnchorActionEvent) =>
    {
        onChange(event.currentTarget.dataset.tabId ?? "");
    }, [onChange]);
    const tabAction = useAnchorButtonAction(handleTabAction);

    const registerTab = useCallback((id: string, element: HTMLAnchorElement | null) =>
    {
        tabRefs.current[id] = element;
    }, []);

    const onKeyDown = useCallback<React.KeyboardEventHandler<HTMLAnchorElement>>((event) =>
    {
        tabAction.onKeyDown(event);

        const currentId = event.currentTarget.dataset.tabId ?? "";
        const currentIndex = tabIds.indexOf(currentId);
        const targetIndex = getProductionTabTargetIndex(event.key, currentIndex, tabIds.length);
        if (targetIndex === null) return;

        event.preventDefault();
        const targetId = tabIds[targetIndex] ?? "";
        tabRefs.current[targetId]?.focus();
    }, [tabAction, tabIds]);

    return { registerTab, onClick: tabAction.onClick, onKeyDown };
};

/// <summary>
/// 渲染物件類別 Tab。
/// </summary>
const ProductionTabs = (
    { lang, tagList, activeTabId, onChange }: ProductionTabsProps,
) =>
{
    const tabIds = useMemo(() => tagList.map((tag) => tag.TagId ?? "").filter(Boolean), [tagList]);
    const keyboard = useProductionTabKeyboard(tabIds, onChange);

    return (
        <div className="Horizontal nav-tabs-list">
            <ul className="nav nav-tabs" role="tablist" aria-orientation="horizontal">
                {tagList.map((tag) =>
                {
                    const id = tag.TagId ?? "";
                    const name = getTagName(tag, lang);

                    return (
                        <li key={id} className="nav-item + me-3" role="presentation">
                            <a
                                href="#"
                                type="button"
                                className={`more-link font-wt-lg ${id === activeTabId ? "active" : ""}`}
                                role="tab"
                                aria-selected={id === activeTabId}
                                aria-controls={`H-navTabs-${id}`}
                                id={`H-Tabs__${id}`}
                                data-tab-id={id}
                                tabIndex={id === activeTabId ? 0 : -1}
                                ref={(element) => keyboard.registerTab(id, element)}
                                onClick={keyboard.onClick}
                                onKeyDown={keyboard.onKeyDown}
                            >
                                <span className="vm">{name}</span>
                                <span className="ms-1">〉</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

/// <summary>
/// 渲染目前選取的 Tab 內容。
/// </summary>
const ProductionTabPanel = ({ lang, activeTab, items, viewMoreText }: { lang: Lang; activeTab: MaterialTag; items: MaterialSet[]; viewMoreText: string; }) =>
{
    const tagName = getTagName(activeTab, lang);

    return (
        <div className="tab-content" id="H-nav-tabContent">
            <div id={`H-navTabs-${activeTab.TagId}`} className="tab-pane fade show active" role="tabpanel" aria-labelledby={`H-Tabs__${activeTab.TagId}`}>
                <div className="SC-headerBox">
                    <div className="d-flex align-items-center">
                        <div className="SC-header-title + me-3">{tagName}</div>
                        <span className="text-muted opacity-50">...</span>
                    </div>
                    <div className="SC-header-smalll">{`${items.length} 筆資料`}</div>
                </div>
                <ProductionCarousel lang={lang} items={items} viewMoreText={viewMoreText} />
            </div>
        </div>
    );
};

/// <summary>
/// 用 React 狀態模擬 Owl 結構，處理播放、暫停、自動輪播與左右滑動。
/// </summary>
const ProductionCarousel = (props: { lang: Lang; items: MaterialSet[]; viewMoreText: string; }) =>
{
    const [trackIndex, setTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
    const animationLockRef = useRef(false);
    const resetTimerRef = useRef<number | null>(null);

    const hasMany = props.items.length > 1;
    const toggleLabel = isPlaying ? "圖片輪播播放中，點擊暫停" : "圖片輪播已暫停，點擊播放";
    const toggleIconClass = isPlaying ? "control-pause-icon" : "control-play-icon";

    const carouselItems = useMemo<MaterialSet[]>(() =>
    {
        if (!hasMany) return props.items;

        const firstItem = props.items[0];
        const lastItem = props.items[props.items.length - 1];
        if (!firstItem || !lastItem) return props.items;

        return [lastItem, ...props.items, firstItem];
    }, [hasMany, props.items]);

    /// <summary>
    /// 清除延遲恢復動畫的計時器，避免快速切換時殘留狀態。
    /// </summary>
    const clearResetTimer = () =>
    {
        if (resetTimerRef.current === null) return;
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
    };

    /// <summary>
    /// 瞬間跳到指定位置，讓複製項目銜接回真實項目時不產生倒退動畫。
    /// </summary>
    const jumpWithoutAnimation = (nextTrackIndex: number) =>
    {
        clearResetTimer();
        setIsTransitionEnabled(false);
        setTrackIndex(nextTrackIndex);

        resetTimerRef.current = window.setTimeout(() =>
        {
            setIsTransitionEnabled(true);
            animationLockRef.current = false;
            resetTimerRef.current = null;
        }, 30);
    };

    /// <summary>
    /// 執行輪播位移，動畫期間鎖定避免連點造成索引錯亂。
    /// </summary>
    const moveSlide = (step: number) =>
    {
        if (!hasMany || animationLockRef.current) return;

        animationLockRef.current = true;
        setIsTransitionEnabled(true);
        setTrackIndex((current) => current + step);
    };

    /// <summary>
    /// 切換分類或資料時回到第一筆並暫停。
    /// </summary>
    useEffect(() =>
    {
        clearResetTimer();
        animationLockRef.current = false;
        setTrackIndex(props.items.length > 1 ? 1 : 0);
        setIsPlaying(false);
        setIsTransitionEnabled(false);

        resetTimerRef.current = window.setTimeout(() =>
        {
            setIsTransitionEnabled(true);
            resetTimerRef.current = null;
        }, 30);
    }, [props.items]);

    /// <summary>
    /// 元件卸載時清除計時器。
    /// </summary>
    useEffect(() => () => clearResetTimer(), []);

    /// <summary>
    /// 播放狀態下每五秒往下一筆滑動，最後一筆後繼續往右銜接第一筆。
    /// </summary>
    useEffect(() =>
    {
        if (!isPlaying || !hasMany) return;

        const timer = window.setInterval(() => moveSlide(1), 5000);
        return () => window.clearInterval(timer);
    }, [isPlaying, hasMany]);

    /// <summary>
    /// 動畫完成後，若目前停在複製項目，立即切回對應真實項目。
    /// </summary>
    const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) =>
    {
        if (event.target !== event.currentTarget) return;

        if (trackIndex <= 0)
        {
            jumpWithoutAnimation(props.items.length);
            return;
        }

        if (trackIndex >= props.items.length + 1)
        {
            jumpWithoutAnimation(1);
            return;
        }

        animationLockRef.current = false;
    };

    /// <summary>
    /// 切到上一筆資料，第一筆再往前會循環到最後一筆。
    /// </summary>
    const goPrev = () => moveSlide(-1);

    /// <summary>
    /// 切到下一筆資料，最後一筆再往後會持續向右銜接第一筆。
    /// </summary>
    const goNext = () => moveSlide(1);

    /// <summary>
    /// 切換播放與暫停狀態。
    /// </summary>
    const togglePlay = (e: React.MouseEvent<HTMLAnchorElement>) =>
    {
        e.preventDefault();
        if (!hasMany) return;
        setIsPlaying((p) => !p);
    };

    if (props.items.length <= 0) return null;

    return (
        <div className="content-box px-0 mb-5">
            <div className="DIV-singleBox">
                <div className="control-singlebox">
                    <a
                        href="javascript:void(0);"
                        className="toggle ms-1"
                        aria-label={toggleLabel}
                        aria-pressed={isPlaying}
                        tabIndex={0}
                        title={isPlaying ? "暫停" : "播放"}
                        onClick={togglePlay}
                    >
                        <div className={`control-toggle ${toggleIconClass}`}>
                            <span className="sr-only">{toggleLabel}</span>
                        </div>
                    </a>
                </div>
            </div>

            <div className="owl-carousel owl-theme owl-loaded owl-drag">
                <div className="owl-stage-outer">
                    <div
                        className="owl-stage"
                        style={{
                            display: "flex",
                            width: "100%",
                            transform: `translate3d(-${trackIndex * 100}%, 0, 0)`,
                            transition: isTransitionEnabled ? "transform 450ms ease" : "none",
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {carouselItems.map((item, idx) => (
                            <div key={`${item.Material?.InternalId ?? "mat"}_${idx}`} className={`owl-item ${idx === trackIndex ? "active" : ""}`} style={{ flex: "0 0 100%", width: "100%" }}>
                                <div className="item">
                                    <ProductionCard lang={props.lang} item={item} viewMoreText={props.viewMoreText} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {hasMany && (
                    <div className="owl-nav" aria-label="圖片輪播控制">
                        <button type="button" className="owl-prev" aria-label="上一張" title="上一張" onClick={goPrev}>
                            <span aria-hidden="true">
                                <span className="d-none">上一張</span>
                            </span>
                        </button>
                        <button type="button" className="owl-next" aria-label="下一張" title="下一張" onClick={goNext}>
                            <span aria-hidden="true">
                                <span className="d-none">下一張</span>
                            </span>
                        </button>
                    </div>
                )}

                <div className="owl-dots disabled"></div>
            </div>
        </div>
    );
};

/// <summary>
/// 解析 MaterialInfoJson，支援後端回傳物件或 JSON 字串。
/// </summary>
const parseMaterialInfoJson = (source?: string | MaterialInfoJsonMap | null): MaterialInfoJsonMap =>
{
    if (!source) return {};
    if (typeof source !== "string") return source;

    try
    {
        return JSON.parse(source) as MaterialInfoJsonMap;
    } catch
    {
        return {};
    }
};

/// <summary>
/// 取得目前語系的物件語系資料。
/// </summary>
const getMaterialLangInfo = (item: MaterialSet, lang: Lang) =>
{
    return item.MaterialLangInfo?.find((p) => p.Lang === lang);
};

/// <summary>
/// 將 Json 欄位值轉成畫面文字。
/// </summary>
const formatInfoValue = (value: MaterialInfoJsonValue): string =>
{
    if (value === null) return "";
    if (typeof value === "boolean") return value ? "是" : "否";
    return String(value);
};

/// <summary>
/// 取得 RowNo 最前面的物件主圖。
/// </summary>
const getPrimaryMaterialPicture = (pictures?: MaterialPicture[] | null): MaterialPicture | undefined =>
{
    return [...(pictures ?? [])].sort((left, right) =>
    {
        return getMaterialPictureOrder(left) - getMaterialPictureOrder(right)
            || Number(left.RowId ?? 0) - Number(right.RowId ?? 0);
    })[0];
};

/// <summary>
/// 取得相片排序值，舊資料沒有 RowNo 時排到最後。
/// </summary>
const getMaterialPictureOrder = (picture: MaterialPicture): number =>
{
    const rowNo = Number(picture.RowNo ?? 0);
    return rowNo > 0 ? rowNo : Number.MAX_SAFE_INTEGER;
};

/// <summary>
/// 渲染單一物件資訊卡。
/// </summary>
const ProductionCard = (props: { lang: Lang; item: MaterialSet; viewMoreText: string; }) =>
{
    const image = getPrimaryMaterialPicture(props.item.MaterialPicture);
    const langInfo = getMaterialLangInfo(props.item, props.lang);
    const matName = langInfo?.MaterialName ?? "";
    const infoRows = buildMaterialInfoRows(props.item, props.lang);
    const imageUrl = image?.PictureId ? FileManagementAPI.get_Public_Preview_Url(image.PictureId) : "";
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    return (
        <div className="sc-item">
            <div className="SC-row">
                <div className="SC-image-container">
                    {imageUrl ? <img src={imageUrl} alt={image?.PictureName ?? ""} /> : <div className="SC-image-placeholder" aria-hidden="true"></div>}
                </div>

                <div className="SC-info-card">
                    <div className="SC-content">
                        <div className="Info_All_Content">
                            <ul>
                                <InfoRow className="Div_H3_Title fw-bold" text={matName} />
                                {infoRows.map((row) => <InfoRow key={row.fieldKey} text={`${row.displayName}：${row.valueText}`} />)}
                            </ul>
                        </div>

                        {props.item && (
                            <div className="d-flex justify-content-start align-items-center">
                                <div className="more-link-box">
                                    <LangLink
                                        to={`${dirUrl}/${props.item.Material?.InternalId}`}
                                        className="more-link font-wt-lg"
                                        title={`查看更多：${matName}`}
                                    >
                                        <span className="vm">{props.viewMoreText}</span>
                                        <span className="ms-1">〉</span>
                                    </LangLink>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/// <summary>
/// 渲染資訊列，空資料不輸出。
/// </summary>
const InfoRow = ({ text, className }: { text: string; className?: string; }) =>
{
    if (!text) return null;

    return (
        <li className="li_row">
            <div className={`col-12 ${className ?? ""}`}>{text}</div>
        </li>
    );
};
// #endregion
