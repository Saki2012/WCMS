import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { List_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { LibSearchBar, type SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";


interface ListCompProp {
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    SearchBar?: SearchBarProps;
    Actions: UseActionsResult;
    GridType?: string;
    GridData?: GridProps;
}

export const ListComp = (prop: ListCompProp) => {
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
                                                <List_Toolbar action={prop.Actions} ></List_Toolbar>
                                                <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                                                    <OperationGuideHelp_Comp lang={DefaultLang} />
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