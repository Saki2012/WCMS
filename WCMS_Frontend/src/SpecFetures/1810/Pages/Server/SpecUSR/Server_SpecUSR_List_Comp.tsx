import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import type { components } from "@/types/api"
import { useSpecUSRProjList } from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Hook"
import * as SchemaFields from "@/types/SchemaFields";
import { useFormatSpecCategoriesName, useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook"
import { useFormatTagsName, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import SpecUSRProvider from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api"
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
/** USR計畫清單
 * @returns 
 */
export const USRProjListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const usePageList = useSpecUSRProjList();
    const useCategory = useSpecCateListData("SpecUSR", "zh-tw");
    const useTag = useTagListData("SpecUSR", "zh-tw");
    const actions = useActions(dirUrl, SpecUSRProvider(), undefined, undefined, usePageList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(usePageList.gridProps, usePageList.rawData, useCategory.rawData, useTag.rawData, actions); }, [usePageList.gridProps, usePageList.rawData, useCategory.rawData, useTag.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "USR計畫搜尋", subTitle: "搜尋USR計畫 ...", settingTitle: "搜尋設定", }
    const isLoading = [usePageList.isLoading, useCategory.isLoading, useTag.isLoading];
    const errors = [usePageList.error, useCategory.error, useTag.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecUSRSet[], cateData: SpecCategorySet[], tagData: TagSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.SpecUSRModelFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.SpecUSRModelFields.CategoryId);
        const rawCatId = rawData?.[index]?.SpecUSR?.CategoryId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatSpecCategoriesName(rawCatId, cateData); }
        const tagCell = row.cells.find(p => p.col.key === SchemaFields.SpecUSRModelFields.Tags);
        const rawTagId = rawData?.[index]?.SpecUSR?.Tags ?? categoryCell?.content?.toString() ?? "";
        if (tagCell) { tagCell.content = useFormatTagsName(rawTagId, tagData); }
        const internalId = rawData?.[index]?.SpecUSR?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)

        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};


/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>
};