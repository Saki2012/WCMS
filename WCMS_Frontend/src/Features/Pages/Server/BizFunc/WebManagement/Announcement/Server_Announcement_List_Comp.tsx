import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useAnnouncementList } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Hook";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "../../../Scaffold/Toolbar/Toolbar_Comp";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import type { Lang } from "@/SysCore/i18n/lang";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 公告列表
 * @returns 
 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useCategory = useCategoryListData("Announcement", "zh-tw");
    const useAnnounceList = useAnnouncementList();
    const actions = useActions(dirUrl, AnnouncementProvider(), undefined, undefined, useAnnounceList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions]);
    const isLoading = [useAnnounceList.isLoading, useCategory.isLoading];
    const errors = [useAnnounceList.error, useCategory.error];
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", settingTitle: "搜尋設定", }
    const compProp: ListCompProp = { Title: prop.title, Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={compProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: AnnouncementSet[], categoryData: CategoryDataSet[],
    actions: UseActionsResult
): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.AnnouncementFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.AnnouncementFields.Categories);
        const rawCatId = rawData?.[index]?.Announcement?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
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