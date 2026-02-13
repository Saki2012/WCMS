import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { LibSearchBar } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";



export const ImgListComp = ({ prop, children }: { prop: FormCompProp; children: React.ReactNode }) => {
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
                                                {prop.SearchBar && <LibSearchBar {...prop.SearchBar}></LibSearchBar>}
                                                <DividerComp></DividerComp>
                                                {/* <Form_Toolbar items={prop.Toolbar}></Form_Toolbar> */}
                                                <List_Toolbar action={prop.Actions} ></List_Toolbar>
                                                <LoadingErrorHandler isLoading={prop.LoadingList} errorList={prop.ErrorList} >
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