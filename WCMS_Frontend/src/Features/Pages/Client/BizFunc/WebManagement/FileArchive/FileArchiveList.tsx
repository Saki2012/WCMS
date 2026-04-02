/**公告清單 */
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { useFileArchiveListFetchData } from "./FileArchiveList_Loader";

type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];

export interface IFileArchiveOptions { Category: string; Tag: string; }
export interface FileArchiveProps { lang: Lang; theme: IFETheme; options: IFileArchiveOptions; site: INormSite; node: INormNode }

const FileArchiveList = (props: FileArchiveProps) => {
    // 宣告變數
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    // 執行 function：統一由 Loader.ts 提供主資料 / tag / category
    const useFileArchiveList = useFileArchiveListFetchData({lang: props.lang,opts: props.options,query,});
    const searchSlot = (
        <SearchBarComp value={queryDraft} tags={useFileArchiveList.rawData.tagOptions}
            onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))}
            onSubmit={() => setQuery(queryDraft)}
            onReset={() => { setQueryDraft({}); setQuery({});}}
        />
    );
    const baseGrid = useMemo(() => {return buildGridProps(props.lang,useFileArchiveList.rawData.list,useFileArchiveList.rawData.pageNumber,useFileArchiveList.rawData.totalPages,useFileArchiveList.rawData.onPageChange,);
    }, [props.lang,useFileArchiveList.rawData.list,useFileArchiveList.rawData.pageNumber,useFileArchiveList.rawData.totalPages,useFileArchiveList.rawData.onPageChange,]);
    const adjustedGrid = useMemo(() => {return SetAdjustFunction(props.lang,baseGrid,useFileArchiveList.rawData.list,useFileArchiveList.rawData.tagMap,);
    }, [props.lang,baseGrid,useFileArchiveList.rawData.list,useFileArchiveList.rawData.tagMap,]);
    const paginprops: PaginatorProps = {currentPage: adjustedGrid.CurrentPage,totalPages: adjustedGrid.TotalPage,onPageChange: adjustedGrid.onPageChange,};
    const viewCountConfig: ModuleViewCountConfig = {mode: "list",};
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} isLoading={useFileArchiveList.isLoading} errorList={useFileArchiveList.errors} paginatorProps={paginprops} viewCountConfig={viewCountConfig}>
            <GridList_Comp key="grid" lang={props.lang} gridData={adjustedGrid} title={props.node.title} />
        </ModuleContent>
    );
};
export default FileArchiveList;

const GridList_Comp = (props: { lang: Lang; title: string; gridData: GridProps; }) => {
    // 宣告變數
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    // 執行 function：讀取 localStorage 欄寬
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const widths = JSON.parse(saved) as Record<string, number>;
            setColumns((prev) =>
                prev.map((col) => ({...col, 
                    width: typeof widths[col.key] === "number"
                        ? widths[col.key] : typeof col.width === "number" ? col.width : undefined,
                })),
            );
        }
    }, []);

    const handleResize = (index: number, width: number) => {
        setColumns((prev) => {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths: Record<string, number> = {};
            updated.forEach((c) => {
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
                <RowRender rows={props.gridData.rows} />
            </table>
        </>
    );
};

const buildGridProps = (
    lang: Lang,
    datas: FileArchiveSet[],
    pageNumber: number,
    totalPage: number,
    onPageChange: (page: number) => void,
): GridProps => {
    // 宣告變數（保持原本欄位行為：visibleKeys 只顯示 Title）
    const columns: ColumnConfig[] = [
        { key: FileArchiveInfoFields.Title, title: "標題" },
    ];

    const rows: GridRow[] = datas.map(item => {
        const cells: RowCell[] = columns.map(col => {
            let content = "";

            switch (col.key) {
                case FileArchiveInfoFields.Title:
                    content = item.FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";
                    break;
                default:
                    content = "";
                    break;
            }

            return { col, content };
        });

        return {
            keyId: item.FileArchive?.InternalId ?? "",
            cells,
        };
    });

    // return
    return {
        columns,
        rows,
        CurrentPage: pageNumber,
        TotalPage: totalPage,
        onPageChange,
    } as GridProps;
};

const SetAdjustFunction = (
    lang: Lang,
    gridProps: GridProps,
    rawData: FileArchiveSet[],
    tagMap: Record<string, string>,
): GridProps => {
    // 宣告變數
    const downloadColName = "__Download__";
    const publicDownloadCountColName = "__PublicDownloadCount__";

    // 執行 function：避免重複處理
    if (gridProps.columns.some(col => col.key === downloadColName || col.key === publicDownloadCountColName)) return gridProps;

    // 宣告變數：欄位組合（其他｜下載｜下載次數）
    const baseColumns = [...gridProps.columns];
    const downloadCol: ColumnConfig = { key: downloadColName, title: "下載" };
    const publicDownloadCountCol: ColumnConfig = { key: publicDownloadCountColName, title: "下載次數" };
    const newColumns: ColumnConfig[] = [...baseColumns, downloadCol, publicDownloadCountCol];

    // 執行 function：逐列組特殊欄位
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        // 宣告變數
        const curRow = rawData?.[index];
        const contentStatus = Number(curRow?.FileArchive?.ContentStatus ?? 0);
        const fileRows = curRow ? getCurrentLangFileRows(lang, curRow) : [];
        const urlRows = curRow ? getCurrentLangUrlRows(lang, curRow) : [];
        const publicDownloadCount = getPublicDownloadCountTotal(fileRows);

        // 宣告變數：下載內容
        let downloadFileContent = <></>;

        fileRows.forEach(item => {
            downloadFileContent = (
                <>
                    {downloadFileContent}
                    {SetDownloadIcon(
                        item.FileSrcId ?? "",
                        item.FileSrc?.FileExtension ?? "docx",
                        item.FileName ?? "",
                    )}
                </>
            );
        });

        urlRows.forEach(item => {
            downloadFileContent = (
                <>
                    {downloadFileContent}
                    {SetUrlIcon(
                        item.Url ?? "",
                        item.UrlDescription ?? "",
                        item.WindowTarget ?? 0,
                    )}
                </>
            );
        });

        // 執行 function：處理既有 cell 顯示
        const cells = row.cells.map(cell => {
            if (cell.col?.key === FileArchiveFields.TagsId) {
                const ids = String(cell.content ?? "")
                    .split(",")
                    .map(s => s.trim())
                    .filter(Boolean);

                const names = ids
                    .map(id => tagMap[id] ?? "")
                    .filter(Boolean)
                    .join("、");

                return { ...cell, content: names };
            }

            if (cell.col?.key === FileArchiveInfoFields.Title) {
                const titleContent = cell.content;
                return {
                    ...cell,
                    content: (
                        <>
                            <div>{titleContent}</div>
                            <div className="d-flex gap-1 flex-wrap">
                                {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                            </div>
                        </>
                    ),
                };
            }

            return cell;
        });

        // 宣告變數：特殊下載欄位
        const downloadCell: RowCell = {
            col: downloadCol,
            content: (
                <div className="Standard_btnDiv">
                    {downloadFileContent}
                </div>
            ),
        };

        // 宣告變數：特殊下載次數欄位
        const publicDownloadCountCell: RowCell = {
            col: publicDownloadCountCol,
            content: String(publicDownloadCount),
        };

        // return
        return {
            ...row,
            cells: [...cells, downloadCell, publicDownloadCountCell],
        };
    });

    // return
    return {
        ...gridProps,
        columns: newColumns,
        rows: newRows,
    };
};

const getCurrentLangFileRows = (lang: Lang, data: FileArchiveSet): FileArchiveDetail[] => {
    // 宣告變數：找目前語系對應的 FileArchiveInfo RowId
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;

    // return：只取目前語系對應的檔案列
    return (data.FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveDetail[];
};

const getCurrentLangUrlRows = (lang: Lang, data: FileArchiveSet): FileArchiveUrlDetail[] => {
    // 宣告變數：找目前語系對應的 FileArchiveInfo RowId
    const fileInfoRowId = data.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;

    // return：只取目前語系對應的連結列
    return (data.FileArchiveUrlDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveUrlDetail[];
};

const getPublicDownloadCountTotal = (fileRows: FileArchiveDetail[]): number => {
    // return：彙總每個實體檔案的 PublicDownloadCount
    return fileRows.reduce((sum, item) => {
        const count = Number(item.FileSrc?.PublicDownloadCount ?? 0);
        return sum + count;
    }, 0);
};

const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) => {
    const fileUrl = fileExtName.toLowerCase() === "pdf"
        ? FileManagementAPI.get_Public_Preview_Url(fileInternalId, fileTitle)
        : FileManagementAPI.get_Public_Download_Url(fileInternalId, fileTitle);

    return (
        <a
            href={fileUrl}
            className={`btn btn-default + bg_${fileExtName}`}
            target="_blank"
            role="button"
            rel="noopener noreferrer"
            title={`${fileTitle} [ 另開新視窗 ]`}
        >
            <span className={fileExtName}>{fileExtName}</span>
        </a>
    );
};

const SetUrlIcon = (url: string, descript: string, target: WindowTarget) => {
    const tar = target === 0 ? "_self" : "_blank";
    const alt = `${descript}${target === 0 ? "" : " [ 另開新視窗 ]"}`;

    return (
        <a
            href={url}
            className="btn btn-default + bg_link"
            role="button"
            aria-label="分享"
            target={tar}
            title={alt}
            rel="noopener noreferrer"
        >
            <span className="link">link</span>
        </a>
    );
};