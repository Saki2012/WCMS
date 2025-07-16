import {Grid} from "../../../../../../SysCore/Components/Grid/Grid_ForServer_Comp"
import {SearchComp} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import {DividerComp} from "../../../../../../SysCore/Components/Divider/Divider_Comp"
import {Toolbar} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp"
import type {ToolbarProp} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import type {IBETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import  {Classic_BETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import { usePageListData } from "./PageManagement_Hook";

const toolbarProp:ToolbarProp={
    Title:"新增頁面",
    Url:"/Server/WebManagement/PageManage/AddNew",
}

const searchCompProp:SearchBarProps={
    title:"頁面搜尋",
    subTitle:"搜尋頁面 ...",
    settingTitle: "搜尋設定",
}


export interface PageListProp{
    title:"頁面列表",
    searchBar:SearchBarProps,
    gridData:{
    },
}

/** 頁面清單
 * @returns 
 */
export const PageListComp = (prop:PageListProp,style:IBETheme) => {

    const { gridProps, isLoading } = usePageListData();
    style=Classic_BETheme

    return (
      <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{prop.title}標題</h3>
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
                                                <Grid gridData={gridProps} style={style.GridView}></Grid>
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
