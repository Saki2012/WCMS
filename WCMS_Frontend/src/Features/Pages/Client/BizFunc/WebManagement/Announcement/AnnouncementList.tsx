import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useLocation } from "react-router-dom";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import ModuleContent, { ContentStatus } from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/SysCore/Utils/Library/LibHook";
import parse from 'html-react-parser';
import { AnnouncementDetailFields, AnnouncementFields, AnnouncementSetFields } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import type { ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { components } from "@/types/api";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { PGID } from "@/Features/Hooks/Common/ProgId";
import { useFormatTagsName, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { isWithinLastNDaysFromString } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_HookFunc/useOptionalSpecAssetUrl";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];


export interface IAnnouncementListOptions { Category?: string; Tag?: string; Style?: number; }
export interface IAnnouncementListProps { theme: IFETheme; lang: Lang; options?: IAnnouncementListOptions; node: INormNode }
const AnnouncementList = (props: IAnnouncementListProps) => {
    // <GridList_Comp {...props} />
    // <PictureList_Row_Comp {...props} />
    // <PictureList_Col_Comp {...props} />
    // <QAList_Comp {...props} />
    const pageSize = useMemo(() => {
        switch (props.options?.Style) {
            case 8: return 0;//歷史時間軸類型的資料一次全撈
            default: return 10;
        }
    }, [props.options]);

    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    const provider = useMemo(() => { return AnnouncementProvider() }, [])
    const useAnnounceList = dataFetch(provider, props.lang, props.options?.Category ?? "", props.options?.Tag ?? "", query, pageSize);
    const useCategory = useCategoryListData(PGID.Announcement, props.lang);
    const useTagData = useTagListData(PGID.Announcement, props.lang);
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.lang, dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData]);
    // const searchSlot = <SearchBarComp value={queryDraft} tags={tags} onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))} onSubmit={() => setQuery(queryDraft)} onReset={() => { setQueryDraft({}); setQuery({}); }} />;
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData]);
    const children = useMemo(() => {
        switch (props.options?.Style) {
            case 8:/** 目前有一bug，有抓資料數量，看如何處理 */
                return <TimelineSlider dirUrl={dirUrl} lang={props.lang} data={useAnnounceList.rawData} />;
            case 3:
                return <QAList_Comp lang={props.lang} gridData={useAnnounceList.rawData} currentPage={useAnnounceList.gridProps.CurrentPage} pageSize={pageSize} />
            case 2:
                return <PictureList_Row_Comp dirUrl={dirUrl} lang={props.lang} gridData={useAnnounceList.rawData} />;
            case 1:
            default: return <GridList_Comp key="grid" gridData={adjustedGrid} title={props.node.title} />;

        }
    }, [useAnnounceList, props.lang, props.options]);
    const loadingList = [useAnnounceList.isLoading];
    const errorList = [useAnnounceList.error];
    const paginprops = props.options?.Style === 8 ? undefined : { currentPage: adjustedGrid.CurrentPage, totalPages: adjustedGrid.TotalPage, onPageChange: adjustedGrid.onPageChange } as PaginatorProps;
    return (
        <ModuleContent nodeTitle={props.node.title} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops}>
            {children}
        </ModuleContent>
    )
};
export default AnnouncementList

const GridList_Comp = (props: { title: string; gridData: GridProps }) => {
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const widths = JSON.parse(saved);
            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    width: typeof widths[col.key] === "number" ? widths[col.key] : typeof col.width === "number" ? col.width : undefined,
                }))
            );
        }
    }, []);
    const handleResize = (index: number, width: number) => {
        setColumns((prev) => {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths: Record<string, number> = {};
            updated.forEach((c) => { if (typeof c.width === "number") widths[c.key] = c.width; });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
            return updated;
        });
    };
    return (
        <>
            <OperationGuideHelp_Comp />
            <table className={"table table-striped table-bordered table-hover + table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.gridData.rows} />
            </table>
        </>
    )
}
const PictureList_Row_Comp = (props: { dirUrl: string; lang: Lang; gridData: AnnouncementSet[] }) => {
    const defaultAnnouncePic = useOptionalSpecAssetUrl({ relativePath: "Assets/Custom/DefaultEventPic.jpg", fallbackToDefault: true, }) ?? "";
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {props.gridData && props.gridData.map((item) => {
                const linkUrl = `${props.dirUrl}/${item.Announcement?.InternalId}`;
                const title = item.AnnouncementDetail?.find(p => p.Lang === props.lang)?.Title ?? ""
                const picUrl = item.Announcement?.PictureId ? `${FileManagementAPI.PREVIEW_URL}/${item.Announcement?.PictureId}` : defaultAnnouncePic
                const picDesc = item.Announcement?.PicDescription ?? title
                const validate = FormatDate(item.Announcement?.Validate_Start)

                return (
                    < div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
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
                                                <span className="s-tle">{"類別名稱"}</span>
                                            </div>
                                        </div>
                                        <div className="card_time">
                                            <i className="far fa-clock mr-2"></i><span className="sr-only">日期</span>{validate}
                                        </div>
                                    </div>

                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                        <span className="card_title">{title}</span>
                                    </div>

                                    <div className="card_StateDiv">
                                        <ContentStatus />
                                        <div className="More customize_btn">
                                            <LangNavLink className="Btn_s1" type="button" role="button" title="觀看更多" to={linkUrl}>
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangNavLink>
                                        </div>

                                    </div>
                                </LangNavLink>
                            </div>
                        </article>
                    </div>)
            })}
        </div >
    )
}
/** 圖文式、備案，後續要連同後端都要增加參數設定，以及開始移除不需要的style參數 */
const PictureList_Col_Comp = (props: { Theme: IFETheme; GridData: GridProps }) => {
    return (
        <div id="Column_Colitem" className="SubPage_Standard_itemBoxs">
            {/**循環下面資料， */
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 + Standard_ItemDiv">
                    <article className="cardbox">
                        <div className="card_content_Column">
                            <div className="left__Box">
                                <figure className="figure_Box">
                                    <a href={"內文InternalId"} className="card_image_link venobox" data-gall="myGallery" title={"標題"}>
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${"封面id"}`} alt={"封面圖片說明"} />
                                            </div>
                                        </div>
                                    </a>
                                </figure>
                            </div>

                            <div className="Right__Box">
                                <div className="card_catDiv">
                                    <div className="card_cat">
                                        <div className="card_cat_link">
                                            <span className="s-line">▍</span>
                                            <span className="s-tle">{"類別名稱"}</span>
                                        </div>
                                    </div>
                                    <div className="card_time">
                                        <i className="far fa-clock mr-2"></i><span className="sr-only">日期/根據語系顯示Date或日期</span>{"上架日期"}
                                    </div>
                                </div>

                                <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                    <a href="#" className="card_title">{"標題"}</a>
                                </div>

                                <div className="card_StateDiv">
                                    <ContentStatus />
                                    <div className="More customize_btn">
                                        <LangNavLink to={"內文internalId"} className="Btn_s1" type="button" role="button" title="觀看更多">
                                            VIEW ALL<span className="ml-2">+</span>
                                        </LangNavLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            }
        </div>
    )
}
const QAList_Comp = (props: { lang: Lang; gridData: AnnouncementSet[]; currentPage: number; pageSize: number; }) => {
    const startIndex = (props.currentPage - 1) * props.pageSize;
    return (
        <div className="faq_content">
            <div className="row">
                <div className="col row-group">
                    <div id="accordion" className="FAQBar">
                        <ul className="QA_info" style={{ counterReset: `faq-counter ${startIndex}` }}>
                            {
                                props.gridData && props.gridData.map((item, idx) => {
                                    const detail = item.AnnouncementDetail?.find(p => p.Lang === props.lang);
                                    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: 'zh-tw' });
                                    const content = parseContent.html ? parse(parseContent.html) : null;
                                    return (
                                        <li>
                                            <div className="QA-01 + card">
                                                <div className="card-header">
                                                    <a href={`#collapse${idx}`} className="card-link collapsed" data-bs-toggle="collapse" type="button" role="button">
                                                        {detail?.Title}
                                                    </a>
                                                </div>
                                                <div id={`collapse${idx}`} className="collapse" data-bs-parent="#accordion">
                                                    <div className="card-body">
                                                        {content}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

const TimelineSlider = (props: { dirUrl: string; lang: Lang; data: AnnouncementSet[] }) => {
    useEffect(() => {
        // SSR 防護：server 端不要執行
        if (typeof window === "undefined") return;
        const w = window as any;
        const $ = (w.$ || w.jQuery) as any;
        if (!$ || !$.fn || !$.fn.owlCarousel) return;
        const $owl = $("#History_owl_carousel");
        const $toggle = $("#History_toggle");
        if ($owl.length === 0 || $toggle.length === 0) return;
        let isPlaying = true; // 跟原本 script 一樣，預設播放中
        // 初始化 owlCarousel（照你給的設定）
        ($owl as any).owlCarousel({
            items: 4,
            loop: false, // true or false
            dots: false,
            nav: true,
            margin: 30,
            autoplay: false, // true or false
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
        const updateToggleButton = () => {
            const $iconBox = $toggle.find(".control-toggle");
            const $srText = $toggle.find(".sr-only");
            // 先清空可能存在的 class
            $iconBox.removeClass("control-play-icon control-pause-icon");
            if (isPlaying) {
                $toggle.attr("aria-pressed", "true").attr("aria-label", "圖片輪播播放中，點擊暫停");
                $iconBox.addClass("control-pause-icon");
                $srText.text("圖片輪播播放中，點擊暫停");
            } else {
                $toggle.attr("aria-pressed", "false").attr("aria-label", "圖片輪播已暫停，點擊播放");
                $iconBox.addClass("control-play-icon");
                $srText.text("圖片輪播已暫停，點擊播放");
            }
        };
        const handleToggleClick = (e: any) => {
            e.preventDefault();

            if (isPlaying) {
                $owl.trigger("stop.owl.autoplay");
                isPlaying = false;
            } else {
                $owl.trigger("play.owl.autoplay", [5000]);
                isPlaying = true;
            }
            updateToggleButton();
        };
        // 綁定 click 事件 & 初始化狀態
        $toggle.on("click", handleToggleClick);
        updateToggleButton();
        // 清理：解除事件 & 摧毀 owl，避免重複綁定
        return () => {
            $toggle.off("click", handleToggleClick);
            try { $owl.trigger("destroy.owl.carousel"); }
            catch {/** ignor */ }
        };
    }, [props.data]);
    return (
        <div className="History_Div + owl-box">
            <div className="row">
                <div className="col-12">
                    <div className="content-box px-0">
                        <div className="DIV-singleBox">
                            <div className="control-singlebox">
                                <a id="History_toggle" className="toggle ms-1" aria-label="圖片輪播播放中，點擊暫停" aria-pressed="true" tabIndex={0} title="暫停" onClick={() => { }}>
                                    <div className="control-toggle control-pause-icon">
                                        <span className="sr-only">圖片輪播播放中，點擊暫停</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div id="History_owl_carousel" className="owl-carousel owl-theme">
                            {props.data.map((item) => {
                                const detail = item.AnnouncementDetail?.find(p => p.Lang === props.lang);
                                const linkUrl = `${props.dirUrl}/${item.Announcement?.InternalId}`;
                                const title = detail?.Title ?? ""
                                const subTitle = detail?.SubTitle ?? ""
                                const picUrl = `${FileManagementAPI.PREVIEW_URL}/${item.Announcement?.PictureId}`
                                const date = FormatDate(item.Announcement?.Validate_Start)
                                return (
                                    <div className="item" key={item.Announcement?.InternalId}>
                                        <LangLink to={linkUrl} title={title} tabIndex={0}>
                                            <article className="cardbox">
                                                <div className="card_content">
                                                    <figure className="figure_Box">
                                                        <div className="card_figure">
                                                            <div className="img-wrapper">
                                                                <img className="card_image" src={picUrl} alt={item.Announcement?.PicDescription ?? ""} />
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
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const dataFetch = (provider: IDataProvider<AnnouncementSet>, lang: string, categoryIds: string, tagIds: string, query: ISearchQuery, pageSize: number) => {
    const now = useNow({ startPaused: true });
    var condition: string = "";
    //因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
    if (now.isoLocal) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
    if (now.isoLocal) condition = LibMerge(" And ", false, condition, `(${AnnouncementFields.Validate_End} >= ${now.isoLocal} Or ${AnnouncementFields.Validate_End} is null)`);
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${query.tag}]`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} !& 4`)//不包含隱藏的資料

    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start],
            [AnnouncementSetFields.Announcement, AnnouncementFields.Categories],
            // [AnnouncementSetFields.Announcement, AnnouncementFields.Tags],
            [AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title],
            [AnnouncementSetFields.Announcement, AnnouncementFields.ViewCount],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                AnnouncementFields.AnnouncementId,
                AnnouncementFields.InternalId,
                AnnouncementFields.ContentStatus,
                AnnouncementFields.PictureId,
                AnnouncementFields.PicDescription,
                AnnouncementFields.Categories,
                AnnouncementFields.Tags,
                AnnouncementFields.Validate_Start,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
                AnnouncementFields.ViewCount,
            ],
            Condition: condition,
            OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }, { Col: AnnouncementFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: pageSize,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case AnnouncementDetailFields.Title:
                        {
                            content = item.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                            break;
                        }
                    case AnnouncementFields.Validate_Start:
                        {
                            content = FormatDate(item.Announcement?.Validate_Start) ?? ""
                            break;
                        }
                    default:
                        {
                            content = (item.Announcement as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, categoryIds, tagIds, query, condition, pageSize],
    });
};
const SetAdjustFunction = (lang: Lang, dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[], catData: CategorySet[], tagData: TagSet[]): GridProps => {
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curRow = rawData?.[index];
        const internalId = curRow.Announcement?.InternalId ?? "";
        const contentStatus = curRow.Announcement?.ContentStatus ?? 0;
        const titleId = `title-${internalId}`;
        const newCells = row.cells.map((cell) => {
            const isTitle = cell.col.key === AnnouncementDetailFields.Title;

            switch (cell.col.key) {
                case AnnouncementFields.Categories:
                    cell.content = useFormatCategoriesName(curRow.Announcement?.Categories ?? "", catData, lang)
                    break;
                case AnnouncementFields.Tags:
                    cell.content = useFormatTagsName(curRow.Announcement?.Tags ?? "", tagData, lang)
                    break;
            }

            return {
                ...cell,
                content: (
                    <>
                        <LangLink to={`${dirUrl}/${internalId}`} className="link-cell" id={isTitle ? titleId : undefined}
                            aria-labelledby={isTitle ? undefined : titleId}>
                            <span aria-hidden={!isTitle}>{cell.content}</span>
                        </LangLink>

                        {isTitle &&
                            <>
                                {isWithinLastNDaysFromString(curRow.Announcement?.Validate_Start ?? "") && (
                                    <span className="label label-warning">最新</span>
                                )}
                                {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                                {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
                            </>
                        }
                    </>
                ),
            };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};
