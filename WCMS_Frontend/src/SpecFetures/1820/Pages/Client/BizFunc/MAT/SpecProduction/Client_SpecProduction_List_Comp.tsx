import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { Module_SpecProduction_OptionsJson } from "@/SpecFetures/1820/Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { type AnchorActionEvent, useAnchorButtonAction } from "@/SysCore/Utils/UI_HookFunc/useAnchorPreventDefaultClick";
import type { components } from "@/types/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
    type SpecProductionGroup,
    type SpecProductionInfoField,
    useClientSpecProductionListFetchData,
} from "./Client_SpecProduction_List_Loader";

// #region Property
type MaterialFormModel = components["schemas"]["Material"];
export interface ClientSpecProductionListProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    opts?: Module_SpecProduction_OptionsJson;
}
type MaterialInfoJsonValue = string | number | boolean | null;
type MaterialInfoJsonMap = Record<string, MaterialInfoJsonValue>;
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
            <SpecProductionContent
                lang={props.lang}
                intro={fetchData.rawData.pageContent}
                catName={fetchData.rawData.catName}
                groups={fetchData.rawData.groups}
                infoFields={fetchData.rawData.infoFields}
                viewMoreText="View More"
            />
        </ModuleContent>
    );
};
// #endregion

// #region Protected
/// <summary>
/// 依類別欄位設定產生動態資訊列。
/// </summary>
const buildMaterialInfoRows = (item: MaterialFormModel, lang: Lang, infoFields: SpecProductionInfoField[]) =>
{
    const langInfo = getMaterialLangInfo(item, lang);
    const infoJson = parseMaterialInfoJson(langInfo?.MaterialInfoJson);
    return infoFields.map((field) =>
    {
        const valueText = formatInfoValue(infoJson[field.field] ?? null);
        return { fieldKey: field.field, displayName: field.label || field.field, valueText };
    }).filter((row) => row.fieldKey && row.valueText);
};

// #endregion

// #region Private
/// <summary>
/// 渲染情境圖文導覽主要內容。
/// </summary>
const SpecProductionContent = (props: {
    lang: Lang;
    intro?: string;
    catName?: string;
    groups: SpecProductionGroup[];
    infoFields: SpecProductionInfoField[];
    viewMoreText: string;
}) =>
{
    const defaultActiveTabId = props.groups[0]?.tagId ?? "";
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

        setActiveTabId((current) => props.groups.some((group) => group.tagId === current) ? current : defaultActiveTabId);
        setIsTabVisible(true);
    }, [props.groups, defaultActiveTabId]);

    const activeGroup = useMemo(
        () => props.groups.find((group) => group.tagId === currentActiveTabId),
        [props.groups, currentActiveTabId],
    );
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
                    {props.groups.length > 0 && (
                        <>
                            <ProductionTabs groups={props.groups} activeTabId={currentActiveTabId} onChange={changeTab} />
                            <div style={{ opacity: isTabVisible ? 1 : 0, transition: "opacity 220ms ease" }}>
                                {activeGroup && (
                                    <ProductionTabPanel
                                        lang={props.lang}
                                        group={activeGroup}
                                        infoFields={props.infoFields}
                                        viewMoreText={props.viewMoreText}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

/// <summary>
/// 渲染物件類別 Tab。
/// </summary>
const ProductionTabs = (
    { groups, activeTabId, onChange }: { groups: SpecProductionGroup[]; activeTabId: string; onChange: (id: string) => void; },
) =>
{
    /** 透過共用 Anchor Button Hook 切換目前 Tab。 */
    const handleTabAction = useCallback((event: AnchorActionEvent) =>
    {
        const id = event.currentTarget.dataset.tabId ?? "";
        onChange(id);
    }, [onChange]);
    const tabAction = useAnchorButtonAction(handleTabAction);

    return (
        <div className="Horizontal nav-tabs-list">
            <ul className="nav nav-tabs" role="tablist">
                {groups.map((group) => (
                    <li key={group.tagId} className="nav-item + me-3" role="presentation">
                        <a
                            href="#"
                            className={`more-link font-wt-lg ${group.tagId === activeTabId ? "active" : ""}`}
                            role="tab"
                            aria-selected={group.tagId === activeTabId}
                            aria-controls={`H-navTabs-${group.tagId}`}
                            id={`H-Tabs__${group.tagId}`}
                            data-tab-id={group.tagId}
                            {...tabAction}
                        >
                            <span className="vm">{group.tagName}</span>
                            <span className="ms-1">〉</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/// <summary>
/// 渲染目前選取的 Tab 內容。
/// </summary>
const ProductionTabPanel = (props: {
    lang: Lang;
    group: SpecProductionGroup;
    infoFields: SpecProductionInfoField[];
    viewMoreText: string;
}) =>
{
    return (
        <div className="tab-content" id="H-nav-tabContent">
            <div id={`H-navTabs-${props.group.tagId}`} className="tab-pane fade show active" role="tabpanel" aria-labelledby={`H-Tabs__${props.group.tagId}`}>
                <div className="SC-headerBox">
                    <div className="d-flex align-items-center">
                        <div className="SC-header-title + me-3">{props.group.tagName}</div>
                        <span className="text-muted opacity-50">...</span>
                    </div>
                    <div className="SC-header-smalll">{`${props.group.items.length} 筆資料`}</div>
                </div>
                <ProductionCarousel
                    lang={props.lang}
                    items={props.group.items}
                    infoFields={props.infoFields}
                    viewMoreText={props.viewMoreText}
                />
            </div>
        </div>
    );
};

/// <summary>
/// 用 React 狀態模擬 Owl 結構，處理播放、暫停、自動輪播與左右滑動。
/// </summary>
const ProductionCarousel = (props: { lang: Lang; items: MaterialFormModel[]; infoFields: SpecProductionInfoField[]; viewMoreText: string; }) =>
{
    const [trackIndex, setTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
    const animationLockRef = useRef(false);
    const resetTimerRef = useRef<number | null>(null);

    const hasMany = props.items.length > 1;
    const toggleLabel = isPlaying ? "圖片輪播播放中，點擊暫停" : "圖片輪播已暫停，點擊播放";
    const toggleIconClass = isPlaying ? "control-pause-icon" : "control-play-icon";

    const carouselItems = useMemo<MaterialFormModel[]>(() =>
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
                        href="#"
                        className="toggle ms-1"
                        aria-label={toggleLabel}
                        aria-pressed={isPlaying}
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
                            <div key={`${item.InternalId ?? item.MaterialId ?? "mat"}_${idx}`} className={`owl-item ${idx === trackIndex ? "active" : ""}`} style={{ flex: "0 0 100%", width: "100%" }}>
                                <div className="item">
                                    <ProductionCard lang={props.lang} item={item} infoFields={props.infoFields} viewMoreText={props.viewMoreText} />
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
const getMaterialLangInfo = (item: MaterialFormModel, lang: Lang) =>
{
    return item._MaterialLangInfo?.find((detail) => detail.Lang === lang) ?? item._MaterialLangInfo?.[0];
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
/// 依 RowNo、RowId 穩定取得第一張物件圖片。
/// </summary>
const getFirstMaterialPicture = (item: MaterialFormModel) =>
{
    return [...(item._MaterialPicture ?? [])].sort((left, right) =>
    {
        const leftOrder = Number(left.RowNo ?? 0) > 0 ? Number(left.RowNo) : Number.MAX_SAFE_INTEGER;
        const rightOrder = Number(right.RowNo ?? 0) > 0 ? Number(right.RowNo) : Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || Number(left.RowId ?? 0) - Number(right.RowId ?? 0);
    })[0];
};

/// <summary>
/// 渲染單一物件資訊卡。
/// </summary>
const ProductionCard = (props: {
    lang: Lang;
    item: MaterialFormModel;
    infoFields: SpecProductionInfoField[];
    viewMoreText: string;
}) =>
{
    const image = getFirstMaterialPicture(props.item);
    const langInfo = getMaterialLangInfo(props.item, props.lang);
    const matName = langInfo?.MaterialName ?? "";
    const infoRows = buildMaterialInfoRows(props.item, props.lang, props.infoFields);
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
                                        to={`${dirUrl}/${props.item.InternalId ?? ""}`}
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
