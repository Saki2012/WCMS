import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { FileArchiveSetFields, FileArchiveFields, FileArchiveInfoFields, AccountFields } from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import { PGID } from "@/Features/Hooks/Common/ProgId";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]

/** 檔案室清單
 * @returns 
 */
export const Server_FileArchiveListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => FileArchiveProvider(), []);
    const usePageList = useFileArchiveList(provider, prop.lang, kw);
    const useCategory = useCategoryListData(PGID.FileArchive, prop.lang);
    const actions = useActions(dirUrl, provider, undefined, undefined, usePageList.refetchCurrent);
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(prop.lang, usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions); }, [usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "檔案室搜尋", subTitle: "搜尋檔案室 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const isLoading = [usePageList.isLoading, useCategory.isLoading];
    const errors = [usePageList.error, useCategory.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: FileArchiveSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.rows.length === 0) return gridProps;
    const hasAdjustCol = gridProps.columns.some(col => col.key === '__adjust__');
    const adjustCol: ColumnConfig = hasAdjustCol ? (gridProps.columns.find(col => col.key === '__adjust__') as ColumnConfig) : { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = hasAdjustCol ? gridProps.columns : [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const internalId = curData?.FileArchive?.InternalId ?? "";
        const baseCells: RowCell[] = row.cells.map(cell => {
            if (cell.col.key === FileArchiveInfoFields.Title) {
                const titleText = curData.FileArchiveInfo?.find(p => p.Lang === lang)?.Title
                return { ...cell, content: (<>{titleText}{GetContentStatus(curData?.FileArchive?.ContentStatus ?? 0)}</>), };
            }
            if (cell.col.key === FileArchiveFields.CategoriesId) {
                const rawCatId =
                    curData?.FileArchive?.CategoriesId ?? cell.content?.toString() ?? "";
                return { ...cell, content: useFormatCategoriesName(rawCatId, categoryData, lang), };
            }
            return cell;
        });
        const toolbarCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
        };
        return { ...row, cells: [...baseCells, toolbarCell] };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

const GetContentStatus = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>
};

const useFileArchiveList = (provider: IDataProvider<FileArchiveSet>, lang: Lang, query: string) => {
    let condition: string = `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang} = ${lang}`;
    if (!!query) condition = LibMerge(" And ", false, condition, `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${query}`)
    return useFetchGridListData<FileArchiveSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [FileArchiveSetFields.FileArchive, FileArchiveFields.CategoriesId],
            [FileArchiveSetFields.FileArchiveInfo, FileArchiveInfoFields.Title],
            [FileArchiveSetFields.FileArchive, FileArchiveFields.CreateTime],
            [FileArchiveSetFields.FileArchive, FileArchiveFields.ModifyUserId],
            [FileArchiveFields.ModifyUser, AccountFields.AccountName],
            [FileArchiveSetFields.FileArchive, FileArchiveFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                FileArchiveFields.InternalId,
                FileArchiveFields.FileArchiveId,
                FileArchiveFields.CategoriesId,
                FileArchiveFields.ContentStatus,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
                FileArchiveFields.ModifyUserId,
                `${FileArchiveFields.ModifyUser}.${AccountFields.AccountName}`,
                FileArchiveFields.CreateTime,
                FileArchiveFields.ModifyTime,
            ],
            Condition: condition,
            RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.FileArchive ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case FileArchiveInfoFields.Title:
                        {
                            content = item.FileArchiveInfo?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                            break;
                        }
                    case FileArchiveFields.CreateTime:
                    case FileArchiveFields.ModifyTime:
                        {
                            content = FormatDateTime((data as any)[col.key]);
                            break;
                        }
                    case FileArchiveFields.ModifyUserId:
                        content = item.FileArchive?.ModifyUser?.AccountName ?? "";
                        break;
                    default:
                        {
                            content = (item.FileArchive as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, query],
    });
};
