// WebResourceList.tsx
/**公告清單 */
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { useWebResourceListFetchData } from "./WebResourceList_Loader";

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

const WebResourceListComp = (props: IWebResourceListProps) =>
{
    // 宣告變數：資料統一由 loader/hook 提供
    const getData = useWebResourceListFetchData({ lang: props.lang, options: props.options });
    const style = props.options?.Style ?? 1;

    const children = useMemo(() =>
    {
        switch (style)
        {
            case 7:
            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={getData.rawData.listData} cateMap={getData.rawData.categoryMap} />;
            case 1:
            default:
            {
                const adjustedGrid = SetAdjustFunction(props.lang, getData.rawData.gridProps, getData.rawData.listData, getData.rawData.categoryMap);
                return <GridList_Comp key="grid" lang={props.lang} title={""} GridData={adjustedGrid} />;
            }
        }
    }, [style, props.lang, getData.rawData.gridProps, getData.rawData.listData, getData.rawData.categoryMap]);

    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    const paginprops = props.options?.Style === 8
        ? undefined
        : { currentPage: getData.rawData.pageNumber, totalPages: getData.rawData.totalPages, onPageChange: getData.rawData.onPageChange };
    // return（DOM 不動）
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            isLoading={getData.isLoading}
            errorList={getData.errorList}
            paginatorProps={paginprops}
            viewCountConfig={viewCountConfig}
        >
            {children}
        </ModuleContent>
    );
};

export default WebResourceListComp;

/** 把 category ids 轉成名稱 */
const formatCategoriesNameByMap = (content: string, categoryMap: Record<string, string>) =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";

    return raw.split(",").map(s => s.trim()).filter(Boolean).map(id => categoryMap[id] ?? "").filter(Boolean).join("、");
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
                            {isWithinLastNDaysFromString(curRow?.WebResource?.CreateTime ?? "") && <span className="label label-warning">最新</span>}
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
    const alt = `${descript}${target === 0 ? "" : "｜[另開視窗]"}`;

    return (
        <a href={url} target={tar} rel="noopener noreferrer" className="btn btn-default bg_link" title={alt}>
            <span className="link">Link</span>
        </a>
    );
};

const GridList_Comp = (props: { lang: Lang; title: string; GridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.GridData.columns);

    useEffect(() =>
    {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const widths = JSON.parse(saved);
        setColumns(prev =>
            prev.map(col => ({ ...col, width: typeof widths[col.key] === "number" ? widths[col.key] : typeof col.width === "number" ? col.width : undefined }))
        );
    }, []);

    const handleResize = (index: number, width: number) =>
    {
        setColumns(prev =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths: Record<string, number> = {};
            updated.forEach(c =>
            {
                if (typeof c.width === "number") widths[c.key] = c.width;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
            return updated;
        });
    };

    return (
        <>
            <OperationGuideHelp_Comp lang={props.lang} />
            <table className={"table table-striped table-bordered table-hover + table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.GridData.rows} />
            </table>
        </>
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
                const validate = FormatDate(item.WebResource?.CreateTime);
                const picUrl = FileManagementAPI.get_Public_Preview_Url(item.WebResource?.PicId, title);
                const urlRaw = detail?.ResUrl ?? "";
                const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank";
                const { isYoutube, url } = resolveYoutubeEmbedUrl(urlRaw);
                const isVideo = false;
                const contentStatus = item.WebResource?.ContentStatus ?? 0;
                const catName = formatCategoriesNameByMap(item.WebResource?.Categories ?? "", prop.cateMap);

                return (
                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
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
                                            <a
                                                href={urlRaw}
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
                                            </a>
                                        )
                                        : (
                                            <a
                                                href={urlRaw}
                                                target={tar}
                                                className="card_image_link venobox"
                                                data-autoplay="true"
                                                data-vbtype="video"
                                                data-ratio="1x1"
                                                data-maxwidth="640px"
                                                title={title}
                                            >
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={picUrl} alt="" />
                                                </div>
                                            </a>
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

                                <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2" style={{ textAlign: (isYoutube || isVideo) ? undefined : "center" }}>
                                    <a href={urlRaw} target={tar} className="card_title">🔗{title}</a>
                                    <div className="d-flex gap-1 flex-wrap">
                                        {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                        {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                                    </div>
                                </div>

                                {(isYoutube || isVideo) && (
                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <a href={urlRaw} target={tar} className="Btn_s1" type="button" role="button" title="觀看更多">
                                                VIEW ALL<span className="ml-2">+</span>
                                            </a>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            <a
                                                href={urlRaw}
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
                                            </a>
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

const YT_SHORT_REGEX = /^https?:\/\/(?:www\.)?youtu\.be\/([^?&#/]+)/i;

/** 解析YT網址 */
export const resolveYoutubeEmbedUrl = (rawUrl?: string | null) =>
{
    if (!rawUrl) return { isYoutube: false, url: rawUrl ?? "" };
    const match = rawUrl.match(YT_SHORT_REGEX);
    if (!match) return { isYoutube: false, url: rawUrl };
    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { isYoutube: true, url: embedUrl };
};

interface WithinLastOptions
{
    /** 當字串沒有時區資訊時，假定的時區位移（單位：分鐘）。預設 0 = 當成 UTC。例：台北(+08:00)傳 480 */
    assumeOffsetMinutes?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateTimeToEpochMs = (input: string, assumeOffsetMinutes: number = 0): number | null =>
{
    if (!input) return null;
    const s = input.trim();

    const msMatch = /\/Date\((\d+)\)\//.exec(s);
    if (msMatch) return Number(msMatch[1]);

    const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    if (hasTZ)
    {
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : t;
    }

    const m = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(s);
    if (m)
    {
        const [_, y, mo, d, hh = "0", mm = "0", ss = "0", fff = "0"] = m;
        const ms = parseInt(fff.padEnd(3, "0"), 10);
        const asUTC = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss, ms) - assumeOffsetMinutes * 60 * 1000;
        return asUTC;
    }

    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
};

export const isWithinLastNDaysFromString = (dateTimeStr?: string, n: number = 8, opts?: WithinLastOptions): boolean =>
{
    if (!dateTimeStr) return false;

    const assumeOffsetMinutes = opts?.assumeOffsetMinutes ?? 0;
    const targetMs = parseDateTimeToEpochMs(dateTimeStr, assumeOffsetMinutes);
    if (targetMs == null) return false;

    const nowMs = Date.now();
    const diffMs = nowMs - targetMs;

    return diffMs >= 0 && diffMs <= n * DAY_MS;
};
