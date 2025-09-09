/**公告清單 */
import { useMemo } from "react";
import type { ColumnConfig, GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
import type { GridRow } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import { GridViewContentComp } from "../../Scaffold/ContentViewMode/GridView/GridView/GridContent_Comp";
import type { Lang } from "../../../../../SysCore/i18n/lang";
import FileArchiveProvider from "../../../../Server/Layout/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { Merge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import { useTagListData } from "../../../../Server/Layout/BizFunc/WebManagement/Tags/Tag_Hook";

const useFileArchive = (lang: string | Lang, categoryIds: string, tagIds: string, tagSets?: TagSet[]) => {
    var condition: string = "";
    if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.FileArchiveFields.CategoriesId} HasAny (${categoryIds})`)
    if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.FileArchiveFields.TagsId} HasAny (${tagIds})`)

    const provider = FileArchiveProvider();
    return useFetchGridListData<FileArchiveSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.TagsId],
            [SchemaFields.FileArchiveSetFields.FileArchiveInfo, SchemaFields.FileArchiveInfoFields.Title],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.FileArchiveFields.InternalId,
                SchemaFields.FileArchiveFields.FileArchiveId,
                SchemaFields.FileArchiveFields.TagsId,
                `${SchemaFields.FileArchiveSetFields.FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.FileArchiveId}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.RowId}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Lang}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveInfo}.${SchemaFields.FileArchiveInfoFields.Title}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileArchiveId}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.ParentRowId}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileSrcId}`,
                `${SchemaFields.FileArchiveSetFields.FileArchiveDetail}.${SchemaFields.FileArchiveDetailFields.FileName}`,
            ],
            Condition: condition,
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
                    case SchemaFields.FileArchiveFields.TagsId:
                        {
                            const tags = (item.FileArchive?.TagsId ?? "")
                                .split(",")
                                .map(s => s.trim())
                                .filter(Boolean);

                            content = tags
                                .map(tagId =>
                                    tagSets
                                        ?.find(s => String(s.TagData?.TagId) === tagId)
                                        ?.TagDetail?.find(d => d.Lang === lang)?.TagName
                                )
                                .filter((x): x is string => !!x)
                                .join("、");

                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [tagSets],
    });
};

export interface IFileArchiveOptions { Category: string; Tag: string; Style: number; }
interface FileArchiveProps { Theme: IFETheme; Lang: string | Lang; Options: IFileArchiveOptions; }

export const FileArchiveList = (props: FileArchiveProps) => {
    const useTagData = useTagListData("FileArchive", "zh-tw");
    const useFileArchiveList = useFileArchive(props.Lang, props.Options.Category, props.Options.Tag, useTagData.rawData);
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(props.Lang, useFileArchiveList.gridProps, useFileArchiveList.rawData); }, [useFileArchiveList.gridProps, useFileArchiveList.rawData]);
    const isLoading = [useFileArchiveList.isLoading, useTagData.isLoading];
    const errors = [useFileArchiveList.error, useTagData.error];
    return <GridViewContentComp GridData={adjustedGrid} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
};

const SetAdjustFunction = (lang: string, gridProps: GridProps, rawData: FileArchiveSet[]): GridProps => {
    const downloadColName = '__Download__'
    if (gridProps.columns.some(col => col.key === downloadColName)) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const downloadCol: ColumnConfig = { key: downloadColName, title: '下載' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, downloadCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {

        const fileInfoRowId = rawData?.[index].FileArchiveInfo?.find(p => p.Lang === lang)?.RowId
        const fileRows = rawData?.[index].FileArchiveDetail?.filter(p => p.ParentRowId === fileInfoRowId) as FileArchiveDetail[]
        let downloadFileContent = <></>;
        fileRows.map((item) => {
            downloadFileContent = <>{downloadFileContent}{SetDownloadIcon(item.FileSrcId ?? "", "docx", item.FileName ?? "")}</>
        });
        const newCell: RowCell = {
            col: downloadCol,
            content: downloadFileContent,
        };

        return { ...row, cells: [...row.cells, newCell] };
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
    return (<a href={`/Service/FileManagement/Download/${fileInternalId}`} target="_blank" rel="noopener noreferrer" className="btn btn-default" title={`${fileTitle}(另開視窗)`} > {div}</ a>)
}