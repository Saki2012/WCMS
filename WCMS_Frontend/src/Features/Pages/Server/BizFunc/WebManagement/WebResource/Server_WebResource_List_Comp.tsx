import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useWebResourceListData } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Hook"
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { Prog } from "@/Features/Hooks/Common/Prog";
import type { Lang } from "@/SysCore/i18n/lang";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 網路資源清單
 * @returns 
 */
export const WebResourceListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useListData = useWebResourceListData();
    const useCategory = useCategoryListData(Prog.WebResource, prop.lang);
    const actions = useActions(dirUrl, WebResourceProvider(), undefined, undefined, useListData.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useListData.gridProps, useListData.rawData, useCategory.rawData, actions); }, [useListData.gridProps, useListData.rawData, useCategory.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "網路資源搜尋", subTitle: "搜尋網路資源 ...", settingTitle: "搜尋設定", }
    const isLoading = [useListData.isLoading];
    const errors = [useListData.error];
    const compProp: ListCompProp = { Title: prop.title, Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={compProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: WebResourceSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.WebResourceFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') {
            statusCell.content = GetDataStatusContent(statusCell.content);
        }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.WebResourceFields.Categories);
        const rawCatId = rawData?.[index]?.WebResource?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }
        const internalId = rawData?.[index]?.WebResource?.InternalId ?? "";
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