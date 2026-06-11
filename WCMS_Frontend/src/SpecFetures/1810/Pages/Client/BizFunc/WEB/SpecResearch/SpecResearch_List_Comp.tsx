import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { useSpecResearchListFetchData } from "./SpecResearch_List_Loader";

// #region Property
export interface ISpecResearchListOptions
{
    Category?: string;
    Tag?: string;
}

export interface ISpecResearchListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: ISpecResearchListOptions;
}
// #endregion

// #region Public
/** SpecResearch 清單元件 */
export const SpecResearchListComp = (props: ISpecResearchListProps) =>
{
    // 宣告變數：優先吃 SSR initData，其次才 fallback route loader data
    const getData = useSpecResearchListFetchData({ lang: props.Lang, options: props.Options });

    // return：保留原本 DOM 結構
    return (
        <LoadingErrorHandler isLoading={getData.isLoading} errorList={getData.errorList}>
            <OperationGuideHelp_Comp lang={props.Lang} />
            <Grid gridData={getData.rawData.gridProps} style={props.Theme.GridView} pageStyle={props.Theme.Paginator} />
        </LoadingErrorHandler>
    );
};
// #endregion
