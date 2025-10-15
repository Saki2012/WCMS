/**公告清單 */
import { useMemo, useState } from "react";
import type { ColumnConfig, GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
import type { GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import * as SchemaFields from "@/types/SchemaFields";
import { GridViewContentComp } from "@/Features/Pages/Client/Scaffold/ContentViewMode/GridView/GridView/GridContent_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

const useFileArchive = (lang: string | Lang, categoryIds: string, tagIds: string, tagSets: TagSet[], query: ISearchQuery) => {
    var condition: string = "";
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${SchemaFields.FileArchiveSetFields.FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${SchemaFields.FileArchiveFields.TagsId} HasAny ${query.tag}`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.FileArchiveFields.CategoriesId} HasAny (${categoryIds})`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.FileArchiveFields.TagsId} HasAny (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${SchemaFields.FileArchiveFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = FileArchiveProvider();
    return useFetchGridListData<FileArchiveSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.TagsId],
            [SchemaFields.FileArchiveSetFields.FileArchiveInfo, SchemaFields.FileArchiveInfoFields.Title],
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.DownloadCount]
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.FileArchiveFields.InternalId,
                SchemaFields.FileArchiveFields.FileArchiveId,
                SchemaFields.FileArchiveFields.TagsId,
                SchemaFields.FileArchiveFields.DownloadCount,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.FileArchiveId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.RowId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Lang}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Title}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileArchiveId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.ParentRowId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileSrcId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileName}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileSrc}.${SchemaFields.FileManageModelFields.InternalId}`,
                `${SchemaFields.FileArchiveFields._FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields._FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileSrc}.${SchemaFields.FileManageModelFields.FileExtension}`
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.FileArchiveFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SchemaFields.FileArchiveInfoFields.Title:
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

export interface IFileArchiveOptions { Category: string; Tag: string; Style: number; }
interface FileArchiveProps { Theme: IFETheme; Lang: Lang; Options: IFileArchiveOptions; }

export const FileArchiveList = (props: FileArchiveProps) => {
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    const useTagData = useTagListData("FileArchive", props.Lang);
    const useFileArchiveList = useFileArchive(props.Lang, props.Options.Category, props.Options.Tag, useTagData.rawData, query);
    const tags = (useTagData.rawData ?? []).map(t => ({ id: t.TagData?.TagId ?? "", name: t.TagDetail?.find(p => p.Lang === props.Lang)?.TagName ?? "" }));

    const tagMap = useMemo(() => {
        const map = new Map<string, string>();
        (useTagData.rawData ?? []).forEach(t => {
            const id = String(t.TagData?.TagId ?? "");
            const name = t.TagDetail?.find(d => d.Lang === props.Lang)?.TagName ?? "";
            if (id) map.set(id, name);
        });
        return map;
    }, [useTagData.rawData, props.Lang]);


    const searchSlot = (
        <SearchBarComp value={queryDraft} tags={tags} onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))}
            onSubmit={() => setQuery(queryDraft)} onReset={() => { setQueryDraft({}); setQuery({}); }} />);

    const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.Lang, useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap); }, [useFileArchiveList.gridProps, useFileArchiveList.rawData, tagMap]);
    const isLoading = [useFileArchiveList.isLoading, useTagData.isLoading];
    const errors = [useFileArchiveList.error, useTagData.error];
    return <GridViewContentComp searchSlot={searchSlot} GridData={adjustedGrid} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
};

const SetAdjustFunction = (lang: string, gridProps: GridProps, rawData: FileArchiveSet[], tagMap: Map<string, string>): GridProps => {
    const downloadColName = '__Download__';

    if (gridProps.columns.some(col => col.key === downloadColName)) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    // 1) 欄位層級：抽掉「下載次數」，最後組合為「其他｜下載｜下載次數」
    let baseColumns = [...gridProps.columns];
    const dcIdx = baseColumns.findIndex(c => c.key === SchemaFields.FileArchiveFields.DownloadCount);

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
        const cells = row.cells.map(cell => {
            if (cell.col?.key !== SchemaFields.FileArchiveFields.TagsId) return cell;
            const ids = String(cell.content ?? "").split(",").map(s => s.trim()).filter(Boolean);
            const names = ids.map(id => tagMap.get(id)).filter((x): x is string => !!x).join("、");
            return { ...cell, content: names };
        });

        const dcCellIdx = cells.findIndex(c => c.col?.key === SchemaFields.FileArchiveFields.DownloadCount);
        let downloadCountCell: RowCell | null = null;
        if (dcCellIdx !== -1) {
            [downloadCountCell] = cells.splice(dcCellIdx, 1);
            if (downloadCountCol) downloadCountCell = { ...downloadCountCell, col: downloadCountCol };
        }
        const downloadCell: RowCell = { col: downloadCol, content: downloadFileContent };
        return { ...row, cells: [...cells, downloadCell, ...(downloadCountCell ? [downloadCountCell] : [])], };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const SetDownloadIcon = (fileInternalId: string, fileExtName: string, fileTitle: string) => {
    let div = <>{fileExtName.toUpperCase()}</>;
    switch (fileExtName) {
        case "docx": {
            div = <div className="word">{div}</div>
            break;
        }
        case "pdf": {
            div = <div className="pdf">{div}</div>
            break;
        }
        default: {
            div = <div className="word">{div}</div>
            break;
        }
    }
    return (<a href={`${FileManagementAPI.DOWNLOAD_URL}/${fileInternalId}`} target="_blank" rel="noopener noreferrer"
        className="btn btn-default" title={`${fileTitle}(另開視窗)`} > {div}</ a>)
}