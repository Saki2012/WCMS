/** 檔案下載清單 */
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { useFileArchiveListData } from "./FileArchiveList_Loader";

type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];

const downloadColName = "__Download__";
const publicDownloadCountColName = "__PublicDownloadCount__";

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

const FileArchiveList = (props: FileArchiveProps) =>
{
    // 宣告變數
    const vm = useFileArchiveListData({ lang: props.lang, opts: props.options });
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };

    const baseGrid = useMemo(() =>
    {
        // return：建立功能基礎 grid
        return buildGridProps(props.lang, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange);
    }, [props.lang, vm.list, vm.pageNumber, vm.totalPages, vm.onPageChange]);

    const adjustedGrid = useMemo(() =>
    {
        // return：套用下載欄位與 Spec 擴充
        return SetAdjustFunction(props.lang, baseGrid, vm.list, vm.tagMap);
    }, [props.lang, baseGrid, vm.list, vm.tagMap]);

    // return
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={""}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            searchBar={vm.searchBar}
            paginatorProps={vm.paginatorProps}
            viewCountConfig={viewCountConfig}
        >
            <GridList_Comp key="grid" lang={props.lang} gridData={adjustedGrid} title={props.node.title} />
        </ModuleContent>
    );
};

export default FileArchiveList;

const GridList_Comp = (props: { lang: Lang; title: string; gridData: GridProps; }) =>
{
    // 宣告變數
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);

    useEffect(() =>
    {
        // 執行 function：同步欄位並套用已記錄欄寬
        setColumns(loadColumnWidths(props.gridData.columns));
    }, [props.gridData.columns]);

    const handleResize = (index: number, width: number) =>
    {
        // 執行 function：更新欄寬並寫入 localStorage
        setColumns(prev => saveColumnWidths(prev, index, width));
    };

    // return
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

/** 讀取 localStorage 欄寬 */
const loadColumnWidths = (columns: ColumnConfig[]): ColumnConfig[] =>
{
    // 宣告變數
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return columns;

    // 執行 function
    const widths = JSON.parse(saved) as Record<string, number>;

    // return
    return columns.map(col => ({
        ...col,
        width: typeof widths[col.key] === "number" ? widths[col.key] : typeof col.width === "number" ? col.width : undefined,
    }));
};

/** 儲存 resize 後的欄寬 */
const saveColumnWidths = (columns: ColumnConfig[], index: number, width: number): ColumnConfig[] =>
{
    // 宣告變數
    const updated = columns.map((col, idx) => idx === index ? { ...col, width } : col);
    const widths = buildColumnWidthMap(updated);

    // 執行 function
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));

    // return
    return updated;
};

/** 建立欄寬儲存格式 */
const buildColumnWidthMap = (columns: ColumnConfig[]): Record<string, number> =>
{
    // 宣告變數
    const widths: Record<string, number> = {};

    // 執行 function
    columns.forEach(col =>
    {
        if (typeof col.width === "number") widths[col.key] = col.width;
    });

    // return
    return widths;
};

/** 建立基礎 GridProps */
const buildGridProps = (lang: Lang, datas: FileArchiveSet[], pageNumber: number, totalPage: number, onPageChange: (page: number) => void): GridProps =>
{
    // 宣告變數
    const columns: ColumnConfig[] = [{ key: FileArchiveInfoFields.Title, title: "標題" }];
    const rows = buildGridRows(lang, datas, columns);

    // return
    return { columns, rows, CurrentPage: pageNumber, TotalPage: totalPage, onPageChange } as GridProps;
};

/** 建立基礎列資料 */
const buildGridRows = (lang: Lang, datas: FileArchiveSet[], columns: ColumnConfig[]): GridRow[] =>
{
    // return
    return datas.map(item =>
    {
        const cells = columns.map(col => ({ col, content: getBaseCellContent(lang, item, col.key) }));
        return { keyId: item.FileArchive?.InternalId ?? "", cells };
    });
};

/** 取得基礎欄位內容 */
const getBaseCellContent = (lang: Lang, item: FileArchiveSet, key: string): string =>
{
    // 執行 function
    if (key === FileArchiveInfoFields.Title) return item.FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";

    // return
    return "";
};

export interface FileArchiveListGridAdjustContext
{
    lang: Lang;
    gridProps: GridProps;
    rawData: FileArchiveSet[];
    tagMap: Record<string, string>;
    result: GridProps;
}

export type FileArchiveListGridAdjustSlot = (ctx: FileArchiveListGridAdjustContext) => GridProps;

/** 預設：核心版不改最終 grid */
export const extendFileArchiveListGridAdjust: FileArchiveListGridAdjustSlot = (ctx) =>
{
    // return
    return ctx.result;
};

const resolvedFileArchiveListGridAdjust = resolveSpecFunc<FileArchiveListGridAdjustSlot>(
    getClientSlotPath("FileArchiveList"),
    extendFileArchiveListGridAdjust,
    ["extendFileArchiveListGridAdjust"],
);

/** 套用下載欄位與 Spec 擴充 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Record<string, string>): GridProps =>
{
    // 宣告變數
    if (hasDownloadColumns(gridProps)) return gridProps;

    const columns = buildAdjustedColumns(gridProps.columns);
    const rows = buildAdjustedRows({ lang, gridProps, rawData, tagMap });
    const result: GridProps = { ...gridProps, columns, rows };

    // return
    return resolvedFileArchiveListGridAdjust({ lang, gridProps, rawData, tagMap, result });
};

/** 判斷是否已補過下載欄位 */
const hasDownloadColumns = (gridProps: GridProps): boolean =>
{
    // return
    return gridProps.columns.some(col => col.key === downloadColName || col.key === publicDownloadCountColName);
};

/** 建立補欄後的欄位 */
const buildAdjustedColumns = (columns: ColumnConfig[]): ColumnConfig[] =>
{
    // 宣告變數
    const downloadCol: ColumnConfig = { key: downloadColName, title: "下載" };
    const publicDownloadCountCol: ColumnConfig = { key: publicDownloadCountColName, title: "下載次數" };

    // return
    return [...columns, downloadCol, publicDownloadCountCol];
};

/** 建立補欄後的列資料 */
const buildAdjustedRows = (p: { lang: Lang; gridProps: GridProps; rawData: FileArchiveSet[]; tagMap: Record<string, string>; }): GridRow[] =>
{
    // return
    return p.gridProps.rows.map((row, index) => buildAdjustedRow({ ...p, row, index }));
};

/** 建立單列下載與狀態資料 */
const buildAdjustedRow = (p: { lang: Lang; row: GridRow; index: number; rawData: FileArchiveSet[]; tagMap: Record<string, string>; }): GridRow =>
{
    // 宣告變數
    const curRow = p.rawData?.[p.index];
    const fileRows = curRow ? getCurrentLangFileRows(p.lang, curRow) : [];
    const urlRows = curRow ? getCurrentLangUrlRows(p.lang, curRow) : [];
    const publicDownloadCount = getPublicDownloadCountTotal(fileRows);
    const contentStatus = Number(curRow?.FileArchive?.ContentStatus ?? 0);
    const cells = p.row.cells.map(cell => adjustBaseCell({ cell, contentStatus, tagMap: p.tagMap }));

    // return
    return { ...p.row, cells: [...cells, buildDownloadCell(fileRows, urlRows), buildDownloadCountCell(publicDownloadCount)] };
};

/** 調整原本欄位顯示 */
const adjustBaseCell = (p: { cell: RowCell; contentStatus: number; tagMap: Record<string, string>; }): RowCell =>
{
    // 執行 function
    if (p.cell.col?.key === FileArchiveFields.TagsId) return buildTagNameCell(p.cell, p.tagMap);
    if (p.cell.col?.key === FileArchiveInfoFields.Title) return buildTitleStatusCell(p.cell, p.contentStatus);

    // return
    return p.cell;
};

/** 將標籤 id 轉成名稱 */
const buildTagNameCell = (cell: RowCell, tagMap: Record<string, string>): RowCell =>
{
    // 宣告變數
    const ids = String(cell.content ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const names = ids.map(id => tagMap[id] ?? "").filter(Boolean).join("、");

    // return
    return { ...cell, content: names };
};

/** 建立標題與狀態標籤 */
const buildTitleStatusCell = (cell: RowCell, contentStatus: number): RowCell =>
{
    // return
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

/** 建立下載欄位 */
const buildDownloadCell = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[]): RowCell =>
{
    // return
    return { col: { key: downloadColName, title: "下載" }, content: <div className="Standard_btnDiv">{buildDownloadContent(fileRows, urlRows)}</div> };
};

/** 建立下載次數欄位 */
const buildDownloadCountCell = (count: number): RowCell =>
{
    // return
    return { col: { key: publicDownloadCountColName, title: "下載次數" }, content: String(count) };
};

/** 建立下載內容 */
const buildDownloadContent = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[]): JSX.Element =>
{
    // 宣告變數
    let content = <></>;

    // 執行 function
    fileRows.forEach(item =>
    {
        content = <>{content} {SetDownloadIcon(item.FileSrcId ?? "", item.FileSrc?.FileExtension ?? "docx", item.FileName ?? "")}</>;
    });
    urlRows.forEach(item =>
    {
        content = <>{content} {SetUrlIcon(item.Url ?? "", item.UrlDescription ?? "", item.WindowTarget ?? 0)}</>;
    });

    // return
    return content;
};

/** 取得目前語系的檔案列 */
const getCurrentLangFileRows = (lang: Lang, data: FileArchiveSet): FileArchiveDetail[] =>
{
    // 宣告變數
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;

    // return
    return (data.FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveDetail[];
};

/** 取得目前語系的連結列 */
const getCurrentLangUrlRows = (lang: Lang, data: FileArchiveSet): FileArchiveUrlDetail[] =>
{
    // 宣告變數
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;

    // return
    return (data.FileArchiveUrlDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveUrlDetail[];
};

/** 彙總實體檔案下載次數 */
const getPublicDownloadCountTotal = (fileRows: FileArchiveDetail[]): number =>
{
    // return
    return fileRows.reduce((sum, item) => sum + Number(item.FileSrc?.PublicDownloadCount ?? 0), 0);
};

/** 建立實體檔案下載連結 */
const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) =>
{
    // 宣告變數
    const safeExtName = fileExtName || "file";
    const label = fileTitle || `下載 ${safeExtName} 檔案`;
    const fileUrl = safeExtName.toLowerCase() === "pdf"
        ? FileManagementAPI.get_Public_Preview_Url(fileInternalId, fileTitle)
        : FileManagementAPI.get_Public_Download_Url(fileInternalId, fileTitle);

    // return
    return (
        <LangLink
            to={fileUrl}
            className={`btn btn-default + bg_${safeExtName}`}
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            title={label}
            aria-label={label}
        >
            <span className={safeExtName}>{safeExtName}</span>
        </LangLink>
    );
};

/** 建立外部連結下載連結 */
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) =>
{
    // 宣告變數
    const tar = target === 0 ? "_self" : "_blank";
    const label = descript || "開啟相關連結";
    const rel = tar === "_blank" ? "noopener noreferrer" : undefined;

    // return
    return (
        <LangLink to={url} className="btn btn-default + bg_link" role="button" target={tar} rel={rel} title={label} aria-label={label}>
            <span className="link">link</span>
        </LangLink>
    );
};
