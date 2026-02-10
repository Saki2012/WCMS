/**公告清單 */
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";

// ✅ 新架構：Adapter + LoaderData initial
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import type { FileArchiveListLoaderData } from "./FileArchiveList_Loader";

type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];

export interface IFileArchiveOptions { Category: string; Tag: string; }
export interface FileArchiveProps { lang: Lang; theme: IFETheme; options: IFileArchiveOptions; node: INormNode }

const FileArchiveList = (props: FileArchiveProps) => {
    // 宣告變數
    const loaderData = useLoaderData() as FileArchiveListLoaderData | null;

    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});

    const adapter = useMemo(() => {
        return {
            FileArchive: FileArchiveAdapter(),
            Tag: TagAdapter(),
        };
    }, []);

    // ✅ SSR Loader 帶回 tags（固定條件由 Loader 做）
    const initialTag = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], TagSet[]> | null>(() => {
        if (!loaderData?.args?.tagParam) return null;

        return {
            args: loaderData.args.tagParam,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.tagRes ?? [],
                SysMessage: [],
            },
        };
    }, [loaderData]);

    // 執行 function：Tag list（SSR initial → CSR 接手）
    const useTagData = adapter.Tag.hooks.useQueryList({
        condition: loaderData?.args?.tagParam ?? { Fields: [], Condition: "1=0", PageNumber: 0, PageSize: 0 },
        initial: initialTag,
        deps: [props.lang], // tag 清單只跟語系有關（固定條件已在 loader）
    });

    // 宣告變數：tags for SearchBar
    const tags = (useTagData.data ?? []).map(t => ({
        id: t.TagData?.TagId ?? "",
        name: t.TagDetail?.find(p => p.Lang === props.lang)?.TagName ?? ""
    }));

    const tagMap = useMemo(() => {
        const map = new Map<string, string>();
        (useTagData.data ?? []).forEach(t => {
            const id = String(t.TagData?.TagId ?? "");
            const name = t.TagDetail?.find(d => d.Lang === props.lang)?.TagName ?? "";
            if (id) map.set(id, name);
        });
        return map;
    }, [useTagData.data, props.lang]);

    const searchSlot = (
        <SearchBarComp
            value={queryDraft}
            tags={tags}
            onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))}
            onSubmit={() => setQuery(queryDraft)}
            onReset={() => { setQueryDraft({}); setQuery({}); }}
        />
    );

    // ✅ FileArchive list/count：固定條件（lang/categoryIds/tagIds/fields/orderby/rankGroups）由 Loader 做
    const useFileArchiveList = useFileArchive(
        adapter.FileArchive,
        props.lang,
        loaderData,
        query,
        useTagData.data ?? [],
    );

    const adjustedGrid = useMemo(() => {
        return SetAdjustFunction(props.lang, useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap);
    }, [props.lang, useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap]);

    const loadingList: boolean[] = [useFileArchiveList.isLoading, useTagData.isLoading];
    const errorList: (string | null | undefined)[] = [useFileArchiveList.error, useTagData.errorText];

    const paginprops: PaginatorProps = { currentPage: adjustedGrid.CurrentPage, totalPages: adjustedGrid.TotalPage, onPageChange: adjustedGrid.onPageChange };

    // return（✅ 不改 div 結構）
    return (
        <ModuleContent nodeTitle={props.node.title} title={""} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops}>
            <GridList_Comp key="grid" lang={props.lang} gridData={adjustedGrid} title={props.node.title} />
        </ModuleContent>
    )
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
                prev.map((col) => ({
                    ...col,
                    width: typeof widths[col.key] === "number" ? widths[col.key] : typeof col.width === "number" ? col.width : undefined,
                }))
            );
        }
    }, []);

    const handleResize = (index: number, width: number) => {
        // 宣告變數
        setColumns((prev) => {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            const widths: Record<string, number> = {};
            updated.forEach((c) => { if (typeof c.width === "number") widths[c.key] = c.width; });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
            return updated;
        });
    };

    // return（✅ 不改 div 結構）
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

const appendQueryToCondition = (baseCondition: string, p: { query: ISearchQuery; }) => {
    // 宣告變數
    let condition = baseCondition ?? "";

    // 執行 function：使用者搜尋條件（互動屬於 CSR，可留在 component）
    if (p.query.keyword) condition = LibMerge(" And ", false, condition, `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${p.query.keyword}`);
    if (p.query.tag) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${p.query.tag}]`);

    // return
    return condition;
};

const buildGridProps = (lang: Lang, datas: FileArchiveSet[], pageNumber: number, totalPage: number, onPageChange: (page: number) => void): GridProps => {
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
        return { cells };
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

const useFileArchive = (
    adapter: ReturnType<typeof FileArchiveAdapter>,
    lang: Lang,
    loaderData: FileArchiveListLoaderData | null,
    query: ISearchQuery,
    tagSets: TagSet[],
) => {
    // 宣告變數：以 loader 的 baseParam 為主（固定條件已在 loader）
    const baseParamFromLoader = loaderData?.args?.baseParam ?? {
        Fields: [],
        Condition: "1=0",
        PageNumber: 1,
        PageSize: 10,
    };

    const baseParam = useMemo(() => {
        const mergedCondition = appendQueryToCondition(baseParamFromLoader.Condition ?? "", { query });

        return {
            ...baseParamFromLoader,
            Condition: mergedCondition,
        } as components["schemas"]["QueryListParam"];
    }, [baseParamFromLoader, query]);

    // 宣告變數：SSR initial（count/list）
    const initialCount = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], number> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.countRes ?? 0,
                SysMessage: [],
            },
        };
    }, [loaderData]);

    const initialList = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], FileArchiveSet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.listRes ?? [],
                SysMessage: [],
            },
        };
    }, [loaderData]);

    // 執行 function：count（SSR initial → CSR 接手）
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [lang, query, tagSets],
    });

    // 執行 function：paged list（SSR initial → CSR 接手）
    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [lang, query, tagSets],
    });

    const gridProps = useMemo(() => {
        return buildGridProps(lang, useList.data ?? [], useList.pageNumber, useList.totalPages, useList.onPageChange);
    }, [lang, useList.data, useList.pageNumber, useList.totalPages, useList.onPageChange]);

    // return
    return {
        rawData: useList.data ?? [],
        gridProps,
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
    };
};

const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Map<string, string>): GridProps => {
    // 宣告變數
    const downloadColName = '__Download__';
    // 執行 function
    if (gridProps.columns.some(col => col.key === downloadColName)) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    // 1) 欄位層級：抽掉「下載次數」，最後組合為「其他｜下載｜下載次數」
    let baseColumns = [...gridProps.columns];
    const dcIdx = baseColumns.findIndex(c => c.key === FileArchiveFields.DownloadCount);

    let downloadCountCol: ColumnConfig | null = null;
    if (dcIdx !== -1) {
        [downloadCountCol] = baseColumns.splice(dcIdx, 1);
    }

    const downloadCol: ColumnConfig = { key: downloadColName, title: '下載' };
    const newColumns: ColumnConfig[] = [...baseColumns, downloadCol, ...(downloadCountCol ? [downloadCountCol] : [])];

    // 2) 列層級：抽掉「下載次數」cell，最後組合為「其他｜下載｜下載次數」
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        // 宣告變數
        const curRow = rawData?.[index];
        const contentStatus = Number(curRow?.FileArchive?.ContentStatus ?? 0);

        const fileInfoRowId = curRow?.FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;
        const fileRows = (curRow?.FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveDetail[];
        const urlRows = (curRow?.FileArchiveUrlDetail?.filter(p => p.ParentRowId === fileInfoRowId) ?? []) as FileArchiveUrlDetail[];

        // 產生「下載」內容
        let downloadFileContent = <></>;
        fileRows.forEach(item => {
            downloadFileContent = (
                <>
                    {downloadFileContent}
                    {SetDownloadIcon(item.FileSrcId ?? '', item.FileSrc?.FileExtension ?? 'docx', item.FileName ?? '')}
                </>
            );
        });
        urlRows.forEach(item => {
            downloadFileContent = (
                <>
                    {downloadFileContent}
                    {SetUrlIcon(item.Url ?? "", item.UrlDescription ?? "", item.WindowTarget ?? 0)}
                </>
            );
        });

        // 執行 function：處理 tags 顯示 + title label 顯示
        const cells = row.cells.map(cell => {
            // tags：把 ids 轉成名稱
            if (cell.col?.key === FileArchiveFields.TagsId) {
                const ids = String(cell.content ?? "").split(",").map(s => s.trim()).filter(Boolean);
                const names = ids.map(id => tagMap.get(id)).filter((x): x is string => !!x).join("、");
                return { ...cell, content: names };
            }

            // title：在 title 前面加 labels
            const isTitle = cell.col?.key === FileArchiveInfoFields.Title;
            if (isTitle) {
                const titleContent = cell.content; // 原本 parseRow 產生的 title 字串
                return {
                    ...cell,
                    content: (
                        <>
                            <div>{titleContent}</div>
                            <div className="d-flex gap-1 flex-wrap">
                                {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                                {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
                            </div>
                        </>
                    )
                };
            }

            return cell;
        });

        // 把下載次數 cell 抽掉
        const dcCellIdx = cells.findIndex(c => c.col?.key === FileArchiveFields.DownloadCount);
        let downloadCountCell: RowCell | null = null;
        if (dcCellIdx !== -1) {
            [downloadCountCell] = cells.splice(dcCellIdx, 1);
            if (downloadCountCol) downloadCountCell = { ...downloadCountCell, col: downloadCountCol };
        }

        // 插入下載 cell
        const downloadCell: RowCell = {
            col: downloadCol,
            content: (
                <div className="Standard_btnDiv">
                    {downloadFileContent}
                </div>
            )
        };

        // return
        return { ...row, cells: [...cells, downloadCell, ...(downloadCountCell ? [downloadCountCell] : [])] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) => {
    return (
        <a href={`${FileManagementAPI.DOWNLOAD_URL}/${fileInternalId}`}
            className={`btn btn-default + bg_${fileExtName}`}
            target="_blank"
            role="button"
            rel="noopener noreferrer"
            title={`${fileTitle} [ 另開新視窗 ]`}>
            <span className={fileExtName}>{fileExtName}</span>
        </a>
    )
}
const SetUrlIcon = (url: string, descript: string, target: WindowTarget) => {
    const tar = target === 0 ? "_self" : "_blank"
    const alt = `${descript}${target === 0 ? "" : " [ 另開新視窗 ]"}`
    return (
        <a href={url} className="btn btn-default + bg_link" role="button" aria-label="分享" target={tar} title={alt} rel="noopener noreferrer" >
            <span className="link">link</span>
        </a>
    )
}
