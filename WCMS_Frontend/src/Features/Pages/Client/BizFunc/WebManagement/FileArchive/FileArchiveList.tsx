/**公告清單 */
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import { ColRender, RowRender, STORAGE_KEY } from "@/SysCore/Components/Grid/Grid_Comp";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FileArchiveDetailFields, FileArchiveFields, FileArchiveInfoFields, FileArchiveSetFields, FileArchiveUrlDetailFields, FileManageModelFields } from "@/types/SchemaFields";
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { useEffect, useMemo, useState } from "react";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { ProgId } from "@/Features/Hooks/Common/ProgId";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"]

export interface IFileArchiveOptions { Category: string; Tag: string; }
export interface FileArchiveProps { lang: Lang; theme: IFETheme; options: IFileArchiveOptions; node: INormNode }
const FileArchiveList = (props: FileArchiveProps) => {
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});

    const pvder = useMemo(() => { return { FileArchive: FileArchiveProvider() } }, []);



    const useTagData = useTagListData(ProgId.FileArchive, props.lang);
    const useFileArchiveList = useFileArchive(pvder.FileArchive, props.lang, props.options.Category, props.options.Tag, useTagData.rawData, query);
    const tags = (useTagData.rawData ?? []).map(t => ({ id: t.TagData?.TagId ?? "", name: t.TagDetail?.find(p => p.Lang === props.lang)?.TagName ?? "" }));
    const tagMap = useMemo(() => {
        const map = new Map<string, string>();
        (useTagData.rawData ?? []).forEach(t => {
            const id = String(t.TagData?.TagId ?? "");
            const name = t.TagDetail?.find(d => d.Lang === props.lang)?.TagName ?? "";
            if (id) map.set(id, name);
        });
        return map;
    }, [useTagData.rawData, props.lang]);
    const searchSlot = (<SearchBarComp value={queryDraft} tags={tags} onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))} onSubmit={() => setQuery(queryDraft)} onReset={() => { setQueryDraft({}); setQuery({}); }} />);
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.lang, useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap); }, [useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap]);
    const loadingList: boolean[] = [useFileArchiveList.isLoading, useTagData.isLoading];
    const errorList: (string | null | undefined)[] = [useFileArchiveList.error, useTagData.error];
    const paginprops: PaginatorProps = { currentPage: adjustedGrid.CurrentPage, totalPages: adjustedGrid.TotalPage, onPageChange: adjustedGrid.onPageChange };
    return (
        <ModuleContent title={""} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops}>
            <GridList_Comp key="grid" gridData={adjustedGrid} title={props.node.title} />
        </ModuleContent>
    )
};
export default FileArchiveList

const GridList_Comp = (props: { title: string; gridData: GridProps; }) => {
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
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
        <table className={"table table-striped table-bordered table-hover + table-rwd"} summary={props.title}>
            <caption>{props.title}</caption>
            <ColRender columns={columns} onResize={handleResize} />
            <RowRender rows={props.gridData.rows} />
        </table>
    );
}

const useFileArchive = (provider: IDataProvider<FileArchiveSet>, lang: Lang, categoryIds: string, tagIds: string, tagSets: TagSet[], query: ISearchQuery) => {
    var condition: string = "";
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${query.tag}]`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.CategoriesId} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${FileArchiveFields.ContentStatus} !& 4`)//不包含隱藏的資料
    return useFetchGridListData<FileArchiveSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [FileArchiveSetFields.FileArchive, FileArchiveFields.TagsId],
            [FileArchiveSetFields.FileArchiveInfo, FileArchiveInfoFields.Title],
            [FileArchiveSetFields.FileArchive, FileArchiveFields.DownloadCount]
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                FileArchiveFields.InternalId,
                FileArchiveFields.FileArchiveId,
                FileArchiveFields.TagsId,
                FileArchiveFields.DownloadCount,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.FileArchiveId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.RowId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileArchiveId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.ParentRowId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrcId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileName}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.InternalId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.FileExtension}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.FileArchiveId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.ParentRowId}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.Url}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.UrlDescription}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.WindowTarget}`,

            ],
            Condition: condition,
            OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case FileArchiveInfoFields.Title:
                        {
                            content = item.FileArchiveInfo?.find(p => p.Lang === lang)?.Title ?? "";
                            break;
                        }
                    default:
                        content = (item.FileArchive as any)[col.key] ?? "";
                        break;
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, categoryIds, tagIds, tagSets, query],
    });
};

const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Map<string, string>): GridProps => {
    const downloadColName = '__Download__';
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
    const newColumns: ColumnConfig[] = [...baseColumns, downloadCol, ...(downloadCountCol ? [downloadCountCol] : []),];
    // 2) 列層級：抽掉「下載次數」cell，最後組合為「其他｜下載｜下載次數」
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const fileInfoRowId = rawData?.[index].FileArchiveInfo?.find(p => p.Lang === lang)?.RowId;
        const fileRows = rawData[index].FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) as FileArchiveDetail[];
        const urlRows = rawData[index].FileArchiveUrlDetail?.filter(p => p.ParentRowId === fileInfoRowId) as FileArchiveUrlDetail[];
        // 產生「下載」內容
        let downloadFileContent = <></>;
        fileRows?.forEach(item => {
            downloadFileContent = (
                <>
                    {downloadFileContent}
                    {SetDownloadIcon(item.FileSrcId ?? '', item.FileSrc?.FileExtension ?? 'docx', item.FileName ?? '')}
                </>
            );
        });
        urlRows?.forEach(item => {
            downloadFileContent = <>
                {downloadFileContent}
                {SetUrlIcon(item.Url ?? "", item.UrlDescription ?? "", item.WindowTarget ?? 0)}
            </>
        });
        const cells = row.cells.map(cell => {
            if (cell.col?.key !== FileArchiveFields.TagsId) return cell;
            const ids = String(cell.content ?? "").split(",").map(s => s.trim()).filter(Boolean);
            const names = ids.map(id => tagMap.get(id)).filter((x): x is string => !!x).join("、");
            return { ...cell, content: names };
        });

        const dcCellIdx = cells.findIndex(c => c.col?.key === FileArchiveFields.DownloadCount);
        let downloadCountCell: RowCell | null = null;
        if (dcCellIdx !== -1) {
            [downloadCountCell] = cells.splice(dcCellIdx, 1);
            if (downloadCountCol) downloadCountCell = { ...downloadCountCell, col: downloadCountCol };
        }
        const downloadCell: RowCell = {
            col: downloadCol, content:
                <div className="Standard_btnDiv">
                    {downloadFileContent}
                </div>
        };
        return { ...row, cells: [...cells, downloadCell, ...(downloadCountCell ? [downloadCountCell] : [])], };
    });
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