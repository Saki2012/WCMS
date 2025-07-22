import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type {IBETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import { useFetchPageListData } from "./PageManagement_Hook";
import type { GridProps,ColumnConfig,GridRow,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router"
import { useLocation } from 'react-router-dom';
import { ListComp } from "../../../Scaffold/Content/List_Comp"
import type { ListCompProp } from "../../../Scaffold/Content/Content_Data"
import * as React from "react";

/** 頁面清單
 * @returns 
 */
export const PageListComp = ({title,theme}:{title:string;theme:IBETheme}) => {

    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form/`);
    const { gridProps, isLoading } = useFetchPageListData();
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, gridProps);}, [gridProps]);
    // <List_Toolbar title="新增頁面" url="/Server/WebManagement/PageManage/Form"></List_Toolbar> 給Toolbar就完成
    const prop:ListCompProp={ Title:title, Theme:theme, LoadingList:[], ErrorList:[], Toolbar:[],GridData:adjustedGrid }


    return (
            <ListComp prop={prop}></ListComp>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction=(dirUrl:string, gridProps: GridProps): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length===0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map(row => {
        const statusCell = row.cells.find(cell=>cell.col.key==="DataStatus");
        if (statusCell && typeof statusCell.content === 'number') statusCell.content = GetDataStatusContent(statusCell.content);

        const uid = row.cells.find(cell=>cell.col.key==="InternalId")?.content?.toString();
        const newCell: RowCell = {
        col: adjustCol,
        content: (
            <div className="all-btn Edit Icon">
                <Link id="edit" className="icon" to={`${dirUrl}${uid}`} target="_self" title="">
                    <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="內容編輯">
                        <i className="far fa-edit"></i>
                    </button>
                </Link>
                <a id="trash" className="icon" href="javascript:void(0);" title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
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

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (datastatus: number): React.ReactNode => {
  switch (datastatus) {
    case 0:
        return <div className="CustomState">
                    <div className="icon-small top-bg">置頂</div>
                </div>;
    case 1:
        return  <div className="CustomState">
                    <div className="icon-small hot-bg">熱門</div>
                </div>;
    case 2:
      return    <div className="CustomState">
                    <div className="icon-small new-bg">最新</div>
                </div>;
    case 3:
        return  <div className="CustomState">
                    <div className="icon-small hide-bg">隱藏</div>
                </div>;
    default:
      return <span>未知狀態</span>;
  }
};