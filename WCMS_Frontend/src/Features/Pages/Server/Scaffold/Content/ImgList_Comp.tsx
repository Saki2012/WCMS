import type { ListCompProp } from "./Content_Data";
import { DividerComp } from "../../../../../SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "../../../../../SysCore/Components/Toolbar/Toolbar_Comp";
import { SearchComp } from "../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { Grid } from "../../../../../SysCore/Components/Grid/Grid_Comp";
import type { SearchBarProps } from "../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";



export const ImgListComp = ({ prop, children }: { prop: ListCompProp; children: React.ReactNode }) => {
    return (
        <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{prop.Title}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="panel">
                                        <div className="panel-body">
                                            <div className="form">
                                                <SearchComp prop={prop.SearchBar}></SearchComp>
                                                <DividerComp></DividerComp>
                                                {/* <Form_Toolbar items={prop.Toolbar}></Form_Toolbar> */}
                                                <List_Toolbar items={prop.Toolbar} ></List_Toolbar>
                                                <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                                    {children}
                                                </LoadingErrorHandler>
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