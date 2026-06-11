import type { ToolbarActions } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { List_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useServerListGridTemplate } from "./Server_ListGridTemplate_Hook";
import type { ServerListGridTemplate } from "./Server_ListGridTemplate_Hook";

// #region Property
export interface ServerListGridSearchRenderProps
{
    /** 最終給 SearchBar 渲染的欄位設定 */
    fields: SearchFieldConfig[];

    /** SearchBar 已送出的搜尋值 */
    submittedValues: SearchValues;

    /** 送出 SearchBar 搜尋值 */
    onSubmit: (values: SearchValues) => void;

    /** 清除 SearchBar 搜尋值 */
    onReset: () => void;
}


export interface ServerListGridTemplateCompProps<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = unknown>
{
    /** 後台卡片標題 */
    Title: string;

    /** 後台主題設定 */
    Theme: IBETheme;

    /** 後台工具列動作設定 */
    Actions?: ToolbarActions;

    /** ListGridTemplate 流程設定，可支援 Feature only、Feature + Spec、Spec only */
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>;

    /** SearchBar 渲染插槽 */
    buildSearchBarNode?: (props: ServerListGridSearchRenderProps) => ReactNode;
}
// #endregion

// #region Public
/** 後台 ListGrid 標準板模，統一處理 SearchBar、Toolbar、Loading/Error 與 Grid 渲染位置 */
export const Server_ListGridTemplate_Comp = <TSearchParams, TRawData, TAdapter = unknown, TQueryParam = unknown>(
    props: ServerListGridTemplateCompProps<TSearchParams, TRawData, TAdapter, TQueryParam>,
) =>
{
    const vm = useServerListGridTemplate(props.template);

    return (
        <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-braille me-2"></i>
                                {props.Title}
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="panel">
                                        <div className="panel-body">
                                            <div className="form">
                                                {props.buildSearchBarNode?.({
                                                    fields: vm.searchFields,
                                                    submittedValues: vm.submittedValues,
                                                    onSubmit: vm.submitSearch,
                                                    onReset: vm.resetSearch,
                                                })}

                                                <DividerComp />

                                                {props.Actions && <List_Toolbar action={props.Actions} />}

                                                <LoadingErrorHandler isLoading={vm.isLoading} errorList={vm.errors}>
                                                    <OperationGuideHelp_Comp lang={DefaultLang} />
                                                    <Grid gridData={vm.gridData} style={props.Theme.GridView} pageStyle={props.Theme.Paginator} />
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
};
// #endregion
