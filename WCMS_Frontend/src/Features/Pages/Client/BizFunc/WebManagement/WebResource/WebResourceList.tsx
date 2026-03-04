/**公告清單 */
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { useEffect, useMemo, useState } from "react";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { CategoryAdapter, formatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import type { WebResourceListLoaderData } from "./WebResourceList_Loader";

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];

export interface IWebResourceListOptions { Category?: string; Tag?: string; Style: number; }
export interface IWebResourceListProps { node: INormNode; theme: IFETheme; lang: Lang; options?: IWebResourceListOptions; title: string }

import type { Lang } from "@/SysCore/i18n/lang";

const WebResourceListComp = (props: IWebResourceListProps) => {
    // 宣告變數
    const loaderData = useLoaderData() as WebResourceListLoaderData | null;

    const adapter = useMemo(() => ({
        web: WebResourceAdapter(),
        cate: CategoryAdapter(),
    }), []);

    const categoryIds = props.options?.Category ?? "";
    const tagIds = props.options?.Tag ?? "";
    const style = props.options?.Style ?? 1;

    const useWebResList = useWebResourceList(adapter.web, props.lang, categoryIds, tagIds, loaderData);
    const useCategory = useCategoryList(adapter.cate, props.lang, loaderData);

    const children = useMemo(() => {
        switch (style) {
            case 7:
            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={useWebResList.rawData ?? []} />;
            case 1:
            default:
                {
                    const adjustedGrid = SetAdjustFunction(props.lang, useWebResList.gridProps, useWebResList.rawData, useCategory.rawData);
                    return <GridList_Comp key="grid" lang={props.lang} title={""} GridData={adjustedGrid} />;
                }
        }
    }, [useWebResList.gridProps, useWebResList.rawData, useCategory.rawData, props.lang, style]);

    const loadingList = [useWebResList.isLoading, useCategory.isLoading];
    const errorList = [useWebResList.error, useCategory.error];

    // return（DOM 不動）
    return (
        <ModuleContent nodeTitle={props.node.title} isLoading={loadingList.some(Boolean)} errorList={errorList}>
            {children}
        </ModuleContent>
    )
};

export default WebResourceListComp;

const useCategoryList = (adapter: ReturnType<typeof CategoryAdapter>, lang: Lang, loaderData: WebResourceListLoaderData | null) => {
    // 宣告變數
    const cateParam = loaderData?.args?.cateParam ?? { Fields: [], Condition: "1=0", PageNumber: 0, PageSize: 0 };

    const initial = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], CategorySet[]> | null>(() => {
        if (!loaderData?.args?.cateParam) return null;

        return {
            args: loaderData.args.cateParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.cateRes ?? [], SysMessage: [] },
        };
    }, [loaderData]);

    // 執行 function
    const hook = adapter.hooks.useQueryList({
        condition: cateParam,
        initial,
        deps: [lang],
    });

    // return
    return {
        rawData: hook.data ?? [],
        isLoading: hook.isLoading,
        error: hook.errorText,
    };
};

const useWebResourceList = (adapter: ReturnType<typeof WebResourceAdapter>, lang: Lang, categoryIds: string, tagIds: string, loaderData: WebResourceListLoaderData | null) => {
    // 宣告變數：baseParam 由 loader 決定（SSR 首屏一致）
    const baseParam = useMemo(() => {
        if (!loaderData?.args?.baseParam) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 10 } as components["schemas"]["QueryListParam"];
        if (loaderData.args.lang !== lang) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 10 } as components["schemas"]["QueryListParam"];
        if (loaderData.args.categoryIds !== categoryIds) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 10 } as components["schemas"]["QueryListParam"];
        if (loaderData.args.tagIds !== tagIds) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 10 } as components["schemas"]["QueryListParam"];
        return loaderData.args.baseParam;
    }, [loaderData, lang, categoryIds, tagIds]);

    const initialCount = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], number> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.lang !== lang) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.tagIds !== tagIds) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] },
        };
    }, [loaderData, lang, categoryIds, tagIds]);

    const initialList = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], WebResourceSet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.lang !== lang) return null;
        if (loaderData.args.categoryIds !== categoryIds) return null;
        if (loaderData.args.tagIds !== tagIds) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData, lang, categoryIds, tagIds]);

    // 執行 function：count
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [lang, categoryIds, tagIds],
    });

    // 執行 function：paged list
    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [lang, categoryIds, tagIds],
    });

    const visibleColumns: ColumnConfig[] = useMemo(() => {
        return [
            { key: WebResourceFields.Categories, title: "類別" },
            { key: WebResourceInfoFields.Title, title: "標題" },
            { key: WebResourceInfoFields.ResUrl, title: "連結" },
        ];
    }, []);

    const gridProps: GridProps = useMemo(() => {
        // 宣告變數
        const rows: GridRow[] = (useList.data ?? []).map(item => {
            const cells: RowCell[] = visibleColumns.map(col => {
                let content = "";

                switch (col.key) {
                    case WebResourceInfoFields.Title:
                        content = item.WebResourceInfo?.find(d => d.Lang === lang)?.Title ?? "";
                        break;

                    case WebResourceInfoFields.ResUrl:
                        content = item.WebResourceInfo?.find(d => d.Lang === lang)?.ResUrl ?? "";
                        break;

                    case WebResourceFields.Categories:
                        content = item.WebResource?.Categories ?? "";
                        break;

                    default:
                        content = "";
                        break;
                }

                return { col, content };
            });

            return { keyId:item.WebResource?.InternalId??"", cells };
        });
        return {
            columns: visibleColumns,
            rows,
            CurrentPage: useList.pageNumber,
            TotalPage: useList.totalPages,
            onPageChange: useList.onPageChange,
        } as GridProps;
    }, [useList.data, useList.pageNumber, useList.totalPages, useList.onPageChange, visibleColumns, lang]);
    
    return {
        rawData: useList.data ?? [],
        gridProps,
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
    };
};

const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: WebResourceSet[], catData: CategorySet[]): GridProps => {
    const newRows: GridRow[] = (gridProps.rows ?? []).map((row, index) => {
        const curRow = rawData?.[index];
        const contentStatus = curRow?.WebResource?.ContentStatus ?? 0;
        const curDt = curRow?.WebResourceInfo?.find(p => p.Lang === lang);

        const newCells = (row.cells ?? []).map((cell) => {
            const isTitle = cell.col.key === WebResourceInfoFields.Title;
            let nextContent = cell.content;

            switch (cell.col.key) {
                case WebResourceFields.Categories:
                    nextContent = formatCategoriesName(curRow?.WebResource?.Categories ?? "", catData, lang);
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
                            {isWithinLastNDaysFromString(curRow?.WebResource?.CreateTime ?? "") && (<span className="label label-warning">最新</span>)}
                            {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                            {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
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

const SetUrlIcon = (url: string, descript: string, target: WindowTarget) => {
    const tar = target === 0 ? "_self" : "_blank";
    const alt = `${descript}${target === 0 ? "" : "｜[另開視窗]"}`;

    return (
        <a href={url} target={tar} rel="noopener noreferrer" className="btn btn-default" title={alt}>
            <div className="link">Link</div>
        </a>
    );
};

const GridList_Comp = (props: { lang: Lang; title: string; GridData: GridProps }) => {
    const [columns, setColumns] = useState<ColumnConfig[]>(props.GridData.columns);

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
const PictureListContent = (prop: { lang: string, datas: WebResourceSet[] }) => {
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {
                prop.datas.map((item, idx) => {
                    const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                    const title = detail?.Title ?? "";
                    const validate = FormatDate(item.WebResource?.CreateTime);
                    const picId = item.WebResource?.PicId ?? "";
                    const urlRaw = detail?.ResUrl ?? "";
                    const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank";
                    const { isYoutube, url } = resolveYoutubeEmbedUrl(urlRaw);
                    const isVideo = false;//暫時
                    const contentStatus = item.WebResource?.ContentStatus ?? 0;

                    return (
                        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="figure_Box">
                                        {isYoutube ?
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <iframe width="100%" height="100%" src={url} title={title}
                                                        style={{ border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                                                </div>
                                            </div> :
                                            isVideo ?
                                                <a href={urlRaw} target={tar} className="card_image_link venobox" data-autoplay="true" data-vbtype="video" data-ratio="1x1" data-maxwidth="640px" title={title}>
                                                    <div className="card_figure">
                                                        <video width="100%">
                                                            <source src={`${FileManagementAPI.PREVIEW_URL}/${picId}`} />
                                                        </video>
                                                        <div className="videoDiv">
                                                            <div className="customize_Play_Btn Ripplestyle">
                                                                <i className="fas fa-play"></i><span className="sr-only">播放</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a> :
                                                <a href={urlRaw} target={tar} className="card_image_link venobox" data-autoplay="true" data-vbtype="video" data-ratio="1x1" data-maxwidth="640px" title={title}>
                                                    <div className="img-wrapper">
                                                        <img className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${picId}`} alt="" />
                                                    </div>
                                                </a>
                                        }
                                    </figure>

                                    {(isYoutube || isVideo) && (
                                        <div className="card_catDiv">
                                            <div className="card_cat">
                                                <div className="card_cat_link">
                                                    <span className="s-line">▍</span>
                                                    <span className="s-tle">{""}</span>
                                                </div>
                                            </div>
                                            <div className="card_time">
                                                <i className="far fa-clock mr-2"></i><span className="sr-only">日期</span>{validate}
                                            </div>
                                        </div>
                                    )}

                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2" style={{ textAlign: (isYoutube || isVideo) ? undefined : 'center' }}>
                                        <a href={urlRaw} target={tar} className="card_title">🔗{title}</a>
                                        <div className="d-flex gap-1 flex-wrap">
                                            {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                                            {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
                                        </div>
                                    </div>

                                    {(isYoutube || isVideo) && (
                                        <div className="card_StateDiv">
                                            <div className="More customize_btn">
                                                <a href={urlRaw} target={tar} className="Btn_s1" type="button" role="button" title="觀看更多">VIEW ALL<span className="ml-2">+</span></a>
                                            </div>

                                            <div className="ZoomIn customize_ZoomIn_btn">
                                                <a href={urlRaw} target={tar} className="Btn_zm1 venobox" data-autoplay="true" data-vbtype="iframe" data-maxwidth="640px" type="button" role="button" title="放大圖片">
                                                    <i className="fas fa-expand-alt"></i>
                                                    <span className="sr-only">放大圖片</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                    )
                })
            }
        </div>
    )
};

const YT_SHORT_REGEX = /^https?:\/\/(?:www\.)?youtu\.be\/([^?&#/]+)/i;

/** 解析YT網址 */
export const resolveYoutubeEmbedUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return { isYoutube: false, url: rawUrl ?? "" };
    const match = rawUrl.match(YT_SHORT_REGEX);
    if (!match) return { isYoutube: false, url: rawUrl };
    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { isYoutube: true, url: embedUrl };
};


///以下應該抽掉

interface WithinLastOptions {
    /** 當字串沒有時區資訊時，假定的時區位移（單位：分鐘）。預設 0 = 當成 UTC。例：台北(+08:00)傳 480 */
    assumeOffsetMinutes?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateTimeToEpochMs = (input: string, assumeOffsetMinutes: number = 0): number | null => {
    if (!input) return null;
    const s = input.trim();

    // 1) .NET /Date(1696540800000)/ 格式
    const msMatch = /\/Date\((\d+)\)\//.exec(s);
    if (msMatch) return Number(msMatch[1]);

    // 2) ISO 8601（含 Z 或 ±HH:mm）
    //    例如：2025-10-28T14:30:00Z、2025-10-28T14:30:00+08:00
    const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    if (hasTZ) {
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : t;
    }

    // 3) 無時區資訊的常見格式：
    //    YYYY-MM-DD[ |T]HH:mm[:ss[.fff]]   或   YYYY/MM/DD[ ...]
    //    以及只有日期：YYYY-MM-DD / YYYY/MM/DD
    const m = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(s);
    if (m) {
        const [_, y, mo, d, hh = "0", mm = "0", ss = "0", fff = "0"] = m;
        const ms = parseInt(fff.padEnd(3, "0"), 10);
        // 先組成「該時區的牆上時間」對應的 UTC 時間
        // 假設輸入代表的是「本地 assumeOffsetMinutes 的時間」
        // 例如 assumeOffsetMinutes=480 (台北 +08:00)，那 2025-10-28 14:30 代表 UTC=14:30-8h
        const asUTC = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss, ms) - assumeOffsetMinutes * 60 * 1000;
        return asUTC;
    }

    // 4) 其他能被 Date.parse 吃到的情況（不保證所有環境一致）
    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
};

export const isWithinLastNDaysFromString = (dateTimeStr?: string, n: number = 8, opts?: WithinLastOptions): boolean => {
    if (!dateTimeStr) return false;

    const assumeOffsetMinutes = opts?.assumeOffsetMinutes ?? 0;
    const targetMs = parseDateTimeToEpochMs(dateTimeStr, assumeOffsetMinutes);
    if (targetMs == null) return false;

    const nowMs = Date.now();
    const diffMs = nowMs - targetMs;

    // 僅計算「過去 n 天內」，未來時間回傳 false
    return diffMs >= 0 && diffMs <= n * DAY_MS;
};