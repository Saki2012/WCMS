import { Form_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { ReactNode } from "react";
import { useServerFormTemplate } from "./Server_FormTemplate_Hook";
import type {
    ServerFormBaseActionOptions,
    ServerFormDefaultRawData,
    ServerFormTemplate,
    ServerFormTemplateViewModel,
} from "./Server_FormTemplate_Hook";

// #region Property
export interface ServerFormTemplateRenderProps<TSet, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TSet, TRefs>, TActionOpt = ServerFormBaseActionOptions>
{
    /** Form Template 統一產生的 ViewModel */
    vm: ServerFormTemplateViewModel<TSet, TAdapter, TRefs, TRawData, TActionOpt>;
}


export interface ServerFormTemplateCompProps<TSet, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TSet, TRefs>, TActionOpt = ServerFormBaseActionOptions>
{
    /** FormTemplate 流程設定，可支援 F 有 S 沒有、F 有 S 有、F 沒有 S 有 */
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>;

    /** Form 內容渲染插槽，可放 Header / Detail / SubDetail / EditGrid */
    renderContent: (props: ServerFormTemplateRenderProps<TSet, TAdapter, TRefs, TRawData, TActionOpt>) => ReactNode;

    /** Toolbar 前方額外內容，例如提示文字或預覽區塊 */
    renderBeforeToolbar?: (props: ServerFormTemplateRenderProps<TSet, TAdapter, TRefs, TRawData, TActionOpt>) => ReactNode;

    /** Toolbar 後方額外內容，例如 debug 或特殊操作 */
    renderAfterToolbar?: (props: ServerFormTemplateRenderProps<TSet, TAdapter, TRefs, TRawData, TActionOpt>) => ReactNode;
}
// #endregion

// #region Public
/** 後台 Form 標準板模，統一處理資料流程、Loading/Error、內容插槽與 Form Toolbar */
export const Server_FormTemplate_Comp = <TSet, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TSet, TRefs>, TActionOpt = ServerFormBaseActionOptions>(
    props: ServerFormTemplateCompProps<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
) =>
{
    const vm = useServerFormTemplate(props.template);
    const hasToolbar = Boolean(vm.formProp.Actions);
    const renderProps: ServerFormTemplateRenderProps<TSet, TAdapter, TRefs, TRawData, TActionOpt> = { vm };

    return (
        <div className="Form-Main-Content">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-braille me-2"></i>
                                {vm.formProp.Title}
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-12">
                                    <LoadingErrorHandler isLoading={vm.formProp.IsLoading} errorList={vm.formProp.ErrorList}>
                                        {props.renderContent(renderProps)}
                                        {props.renderBeforeToolbar?.(renderProps)}
                                        {hasToolbar && (
                                            <>
                                                <DividerComp></DividerComp>
                                                <Form_Toolbar action={vm.formProp.Actions!}></Form_Toolbar>
                                            </>
                                        )}
                                        {props.renderAfterToolbar?.(renderProps)}
                                    </LoadingErrorHandler>
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
