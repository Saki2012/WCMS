import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ReactNode } from "react";
import { FormShellComp, type FormShellToolbarButton } from "../FormShell_Comp";
import { useServerFormTemplate } from "./Server_FormTemplate_Hook";
import type {
    ServerFormBaseActionOptions,
    ServerFormDefaultRawData,
    ServerFormTemplate,
    ServerFormTemplateViewModel,
} from "./Server_FormTemplate_Hook";
// #region Property
export interface ServerFormTemplateRenderProps<TFormModel, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TFormModel, TRefs>, TActionOpt = ServerFormBaseActionOptions>
{
    /** Form Template 統一產生的 ViewModel */
    vm: ServerFormTemplateViewModel<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>;
}

export interface ServerFormTemplateCompProps<TFormModel, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TFormModel, TRefs>, TActionOpt = ServerFormBaseActionOptions>
{
    /** FormTemplate 流程設定，可支援 F 有 S 沒有、F 有 S 有、F 沒有 S 有 */
    template: ServerFormTemplate<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>;
    /** 覆寫表單類型的基礎工具列，例如儲存、返回、上一筆、下一筆。 */
    resolveBasicToolbarButtons?: (props: ServerFormTemplateRenderProps<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>, defaultButtons: FormShellToolbarButton[]) => FormShellToolbarButton[];
    /** Form 內容渲染插槽，可放 Header / Detail / SubDetail / EditGrid */
    renderContent: (props: ServerFormTemplateRenderProps<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>) => ReactNode;
    /** 建立功能自定義工具列，例如預覽、匯出、同步。 */
    resolveActionToolbarButtons?: (props: ServerFormTemplateRenderProps<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>) => FormShellToolbarButton[];
}
// #endregion

// #region Public
/** 後台 Form 標準板模，統一處理資料流程、Loading/Error、內容插槽與 Form Toolbar */
export const Server_FormTemplate_Comp = <TFormModel, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TFormModel, TRefs>, TActionOpt = ServerFormBaseActionOptions>(
    props: ServerFormTemplateCompProps<TFormModel, TAdapter, TRefs, TRawData, TActionOpt>,
) =>
{
    const vm = useServerFormTemplate(props.template);
    const renderProps: ServerFormTemplateRenderProps<TFormModel, TAdapter, TRefs, TRawData, TActionOpt> = { vm };
    const defaultBasicToolbarButtons = buildDefaultBasicToolbarButtons(vm.actions);
    const basicToolbarButtons = props.resolveBasicToolbarButtons?.(renderProps, defaultBasicToolbarButtons) ?? defaultBasicToolbarButtons;
    const actionToolbarButtons = props.resolveActionToolbarButtons?.(renderProps) ?? [];
    return (
        <FormShellComp prop={vm.formProp} basicToolbarButtons={basicToolbarButtons} actionToolbarButtons={actionToolbarButtons}>
            {props.renderContent(renderProps)}
        </FormShellComp>
    );
};
// #endregion

// #region Private
/** 建立 FormTemplate 預設基礎工具列。 */
const buildDefaultBasicToolbarButtons = (actions: ServerFormActions): FormShellToolbarButton[] =>
{
    return [
        { title: "儲存送出", action: actions.Save, disabled: actions.IsSaving },
        { title: "取消返回", action: actions.Back },
    ];
};
// #endregion
