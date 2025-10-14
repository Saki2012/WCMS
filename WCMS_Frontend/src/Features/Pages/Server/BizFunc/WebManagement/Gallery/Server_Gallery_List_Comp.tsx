import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { useGalleryListData } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Hook"
import { GalleryFields, GalleryInfoFields } from "@/types/SchemaFields"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient"
import type { components } from "@/types/api";
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
type GallerySet = components["schemas"]["GallerySet_DTO"]

/** 相簿清單
 * @returns 
 */
export const Server_GalleryListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const useGalleryList = useGalleryListData();
    const actions = useActions(dirUrl, GalleryProvider(), undefined, undefined, useGalleryList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useGalleryList.gridProps, useGalleryList.rawData, actions); }, [useGalleryList.gridProps, useGalleryList.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "相簿搜尋", subTitle: "搜尋相簿 ...", settingTitle: "搜尋設定", }
    const isLoading = [useGalleryList.isLoading];
    const errors = [useGalleryList.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}
/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: GallerySet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Gallery?.InternalId ?? "";
        const pic = row.cells.find(cell => cell.col.key === GalleryFields.CoverPicSrcId);
        const title = row.cells.find(cell => cell.col.key === GalleryInfoFields.Title)?.content?.toString();
        if (pic) {
            const coverPicId = pic.content?.toString(); // 轉成字串
            pic.content = (
                <>
                    <img src={`${FileManagementAPI.PREVIEW_URL}/${coverPicId}`} alt={title} style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                </>
            );
        }
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
}