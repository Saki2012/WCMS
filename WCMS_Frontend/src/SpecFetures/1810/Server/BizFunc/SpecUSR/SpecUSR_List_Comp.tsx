import type { SearchBarProps } from "../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "../../../../../Features/Server/Layout/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useLocation } from 'react-router-dom';
import { ListComp } from "../../../../../Features/Server/Layout/Scaffold/Content/List_Comp"
import type { ListCompProp } from "../../../../../Features/Server/Layout/Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "../../../../../types/api"
import { useListToolbarActions } from "../../../../../SysCore/Components/Toolbar/Toolbar_Hook"
import { useUSRProjList } from "./SpecUSR_Hook"
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]

/** USR計畫清單
 * @returns 
 */
export const USRProjListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);

    const usePageList = useUSRProjList();

    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, usePageList.gridProps, usePageList.rawData); }, [usePageList.gridProps, usePageList.rawData]);

    const useToolbar = useListToolbarActions(dirUrl)
    const searchCompProp: SearchBarProps = {
        title: "USR計畫搜尋",
        subTitle: "搜尋USR計畫 ...",
        settingTitle: "搜尋設定",
    }
    const isLoading: boolean[] = [];
    const errors: string[] = [];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }

    return (
        <ListComp prop={prop}></ListComp>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: SpecUSRSet[]): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === "DataStatus");
        // if (statusCell && typeof statusCell.content === 'number') {
        //     statusCell.content = GetDataStatusContent(statusCell.content);
        // }

        const internalId = rawData?.[index]?.SpecUSR?.InternalId ?? "";

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
                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除USR計畫">
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
