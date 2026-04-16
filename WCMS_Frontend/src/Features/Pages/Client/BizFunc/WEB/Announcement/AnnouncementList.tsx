import { formatCategoriesName } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { formatTagsName } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useAnnouncementListData } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementList_Loader";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_HookFunc/useOptionalSpecAssetUrl";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import parse from "html-react-parser";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { isWithinLastNDaysFromString } from "../WebResource/WebResourceList";

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

const AnnouncementList = (props: IAnnouncementListProps) =>
{
    // 宣告變數
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    const [keyword] = useState<string | undefined>(undefined);

    // 執行 function：先開 kw 入口，但目前只給 CSR hooks 使用
    const vm = useAnnouncementListData({
        lang: props.lang,
        opts: props.options,
        kw: keyword,
    });

    const adjustedGrid = useMemo(() =>
    {
        return SetAdjustFunction(
            props.lang,
            dirUrl,
            vm.gridPropsFromList,
            vm.listData,
            vm.categoryData,
            vm.tagData,
        );
    }, [props.lang, dirUrl, vm.gridPropsFromList, vm.listData, vm.categoryData, vm.tagData]);

    // TODO(AnnouncementList kw):
    // 之後 feature 若要補搜尋框，只要把輸入值 set 到 keyword 即可。
    // SSR route 目前不提供 kw，維持首屏固定條件。
    // 1810 之後可直接共用同一個 kw 傳法，只保留自己的 DOM。

    const children = useMemo(() =>
    {
        switch (props.options?.Style)
        {
            case 8:
                return (
                    <TimelineSlider
                        dirUrl={dirUrl}
                        lang={props.lang}
                        data={vm.listData}
                    />
                );
            case 3:
                return (
                    <QAList_Comp
                        lang={props.lang}
                        gridData={vm.listData}
                        currentPage={vm.pageNumber}
                        pageSize={vm.pageSize}
                    />
                );
            case 2:
                return (
                    <PictureList_Row_Comp
                        dirUrl={dirUrl}
                        lang={props.lang}
                        gridData={vm.listData}
                        categoryData={vm.categoryData}
                    />
                );
            case 1:
                return (
                    <GridList_Comp
                        key={`grid-${props.lang}`}
                        lang={props.lang}
                        gridData={adjustedGrid}
                        title={props.node.title}
                    />
                );
            default:
                return null;
        }
    }, [
        props.options?.Style,
        dirUrl,
        props.lang,
        props.node.title,
        vm.listData,
        vm.pageNumber,
        vm.pageSize,
        vm.categoryData,
        adjustedGrid,
    ]);

    const paginprops = props.options?.Style === 8
        ? undefined
        : {
            currentPage: vm.pageNumber,
            totalPages: vm.totalPages,
            onPageChange: vm.onPageChange,
        };

    // return
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            paginatorProps={paginprops}
            viewCountConfig={{ mode: "list" }}
        >
            {children}
        </ModuleContent>
    );
};

export default AnnouncementList;

const GridList_Comp = (props: { lang: Lang; title: string; gridData: GridProps; }) =>
{
    // 宣告變數
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);

    useEffect(() =>
    {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved)
        {
            const widths = JSON.parse(saved);
            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    width: typeof widths[col.key] === "number"
                        ? widths[col.key]
                        : typeof col.width === "number"
                        ? col.width
                        : undefined,
                }))
            );
        }
    }, []);

    const handleResize = (index: number, width: number) =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);

            const widths: Record<string, number> = {};
            updated.forEach((c) =>
            {
                if (typeof c.width === "number") widths[c.key] = c.width;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
            return updated;
        });
    };

    // return
    return (
        <>
            <OperationGuideHelp_Comp lang={props.lang} />
            <table
                className={"table table-striped table-bordered table-hover + table-rwd"}
                summary={props.title}
            >
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.gridData.rows} />
            </table>
        </>
    );
};

const PictureList_Row_Comp = (props: {
    dirUrl: string;
    lang: Lang;
    gridData: AnnouncementSet[];
    categoryData: CategorySet[];
}) =>
{
    // 宣告變數
    const defaultAnnouncePic = useOptionalSpecAssetUrl({
        relativePath: "Assets/Custom/DefaultEventPic.jpg",
        fallbackToDefault: true,
    }) ?? "";

    // return
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {props.gridData && props.gridData.map((item) =>
            {
                const linkUrl = `${props.dirUrl}/${item.Announcement?.InternalId}`;
                const title = item.AnnouncementDetail?.find(
                    p => p.Lang === props.lang,
                )?.Title ?? "";
                const picUrl = FileManagementAPI.get_Public_Preview_Url(
                    item.Announcement?.PictureId,
                    item.Announcement?.PicDescription,
                ) ?? defaultAnnouncePic;
                const picDesc = item.Announcement?.PicDescription ?? title;
                const validate = FormatDate(item.Announcement?.Validate_Start);
                const catName = formatCategoriesName(
                    item.Announcement?.Categories ?? "",
                    props.categoryData,
                    props.lang,
                );

                return (
                    <div
                        key={item.Announcement?.InternalId}
                        className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv"
                    >
                        <article className="cardbox">
                            <div className="card_content">
                                <LangNavLink
                                    to={linkUrl}
                                    className="card_image_link venobox vbox-item"
                                    data-gall="myGallery"
                                    title={title}
                                >
                                    <figure className="figure_Box">
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img
                                                    className="card_image"
                                                    src={picUrl}
                                                    alt={picDesc}
                                                />
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

                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <LangNavLink
                                                className="Btn_s1"
                                                type="button"
                                                role="button"
                                                title="觀看更多"
                                                to={linkUrl}
                                            >
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangNavLink>
                                        </div>
                                    </div>
                                </LangNavLink>
                            </div>
                        </article>
                    </div>
                );
            })}
        </div>
    );
};

type NativeMouseEventWithStopImmediate = MouseEvent & {
    stopImmediatePropagation?: () => void;
};

const QAList_Comp = (props: {
    lang: Lang;
    gridData: AnnouncementSet[];
    currentPage: number;
    pageSize: number;
}) =>
{
    // 宣告變數
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

    // return
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

const QAItem_Comp = (props: {
    item: AnnouncementSet;
    idx: number;
    lang: Lang;
    startIndex: number;
    openKey: string | null;
    getCollapseClass: (key: string, isOpen: boolean) => string;
    onToggle: (key: string) => void;
    onSetRef: (key: string, el: HTMLDivElement | null) => void;
}) =>
{
    // 宣告變數
    const detail = props.item.AnnouncementDetail?.find(p => p.Lang === props.lang);
    const rawKey = props.item.Announcement?.InternalId ?? `${props.startIndex}_${props.idx}`;
    const key = rawKey.replace(/[^A-Za-z0-9_-]/g, "_");
    const collapseId = `collapse_${key}`;
    const isOpen = props.openKey === key;
    const contentNode = useFaqContentNode(detail?.Content ?? "", props.lang);

    // return
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
                        {contentNode}
                    </div>
                </div>
            </div>
        </li>
    );
};

const useFaqContentNode = (html: string, lang: Lang) =>
{
    // 宣告變數
    const resolved = useResolveInternalIds(html, { locale: lang });

    // return
    return useMemo(() =>
    {
        return resolved.html ? parse(resolved.html) : null;
    }, [resolved.html]);
};

const TimelineSlider = (props: { dirUrl: string; lang: Lang; data: AnnouncementSet[]; }) =>
{
    useEffect(() =>
    {
        // SSR 防護：server 端不要執行
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
            responsive: {
                0: { items: 2 },
                575: { items: 2 },
                767: { items: 3 },
                991: { items: 4 },
                1199: { items: 4 },
            },
        });

        const updateToggleButton = () =>
        {
            const $iconBox = $toggle.find(".control-toggle");
            const $srText = $toggle.find(".sr-only");

            $iconBox.removeClass("control-play-icon control-pause-icon");

            if (isPlaying)
            {
                $toggle
                    .attr("aria-pressed", "true")
                    .attr("aria-label", "圖片輪播播放中，點擊暫停");
                $iconBox.addClass("control-pause-icon");
                $srText.text("圖片輪播播放中，點擊暫停");
            } else
            {
                $toggle
                    .attr("aria-pressed", "false")
                    .attr("aria-label", "圖片輪播已暫停，點擊播放");
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
                /** ignore */
            }
        };
    }, [props.data]);

    // return
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
                                const title = detail?.Title ?? "";
                                const subTitle = detail?.SubTitle ?? "";
                                const picUrl = FileManagementAPI.get_Public_Preview_Url(
                                    item.Announcement?.PictureId,
                                    item.Announcement?.PicDescription,
                                );
                                const date = FormatDate(item.Announcement?.Validate_Start);

                                return (
                                    <div className="item" key={item.Announcement?.InternalId}>
                                        <LangLink to={linkUrl} title={title} tabIndex={0}>
                                            <article className="cardbox">
                                                <div className="card_content">
                                                    <figure className="figure_Box">
                                                        <div className="card_figure">
                                                            <div className="img-wrapper">
                                                                <img
                                                                    className="card_image"
                                                                    src={picUrl}
                                                                    alt={item.Announcement?.PicDescription ?? ""}
                                                                />
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

const resolveAdjustedCellText = (p: {
    colKey: string;
    rawContent: string;
    rowTitle: string;
    curRow: AnnouncementSet;
    catData: CategorySet[];
    tagData: TagSet[];
    lang: Lang;
}): string =>
{
    // 宣告變數
    if (p.colKey === AnnouncementDetailFields.Title) return p.rowTitle;
    if (p.colKey === AnnouncementFields.Categories)
    {
        return formatCategoriesName(p.curRow.Announcement?.Categories ?? "", p.catData, p.lang);
    }
    if (p.colKey === AnnouncementFields.Tags)
    {
        return formatTagsName(p.curRow.Announcement?.Tags ?? "", p.tagData, p.lang);
    }

    // return
    return p.rawContent;
};

const SetAdjustFunction = (
    lang: Lang,
    dirUrl: string,
    gridProps: GridProps,
    rawData: AnnouncementSet[],
    catData: CategorySet[],
    tagData: TagSet[],
): GridProps =>
{
    // 宣告變數
    const newRows: GridRow[] = gridProps.rows.map((row, index) =>
    {
        const curRow = rawData?.[index];
        const internalId = curRow?.Announcement?.InternalId ?? "";
        const contentStatus = curRow?.Announcement?.ContentStatus ?? 0;
        const titleId = `title-${internalId}`;
        const rowTitle = curRow?.AnnouncementDetail?.find(p => p.Lang === lang)?.Title?.trim() ?? "";
        const srLinkText = rowTitle ? `前往：${rowTitle}` : "前往內容";

        const newCells = row.cells.map((cell) =>
        {
            const isTitle = cell.col.key === AnnouncementDetailFields.Title;
            const displayText = resolveAdjustedCellText({
                colKey: cell.col.key,
                rawContent: typeof cell.content === "string" ? cell.content : "",
                rowTitle,
                curRow,
                catData,
                tagData,
                lang,
            });

            return {
                ...cell,
                content: (
                    <>
                        {isTitle
                            ? (
                                <>
                                    {isWithinLastNDaysFromString(curRow?.Announcement?.Validate_Start ?? "") && (
                                        <span className="label label-warning">最新</span>
                                    )}
                                    {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                    {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                                    <LangLink
                                        to={`${dirUrl}/${internalId}`}
                                        className="link-cell"
                                        id={isTitle ? titleId : undefined}
                                        aria-labelledby={isTitle ? undefined : titleId}
                                    >
                                        <span aria-hidden={!isTitle}>{displayText}</span>
                                        {!isTitle && <span className="visually-hidden">{srLinkText}</span>}
                                    </LangLink>
                                </>
                            )
                            : <span>{displayText}</span>}
                    </>
                ),
            };
        });

        return { ...row, cells: newCells };
    });

    // return
    return { ...gridProps, rows: newRows };
};
