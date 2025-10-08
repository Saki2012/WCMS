import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { ListCompProp } from "../GridView_Data";

export interface GridViewContentSlots extends ListCompProp {
    searchSlot?: React.ReactNode;
}

export const GridViewContentComp = (prop: GridViewContentSlots) => {
    return (
        <>
            {prop.searchSlot}
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator}></Grid>
            </LoadingErrorHandler>
        </>
    );
}