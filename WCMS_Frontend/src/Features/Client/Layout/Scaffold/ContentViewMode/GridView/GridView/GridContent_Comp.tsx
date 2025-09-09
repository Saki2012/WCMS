import { Grid } from "../../../../../../../SysCore/Components/Grid/Grid_Comp";
import LoadingErrorHandler from "../../../../../../../SysCore/Components/LoadingErrorHandler";
import SearchBarComp from "../../../../../../../SysCore/Components/SearchBar/SearchBar_Comp";
import type { ListCompProp } from "../GridView_Data";

export const GridViewContentComp = (prop: ListCompProp) => {
    return (
        <>
            {/* <SearchBarComp></SearchBarComp> */}
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator}></Grid>
            </LoadingErrorHandler>
        </>
    );
}