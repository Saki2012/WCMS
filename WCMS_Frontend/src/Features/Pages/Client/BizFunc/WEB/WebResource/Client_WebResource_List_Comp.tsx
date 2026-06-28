import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { applyGridColumnWidths, readGridColumnWidths, writeGridColumnWidths } from "@/SysCore/Components/Grid/Grid_ColumnWidth";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibDate, LibMedia, LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { useWebResourceListData } from "./Client_WebResource_List_Loader";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];
export interface IWebResourceListOptions
{
    Category?: string;
    Tag?: string;
    Style: number;
}
export interface IWebResourceListProps
{
    site: INormSite;
    node: INormNode;
    theme: IFETheme;
    lang: Lang;
    options?: IWebResourceListOptions;
    title: string;
}
const WEB_RESOURCE_GRID_COLUMN_WIDTH_STORAGE_KEY = "client-webresource-grid-column-widths";
type WebResourceListVm = ReturnType<typeof useWebResourceListData>;
export interface WebResourceListViewProps extends IWebResourceListProps
{
    /** Feature List Hook 整理後的相關連結清單資料。 */
    vm: WebResourceListVm;
}
// #endregion

// #region Variable
/** WebResource List View 快取，避免每次 render 重複解析 Spec View。 */
let webResourceListViewCache: typeof Client_WebResource_List_FeatureView | null = null;
// #endregion

// #region Public
/** 相關連結清單完整 Comp，負責取得 Feature Hook 資料，再交給 List Entry。 */
export const Client_WebResource_List_Comp = (props: IWebResourceListProps) =>
{
    const vm = useWebResourceListData({ lang: props.lang, opts: props.options });
    return <Client_WebResource_List {...props} vm={vm} />;
};

/** 相關連結 ListView Entry，正式前台統一從這裡進入 Spec / Feature DOM。 */
export const Client_WebResource_List = (props: WebResourceListViewProps) =>
{
    const ListView = getWebResourceListView();
    return <ListView {...props} />;
};

/** 相關連結 Feature 預設 View，只負責輸出 DOM。 */
const Client_WebResource_List_FeatureView = (props: WebResourceListViewProps) =>
{
    const style = props.options?.Style ?? 1;
    const children = useMemo(() =>
    {
        switch (style)
        {
            case 7:
            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={props.vm.listData} cateMap={props.vm.categoryMap} />;
            case 1:
            default:
            {
                const adjustedGrid = SetAdjustFunction(props.lang, props.vm.gridProps, props.vm.listData, props.vm.categoryMap);
                return <GridList_Comp key="grid" lang={props.lang} title={""} GridData={adjustedGrid} />;
            }
        }
    }, [style, props.lang, props.vm.gridProps, props.vm.listData, props.vm.categoryMap]);
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => ({ mode: "list" }), []);
    return (
        <ModuleContent nodeTitle={props.node.title} isLoading={props.vm.isLoading} errorList={props.vm.errorList} searchBar={props.vm.searchBar} paginatorProps={props.vm.paginatorProps} viewCountConfig={viewCountConfig}>
            {children}
        </ModuleContent>
    );
};
// #endregion

// #region Section
const GridList_Comp = (props: { lang: Lang; title: string; GridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.GridData.columns);

    useEffect(() =>
    {
        const widths = readGridColumnWidths(WEB_RESOURCE_GRID_COLUMN_WIDTH_STORAGE_KEY);
        if (Object.keys(widths).length === 0) return;

        setColumns((prev) => applyGridColumnWidths(prev, widths));
    }, []);

    const handleResize = (index: number, width: number): void =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);

            writeGridColumnWidths(WEB_RESOURCE_GRID_COLUMN_WIDTH_STORAGE_KEY, updated);

            return updated;
        });
    };

    return (
        <>
            <OperationGuideHelp_Comp lang={props.lang} />
            <table className={"table table-striped table-bordered table-hover table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.GridData.rows} />
            </table>
        </>
    );
};
// #endregion

// #region Protected
/** 取得 WebResource List View，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getWebResourceListView = (): typeof Client_WebResource_List_FeatureView =>
{
    if (webResourceListViewCache !== null)
    {
        return webResourceListViewCache;
    }

    webResourceListViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_WebResource_List_Comp"),
        Client_WebResource_List_FeatureView,
        ["Client_WebResource_List"],
    );

    return webResourceListViewCache;
};
// #endregion

// #region Private
/** 把 category ids 轉成名稱 */
const formatCategoriesNameByMap = (content: string, categoryMap: Record<string, string>): string =>
{
    const ids = LibText.splitTrimToArray(content);
    return LibText.mapKeysToDisplayText(ids, categoryMap);
};
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: WebResourceSet[], catMap: Record<string, string>): GridProps =>
{
    const newRows: GridRow[] = (gridProps.rows ?? []).map((row, index) =>
    {
        const curRow = rawData?.[index];
        const contentStatus = curRow?.WebResource?.ContentStatus ?? 0;
        const curDt = curRow?.WebResourceInfo?.find(p => p.Lang === lang);
        const newCells = (row.cells ?? []).map(cell =>
        {
            const isTitle = cell.col.key === WebResourceInfoFields.Title;
            let nextContent = cell.content;
            switch (cell.col.key)
            {
                case WebResourceFields.Categories:
                    nextContent = formatCategoriesNameByMap(curRow?.WebResource?.Categories ?? "", catMap);
                    break;

                case WebResourceInfoFields.ResUrl:
                    nextContent = SetUrlIcon(curDt?.ResUrl ?? "", curDt?.Content ?? "", curDt?.Url_OpenType ?? 0);
                    break;
            }
            const wrappedContent = (
                <>
                    {nextContent}
                    {isTitle && (
                        <>
                            {LibDate.isWithinLastDays(curRow?.WebResource?.CreateTime, 8) && <span className="label label-warning">最新</span>}
                            {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                            {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                        </>
                    )}
                </>
            );
            return { ...cell, content: wrappedContent };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) =>
{
    const tar = target === 0 ? "_self" : "_blank";
    return (
        <LangLink to={url} target={tar} className="btn btn-default bg_link" title={descript}>
            <span className="link">Link</span>
        </LangLink>
    );
};
/** YT要做自動解析 */
const PictureListContent = (prop: { lang: Lang; datas: WebResourceSet[]; cateMap: Record<string, string>; }) =>
{
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {prop.datas.map(item =>
            {
                const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                const title = detail?.Title ?? "";
                const validate = formatDate(item.WebResource?.CreateTime);
                const picUrl = FileManagementAPI.get_Public_Preview_Url(item.WebResource?.PicId, title);
                const urlRaw = detail?.ResUrl ?? "";
                const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank";
                const { isYoutube, url } = LibMedia.resolveYoutubeEmbedUrl(urlRaw);
                const isVideo = false;
                const contentStatus = item.WebResource?.ContentStatus ?? 0;
                const catName = formatCategoriesNameByMap(item.WebResource?.Categories ?? "", prop.cateMap);
                const key = item.WebResource?.InternalId ?? item.WebResource?.WebResourceId ?? detail?.ResUrl ?? title;
                return (
                    <div key={key} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 Standard_ItemDiv">
                        <article className="cardbox">
                            <div className="card_content">
                                <figure className="figure_Box">
                                    {isYoutube
                                        ? (
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={url}
                                                        title={title}
                                                        style={{ border: 0 }}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                        )
                                        : isVideo
                                        ? (
                                            <LangLink
                                                to={urlRaw}
                                                target={tar}
                                                className="card_image_link venobox"
                                                data-autoplay="true"
                                                data-vbtype="video"
                                                data-ratio="1x1"
                                                data-maxwidth="640px"
                                                title={title}
                                            >
                                                <div className="card_figure">
                                                    <video width="100%">
                                                        <source src={picUrl} />
                                                    </video>
                                                    <div className="videoDiv">
                                                        <div className="customize_Play_Btn Ripplestyle">
                                                            <i className="fas fa-play"></i>
                                                            <span className="sr-only">播放</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </LangLink>
                                        )
                                        : (
                                            <LangLink
                                                to={urlRaw}
                                                target={tar}
                                                className="card_image_link venobox"
                                                data-autoplay="true"
                                                data-vbtype="video"
                                                data-ratio="1x1"
                                                data-maxwidth="640px"
                                                title={title}
                                            >
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={picUrl} alt={title} />
                                                </div>
                                            </LangLink>
                                        )}
                                </figure>
                                {(isYoutube || isVideo) && (
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
                                )}
                                <div className="card_titleDiv mb-md-4 mb-sm-3 mb-2" style={{ textAlign: (isYoutube || isVideo) ? undefined : "center" }}>
                                    <LangLink to={urlRaw} target={tar} className="card_title">
                                        <i className="fad fa-link me-2"></i>
                                        {title}
                                    </LangLink>
                                    <div className="d-flex gap-1 flex-wrap">
                                        {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                        {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                                    </div>
                                </div>
                                {(isYoutube || isVideo) && (
                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <LangLink to={urlRaw} target={tar} className="Btn_s1" type="button" role="button" title="觀看更多">
                                                VIEW ALL<span className="ml-2">+</span>
                                            </LangLink>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            <LangLink
                                                to={urlRaw}
                                                target={tar}
                                                className="Btn_zm1 venobox"
                                                data-autoplay="true"
                                                data-vbtype="iframe"
                                                data-maxwidth="640px"
                                                type="button"
                                                role="button"
                                                title="放大圖片"
                                            >
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </LangLink>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    </div>
                );
            })}
        </div>
    );
};
// #endregion
