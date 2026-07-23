/** 檔案下載清單 */
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { applyGridColumnWidths, readGridColumnWidths, writeGridColumnWidths } from "@/SysCore/Components/Grid/Grid_ColumnWidth";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { getModelColumnDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { FileArchiveFields, FileArchiveInfoFields, FileManageFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { useFileArchiveListData } from "./Client_FileArchive_List_Loader";

// #region Property
type FileArchiveFormModel = components["schemas"]["FileArchive"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail"];
type WindowTarget = components["schemas"]["WindowTarget"];
const downloadColName = "__Download__";
const publicDownloadCountColName = "__PublicDownloadCount__";
const FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY = "client-filearchive-grid-column-widths";

export interface IFileArchiveOptions
{
    Category: string;
    Tag: string;
}

export interface FileArchiveProps
{
    lang: Lang;
    theme: IFETheme;
    options: IFileArchiveOptions;
    site: INormSite;
    node: INormNode;
}

type FileArchiveListVm = ReturnType<typeof useFileArchiveListData>;

export interface FileArchiveListViewProps extends FileArchiveProps
{
    /** Feature List Hook 整理後的檔案清單資料。 */
    vm: FileArchiveListVm;
    /** Feature 基礎欄位與 Spec 欄位擴充後的 Grid 設定。 */
    adjustedGrid: GridProps;
}

export interface FileArchiveListGridAdjustContext
{
    lang: Lang;
    modelDisplayName: ModelDisplaySchema | null;
    gridProps: GridProps;
    rawData: FileArchiveFormModel[];
    tagMap: Record<string, string>;
    result: GridProps;
}

export type FileArchiveListGridAdjustSlot = (ctx: FileArchiveListGridAdjustContext) => GridProps;

interface FileArchiveExtraColumns
{
    download: ColumnConfig;
    downloadCount: ColumnConfig;
}
// #endregion

// #region Initialization
const extendFileArchiveListGridAdjust: FileArchiveListGridAdjustSlot = ctx => ctx.result;
let fileArchiveListGridAdjustCache: FileArchiveListGridAdjustSlot | null = null;
/** FileArchive List View 快取，避免每次 render 重複解析 Spec View。 */
let fileArchiveListViewCache: typeof Client_FileArchive_List_FeatureView | null = null;
// #endregion

// #region Public
/** 檔案下載清單完整 Comp，負責取得 Feature Hook 資料，再交給 List Entry。 */
export const Client_FileArchive_List_Comp = (props: FileArchiveProps) =>
{
    const vm = useFileArchiveListData({ lang: props.lang, opts: props.options });
    const baseGrid = useMemo(
        () => buildGridProps(props.lang, vm.modelDisplayName, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange),
        [props.lang, vm.modelDisplayName, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange],
    );
    const adjustedGrid = useMemo(
        () => SetAdjustFunction(props.lang, vm.modelDisplayName, baseGrid, vm.list, vm.tagMap),
        [props.lang, vm.modelDisplayName, baseGrid, vm.list, vm.tagMap],
    );

    return <Client_FileArchive_List {...props} vm={vm} adjustedGrid={adjustedGrid} />;
};

/** 檔案下載 ListView Entry，正式前台統一從這裡進入 Spec / Feature DOM。 */
export const Client_FileArchive_List = (props: FileArchiveListViewProps) =>
{
    const ListView = getFileArchiveListView();
    return <ListView {...props} />;
};

/** 檔案下載 Feature 預設 View，只負責輸出 DOM。 */
const Client_FileArchive_List_FeatureView = (props: FileArchiveListViewProps) =>
{
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} isLoading={props.vm.isLoading} errorList={props.vm.errorList} searchBar={props.vm.searchBar} paginatorProps={props.vm.paginatorProps} viewCountConfig={viewCountConfig}>
            <GridList_Comp key="grid" lang={props.lang} gridData={props.adjustedGrid} title={props.node.title} />
        </ModuleContent>
    );
};
// #endregion

// #region Section
const GridList_Comp = (props: { lang: Lang; title: string; gridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    useEffect(() =>
    {
        const widths = readGridColumnWidths(FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY);
        const nextColumns = Object.keys(widths).length > 0
            ? applyGridColumnWidths(props.gridData.columns, widths)
            : props.gridData.columns;
        setColumns(nextColumns);
    }, [props.gridData.columns]);

    const handleResize = (index: number, width: number): void =>
    {
        setColumns(prev =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            writeGridColumnWidths(FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY, updated);
            return updated;
        });
    };

    return (
        <>
            <OperationGuideHelp_Comp lang={props.lang} />
            <table className={"table table-striped table-bordered table-hover + table-rwd"} summary={props.title}>
                <caption>{props.title}</caption>
                <ColRender columns={columns} onResize={handleResize} />
                <RowRender rows={props.gridData.rows} />
            </table>
        </>
    );
};
// #endregion

// #region Protected
/** 建立基礎 GridProps。 */
const buildGridProps = (
    lang: Lang,
    model: ModelDisplaySchema | null,
    datas: FileArchiveFormModel[],
    pageNumber: number,
    totalPage: number,
    onPageChange: (page: number) => void,
): GridProps =>
{
    const fallbackTitle = lang === "en" ? "Title" : "標題";
    const title = getModelColumnDisplayName(model, ["FileArchiveInfo_DTO", "FileArchiveInfo"], FileArchiveInfoFields.Title, fallbackTitle);
    const columns: ColumnConfig[] = [{ key: FileArchiveInfoFields.Title, title }];
    const rows = datas.map(item => buildBaseGridRow(lang, item, columns));
    return { columns, rows, CurrentPage: pageNumber, TotalPage: totalPage, onPageChange } as GridProps;
};

/** 建立一筆基礎 GridRow。 */
const buildBaseGridRow = (lang: Lang, item: FileArchiveFormModel, columns: ColumnConfig[]): GridRow =>
{
    const cells = columns.map(col => ({ col, content: getBaseCellContent(lang, item, col.key) }));
    return { keyId: item.InternalId ?? "", cells };
};

/** 建立前端虛擬下載欄位與後端下載次數欄位。 */
const buildExtraColumns = (lang: Lang, model: ModelDisplaySchema | null): FileArchiveExtraColumns =>
{
    const isEnglish = lang === "en";
    const download: ColumnConfig = { key: downloadColName, title: isEnglish ? "Download" : "下載" };
    const downloadCount: ColumnConfig = {
        key: publicDownloadCountColName,
        title: getModelColumnDisplayName(model, ["FileManageModel_DTO", "FileManageModel"], FileManageFields.PublicDownloadCount, isEnglish ? "Download Count" : "下載次數"),
    };
    return { download, downloadCount };
};

/** 建立補欄後的欄位。 */
const buildAdjustedColumns = (columns: ColumnConfig[], extra: FileArchiveExtraColumns): ColumnConfig[] =>
{
    return [...columns, extra.download, extra.downloadCount];
};

/** 建立補欄後的列資料。 */
const buildAdjustedRows = (p: {
    lang: Lang;
    gridProps: GridProps;
    rawData: FileArchiveFormModel[];
    tagMap: Record<string, string>;
    extra: FileArchiveExtraColumns;
}): GridRow[] =>
{
    return p.gridProps.rows.map((row, index) => buildAdjustedRow({ ...p, row, index }));
};

/** 建立單列下載與狀態資料。 */
const buildAdjustedRow = (p: {
    lang: Lang;
    row: GridRow;
    index: number;
    rawData: FileArchiveFormModel[];
    tagMap: Record<string, string>;
    extra: FileArchiveExtraColumns;
}): GridRow =>
{
    const curRow = p.rawData?.[p.index];
    const fileRows = curRow ? getCurrentLangFileRows(p.lang, curRow) : [];
    const urlRows = curRow ? getCurrentLangUrlRows(p.lang, curRow) : [];
    const publicDownloadCount = fileRows.reduce((sum, item) => sum + Number(item.FileSrc?.PublicDownloadCount ?? 0), 0);
    const contentStatus = Number(curRow?.ContentStatus ?? 0);
    const cells = p.row.cells.map(cell => adjustBaseCell({ cell, contentStatus, tagMap: p.tagMap }));
    return { ...p.row, cells: [...cells, buildDownloadCell(fileRows, urlRows, p.extra.download), buildDownloadCountCell(publicDownloadCount, p.extra.downloadCount)] };
};

/** 將標籤 id 轉成名稱。 */
const buildTagNameCell = (cell: RowCell, tagMap: Record<string, string>): RowCell =>
{
    const ids = LibText.splitTrimToArray(String(cell.content ?? ""));
    const names = LibText.mapKeysToDisplayText(ids, tagMap);
    return { ...cell, content: names };
};

/** 建立標題與狀態標籤。 */
const buildTitleStatusCell = (cell: RowCell, contentStatus: number): RowCell =>
{
    return {
        ...cell,
        content: (
            <>
                <div>{cell.content}</div>
                <div className="d-flex gap-1 flex-wrap">
                    {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                    {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                </div>
            </>
        ),
    };
};

/** 建立下載欄位。 */
const buildDownloadCell = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[], col: ColumnConfig): RowCell =>
{
    return { col, content: <div className="Standard_btnDiv">{buildDownloadContent(fileRows, urlRows)}</div> };
};

/** 建立下載次數欄位。 */
const buildDownloadCountCell = (count: number, col: ColumnConfig): RowCell =>
{
    return { col, content: String(count) };
};

/** 建立下載內容。 */
const buildDownloadContent = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[]): JSX.Element =>
{
    let content = <></>;
    fileRows.forEach(item =>
    {
        content = <>{content} {SetDownloadIcon(item.FileSrcId ?? "", item.FileSrc?.FileExtension ?? "docx", item.FileName ?? "")}</>;
    });
    urlRows.forEach(item =>
    {
        content = <>{content} {SetUrlIcon(item.Url ?? "", item.UrlDescription ?? "", item.WindowTarget ?? 0)}</>;
    });
    return content;
};

/** 取得 FileArchive List Grid Spec，延後解析避免 import 期循環引用。 */
const getResolvedFileArchiveListGridAdjust = (): FileArchiveListGridAdjustSlot =>
{
    if (fileArchiveListGridAdjustCache !== null) return fileArchiveListGridAdjustCache;
    fileArchiveListGridAdjustCache = resolveSpecFunc<FileArchiveListGridAdjustSlot>(getClientSlotPath("Slot_FileArchive_List_Comp"), extendFileArchiveListGridAdjust, ["extendFileArchiveListGridAdjust"]);
    return fileArchiveListGridAdjustCache;
};

/** 取得 FileArchive List View，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getFileArchiveListView = (): typeof Client_FileArchive_List_FeatureView =>
{
    if (fileArchiveListViewCache !== null) return fileArchiveListViewCache;
    fileArchiveListViewCache = resolveSpecComponent(getClientSlotPath("Slot_FileArchive_List_Comp"), Client_FileArchive_List_FeatureView, ["Client_FileArchive_List"]);
    return fileArchiveListViewCache;
};
// #endregion

// #region Private
/** 取得基礎欄位內容 */
const getBaseCellContent = (lang: Lang, item: FileArchiveFormModel, key: string): string =>
{
    if (key === FileArchiveInfoFields.Title) return item._FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";
    return "";
};
/** 套用下載欄位與 Spec 擴充 */
const SetAdjustFunction = (
    lang: Lang,
    modelDisplayName: ModelDisplaySchema | null,
    gridProps: GridProps,
    rawData: FileArchiveFormModel[],
    tagMap: Record<string, string>,
): GridProps =>
{
    if (gridProps.columns.some(col => col.key === downloadColName || col.key === publicDownloadCountColName)) return gridProps;
    const extra = buildExtraColumns(lang, modelDisplayName);
    const columns = buildAdjustedColumns(gridProps.columns, extra);
    const rows = buildAdjustedRows({ lang, gridProps, rawData, tagMap, extra });
    const result: GridProps = { ...gridProps, columns, rows };
    return getResolvedFileArchiveListGridAdjust()({ lang, modelDisplayName, gridProps, rawData, tagMap, result });
};

/** 調整原本欄位顯示。 */
const adjustBaseCell = (p: { cell: RowCell; contentStatus: number; tagMap: Record<string, string>; }): RowCell =>
{
    if (p.cell.col?.key === FileArchiveFields.TagsId) return buildTagNameCell(p.cell, p.tagMap);
    if (p.cell.col?.key === FileArchiveInfoFields.Title) return buildTitleStatusCell(p.cell, p.contentStatus);
    return p.cell;
};
/** 取得目前語系的檔案列 */
const getCurrentLangFileRows = (lang: Lang, data: FileArchiveFormModel): FileArchiveDetail[] =>
{
    const info = data._FileArchiveInfo?.find(p => p.Lang === lang);
    return sortFileArchiveRows(info?._FileArchiveDetail);
};
/** 取得目前語系的連結列 */
const getCurrentLangUrlRows = (lang: Lang, data: FileArchiveFormModel): FileArchiveUrlDetail[] =>
{
    const info = data._FileArchiveInfo?.find(p => p.Lang === lang);
    return sortFileArchiveRows(info?._FileArchiveUrlDetail);
};
/** 依 RowNo 排序檔案室子資料，舊資料缺值時以 RowId 維持穩定順序。 */
const sortFileArchiveRows = <TRow extends { RowId?: number; RowNo?: number | null; }>(rows?: TRow[] | null): TRow[] =>
{
    return [...(rows ?? [])].sort((a, b) =>
    {
        const rowNoDiff = Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0);
        return rowNoDiff || Number(a.RowId ?? 0) - Number(b.RowId ?? 0);
    });
};

/** 建立檔案下載按鈕。 */
const SetDownloadIcon = (internalId: string, extension: string, fileName: string): JSX.Element =>
{
    const safeExtension = extension || "file";
    const label = fileName || `下載 ${safeExtension} 檔案`;
    const href = safeExtension.toLowerCase() === "pdf"
        ? FileManagementAPI.get_Public_Preview_Url(internalId, fileName)
        : FileManagementAPI.get_Public_Download_Url(internalId, fileName);

    return (
        <LangLink
            to={href}
            className={`btn btn-default + bg_${safeExtension}`}
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            title={label}
            aria-label={label}
        >
            <span className={safeExtension}>{safeExtension}</span>
        </LangLink>
    );
};

/** 建立外部連結按鈕。 */
const SetUrlIcon = (url: string, description: string, target: WindowTarget): JSX.Element =>
{
    const windowTarget = Number(target) === 1 ? "_blank" : "_self";
    return (
        <LangLink to={url} target={windowTarget} rel={windowTarget === "_blank" ? "noopener noreferrer" : undefined} title={description} aria-label={description}>
            <i className="fas fa-link" aria-hidden="true" />
            <span className="sr-only">{description}</span>
        </LangLink>
    );
};
// #endregion
