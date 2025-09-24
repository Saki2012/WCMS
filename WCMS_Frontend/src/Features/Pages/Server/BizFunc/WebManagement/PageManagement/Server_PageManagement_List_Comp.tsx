import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { usePageManagementListData } from "../../../../../Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Hook";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation, Link } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "../../../Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "@/types/api";
import { useListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
import { handleDelete } from "../../../../../Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Hook";
import { useCategoryListData, useFormatCategoriesName } from "../../../../../Hooks/BizFunc/WebManagement/Category/Category_Hook";
import * as SchemaFields from "@/types/SchemaFields";

/** 頁面清單
 * @returns 
 */
export const PageListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useCategory = useCategoryListData("PageManagement", "zh-tw");
    const usePageList = usePageManagementListData();
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, usePageList.gridProps, usePageList.rawData, useCategory.rawData); }, [usePageList.gridProps, usePageList.rawData, useCategory.rawData]);
    const useToolbar = useListToolbarActions(dirUrl)
    const searchCompProp: SearchBarProps = { title: "頁面搜尋", subTitle: "搜尋頁面 ...", settingTitle: "搜尋設定", }
    const isLoading = [usePageList.isLoading, useCategory.isLoading];
    const errors = [usePageList.error, useCategory.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}
/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: PageManagementSet[], categoryData: CategoryDataSet[]): GridProps => {
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
        if (categoryCell) {
            categoryCell.content = useFormatCategoriesName(categoryCell.content?.toString() ?? "", categoryData)
        }
        const internalId = rawData?.[index]?.PageManagement?.InternalId ?? "";

        const newCell: RowCell = {
            col: adjustCol,
            content: (
                <div className="all-btn Edit Icon">
                    <Link id="edit" className="icon" to={`${dirUrl}/${internalId}`} target="_self">
                        <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="內容編輯">
                            <i className="far fa-edit"></i>
                        </button>
                    </Link>
                    <a id="trash" className="icon" onClick={() => handleDelete(internalId)} data-bs-toggle="modal" data-bs-target="#All_Delete">
                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除頁面">
                            <i className="far fa-trash-alt"></i>
                        </button>
                    </a>
                </div>
            )
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