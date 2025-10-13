import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { SearchComp } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";



export const ListComp = ({ prop }: { prop: ListCompProp; }) => {
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
                                                <List_Toolbar action={prop.Actions} ></List_Toolbar>
                                                <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                                    <Grid gridData={prop.GridData as GridProps} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator}></Grid>
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