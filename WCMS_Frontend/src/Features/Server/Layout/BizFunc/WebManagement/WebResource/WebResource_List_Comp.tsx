import type { SearchBarProps } from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "../../../Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useLocation } from 'react-router-dom';
import { ListComp } from "../../../Scaffold/Content/List_Comp"
import type { ListCompProp } from "../../../Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "../../../../../../types/api";
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";

// 借用Page資料
import { usePageManagementListData } from "../PageManagement/PageManagement_Hook";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
import { handleDelete } from "../PageManagement/PageManagement_Hook";

/** 網路資源清單
 * @returns 
 */
export const WebResourceListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);

    const usePageList = usePageManagementListData();

    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, usePageList.gridProps, usePageList.rawData); }, [usePageList.gridProps, usePageList.rawData]);

    const useToolbar = useListToolbarActions(dirUrl)
    const searchCompProp: SearchBarProps = {
        title: "網路資源搜尋",
        subTitle: "搜尋網路資源 ...",
        settingTitle: "搜尋設定",
    }
    const isLoading = [usePageList.isLoading];
    const errors = [usePageList.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }

    return (
        <ListComp prop={prop}></ListComp>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: PageManagementSet[]): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === "DataStatus");
        if (statusCell && typeof statusCell.content === 'number') {
            statusCell.content = GetDataStatusContent(statusCell.content);
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