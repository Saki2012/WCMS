import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation, Link } from 'react-router-dom';
import { useGalleryListData } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Hook"
import { GalleryFields, GalleryInfoFields } from "@/types/SchemaFields"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient"
import type { components } from "@/types/api";
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import { useListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
type GallerySet = components["schemas"]["GallerySet_DTO"]

/** 相簿清單
 * @returns 
 */
export const Server_GalleryListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form/`);
    const useGalleryList = useGalleryListData();
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useGalleryList.gridProps, useGalleryList.rawData); }, [useGalleryList.gridProps, useGalleryList.rawData]);
    const useToolbar = useListToolbarActions(dirUrl)
    const searchCompProp: SearchBarProps = { title: "相簿搜尋", subTitle: "搜尋相簿 ...", settingTitle: "搜尋設定", }
    const isLoading = [useGalleryList.isLoading];
    const errors = [useGalleryList.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
}
/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: GallerySet[]): GridProps => {
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
            content: (
                <div className="all-btn Edit Icon">
                    <Link id="edit" className="icon" to={`${dirUrl}${internalId}`} target="_self" title="">
                        <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="內容編輯">
                            <i className="far fa-edit"></i>
                        </button>
                    </Link>
                    <a id="trash" className="icon" href="#" onClick={(e) => { e.preventDefault(); }} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                            <i className="far fa-trash-alt"></i>
                        </button>
                    </a>
                </div>
            )
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
}