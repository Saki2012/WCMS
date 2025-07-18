import {Grid} from "../../../../../../SysCore/Components/Grid/Grid_Comp"
import {SearchComp} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import {DividerComp} from "../../../../../../SysCore/Components/Divider/Divider_Comp"
import {Toolbar} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp"
import type {ToolbarProp} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import type {IBETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import { useFetchPageListData } from "./PageManagement_Hook";
import type { GridProps,ColumnConfig,GridRow,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router"
import { useLocation } from 'react-router-dom';

const toolbarProp:ToolbarProp={
    Title:"新增頁面",
    Url:"/Server/WebManagement/PageManage/AddNew",
}

const searchCompProp:SearchBarProps={
    title:"頁面搜尋",
    subTitle:"搜尋頁面 ...",
    settingTitle: "搜尋設定",
}

/** 頁面清單
 * @returns 
 */
export const PageListComp = ({title,theme}:{title:string;theme:IBETheme}) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form/`);
    const { gridProps, isLoading } = useFetchPageListData();
    const adjustedGrid = useMemo(() => {return SetAdjustFunction(dirUrl, gridProps);}, [gridProps]);
    return (
      <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{title}</h3>
                        </div>
                        {/* <ListBodyComp></ListBodyComp> */}
                        <div className="card-body">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="panel">
                                        <div className="panel-body">
                                            <div className="form"> 
                                                <SearchComp {...searchCompProp}></SearchComp>
                                                <DividerComp></DividerComp>
                                                <Toolbar {...toolbarProp}></Toolbar>
                                                <Grid gridData={adjustedGrid} style={theme.GridView} pageStyle={theme.Paginator}></Grid>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction=(dirUrl:string, gridProps: GridProps): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length===0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map(row => {
        const id = row.cells[0].content?.toString();
        const newCell: RowCell = {
        col: adjustCol,
        content: (
            <div className="all-btn Edit Icon">
                <Link id="edit" className="icon" to={`${dirUrl}${id}`} target="_self" title="">
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