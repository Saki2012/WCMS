/**公告清單 */
import { useId, useMemo, useState } from "react";
import type { ColumnConfig, GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FileArchiveSetFields, FileArchiveFields, FileArchiveInfoFields, FileArchiveDetailFields, FileManageModelFields, FileArchiveUrlDetailFields } from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import type { FileArchiveProps } from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"]

const useFileArchive = (lang: Lang, categoryIds: string, tagIds: string, tagSets: TagSet[], query: ISearchQuery) => {
    var condition: string = "";
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${query.tag}]`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.CategoriesId} HasAny [${categoryIds}]`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${tagIds}]`)
    condition = LibMerge(" And ", false, condition, `${FileArchiveFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = FileArchiveProvider();
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
            RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
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


const FileArchiveList = (props: FileArchiveProps) => {
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    const useTagData = useTagListData("FileArchive", props.lang);
    const useFileArchiveList = useFileArchive(props.lang, props.options.Category, props.options.Tag, useTagData.rawData, query);
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
    const isLoading = [useFileArchiveList.isLoading, useTagData.isLoading];
    const errors = [useFileArchiveList.error, useTagData.error];
    const content: React.ReactElement | null = useMemo(() => { return <List_Comp key="grid" lang={props.lang} gridData={adjustedGrid} theme={props.theme} /> }, [searchSlot, adjustedGrid, props.theme, isLoading, errors]);


    return (
        <>
            {searchSlot}
            <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
                {content}
            </LoadingErrorHandler>
        </>
    )
};

export default FileArchiveList

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

const SetUrlIcon = (url: string, descript: string, target: WindowTarget) => {
    const t = target === 0 ? "_self" : "_blank"
    const alt = `${descript}${target === 0 ? "" : "｜[另開視窗]"}`
    return (
        <a href={url} target={t} rel="noopener noreferrer" className="btn btn-default" title={alt}>
            <div className="link">Link</div>
        </a>)
}
/** 清單式 */
const List_Comp = (prop: { lang: Lang; gridData: GridProps; theme: IFETheme }) => {
    return (
        <>
            <OperationGuideHelp_Comp lang={prop.lang} />
            <Grid gridData={prop.gridData} style={prop.theme.GridView} pageStyle={prop.theme.Paginator} />
        </>
    )
}