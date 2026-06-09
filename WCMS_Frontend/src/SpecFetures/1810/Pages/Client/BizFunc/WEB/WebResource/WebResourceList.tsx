/**公告清單 */
import { type IWebResourceListProps } from "@/Features/Pages/Client/BizFunc/WEB/WebResource/Client_WebResource_List_Comp";
import { useWebResourceListData } from "@/Features/Pages/Client/BizFunc/WEB/WebResource/Client_WebResource_List_Loader";
import { Client_SearchBar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import DefaultImg from "@/SpecFetures/1810/Assets/Custom/WebResource_Default.png";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import type { GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMedia } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import { isWithinLastNDaysFromString } from "../Announcement/AnnouncementList";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

type WindowTarget = components["schemas"]["WindowTarget"];

type CategoryMap = Record<string, string>;

interface IVenoBoxInstance
{
    destroy?: () => void;
}

interface IVenoBoxWindow extends Window
{
    VenoBox?: new(options: Record<string, string | boolean>) => IVenoBoxInstance;
}
// #endregion

// #region Section
const WebResourceListComp = (props: IWebResourceListProps) =>
{
    // 宣告變數：直接吃 feature data
    const getData = useWebResourceListData({ lang: props.lang, opts: props.options });
    const style = props.options?.Style ?? 1;

    const content = useMemo(() =>
    {
        switch (style)
        {
            case 7:
                return <YoutubeContent key="yt" lang={props.lang} datas={getData.listData ?? []} />;

            case 2:
                return <PictureListContent key="pic" lang={props.lang} datas={getData.listData ?? []} />;

            case 1:
            default:
            {
                const adjustedGrid = SetAdjustFunction(props.lang, getData.gridProps, getData.listData, getData.categoryMap);
                return <GridList_Comp key="grid" lang={props.lang} GridData={adjustedGrid} Theme={props.theme} />;
            }
        }
    }, [style, props.lang, props.theme, getData.gridProps, getData.listData, getData.categoryMap]);

    // return
    return (
        <LoadingErrorHandler isLoading={getData.isLoading} errorList={getData.errorList}>
            <div className="row">
                <div className="page-header">
                    <h3>{props.title}</h3>
                </div>
            </div>
            <hr className="hr-Css" />
            {getData.searchBar && <Client_SearchBar_Comp {...getData.searchBar} />}
            {content}
        </LoadingErrorHandler>
    );
};

const GridList_Comp = (prop: { lang: Lang; Theme: IFETheme; GridData: GridProps; }) =>
{
    return (
        <>
            <OperationGuideHelp_Comp lang={prop.lang} />
            <Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator} />
        </>
    );
};
// #endregion

// #region Private
/** 把 category ids 轉成名稱 */
const formatCategoriesNameByMap = (content: string, categoryMap: CategoryMap) =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";

    return raw.split(",").map(s => s.trim()).filter(Boolean).map(id => categoryMap[id] ?? "").filter(Boolean).join("、");
};

export default WebResourceListComp;

const YoutubeContent = (prop: { lang: string; datas: WebResourceSet[]; }) =>
{
    const venoboxInstanceRef = useRef<IVenoBoxInstance | null>(null);

    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const win = window as IVenoBoxWindow;
        if (!win.VenoBox) return;

        if (venoboxInstanceRef.current?.destroy) venoboxInstanceRef.current.destroy();

        venoboxInstanceRef.current = new win.VenoBox({
            selector: ".photo_standardbox .venobox",
            autoplay: true,
            maxWidth: "1200px",
            border: "0px",
            titleattr: "title",
            numeration: true,
            infinigall: true,
            share: true,
        });

        return () =>
        {
            if (venoboxInstanceRef.current?.destroy) venoboxInstanceRef.current.destroy();
            venoboxInstanceRef.current = null;
        };
    }, [prop.datas, prop.lang]);

    return (
        <>
            <div className="row margin_0">
                {prop.datas.map(item =>
                {
                    const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                    const title = detail?.Title ?? "";
                    const urlRaw = detail?.ResUrl ?? "";
                    const tar = detail?.Url_OpenType === 0 ? "_self" : "_blank";
                    const { url } = LibMedia.resolveYoutubeEmbedUrl(urlRaw);

                    return (
                        <div className="col-lg-4 col-md-6 col-sm-6 col-12 photo_standardbox">
                            <a
                                className="venobox"
                                data-autoplay="true"
                                data-vbtype="video"
                                href={detail?.ResUrl ?? ""}
                                title={`${detail?.Title ?? ""} (另開新視窗)`}
                                target={tar}
                                rel="noopener noreferrer"
                            >
                                <div className="img-box">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={url}
                                        title={title}
                                        style={{ border: "none" }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    >
                                    </iframe>
                                </div>
                                <figcaption>
                                    <h3 className="title mt-0 mb-0">{detail?.Title ?? ""}</h3>
                                </figcaption>
                            </a>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const PictureListContent = (prop: { lang: string; datas: WebResourceSet[]; }) =>
{
    return (
        <>
            <div className="row margin_0">
                {(prop.datas ?? []).map(item =>
                {
                    const header = item.WebResource;
                    const detail = item.WebResourceInfo?.find(p => p.Lang === prop.lang);
                    const picUrl = FileManagementAPI.get_Public_Preview_Url(header?.PicId) ?? DefaultImg;

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
                    );
                })}
            </div>
        </>
    );
};

const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: WebResourceSet[], catMap: CategoryMap): GridProps =>
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
        <a href={url} target={tar} rel="noopener noreferrer" className="btn btn-default" title={alt}>
            <div className="link">Link</div>
        </a>
    );
};
// #endregion
