/**公告清單 */
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource_Api";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import DefaultImg from "@/SpecFetures/1810/Assets/Custom/WebResource_Default.png"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { PGID, WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import type { GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import { useEffect, useMemo, useRef } from "react";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { isWithinLastNDaysFromString } from "../Announcement/AnnouncementList";
import { resolveYoutubeEmbedUrl, type IWebResourceListProps } from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
// type TagSet = components["schemas"]["TagSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"]


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
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
            ],
            Condition: condition,
            RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
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

const WebResourceListComp = (props: IWebResourceListProps) => {
    const useWebResList = useWebResourceList(props.options?.Category ?? "", props.options?.Tag ?? "", props.lang);
    const useCategory = useCategoryListData(PGID.WebResource, props.lang);
    const isLoading = [useWebResList.isLoading, useCategory.isLoading];
    const errors = [useWebResList.error, useCategory.error];
    const content = useMemo(() => {
        switch (props.options?.Style) {
            case 7:
                return <YoutubeContent key="yt" lang={props.lang} datas={useWebResList.rawData ?? []} />;
            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={useWebResList.rawData ?? []} />;
            case 1:
            default: {
                const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.lang, useWebResList.gridProps, useWebResList.rawData, useCategory.rawData); }, [useWebResList.gridProps, useWebResList.rawData, useCategory.rawData]);
                return <GridList_Comp key="grid" lang={props.lang} GridData={adjustedGrid} Theme={props.theme} />;
            }
        }
    }, [useWebResList, props.lang, props.options]);

    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
            <div className="row"><div className="page-header"><h3>{props.title}</h3></div></div>
            <hr className="hr-Css" />
            {content}
        </LoadingErrorHandler>
    );
};

export default WebResourceListComp

const YoutubeContent = (prop: { lang: string, datas: WebResourceSet[] }) => {
    const venoboxInstanceRef = useRef<any | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const win = window as any;
        if (!win.VenoBox) return; // venobox JS 還沒載到就先跳過
        // 先把舊的 instance 清掉，避免重複綁定
        if (venoboxInstanceRef.current &&
            typeof venoboxInstanceRef.current.destroy === "function") {
            venoboxInstanceRef.current.destroy();
        }
        // 只針對這一區塊的 .venobox 綁燈箱
        venoboxInstanceRef.current = new win.VenoBox({
            selector: ".photo_standardbox .venobox", autoplay: true, maxWidth: "1200px",
            border: "0px", titleattr: "title", numeration: true, infinigall: true, share: true,
        });
        return () => {
            if (venoboxInstanceRef.current && typeof venoboxInstanceRef.current.destroy === "function") {
                venoboxInstanceRef.current.destroy();
                venoboxInstanceRef.current = null;
            }
        };
    }, [prop.datas, prop.lang]);
    return (<>
        <div className="row margin_0">
            {prop.datas.map((item) => {
                const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                const title = detail?.Title ?? "";
                const urlRaw = detail?.ResUrl ?? ""
                const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank"
                const { url } = resolveYoutubeEmbedUrl(urlRaw);
                return (
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <a className="venobox" data-autoplay="true" data-vbtype="video" href={detail?.ResUrl ?? ""} title={`${detail?.Title ?? ""} (另開新視窗)`} target={tar} rel="noopener noreferrer">
                            <div className="img-box">
                                <iframe width="100%" height="100%" src={url}
                                    title={title} style={{ border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen>
                                </iframe>
                            </div>
                            <figcaption>
                                <h3 className="title mt-0 mb-0">{detail?.Title ?? ""}</h3>
                            </figcaption>
                        </a>
                    </div>
                )
            })}
        </div>
    </>)
}

const PictureListContent = (prop: { lang: string, datas: WebResourceSet[] }) => {
    return (<>
        <div className="row margin_0">
            {(prop.datas ?? []).map((item) => {
                const header = item.WebResource;
                const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                const picUrl = header?.PicId ? `${FileManagementAPI.PREVIEW_URL}/${header.PicId}` : DefaultImg
                return (
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <a href={detail?.ResUrl ?? ""} title={`${detail?.Title}(另開新視窗)`} target="_blank" rel="noopener noreferrer">
                            <div className="img-box">
                                <img className="img-fluid" src={picUrl} alt={header?.PicDescription ?? ""} />
                            </div>
                            <figcaption>
                                <h3 className="title mt-0 mb-0">{detail?.Title}</h3>
                            </figcaption>
                        </a>
                    </div>
                )
            })}
        </div>
    </>)
}
const GridList_Comp = (prop: { lang: Lang; Theme: IFETheme; GridData: GridProps }) => {
    return (
        <>
            <OperationGuideHelp_Comp lang={prop.lang} />
            <Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator} />
        </>)
}



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
                    nextContent = useFormatCategoriesName(curRow?.WebResource?.Categories ?? "", catData, lang);
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