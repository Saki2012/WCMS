import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { usePageManagementListData } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Hook";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "@/types/api";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import * as SchemaFields from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "../../../Scaffold/Toolbar/Toolbar_Comp";
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
import { Prog } from "@/Features/Hooks/Common/Prog";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 頁面清單
 * @returns 
 */
export const PageListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useCategory = useCategoryListData(Prog.PageManagement, prop.lang);
    const usePageList = usePageManagementListData();
    const actions = useActions(dirUrl, PageManagementProvider(), undefined, undefined, usePageList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions); }, [dirUrl, usePageList.gridProps, usePageList.rawData, useCategory.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "頁面搜尋", subTitle: "搜尋頁面 ...", settingTitle: "搜尋設定", }
    const isLoading = [usePageList.isLoading, useCategory.isLoading];
    const errors = [usePageList.error, useCategory.error];
    const compProp: ListCompProp = { Title: prop.title, Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={compProp}></ListComp>);
}
/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: PageManagementSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === "DataStatus");
        if (statusCell && typeof statusCell.content === 'number') {
            statusCell.content = GetDataStatusContent(statusCell.content);
        }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.PageManagementFields.CategoryId);
        const rawCatId = rawData?.[index]?.PageManagement?.CategoryId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) {
            categoryCell.content = useFormatCategoriesName(rawCatId, categoryData);
        }
        const internalId = rawData?.[index]?.PageManagement?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (datastatus: number): React.ReactNode => {
    switch (datastatus) {
        case 0:
            return <div className="CustomState">
                <div className="icon-small top-bg">置頂</div>
            </div>;
        case 1:
            return <div className="CustomState">
                <div className="icon-small hot-bg">熱門</div>
            </div>;
        case 2:
            return <div className="CustomState">
                <div className="icon-small new-bg">最新</div>
            </div>;
        case 3:
            return <div className="CustomState">
                <div className="icon-small hide-bg">隱藏</div>
            </div>;
        default:
            return <span>未知狀態</span>;
    }
};