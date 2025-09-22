import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation, Link } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import * as React from "react";
import type { components } from "@/types/api";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
import { useListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import * as SchemaFields from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "../../../../../Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useAnnouncementList } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Hook";
import { handleDelete } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Hook";

/** 公告列表
 * @returns 
 */
export const Server_AnnouncementListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useCategory = useCategoryListData("Announcement", "zh-tw");
    const useAnnounceList = useAnnouncementList();
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData); },
        [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData]);
    const useToolbar = useListToolbarActions(dirUrl)
    const isLoading = [useAnnounceList.isLoading, useCategory.isLoading];
    const errors = [useAnnounceList.error, useCategory.error];
    const searchCompProp: SearchBarProps = {
        title: "公告搜尋",
        subTitle: "搜尋公告 ...",
        settingTitle: "搜尋設定",
    }
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }

    return (
        <ListComp prop={prop}></ListComp>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[], categoryData: CategoryDataSet[]): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.AnnouncementFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.AnnouncementFields.Categories);
        if (categoryCell) {
            categoryCell.content = useFormatCategoriesName(categoryCell.content?.toString() ?? "", categoryData)
        }
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
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
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
    const id = React.useId()
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div key={id} className="CustomState">{statusItems}</div>
};