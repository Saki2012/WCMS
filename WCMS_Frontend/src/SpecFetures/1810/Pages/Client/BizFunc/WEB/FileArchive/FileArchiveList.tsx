/**公告清單 */
import type { FileArchiveProps } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Comp";
import { useFileArchiveListData } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Loader";
import { Client_SearchBar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];

type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];

type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];

type WindowTarget = components["schemas"]["WindowTarget"];
// #endregion

// #region Section
/** 清單式 */
const List_Comp = (prop: { lang: Lang; gridData: GridProps; theme: IFETheme; }) =>
{
    // return：保留 1810 原本 DOM 結構
    return (
        <>
            <OperationGuideHelp_Comp lang={prop.lang} />
            <Grid gridData={prop.gridData} style={prop.theme.GridView} pageStyle={prop.theme.Paginator} />
        </>
    );
};
// #endregion

// #region Protected
/** 建立 1810 基礎欄位 */
const buildGridColumns = (): ColumnConfig[] =>
{
    // return：保留 1810 原本欄位順序（標籤、標題）
    return [{ key: FileArchiveFields.TagsId, title: "標籤" }, { key: FileArchiveInfoFields.Title, title: "標題" }];
};

/** 建立 1810 基礎列資料 */
const buildGridRows = (lang: Lang, datas: FileArchiveSet[], columns: ColumnConfig[]): GridRow[] =>
{
    // return：只處理 1810 原本基礎欄位內容
    return datas.map(item =>
    {
        const cells: RowCell[] = columns.map(col =>
        {
            const content = getBaseCellContent(lang, item, col.key);
            return { col, content };
        });

        return { keyId: item.FileArchive?.InternalId ?? "", cells };
    });
};

/** 建立 1810 GridProps */
const buildGridProps = (lang: Lang, datas: FileArchiveSet[], pageNumber: number, totalPages: number, onPageChange: (page: number) => void): GridProps =>
{
    // 宣告變數
    const columns = buildGridColumns();
    const rows = buildGridRows(lang, datas, columns);

    // return
    return { columns, rows, CurrentPage: pageNumber, TotalPage: totalPages, onPageChange } as GridProps;
};

/** 建立下載內容 */
const buildDownloadContent = (fileRows: FileArchiveDetail[], urlRows: FileArchiveUrlDetail[]): JSX.Element =>
{
    // 宣告變數
    let content = <></>;

    // 執行 function：實體檔案
    fileRows.forEach(item =>
    {
        content = <>{content} {SetDownloadIcon(item.FileSrcId ?? "", item.FileSrc?.FileExtension ?? "docx", item.FileName ?? "")}</>;
    });

    // 執行 function：外部連結
    urlRows.forEach(item =>
    {
        content = <>{content} {SetUrlIcon(item.Url ?? "", item.UrlDescription ?? "", item.WindowTarget ?? 0)}</>;
    });

    // return
    return content;
};
// #endregion

// #region Private
export const FileArchiveList = (props: FileArchiveProps) =>
{
    // 宣告變數
    const useFileArchiveList = useFileArchiveListData({ lang: props.lang, opts: props.options });

    const baseGrid = useMemo(() =>
    {
        // 執行 function：維持 1810 原本基礎欄位結構
        return buildGridProps(
            props.lang,
            useFileArchiveList.list,
            useFileArchiveList.pageNumber,
            useFileArchiveList.totalPages,
            useFileArchiveList.onPageChange,
        );
    }, [props.lang, useFileArchiveList.list, useFileArchiveList.pageNumber, useFileArchiveList.totalPages, useFileArchiveList.onPageChange]);

    const adjustedGrid = useMemo(() =>
    {
        // 執行 function：補下載 / 下載次數欄位與 tag 名稱
        return SetAdjustFunction(props.lang, baseGrid, useFileArchiveList.list, useFileArchiveList.tagMap);
    }, [props.lang, baseGrid, useFileArchiveList.list, useFileArchiveList.tagMap]);

    const content = useMemo(() =>
    {
        // return：保留 1810 原本 DOM 結構
        return <List_Comp key="grid" lang={props.lang} gridData={adjustedGrid} theme={props.theme} />;
    }, [props.lang, adjustedGrid, props.theme]);

    return (
        <>
            {useFileArchiveList.searchBar && <Client_SearchBar_Comp {...useFileArchiveList.searchBar} />}
            <LoadingErrorHandler isLoading={useFileArchiveList.isLoading} errorList={useFileArchiveList.errorList}>{content}</LoadingErrorHandler>
        </>
    );
};
/** 取得基礎欄位內容 */
const getBaseCellContent = (lang: Lang, item: FileArchiveSet, key: string): string =>
{
    // 執行 function：依欄位決定顯示值
    switch (key)
    {
        case FileArchiveFields.TagsId:
            return item.FileArchive?.TagsId ?? "";
        case FileArchiveInfoFields.Title:
            return item.FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";
        default:
            return "";
    }
};

/** 補下載 / 下載次數欄位與 tag 名稱 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Record<string, string>): GridProps =>
{
    // 宣告變數
    const downloadColName = "__Download__";
    const publicDownloadCountColName = "__PublicDownloadCount__";

    // 執行 function：避免重複處理
    if (gridProps.columns.some(col => col.key === downloadColName || col.key === publicDownloadCountColName))
    {
        return gridProps;
    }

    const downloadCol: ColumnConfig = { key: downloadColName, title: "下載" };
    const publicDownloadCountCol: ColumnConfig = { key: publicDownloadCountColName, title: "下載次數" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, downloadCol, publicDownloadCountCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) =>
    {
        // 宣告變數
        const curRow = rawData?.[index];
        const fileRows = curRow ? getCurrentLangFileRows(lang, curRow) : [];
        const urlRows = curRow ? getCurrentLangUrlRows(lang, curRow) : [];
        const publicDownloadCount = getPublicDownloadCountTotal(fileRows);
        const downloadFileContent = buildDownloadContent(fileRows, urlRows);

        const cells = row.cells.map(cell =>
        {
            if (cell.col?.key !== FileArchiveFields.TagsId) return cell;

            const ids = String(cell.content ?? "").split(",").map(s => s.trim()).filter(Boolean);

            const names = ids.map(id => tagMap[id] ?? "").filter(Boolean).join("、");

            return { ...cell, content: names };
        });

        const downloadCell: RowCell = { col: downloadCol, content: downloadFileContent };

        const publicDownloadCountCell: RowCell = { col: publicDownloadCountCol, content: String(publicDownloadCount) };

        return { ...row, cells: [...cells, downloadCell, publicDownloadCountCell] };
    });

    // return：即使 rows 為空，也保留欄位
    return { ...gridProps, columns: newColumns, rows: newRows };
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

/** 彙總下載次數 */
const getPublicDownloadCountTotal = (fileRows: FileArchiveDetail[]): number =>
{
    // return：累加每個實體檔案的 PublicDownloadCount
    return fileRows.reduce((sum, item) =>
    {
        const count = Number(item.FileSrc?.PublicDownloadCount ?? 0);
        return sum + count;
    }, 0);
};

/** 檔案下載按鈕 */
const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) =>
{
    // 宣告變數
    const ext = fileExtName.toLowerCase();
    const fileUrl = ext === "pdf"
        ? FileManagementAPI.get_Public_Preview_Url(fileInternalId, fileTitle)
        : FileManagementAPI.get_Public_Download_Url(fileInternalId, fileTitle);

    let div = <>{fileExtName.toUpperCase()}</>;

    // 執行 function：保留 1810 原本 icon DOM
    switch (ext)
    {
        case "docx":
            div = <div className="word">{div}</div>;
            break;
        case "pdf":
            div = <div className="pdf">{div}</div>;
            break;
        default:
            div = <div className="word">{div}</div>;
            break;
    }

    // return
    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-default" title={`${fileTitle}(另開視窗)`}>{div}</a>;
};

/** 外部連結按鈕 */
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) =>
{
    // 宣告變數
    const t = target === 0 ? "_self" : "_blank";
    const alt = `${descript}${target === 0 ? "" : "｜[另開視窗]"}`;

    // return：保留 1810 原本 icon DOM
    return (
        <a href={url} target={t} rel="noopener noreferrer" className="btn btn-default" title={alt}>
            <div className="link">Link</div>
        </a>
    );
};
// #endregion
