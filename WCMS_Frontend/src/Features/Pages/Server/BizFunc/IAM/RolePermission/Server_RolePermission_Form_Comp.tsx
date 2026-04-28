import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import { type PermissionCatalogModuleDTO, useRolePermissionPermissionUI, useServerRolePermissionForm } from "./Server_RolePermission_Form_Hook";
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
export const Server_RolePermission_Form_Comp = (props: { theme: IBETheme; lang: Lang; }) =>
{
    const vm = useServerRolePermissionForm(props);
    return (
        <FormComp prop={vm.prop}>
            <Header_Comp theme={props.theme} formData={vm.formData} isAddNew={vm.isAddNew} />
            <PermissionSetting_Comp modules={vm.modules} grantMap={vm.grantMap} onGrantChange={vm.onGrantChange} actionNameMap={vm.actionNameMap} />
        </FormComp>
    );
};

const Header_Comp = (props: { formData: UseFetchFormDataResult<RolePermissionSet>; theme: IBETheme; isAddNew: boolean; }) =>
{
    const setField = useSetTableField<RolePermissionSet>(props.formData);
    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="panel">
                    <div className="panel-body">
                        <div className="form">
                            <div className="row mx-0">
                                <div className="px-0 mb-2">
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleId, "string")}
                                        disabled={!props.isAddNew}
                                    />
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName, "string")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface IRolePermissionCatalogAccordionProps
{
    modules: PermissionCatalogModuleDTO[];
    grantMap: Record<string, number>;
    onGrantChange: (progId: string, nextGrantMask: number) => void;
    actionNameMap?: Record<string, string>;
}

const PermissionSetting_Comp = (props: IRolePermissionCatalogAccordionProps) =>
{
    const ui = useRolePermissionPermissionUI(props);
    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="panel">
                    <div className="panel-body">
                        <div className="form">
                            <div className="row mx-0">
                                <div className="px-0 mb-2">
                                    <button
                                        type="button"
                                        className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                        onClick={() => ui.setAllExpanded(true)}
                                        aria-label="展開所有模組"
                                    >
                                        展開
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                        onClick={() => ui.setAllExpanded(false)}
                                        aria-label="收合所有模組"
                                    >
                                        收合
                                    </button>
                                </div>
                            </div>

                            <div className="row mx-0">
                                <div className="accordion">
                                    {(props.modules ?? []).map((m, mi) =>
                                    {
                                        const moduleCode = (m.ModuleCode ?? "").trim();
                                        const moduleTitle = (m.ModuleTitle ?? moduleCode).trim();
                                        const isOpen = ui.expanded[moduleCode] ?? false;
                                        const headerId = `${ui.rid}-mod-h-${mi}-${moduleCode}`;
                                        const panelId = `${ui.rid}-mod-p-${mi}-${moduleCode}`;
                                        const moduleAllId = `${ui.rid}-mod-all-${mi}-${moduleCode}`;
                                        const isModuleChecked = ui.isModuleAllChecked(m);

                                        return (
                                            <div className="accordion-item" key={`${moduleCode}-${mi}`}>
                                                <h4 className="accordion-header" id={headerId}>
                                                    <button
                                                        type="button"
                                                        className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                                                        aria-expanded={isOpen}
                                                        aria-controls={panelId}
                                                        onClick={() => ui.toggleModule(moduleCode)}
                                                    >
                                                        {moduleTitle}
                                                    </button>
                                                </h4>

                                                <div
                                                    id={panelId}
                                                    className="accordion-collapse"
                                                    role="region"
                                                    aria-labelledby={headerId}
                                                    aria-hidden={!isOpen}
                                                    style={ui.getCollapseStyle(isOpen)}
                                                >
                                                    <div className="accordion-body" style={ui.getCollapseBodyStyle(isOpen)}>
                                                        <div className="row mx-0 mb-2">
                                                            <div className="col-sm-12 px-0">
                                                                <div className="custom-control custom-checkbox">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="custom-check-input"
                                                                        id={moduleAllId}
                                                                        checked={isModuleChecked}
                                                                        onChange={(e) => ui.onToggleModuleAll(m, e.target.checked)}
                                                                    />
                                                                    <label className="custom-check-label" htmlFor={moduleAllId}>
                                                                        <span className="check-txt">全選本模組權限</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(m.Progs ?? []).map((p, pi) =>
                                                        {
                                                            const progId = (p.ProgId ?? "").trim();
                                                            const progTitle = (p.ProgTitle ?? progId).trim();
                                                            const supportMask = p.SupportMask ?? 0;
                                                            const grantMask = ui.getGrantMask(progId);
                                                            const progHeaderId = `${ui.rid}-prog-h-${mi}-${pi}-${moduleCode}-${progId}`;
                                                            const progPanelId = `${ui.rid}-prog-p-${mi}-${pi}-${moduleCode}-${progId}`;
                                                            const progKey = ui.getProgKey(moduleCode, progId);
                                                            const isProgOpen = ui.expandedProg[progKey] ?? false;

                                                            return (
                                                                <div className="accordion mb-2" key={`${progId}-${pi}`}>
                                                                    <div className="accordion-item">
                                                                        <h4 className="accordion-header" id={progHeaderId}>
                                                                            <button
                                                                                type="button"
                                                                                className={`accordion-button ${isProgOpen ? "" : "collapsed"}`}
                                                                                aria-expanded={isProgOpen}
                                                                                aria-controls={progPanelId}
                                                                                onClick={() => ui.toggleProg(moduleCode, progId)}
                                                                            >
                                                                                {progTitle}
                                                                            </button>
                                                                        </h4>

                                                                        <div
                                                                            id={progPanelId}
                                                                            className="accordion-collapse"
                                                                            role="region"
                                                                            aria-labelledby={progHeaderId}
                                                                            aria-hidden={!isProgOpen}
                                                                            style={ui.getCollapseStyle(isProgOpen)}
                                                                        >
                                                                            <div className="accordion-body" style={ui.getCollapseBodyStyle(isProgOpen)}>
                                                                                <div className="row mx-0">
                                                                                    <div className="col form-group">
                                                                                        <label className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                                                                                            使用者權限
                                                                                        </label>

                                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                                            {(() =>
                                                                                            {
                                                                                                const supportedActions = ui.getSupportedActions(supportMask);
                                                                                                if (supportedActions.length === 0)
                                                                                                {
                                                                                                    return <div className="text-muted">（無可設定權限）</div>;
                                                                                                }
                                                                                                const allId = `${ui.rid}-${moduleCode}-${progId}-all`;
                                                                                                const isAllChecked = ui.isAllSupportedChecked(p);
                                                                                                return (
                                                                                                    <>
                                                                                                        <div
                                                                                                            className="col-sm-3 col-12 float-left p-0"
                                                                                                            key={allId}
                                                                                                        >
                                                                                                            <div className="custom-control custom-checkbox">
                                                                                                                <input
                                                                                                                    type="checkbox"
                                                                                                                    className="custom-check-input"
                                                                                                                    id={allId}
                                                                                                                    checked={isAllChecked}
                                                                                                                    onChange={(e) =>
                                                                                                                        ui.onToggleAllAction(
                                                                                                                            p,
                                                                                                                            e.target.checked,
                                                                                                                        )}
                                                                                                                />
                                                                                                                <label
                                                                                                                    className="custom-check-label"
                                                                                                                    htmlFor={allId}
                                                                                                                >
                                                                                                                    <span className="check-txt">全選</span>
                                                                                                                </label>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {supportedActions.map((act) =>
                                                                                                        {
                                                                                                            const id =
                                                                                                                `${ui.rid}-${moduleCode}-${progId}-${act.key}`;
                                                                                                            const checked =
                                                                                                                (grantMask & act.value) === act.value;

                                                                                                            return (
                                                                                                                <div
                                                                                                                    className="col-sm-3 col-12 float-left p-0"
                                                                                                                    key={id}
                                                                                                                >
                                                                                                                    <div className="custom-control custom-checkbox">
                                                                                                                        <input
                                                                                                                            type="checkbox"
                                                                                                                            className="custom-check-input"
                                                                                                                            id={id}
                                                                                                                            checked={checked}
                                                                                                                            onChange={(e) =>
                                                                                                                                ui.onToggleAction(
                                                                                                                                    p,
                                                                                                                                    act,
                                                                                                                                    e.target.checked,
                                                                                                                                )}
                                                                                                                        />
                                                                                                                        <label
                                                                                                                            className="custom-check-label"
                                                                                                                            htmlFor={id}
                                                                                                                        >
                                                                                                                            <span className="check-txt">
                                                                                                                                {act.label}
                                                                                                                            </span>
                                                                                                                        </label>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            );
                                                                                                        })}
                                                                                                    </>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
