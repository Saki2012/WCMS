import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "@/types/api";
import { useFileArchiveList } from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Hook"
import * as SchemaFields from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import { Prog } from "@/Features/Hooks/Common/Prog";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]

/** 檔案室清單
 * @returns 
 */
export const Server_FileArchiveListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const usePageList = useFileArchiveList();
    const useCategory = useCategoryListData(Prog.FileArchive, "zh-tw");
    const actions = useActions(dirUrl, FileArchiveProvider(), undefined, undefined, usePageList.refetchCurrent);
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions); }, [usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "檔案室搜尋", subTitle: "搜尋檔案室 ...", settingTitle: "搜尋設定", }
    const isLoading = [usePageList.isLoading, useCategory.isLoading];
    const errors = [usePageList.error, useCategory.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: FileArchiveSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.FileArchiveFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') {
            statusCell.content = GetContentStatus(statusCell.content);
        }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.FileArchiveFields.CategoriesId);
        const rawCatId = rawData?.[index]?.FileArchive?.CategoriesId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }
        const internalId = rawData?.[index]?.FileArchive?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
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
