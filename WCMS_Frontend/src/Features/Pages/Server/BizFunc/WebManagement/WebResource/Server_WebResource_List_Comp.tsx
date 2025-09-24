import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import type { components } from "@/types/api";
import { useListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import * as SchemaFields from "@/types/SchemaFields";
import { useWebResourceListData } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Hook"
import { handleDelete } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Hook";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 網路資源清單
 * @returns 
 */
export const WebResourceListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useListData = useWebResourceListData();
    const useCategory = useCategoryListData("WebResource", "zh-tw");
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useListData.gridProps, useListData.rawData, useCategory.rawData); }, [dirUrl, useListData.gridProps, useListData.rawData, useCategory.rawData]);
    const useToolbar = useListToolbarActions(dirUrl)
    const searchCompProp: SearchBarProps = { title: "網路資源搜尋", subTitle: "搜尋網路資源 ...", settingTitle: "搜尋設定", }
    const isLoading = [useListData.isLoading];
    const errors = [useListData.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: WebResourceSet[], categoryData: CategoryDataSet[]): GridProps => {
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
            content: (
                <div className="all-btn Edit Icon">
                    <Link id="edit" className="icon" to={`${dirUrl}/${internalId}`} target="_self">
                        <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="內容編輯">
                            <i className="far fa-edit"></i>
                        </button>
                    </Link>
                    <a id="trash" className="icon" onClick={() => handleDelete(internalId)} data-bs-toggle="modal" data-bs-target="#All_Delete">
                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除網路資源">
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
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>
};