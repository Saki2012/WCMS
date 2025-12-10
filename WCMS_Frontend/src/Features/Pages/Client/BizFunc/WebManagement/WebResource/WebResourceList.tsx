/**公告清單 */
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { PGID } from "@/Features/Hooks/Common/ProgId";
import { useEffect, useMemo, useState } from "react";
import { isWithinLastNDaysFromString } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
// type TagSet = components["schemas"]["TagSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"]

export interface IWebResourceListOptions { Category?: string; Tag?: string; Style: number; }
export interface IWebResourceListProps { node: INormNode; theme: IFETheme; lang: Lang; options?: IWebResourceListOptions; title: string }
const WebResourceListComp = (props: IWebResourceListProps) => {
    const useWebResList = useWebResourceList(props.options?.Category ?? "", props.options?.Tag ?? "", props.lang);
    const useCategory = useCategoryListData(PGID.WebResource, props.lang);
    const children = useMemo(() => {
        switch (props.options?.Style) {
            case 7:
            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={useWebResList.rawData ?? []} />;
            case 1:
            default: {
                const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.lang, useWebResList.gridProps, useWebResList.rawData, useCategory.rawData); }, [useWebResList.gridProps, useWebResList.rawData, useCategory.rawData]);
                return <GridList_Comp key="grid" title={""} GridData={adjustedGrid} />;
            }
        }
    }, [useWebResList, props.lang, props.options]);
    const loadingList = [useWebResList.isLoading, useCategory.isLoading];
    const errorList = [useWebResList.error, useCategory.error];
    return (
        <ModuleContent nodeTitle={props.node.title} loadingList={loadingList} errorList={errorList}>
            {children}
        </ModuleContent>
    )
};
export default WebResourceListComp

const useWebResourceList = (categoryIds: string, tagIds: string, lang: Lang) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Tags} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${WebResourceFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = WebResourceProvider();
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [WebResourceSetFields.WebResource, WebResourceFields.Categories],
            [WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title],
            [WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.ResUrl],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                WebResourceFields.InternalId,
                WebResourceFields.WebResourceId,
                WebResourceFields.PicId,
                WebResourceFields.PicDescription,
                WebResourceFields.Categories,
                WebResourceFields.ContentStatus,
                WebResourceFields.CreateTime,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case WebResourceInfoFields.Title:
                        {
                            content = item.WebResourceInfo?.find(d => d.Lang === lang)?.Title ?? "";
                            break;
                        }
                    case WebResourceInfoFields.Content:
                        {
                            content = item.WebResourceInfo?.find(d => d.Lang === lang)?.Content ?? "";
                            break;
                        }
                    default:
                        {
                            content = (item.WebResource as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [categoryIds, tagIds],
    });
};
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: WebResourceSet[], catData: CategorySet[]): GridProps => {
    const newRows: GridRow[] = (gridProps.rows ?? []).map((row, index) => {
        const curRow = rawData?.[index];
        const contentStatus = curRow?.WebResource?.ContentStatus ?? 0;
        const curDt = curRow?.WebResourceInfo?.find(p => p.Lang === lang);
        const newCells = (row.cells ?? []).map((cell) => {
            const isTitle = cell.col.key === WebResourceInfoFields.Title;
            // 先保留原本內容
            let nextContent = cell.content;
            // 只在特定欄位調整內容
            switch (cell.col.key) {
                case WebResourceFields.Categories:
                    nextContent = useFormatCategoriesName(curRow?.WebResource?.Categories ?? "", catData);
                    break;
                case WebResourceInfoFields.ResUrl:
                    nextContent = SetUrlIcon(curDt?.ResUrl ?? "", curDt?.Content ?? "", curDt?.Url_OpenType ?? 0);
                    break;

            }
            // 再把「最新 / 置頂 / 熱門」標籤疊上去（只對 Title 欄位）
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
            return { ...cell, content: wrappedContent, };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) => {
    const tar = target === 0 ? "_self" : "_blank"
    const alt = `${descript}${target === 0 ? "" : "｜[另開視窗]"}`
    return (
        <a href={url} target={tar} rel="noopener noreferrer" className="btn btn-default" title={alt}>
            <div className="link">Link</div>
        </a>
    )
}
//
const GridList_Comp = (props: { title: string; GridData: GridProps }) => {

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
            <OperationGuideHelp_Comp />
            <table className={"table table-striped table-bordered table-hover + table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.GridData.rows} />
            </table>
        </>
    )


    return (<></>
        // <table className="table table-striped table-bordered table-hover + Files_table + table-rwd" summary="檔案下載列表">
        //     <caption>檔案下載列表</caption>
        //     <thead>
        //         <tr className="tr-only-hide-titlebar">
        //             <th id="F1" scope="col" width="10%">類別</th>
        //             <th id="F2" scope="col" width="7%">排序</th>
        //             <th id="F3" scope="col" width="40%">標題</th>
        //             <th id="F4" scope="col" width="23%">檔案下載</th>
        //             <th id="F5" scope="col" width="8%">下載數</th>
        //             <th id="F6" scope="col" width="12%">上傳日期</th>
        //         </tr>
        //     </thead>
        //     <tbody>
        //         <tr>
        //             <td headers="F1" className="table_td_vertical_align" data-th="類別">檔案室</td>
        //             <td headers="F2" className="table_td_vertical_align" data-th="排序">0</td>
        //             <td headers="F3" className="table_td_vertical_align" data-th="標題">
        //                 <a href="javascript:void(0);">標題虛擬文字 Virtual text 虛擬文字 Virtual text 虛擬文字 Virtual text 虛擬文字 Virtual text</a>
        //                 <div className="CustomState">
        //                     <span className="label icon-small label-success">置頂</span>
        //                     <span className="label icon-small label-danger">熱門</span>
        //                     <span className="label icon-small label-warning">最新</span>
        //                 </div>
        //             </td>
        //             <td headers="F4" className="table_td_vertical_align" data-th="檔案下載">
        //                 <div className="Standard_btnDiv">
        //                     <a href="" className="btn btn-default + bg_pdf" role="button" aria-label="分享" target="_blank" title=".pdf [ 另開新視窗 ]" tabindex="0">
        //                         <span className="pdf">pdf</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_docx" role="button" aria-label="分享" target="_blank" title=".docx [ 另開新視窗 ]" tabindex="0">
        //                         <span className="docx">docx</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_docx" role="button" aria-label="分享" target="_blank" title=".odt [ 另開新視窗 ]" tabindex="0">
        //                         <span className="odt">odt</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_xlsx" role="button" aria-label="分享" target="_blank" title=".xlsx [ 另開新視窗 ]" tabindex="0">
        //                         <span className="xlsx">xlsx</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_xlsx" role="button" aria-label="分享" target="_blank" title=".ods [ 另開新視窗 ]" tabindex="0">
        //                         <span className="ods">ods</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_ppt" role="button" aria-label="分享" target="_blank" title=".ppt [ 另開新視窗 ]" tabindex="0">
        //                         <span className="ppt">ppt</span>
        //                     </a>
        //                     <a href="" className="btn btn-default + bg_link" role="button" aria-label="分享" target="_blank" title="[ 另開新視窗 ]" tabindex="0">
        //                         <span className="link">link</span>
        //                     </a>
        //                 </div>
        //             </td>
        //             <td headers="F5" className="table_td_vertical_align" data-th="下載數">0</td>
        //             <td headers="F6" className="table_td_vertical_align" data-th="上傳日期">2025-01-01</td>
        //         </tr>
        //     </tbody>
        // </table>
    )
}
/** YT要做自動解析 */
const PictureListContent = (prop: { lang: string, datas: WebResourceSet[] }) => {
    //有影音時顯示影音，如果沒有的話就往下確認yt
    //如果連結是Youtube，解析Youtube(embed)
    return (
        <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
            {
                prop.datas.map((item, idx) => {
                    const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                    const title = detail?.Title ?? "";
                    const validate = FormatDate(item.WebResource?.CreateTime)
                    const picId = item.WebResource?.PicId ?? ""
                    const urlRaw = detail?.ResUrl ?? ""
                    const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank"
                    const { isYoutube, url } = resolveYoutubeEmbedUrl(urlRaw);
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
                                            </a>
                                        }
                                    </figure>

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

                                    <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                        <a href={urlRaw} target={tar} className="card_title">{title}</a>
                                    </div>

                                    <div className="card_StateDiv">
                                        <div className="More customize_btn">
                                            <a href={urlRaw} target={tar} className="Btn_s1" type="button" role="button" title="觀看更多">VIEW ALL<span className="ml-2">+</span></a>
                                        </div>

                                        <div className="ZoomIn customize_ZoomIn_btn">
                                            {/* <a href="images/video/0_Robot(4.4)_1080x1080.mp4" className="Btn_zm1 venobox" data-autoplay="true" data-vbtype="video" data-ratio="1x1" data-maxwidth="640px" type="button" role="button" title="放大播放影片"> */}
                                            <a href={urlRaw} target={tar} className="Btn_zm1 venobox" data-autoplay="true" data-vbtype="iframe" data-maxwidth="640px" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )
                })
            }
        </div>
    )
}
const YT_SHORT_REGEX = /^https?:\/\/(?:www\.)?youtu\.be\/([^?&#/]+)/i;
/** 解析YT網址 */
export const resolveYoutubeEmbedUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return { isYoutube: false, url: rawUrl ?? "", };
    const match = rawUrl.match(YT_SHORT_REGEX);
    if (!match) return { isYoutube: false, url: rawUrl };
    const videoId = match[1]; // 抓到 {id}
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { isYoutube: true, url: embedUrl };
};