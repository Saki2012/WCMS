/** 檔案下載清單 */
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { applyGridColumnWidths, readGridColumnWidths, writeGridColumnWidths } from "@/SysCore/Components/Grid/Grid_ColumnWidth";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { useFileArchiveListData } from "./Client_FileArchive_List_Loader";

// #region Property
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
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
export interface FileArchiveListGridAdjustContext
{
    lang: Lang;
    gridProps: GridProps;
    rawData: FileArchiveSet[];
    tagMap: Record<string, string>;
    result: GridProps;
}
export type FileArchiveListGridAdjustSlot = (ctx: FileArchiveListGridAdjustContext) => GridProps;
// #endregion

// #region Initialization
const extendFileArchiveListGridAdjust: FileArchiveListGridAdjustSlot = (ctx) => ctx.result;
const resolvedFileArchiveListGridAdjust = resolveSpecFunc<FileArchiveListGridAdjustSlot>(getClientSlotPath("FileArchiveList"), extendFileArchiveListGridAdjust, ["extendFileArchiveListGridAdjust"]);
// #endregion

// #region Public
export const Client_FileArchive_List = (props: FileArchiveProps) =>
{
    const vm = useFileArchiveListData({ lang: props.lang, opts: props.options });
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    const baseGrid = useMemo(() => buildGridProps(props.lang, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange), [props.lang, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange]);
    const adjustedGrid = useMemo(() => SetAdjustFunction(props.lang, baseGrid, vm.list, vm.tagMap), [props.lang, baseGrid, vm.list, vm.tagMap]);
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} isLoading={vm.isLoading} errorList={vm.errorList} searchBar={vm.searchBar} paginatorProps={vm.paginatorProps} viewCountConfig={viewCountConfig}>
            <GridList_Comp key="grid" lang={props.lang} gridData={adjustedGrid} title={props.node.title} />
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
        setColumns((prev) =>
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
/** 建立基礎 GridProps */
const buildGridProps = (lang: Lang, datas: FileArchiveSet[], pageNumber: number, totalPage: number, onPageChange: (page: number) => void): GridProps =>
{
    const columns: ColumnConfig[] = [{ key: FileArchiveInfoFields.Title, title: "標題" }];
    const rows = datas.map(item =>
    {
        const cells = columns.map(col => ({ col, content: getBaseCellContent(lang, item, col.key) }));
        return { keyId: item.FileArchive?.InternalId ?? "", cells };
    });
    return { columns, rows, CurrentPage: pageNumber, TotalPage: totalPage, onPageChange } as GridProps;
};
/** 建立補欄後的欄位 */
const buildAdjustedColumns = (columns: ColumnConfig[]): ColumnConfig[] =>
{
    const downloadCol: ColumnConfig = { key: downloadColName, title: "下載" };
    const publicDownloadCountCol: ColumnConfig = { key: publicDownloadCountColName, title: "下載次數" };
    return [...columns, downloadCol, publicDownloadCountCol];
};
/** 建立補欄後的列資料 */
const buildAdjustedRows = (p: { lang: Lang; gridProps: GridProps; rawData: FileArchiveSet[]; tagMap: Record<string, string>; }): GridRow[] =>
{
    return p.gridProps.rows.map((row, index) => buildAdjustedRow({ ...p, row, index }));
};
/** 建立單列下載與狀態資料 */
const buildAdjustedRow = (p: { lang: Lang; row: GridRow; index: number; rawData: FileArchiveSet[]; tagMap: Record<string, string>; }): GridRow =>
{
    const curRow = p.rawData?.[p.index];
    const fileRows = curRow ? getCurrentLangFileRows(p.lang, curRow) : [];
    const urlRows = curRow ? getCurrentLangUrlRows(p.lang, curRow) : [];
    const publicDownloadCount = fileRows.reduce((sum, item) => sum + Number(item.FileSrc?.PublicDownloadCount ?? 0), 0);
    const contentStatus = Number(curRow?.FileArchive?.ContentStatus ?? 0);
    const cells = p.row.cells.map(cell => adjustBaseCell({ cell, contentStatus, tagMap: p.tagMap }));
    return { ...p.row, cells: [...cells, buildDownloadCell(fileRows, urlRows), buildDownloadCountCell(publicDownloadCount)] };
};
/** 將標籤 id 轉成名稱 */
const buildTagNameCell = (cell: RowCell, tagMap: Record<string, string>): RowCell =>
{
    const ids = LibText.splitTrimToArray(String(cell.content ?? ""));
    const names = LibText.mapKeysToDisplayText(ids, tagMap);
    return { ...cell, content: names };
};
/** 建立標題與狀態標籤 */
const buildTitleStatusCell = (cell: RowCell, contentStatus: number): RowCell =>
{
    return {
        ...cell,
        content: (
            <>
                <div>{cell.content}</div>
                <div className="d-flex gap-1 flex-wrap">{Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>} {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}</div>
            </>
        ),
    };
};
/** 建立下載欄位 */
const buildDownloadCell = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[]): RowCell =>
{
    return { col: { key: downloadColName, title: "下載" }, content: <div className="Standard_btnDiv">{buildDownloadContent(fileRows, urlRows)}</div> };
};
/** 建立下載次數欄位 */
const buildDownloadCountCell = (count: number): RowCell =>
{
    return { col: { key: publicDownloadCountColName, title: "下載次數" }, content: String(count) };
};
/** 建立下載內容 */
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
// #endregion

// #region Private
/** 取得基礎欄位內容 */
const getBaseCellContent = (lang: Lang, item: FileArchiveSet, key: string): string =>
{
    if (key === FileArchiveInfoFields.Title) return item.FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";
    return "";
};
/** 套用下載欄位與 Spec 擴充 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Record<string, string>): GridProps =>
{
    if (gridProps.columns.some(col => col.key === downloadColName || col.key === publicDownloadCountColName)) return gridProps;
    const columns = buildAdjustedColumns(gridProps.columns);
    const rows = buildAdjustedRows({ lang, gridProps, rawData, tagMap });
    const result: GridProps = { ...gridProps, columns, rows };
    return resolvedFileArchiveListGridAdjust({ lang, gridProps, rawData, tagMap, result });
};
/** 調整原本欄位顯示 */
const adjustBaseCell = (p: { cell: RowCell; contentStatus: number; tagMap: Record<string, string>; }): RowCell =>
{
    if (p.cell.col?.key === FileArchiveFields.TagsId) return buildTagNameCell(p.cell, p.tagMap);
    if (p.cell.col?.key === FileArchiveInfoFields.Title) return buildTitleStatusCell(p.cell, p.contentStatus);
    return p.cell;
};
/** 取得目前語系的檔案列 */
const getCurrentLangFileRows = (lang: Lang, data: FileArchiveSet): FileArchiveDetail[] =>
{
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;
    return (data.FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveDetail[];
};
/** 取得目前語系的連結列 */
const getCurrentLangUrlRows = (lang: Lang, data: FileArchiveSet): FileArchiveUrlDetail[] =>
{
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;
    return (data.FileArchiveUrlDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveUrlDetail[];
};
/** 建立實體檔案下載連結 */
const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) =>
{
    const safeExtName = fileExtName || "file";
    const label = fileTitle || `下載 ${safeExtName} 檔案`;
    const fileUrl = safeExtName.toLowerCase() === "pdf" ? FileManagementAPI.get_Public_Preview_Url(fileInternalId, fileTitle) : FileManagementAPI.get_Public_Download_Url(fileInternalId, fileTitle);
    return (
        <LangLink to={fileUrl} className={`btn btn-default + bg_${safeExtName}`} target="_blank" rel="noopener noreferrer" role="button" title={label} aria-label={label}>
            <span className={safeExtName}>{safeExtName}</span>
        </LangLink>
    );
};
/** 建立外部連結下載連結 */
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) =>
{
    const tar = target === 0 ? "_self" : "_blank";
    const label = descript || "開啟相關連結";
    const rel = tar === "_blank" ? "noopener noreferrer" : undefined;
    return (
        <LangLink to={url} className="btn btn-default + bg_link" role="button" target={tar} rel={rel} title={label} aria-label={label}>
            <span className="link">link</span>
        </LangLink>
    );
};
// #endregion
