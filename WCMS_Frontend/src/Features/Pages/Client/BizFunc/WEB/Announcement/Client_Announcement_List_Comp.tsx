import { formatCategoriesName } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { formatTagsName } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useAnnouncementListData } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Loader";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { applyGridColumnWidths, readGridColumnWidths, writeGridColumnWidths } from "@/SysCore/Components/Grid/Grid_ColumnWidth";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibDate, LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_HookFunc/useOptionalSpecAssetUrl";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getClientSlotPath } from "../../../Scaffold/Slot/Client_SlotPath";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
export interface IAnnouncementListOptions
{
    Category?: string;
    Tag?: string;
    Style?: number;
}
export interface IAnnouncementListProps
{
    theme: IFETheme;
    lang: Lang;
    options?: IAnnouncementListOptions;
    site: INormSite;
    node: INormNode;
}
type NativeMouseEventWithStopImmediate = MouseEvent & { stopImmediatePropagation?: () => void; };
const ANNOUNCEMENT_GRID_COLUMN_WIDTH_STORAGE_KEY = "client-announcement-grid-column-widths";
type AnnouncementListVm = ReturnType<typeof useAnnouncementListData>;

export interface AnnouncementListViewProps extends IAnnouncementListProps
{
    /** 目前列表基準路徑，供明細連結使用。 */
    dirUrl: string;
    /** Feature List Hook 整理後的公告清單資料。 */
    vm: AnnouncementListVm;
    /** Feature 基礎欄位與 Spec 欄位擴充後的 Grid 設定。 */
    adjustedGrid: GridProps;
}

export interface AnnouncementListGridContext
{
    lang: Lang;
    dirUrl: string;
    gridProps: GridProps;
    rawData: AnnouncementSet[];
    categoryData: CategorySet[];
    tagData: TagSet[];
}

export interface AnnouncementListGridRowContext extends AnnouncementListGridContext
{
    rowData?: AnnouncementSet;
    rowIndex: number;
    columns: ColumnConfig[];
}

export interface AnnouncementListGridSpecSlot
{
    /** 調整公告清單欄位，可用於隱藏、新增、排序欄位。 */
    resolveGridColumns?: (columns: ColumnConfig[], context: AnnouncementListGridContext) => ColumnConfig[];
    /** 調整公告清單每列 cells，可用於追加或改寫客製欄位內容。 */
    resolveGridCells?: (cells: RowCell[], context: AnnouncementListGridRowContext) => RowCell[];
}

export interface AnnouncementListCompSpecSlot
{
    /** 公告清單主內容上方追加區塊，供 Spec 在不覆寫 Feature View 的情況補內容。 */
    BeforeListContent?: ComponentType<AnnouncementListViewProps>;
    /** 公告清單主內容下方追加區塊，供 Spec 在不覆寫 Feature View 的情況補內容。 */
    AfterListContent?: ComponentType<AnnouncementListViewProps>;
}
// #endregion

// #region Initialization
const extendAnnouncementListGridSpec: AnnouncementListGridSpecSlot = {};
/** Announcement List Grid Spec 快取，避免 top-level 立即解析造成循環載入。 */
let announcementListGridSpecCache: AnnouncementListGridSpecSlot | null = null;
/** Announcement List View 快取，避免每次 render 重複解析 Spec View。 */
let announcementListViewCache: typeof Client_Announcement_List_FeatureView | null = null;
/** Announcement List Comp Spec 空擴充，讓 Spec 可以不覆寫 Feature View 追加區塊。 */
const extendAnnouncementListCompSpec: AnnouncementListCompSpecSlot = {};
/** Announcement List Comp Spec 快取，避免每次 render 重複解析 Spec。 */
let announcementListCompSpecCache: AnnouncementListCompSpecSlot | null = null;
// #endregion

// #region Public
/** 公告清單完整 Comp，負責取得 Feature Hook 資料，再交給 List Entry。 */
export const Client_Announcement_List_Comp = (props: IAnnouncementListProps) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    const vm = useAnnouncementListData({ lang: props.lang, opts: props.options });
    const adjustedGrid = useMemo(() =>
    {
        return SetAdjustFunction({
            lang: props.lang,
            dirUrl,
            gridProps: vm.gridPropsFromList,
            rawData: vm.listData,
            categoryData: vm.categoryData,
            tagData: vm.tagData,
        });
    }, [props.lang, dirUrl, vm.gridPropsFromList, vm.listData, vm.categoryData, vm.tagData]);

    return <Client_Announcement_List {...props} dirUrl={dirUrl} vm={vm} adjustedGrid={adjustedGrid} />;
};

/** 公告清單 ListView Entry，正式前台統一從這裡進入 Spec / Feature DOM。 */
export const Client_Announcement_List = (props: AnnouncementListViewProps) =>
{
    const ListView = getAnnouncementListView();
    return <ListView {...props} />;
};

/** 公告清單 Feature 預設 View，只負責輸出 DOM。 */
const Client_Announcement_List_FeatureView = (props: AnnouncementListViewProps) =>
{
    const compSpec = getAnnouncementListCompSpec();
    const BeforeListContent = compSpec.BeforeListContent;
    const AfterListContent = compSpec.AfterListContent;
    const children = useMemo(() =>
    {
        switch (props.options?.Style)
        {
            case 8:
                return <TimelineSlider dirUrl={props.dirUrl} lang={props.lang} data={props.vm.listData} />;
            case 3:
                return <QAList_Comp lang={props.lang} gridData={props.vm.listData} currentPage={props.vm.pageNumber} pageSize={props.vm.pageSize} />;
            case 2:
                return <PictureList_Row_Comp dirUrl={props.dirUrl} lang={props.lang} gridData={props.vm.listData} categoryData={props.vm.categoryData} />;
            case 1:
            default:
                return <GridList_Comp key={`grid-${props.lang}`} lang={props.lang} gridData={props.adjustedGrid} title={props.node.title} />;
        }
    }, [props.options?.Style, props.dirUrl, props.lang, props.node.title, props.vm.listData, props.vm.pageNumber, props.vm.pageSize, props.vm.categoryData, props.adjustedGrid]);

    return (
        <>
            <ModuleContent
                nodeTitle={props.node.title}
                isLoading={props.vm.isLoading}
                errorList={props.vm.errorList}
                paginatorProps={props.vm.paginatorProps}
                searchBar={props.vm.searchBar}
                viewCountConfig={{ mode: "list" }}
            >
                {BeforeListContent && <BeforeListContent {...props} />}
                {children}
            </ModuleContent>
            {AfterListContent && <AfterListContent {...props} />}
        </>
    );
};
// #endregion

// #region Section
const GridList_Comp = (props: { lang: Lang; title: string; gridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    useEffect(() =>
    {
        const widths = readGridColumnWidths(ANNOUNCEMENT_GRID_COLUMN_WIDTH_STORAGE_KEY);
        const nextColumns = Object.keys(widths).length > 0 ? applyGridColumnWidths(props.gridData.columns, widths) : props.gridData.columns;
        setColumns(nextColumns);
    }, [props.gridData.columns]);
    const handleResize = (index: number, width: number): void =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            writeGridColumnWidths(ANNOUNCEMENT_GRID_COLUMN_WIDTH_STORAGE_KEY, updated);
            return updated;
        });
    };
    return (
        <>
            <OperationGuideHelp_Comp lang={props.lang} />
            <table className={"table table-striped table-bordered table-hover table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.gridData.rows} />
            </table>
        </>
    );
};
const PictureList_Row_Comp = (props: { dirUrl: string; lang: Lang; gridData: AnnouncementSet[]; categoryData: CategorySet[]; }) =>
{
    const defaultAnnouncePic = useOptionalSpecAssetUrl({ relativePath: "Assets/Client/Spec/DefaultEventPic.jpg", fallbackToDefault: true }) ?? "";
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {props.gridData && props.gridData.map((item) =>
            {
                const linkUrl = `${props.dirUrl}/${item.Announcement?.InternalId}`;
                const title = item.AnnouncementDetail?.find(p => p.Lang === props.lang)?.Title?.trim() ?? "";
                const picUrl = FileManagementAPI.get_Public_Preview_Url(item.Announcement?.PictureId, item.Announcement?.PicDescription) || defaultAnnouncePic;
                const picDesc = item.Announcement?.PicDescription?.trim() || title;
                const validate = formatDate(item.Announcement?.Validate_Start);
                const catName = formatCategoriesName(item.Announcement?.Categories ?? "", props.categoryData, props.lang);
                return (
                    <div key={item.Announcement?.InternalId} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                        <article className="cardbox">
                            <div className="card_content">
                                <LangNavLink to={linkUrl} className="card_image_link venobox vbox-item" data-gall="myGallery" title={title}>
                                    <figure className="figure_Box">
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={picUrl} alt={picDesc} />
                                            </div>
                                        </div>
                                    </figure>
                                    <div className="card_catDiv">
                                        <div className="card_cat">
                                            <div className="card_cat_link">
                                                <span className="s-line">▍</span>
                                                <span className="s-tle">{catName}</span>
                                            </div>
                                        </div>
                                        <div className="card_time">
                                            <i className="far fa-clock mr-2"></i>
                                            <span className="sr-only">日期</span>
                                            {validate}
                                        </div>
                                    </div>
                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                        <span className="card_title">{title}</span>
                                    </div>
                                </LangNavLink>
                                <div className="card_StateDiv">
                                    <div className="More customize_btn">
                                        <LangNavLink className="Btn_s1" title={`觀看更多：${title}`} aria-label={`觀看更多：${title}`} to={linkUrl}>
                                            VIEW ALL<span className="ml-2">+</span>
                                        </LangNavLink>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                );
            })}
        </div>
    );
};
const QAList_Comp = (props: { lang: Lang; gridData: AnnouncementSet[]; currentPage: number; pageSize: number; }) =>
{
    const startIndex = (props.currentPage - 1) * props.pageSize;
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [animMap, setAnimMap] = useState<Record<string, "opening" | "closing" | undefined>>({});
    const collapseRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const durationMs = 520;
    const setAnimating = (key: string, value?: "opening" | "closing") =>
    {
        setAnimMap(prev =>
        {
            const next = { ...prev };
            if (!value) delete next[key];
            else next[key] = value;
            return next;
        });
    };
    const animateOpen = (key: string, el: HTMLDivElement) =>
    {
        setAnimating(key, "opening");
        el.style.transition = `height ${durationMs}ms ease`;
        el.style.height = "0px";
        void el.offsetHeight;
        requestAnimationFrame(() =>
        {
            el.style.height = `${el.scrollHeight}px`;
        });
        const onEnd = (ev: TransitionEvent) =>
        {
            if (ev.propertyName !== "height") return;
            el.removeEventListener("transitionend", onEnd);
            el.style.height = "";
            setAnimating(key, undefined);
        };
        el.addEventListener("transitionend", onEnd);
    };
    const animateClose = (key: string, el: HTMLDivElement) =>
    {
        setAnimating(key, "closing");
        el.style.transition = `height ${durationMs}ms ease`;
        el.style.height = `${el.scrollHeight}px`;
        void el.offsetHeight;
        requestAnimationFrame(() =>
        {
            el.style.height = "0px";
        });
        const onEnd = (ev: TransitionEvent) =>
        {
            if (ev.propertyName !== "height") return;
            el.removeEventListener("transitionend", onEnd);
            el.style.height = "";
            setAnimating(key, undefined);
        };
        el.addEventListener("transitionend", onEnd);
    };
    const toggle = (key: string) =>
    {
        setOpenKey(prev =>
        {
            const next = prev === key ? null : key;
            if (prev)
            {
                const prevEl = collapseRefs.current[prev];
                if (prevEl) animateClose(prev, prevEl);
            }
            if (next)
            {
                const nextEl = collapseRefs.current[next];
                if (nextEl) animateOpen(next, nextEl);
            }
            return next;
        });
    };
    const getCollapseClass = (key: string, isOpen: boolean) =>
    {
        const anim = animMap[key];
        if (anim) return "collapsing";
        return `collapse${isOpen ? " show" : ""}`;
    };
    const setCollapseRef = (key: string, el: HTMLDivElement | null) =>
    {
        collapseRefs.current[key] = el;
    };
    return (
        <div className="faq_content">
            <div className="row">
                <div className="col row-group">
                    <div id="accordion" className="FAQBar">
                        <ul className="QA_info" style={{ counterReset: `faq-counter ${startIndex}` }}>
                            {props.gridData.map((item, idx) => (
                                <QAItem_Comp
                                    key={`faq_item_${item.Announcement?.InternalId ?? `${startIndex}_${idx}`}`}
                                    item={item}
                                    idx={idx}
                                    lang={props.lang}
                                    startIndex={startIndex}
                                    openKey={openKey}
                                    getCollapseClass={getCollapseClass}
                                    onToggle={toggle}
                                    onSetRef={setCollapseRef}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
const QAItem_Comp = (
    props: {
        item: AnnouncementSet;
        idx: number;
        lang: Lang;
        startIndex: number;
        openKey: string | null;
        getCollapseClass: (key: string, isOpen: boolean) => string;
        onToggle: (key: string) => void;
        onSetRef: (key: string, el: HTMLDivElement | null) => void;
    },
) =>
{
    const detail = props.item.AnnouncementDetail?.find(p => p.Lang === props.lang);
    const rawKey = props.item.Announcement?.InternalId ?? `${props.startIndex}_${props.idx}`;
    const key = rawKey.replace(/[^A-Za-z0-9_-]/g, "_");
    const collapseId = `collapse_${key}`;
    const isOpen = props.openKey === key;
    return (
        <li key={`faq_${key}`}>
            <div className="QA-01 + card">
                <div className="card-header">
                    <a
                        href="#"
                        className={`card-link${isOpen ? "" : " collapsed"}`}
                        data-bs-toggle="collapse"
                        type="button"
                        role="button"
                        aria-expanded={isOpen}
                        aria-controls={collapseId}
                        onClick={(e) =>
                        {
                            e.preventDefault();
                            e.stopPropagation();
                            const ne = e.nativeEvent as NativeMouseEventWithStopImmediate;
                            ne.stopImmediatePropagation?.();
                            props.onToggle(key);
                        }}
                    >
                        {detail?.Title}
                    </a>
                </div>
                <div
                    id={collapseId}
                    className={props.getCollapseClass(key, isOpen)}
                    data-bs-parent="#accordion"
                    ref={(el) =>
                    {
                        props.onSetRef(key, el);
                    }}
                >
                    <div className="card-body">
                        <CmsHtml_Comp html={detail?.Content ?? ""} lang={props.lang} />
                    </div>
                </div>
            </div>
        </li>
    );
};
const TimelineSlider = (props: { dirUrl: string; lang: Lang; data: AnnouncementSet[]; }) =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const w = window as any;
        const $ = (w.$ || w.jQuery) as any;
        if (!$ || !$.fn || !$.fn.owlCarousel) return;
        const $owl = $("#History_owl_carousel");
        const $toggle = $("#History_toggle");
        if ($owl.length === 0 || $toggle.length === 0) return;
        let isPlaying = true;
        ($owl as any).owlCarousel({
            items: 4,
            loop: false,
            dots: false,
            nav: true,
            margin: 30,
            autoplay: false,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            responsive: { 0: { items: 2 }, 575: { items: 2 }, 767: { items: 3 }, 991: { items: 4 }, 1199: { items: 4 } },
        });
        const updateToggleButton = () =>
        {
            const $iconBox = $toggle.find(".control-toggle");
            const $srText = $toggle.find(".sr-only");
            $iconBox.removeClass("control-play-icon control-pause-icon");
            if (isPlaying)
            {
                $toggle.attr("aria-pressed", "true").attr("aria-label", "圖片輪播播放中，點擊暫停");
                $iconBox.addClass("control-pause-icon");
                $srText.text("圖片輪播播放中，點擊暫停");
            } else
            {
                $toggle.attr("aria-pressed", "false").attr("aria-label", "圖片輪播已暫停，點擊播放");
                $iconBox.addClass("control-play-icon");
                $srText.text("圖片輪播已暫停，點擊播放");
            }
        };
        const handleToggleClick = (e: any) =>
        {
            e.preventDefault();
            if (isPlaying)
            {
                $owl.trigger("stop.owl.autoplay");
                isPlaying = false;
            } else
            {
                $owl.trigger("play.owl.autoplay", [5000]);
                isPlaying = true;
            }
            updateToggleButton();
        };
        $toggle.on("click", handleToggleClick);
        updateToggleButton();
        return () =>
        {
            $toggle.off("click", handleToggleClick);
            try
            {
                $owl.trigger("destroy.owl.carousel");
            } catch
            {
            }
        };
    }, [props.data]);
    return (
        <div className="History_Div + owl-box">
            <div className="row">
                <div className="col-12">
                    <div className="content-box px-0">
                        <div className="DIV-singleBox">
                            <div className="control-singlebox">
                                <a
                                    id="History_toggle"
                                    className="toggle ms-1"
                                    aria-label="圖片輪播播放中，點擊暫停"
                                    aria-pressed="true"
                                    tabIndex={0}
                                    title="暫停"
                                    onClick={() =>
                                    {}}
                                >
                                    <div className="control-toggle control-pause-icon">
                                        <span className="sr-only">圖片輪播播放中，點擊暫停</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div id="History_owl_carousel" className="owl-carousel owl-theme">
                            {props.data.map((item) =>
                            {
                                const detail = item.AnnouncementDetail?.find(p => p.Lang === props.lang);
                                const linkUrl = `${props.dirUrl}/${item.Announcement?.InternalId}`;
                                const title = detail?.Title?.trim() ?? "";
                                const subTitle = detail?.SubTitle ?? "";
                                const picUrl = FileManagementAPI.get_Public_Preview_Url(item.Announcement?.PictureId, item.Announcement?.PicDescription);
                                const picAlt = LibText.getFirstNonEmptyText(item.Announcement?.PicDescription, title, "大事記圖片");
                                const date = formatDate(item.Announcement?.Validate_Start);
                                return (
                                    <div className="item" key={item.Announcement?.InternalId}>
                                        <LangLink to={linkUrl} title={title}>
                                            <article className="cardbox">
                                                <div className="card_content">
                                                    <figure className="figure_Box">
                                                        <div className="card_figure">
                                                            <div className="img-wrapper">
                                                                <img className="card_image" src={picUrl} alt={picAlt} />
                                                            </div>
                                                        </div>
                                                    </figure>
                                                    <div className="steps-dot">
                                                        <span className="steps-dot-line"></span>
                                                        <span className="dot"></span>
                                                    </div>
                                                    <div className="Text_Block_Area">
                                                        <div className="year_box">
                                                            <span>{date}</span>
                                                        </div>
                                                        <div className="card_titleDiv">
                                                            <div className="card_title">{title}</div>
                                                        </div>
                                                        <div className="card_introduction">{subTitle}</div>
                                                    </div>
                                                </div>
                                            </article>
                                        </LangLink>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Protected
/** 取得 Announcement List View，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getAnnouncementListView = (): typeof Client_Announcement_List_FeatureView =>
{
    if (announcementListViewCache !== null)
    {
        return announcementListViewCache;
    }

    announcementListViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_Announcement_List_Comp"),
        Client_Announcement_List_FeatureView,
        ["Client_Announcement_List"],
    );

    return announcementListViewCache;
};

/** 取得 Announcement List Grid Spec，有 Spec 時使用 Spec 擴充，否則使用空擴充。 */
const getAnnouncementListGridSpec = (): AnnouncementListGridSpecSlot =>
{
    if (announcementListGridSpecCache !== null) return announcementListGridSpecCache;
    announcementListGridSpecCache = resolveSpecFunc<AnnouncementListGridSpecSlot>(getClientSlotPath("Slot_Announcement_List_Comp"), extendAnnouncementListGridSpec, ["extendAnnouncementListGridSpec"]);
    return announcementListGridSpecCache;
};

/** 取得 Announcement List Comp Spec，有 Spec 時追加 Feature 區塊。 */
const getAnnouncementListCompSpec = (): AnnouncementListCompSpecSlot =>
{
    if (announcementListCompSpecCache !== null) return announcementListCompSpecCache;
    announcementListCompSpecCache = resolveSpecFunc<AnnouncementListCompSpecSlot>(getClientSlotPath("Slot_Announcement_List_Comp"), extendAnnouncementListCompSpec, ["extendAnnouncementListCompSpec"]);
    return announcementListCompSpecCache;
};
// #endregion

// #region Private
const resolveAdjustedCellText = (
    p: { colKey: string; rawContent: string; rowTitle: string; curRow: AnnouncementSet; catData: CategorySet[]; tagData: TagSet[]; lang: Lang; },
): string =>
{
    if (p.colKey === AnnouncementDetailFields.Title) return p.rowTitle;
    if (p.colKey === AnnouncementFields.Categories)
    {
        return formatCategoriesName(p.curRow.Announcement?.Categories ?? "", p.catData, p.lang);
    }
    if (p.colKey === AnnouncementFields.Tags)
    {
        return formatTagsName(p.curRow.Announcement?.Tags ?? "", p.tagData, p.lang);
    }
    return p.rawContent;
};
/** 建立公告列表 Grid，並套用 Spec 欄位與 cell 擴充。 */
const SetAdjustFunction = (context: AnnouncementListGridContext): GridProps =>
{
    const columns = resolveAnnouncementGridColumns(context);
    const columnKeys = new Set(columns.map(col => col.key));
    const rows = context.gridProps.rows.map((row, index) => buildAnnouncementGridRow(context, row, index, columns, columnKeys));

    return { ...context.gridProps, columns, rows };
};

/** 解析公告列表欄位，可讓 Spec 隱藏、新增或排序欄位。 */
const resolveAnnouncementGridColumns = (context: AnnouncementListGridContext): ColumnConfig[] =>
{
    const columns = context.gridProps.columns;

    const spec = getAnnouncementListGridSpec();
    return spec.resolveGridColumns?.(columns, context) ?? columns;
};

/** 建立公告列表單列資料，並套用 Spec cell 擴充。 */
const buildAnnouncementGridRow = (context: AnnouncementListGridContext, row: GridRow, index: number, columns: ColumnConfig[], columnKeys: Set<string>): GridRow =>
{
    const adjustedCells = row.cells.map(cell => buildAnnouncementGridCell(context, cell, index)).filter(cell => columnKeys.has(cell.col.key));
    const spec = getAnnouncementListGridSpec();
    const finalCells = spec.resolveGridCells?.(adjustedCells, { ...context, rowData: context.rawData?.[index], rowIndex: index, columns }) ?? adjustedCells;
    return { ...row, cells: finalCells };
};
/** 建立公告列表 cell 顯示內容。 */
const buildAnnouncementGridCell = (context: AnnouncementListGridContext, cell: RowCell, index: number): RowCell =>
{
    const curRow = context.rawData?.[index];
    const internalId = curRow?.Announcement?.InternalId ?? "";
    const contentStatus = curRow?.Announcement?.ContentStatus ?? 0;
    const titleId = `title-${internalId}`;
    const rowTitle = curRow?.AnnouncementDetail?.find(p => p.Lang === context.lang)?.Title?.trim() ?? "";
    const srLinkText = rowTitle ? `前往：${rowTitle}` : "前往內容";
    const isTitle = cell.col.key === AnnouncementDetailFields.Title;
    const displayText = resolveAdjustedCellText({ colKey: cell.col.key, rawContent: typeof cell.content === "string" ? cell.content : "", rowTitle, curRow, catData: context.categoryData, tagData: context.tagData, lang: context.lang });
    return { ...cell, content: buildAnnouncementGridCellContent({ context, internalId, contentStatus, titleId, srLinkText, isTitle, displayText, colKey: cell.col.key }) };
};
/** 建立公告列表 cell JSX。 */
const buildAnnouncementGridCellContent = (p: { context: AnnouncementListGridContext; internalId: string; contentStatus: number; titleId: string; srLinkText: string; isTitle: boolean; displayText: string; colKey: string; }): JSX.Element =>
{
    if (!p.isTitle) return buildAnnouncementNonTitleCellContent(p.colKey, p.displayText);
    return (
        <>
            {LibDate.isWithinLastDays(p.context.rawData.find(x => x.Announcement?.InternalId === p.internalId)?.Announcement?.Validate_Start, 8) && <span className="label label-warning">最新</span>}
            {Boolean(p.contentStatus & 1) && <span className="label label-success">置頂</span>}
            {Boolean(p.contentStatus & 2) && <span className="label label-danger">熱門</span>}
            <LangLink to={`${p.context.dirUrl}/${p.internalId}`} className="link-cell" id={p.titleId}>
                <span>{p.displayText}</span>
            </LangLink>
        </>
    );
};

/** 建立非標題欄位 Cell 內容。 */
const buildAnnouncementNonTitleCellContent = (colKey: string, displayText: string): JSX.Element =>
{
    if (colKey === AnnouncementFields.Categories || colKey === AnnouncementFields.Tags)
    {
        return <AnnouncementTermCellList items={splitAnnouncementTermText(displayText)} />;
    }
    return <span>{displayText}</span>;
};
/** 將分類與標籤格式化文字切成清單。 */
const splitAnnouncementTermText = (text: string): string[] =>
{
    return text.split("、").map(item => item.trim()).filter(Boolean);
};

/** 公告清單分類與標籤 Cell 清單。 */
const AnnouncementTermCellList = (props: { items: string[]; }) =>
{
    if (props.items.length === 0) return <span></span>;
    return (
        <ul className="mb-0 pl-3">
            {props.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
    );
};
// #endregion
