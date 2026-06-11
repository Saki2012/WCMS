import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    rolePermissionEmptyData,
    type PermissionActionOption,
    type PermissionCatalogModuleDTO,
    type PermissionCatalogProgDTO,
    type RolePermissionCatalogAccordionProps,
    type RolePermissionFormRefs,
    useRolePermissionFormTemplate,
    useRolePermissionGrantBinding,
    useRolePermissionPermissionUI,
} from "./Server_RolePermission_Form_Hook";

// #region Property
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];

type RolePermissionBinding = ServerFormBinding<RolePermissionSet>;


type RolePermissionUI = ReturnType<typeof useRolePermissionPermissionUI>;


type SetRolePermissionField = ReturnType<typeof useSetTableField<RolePermissionSet>>;


interface RolePermissionFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}


interface RolePermissionContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: RolePermissionBinding;

    /** RolePermission Hook 整理後的參照資料 */
    refs: RolePermissionFormRefs;

    /** 是否新增模式 */
    isAddNew: boolean;
}


interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: RolePermissionBinding;

    /** 是否新增模式 */
    isAddNew: boolean;
}


interface RoleFieldGroupProps extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: SetRolePermissionField;
}


interface PermissionSectionProps extends RolePermissionCatalogAccordionProps { }


interface ModuleItemProps
{
    /** 權限 UI helper */
    ui: RolePermissionUI;

    /** 模組資料 */
    module: PermissionCatalogModuleDTO;

    /** 模組 index */
    moduleIndex: number;
}


interface ProgramItemProps extends ModuleItemProps
{
    /** 功能資料 */
    prog: PermissionCatalogProgDTO;

    /** 功能 index */
    progIndex: number;
}


interface PermissionCheckboxProps
{
    /** checkbox id */
    id: string;

    /** checkbox 顯示文字 */
    label: string;

    /** 是否勾選 */
    checked: boolean;

    /** 切換勾選事件 */
    onChange: (checked: boolean) => void;
}
// #endregion

// #region Public
/** 後台角色權限 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_RolePermission_Form_Comp = (props: RolePermissionFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(LibRoutePath.buildServerBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() => ({ onBackToList }), [onBackToList]);

    const template = useRolePermissionFormTemplate({
        theme: props.theme,
        lang: props.lang,
        internalId: internalId ?? "",
        emptyData: rolePermissionEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <RolePermissionContentComp
                    theme={props.theme}
                    binding={vm.binding}
                    refs={vm.refs}
                    isAddNew={vm.mode === "new"}
                />
            )}
        />
    );
};
// #endregion

// #region Section
/** 角色權限內容區，保留角色資料與權限設定兩段。 */
const RolePermissionContentComp = (props: RolePermissionContentProps) =>
{
    const grant = useRolePermissionGrantBinding(props.binding);

    return (
        <>
            <HeaderSectionComp theme={props.theme} binding={props.binding} isAddNew={props.isAddNew} />
            <PermissionSectionComp
                modules={props.refs.modules}
                grantMap={grant.grantMap}
                onGrantChange={grant.onGrantChange}
                actionNameMap={props.refs.actionNameMap}
            />
        </>
    );
};


/** 角色基本資料區。 */
const HeaderSectionComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<RolePermissionSet>(props.binding);

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="panel">
                    <div className="panel-body">
                        <div className="form">
                            <RoleFieldGroupComp {...props} setField={setField} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/** 權限設定區。 */
const PermissionSectionComp = (props: PermissionSectionProps) =>
{
    const ui = useRolePermissionPermissionUI(props);

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="panel">
                    <div className="panel-body">
                        <div className="form">
                            <PermissionToolbarComp ui={ui} />
                            <ModuleAccordionListComp ui={ui} modules={props.modules} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/** 角色代碼與角色名稱欄位。 */
const RoleFieldGroupComp = (props: RoleFieldGroupProps) =>
{
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...props.setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleId, "string")}
                    disabled={!props.isAddNew}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...props.setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName, "string")}
                />
            </div>
        </div>
    );
};


/** 權限設定工具列。 */
const PermissionToolbarComp = (props: { ui: RolePermissionUI; }) =>
{
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => props.ui.setAllExpanded(true)} aria-label="展開所有模組">
                    展開
                </button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => props.ui.setAllExpanded(false)} aria-label="收合所有模組">
                    收合
                </button>
            </div>
        </div>
    );
};


/** 模組 Accordion 清單。 */
const ModuleAccordionListComp = (props: { ui: RolePermissionUI; modules: PermissionCatalogModuleDTO[]; }) =>
{
    return (
        <div className="row mx-0">
            <div className="accordion">
                {(props.modules ?? []).map((module, index) => (
                    <ModuleAccordionItemComp key={`${module.ModuleCode}-${index}`} ui={props.ui} module={module} moduleIndex={index} />
                ))}
            </div>
        </div>
    );
};


/** 單一模組 Accordion。 */
const ModuleAccordionItemComp = (props: ModuleItemProps) =>
{
    const id = buildModuleIds(props.ui.rid, props.module, props.moduleIndex);
    const isOpen = props.ui.expanded[id.moduleCode] ?? false;

    return (
        <div className="accordion-item">
            <ModuleHeaderComp {...props} ids={id} isOpen={isOpen} />
            <div id={id.panelId} className="accordion-collapse" role="region" aria-labelledby={id.headerId} aria-hidden={!isOpen} style={props.ui.getCollapseStyle(isOpen)}>
                <div className="accordion-body" style={props.ui.getCollapseBodyStyle(isOpen)}>
                    <ModulePermissionAllComp {...props} ids={id} />
                    <ProgramAccordionListComp {...props} />
                </div>
            </div>
        </div>
    );
};


/** 模組標題列。 */
const ModuleHeaderComp = (props: ModuleItemProps & { ids: ReturnType<typeof buildModuleIds>; isOpen: boolean; }) =>
{
    return (
        <h4 className="accordion-header" id={props.ids.headerId}>
            <button
                type="button"
                className={`accordion-button ${props.isOpen ? "" : "collapsed"}`}
                aria-expanded={props.isOpen}
                aria-controls={props.ids.panelId}
                onClick={() => props.ui.toggleModule(props.ids.moduleCode)}
            >
                {props.ids.moduleTitle}
            </button>
        </h4>
    );
};


/** 單一模組全選 checkbox。 */
const ModulePermissionAllComp = (props: ModuleItemProps & { ids: ReturnType<typeof buildModuleIds>; }) =>
{
    return (
        <div className="row mx-0 mb-2">
            <div className="col-sm-12 px-0">
                <PermissionCheckboxComp
                    id={props.ids.moduleAllId}
                    label="全選本模組權限"
                    checked={props.ui.isModuleAllChecked(props.module)}
                    onChange={checked => props.ui.onToggleModuleAll(props.module, checked)}
                />
            </div>
        </div>
    );
};


/** 功能 Accordion 清單。 */
const ProgramAccordionListComp = (props: ModuleItemProps) =>
{
    return (
        <>
            {(props.module.Progs ?? []).map((prog, index) => (
                <ProgramAccordionItemComp key={`${prog.ProgId}-${index}`} {...props} prog={prog} progIndex={index} />
            ))}
        </>
    );
};


/** 單一功能 Accordion。 */
const ProgramAccordionItemComp = (props: ProgramItemProps) =>
{
    const ids = buildProgramIds(props.ui.rid, props.module, props.moduleIndex, props.prog, props.progIndex);
    const isOpen = props.ui.expandedProg[ids.progKey] ?? false;

    return (
        <div className="accordion mb-2">
            <div className="accordion-item">
                <ProgramHeaderComp {...props} ids={ids} isOpen={isOpen} />
                <div id={ids.panelId} className="accordion-collapse" role="region" aria-labelledby={ids.headerId} aria-hidden={!isOpen} style={props.ui.getCollapseStyle(isOpen)}>
                    <div className="accordion-body" style={props.ui.getCollapseBodyStyle(isOpen)}>
                        <ProgramPermissionBodyComp {...props} ids={ids} />
                    </div>
                </div>
            </div>
        </div>
    );
};


/** 功能標題列。 */
const ProgramHeaderComp = (props: ProgramItemProps & { ids: ReturnType<typeof buildProgramIds>; isOpen: boolean; }) =>
{
    return (
        <h4 className="accordion-header" id={props.ids.headerId}>
            <button
                type="button"
                className={`accordion-button ${props.isOpen ? "" : "collapsed"}`}
                aria-expanded={props.isOpen}
                aria-controls={props.ids.panelId}
                onClick={() => props.ui.toggleProg(props.ids.moduleCode, props.ids.progId)}
            >
                {props.ids.progTitle}
            </button>
        </h4>
    );
};


/** 功能權限設定內容。 */
const ProgramPermissionBodyComp = (props: ProgramItemProps & { ids: ReturnType<typeof buildProgramIds>; }) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <label className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">使用者權限</label>
                <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                    <ProgramPermissionOptionsComp {...props} />
                </div>
            </div>
        </div>
    );
};


/** 功能權限選項。 */
const ProgramPermissionOptionsComp = (props: ProgramItemProps & { ids: ReturnType<typeof buildProgramIds>; }) =>
{
    const supportedActions = props.ui.getSupportedActions(props.prog.SupportMask ?? 0);
    if (supportedActions.length === 0) return <div className="text-muted">（無可設定權限）</div>;

    return (
        <>
            <ProgramAllPermissionCheckboxComp {...props} />
            {supportedActions.map(action => <ProgramActionCheckboxComp key={`${props.ids.progId}-${action.key}`} {...props} action={action} />)}
        </>
    );
};


/** 功能全選 checkbox。 */
const ProgramAllPermissionCheckboxComp = (props: ProgramItemProps & { ids: ReturnType<typeof buildProgramIds>; }) =>
{
    return (
        <div className="col-sm-3 col-12 float-left p-0">
            <PermissionCheckboxComp
                id={`${props.ui.rid}-${props.ids.moduleCode}-${props.ids.progId}-all`}
                label="全選"
                checked={props.ui.isAllSupportedChecked(props.prog)}
                onChange={checked => props.ui.onToggleAllAction(props.prog, checked)}
            />
        </div>
    );
};


/** 單一動作 checkbox。 */
const ProgramActionCheckboxComp = (props: ProgramItemProps & { ids: ReturnType<typeof buildProgramIds>; action: PermissionActionOption; }) =>
{
    const grantMask = props.ui.getGrantMask(props.ids.progId);
    const checked = (grantMask & props.action.value) === props.action.value;

    return (
        <div className="col-sm-3 col-12 float-left p-0">
            <PermissionCheckboxComp
                id={`${props.ui.rid}-${props.ids.moduleCode}-${props.ids.progId}-${props.action.key}`}
                label={props.action.label}
                checked={checked}
                onChange={next => props.ui.onToggleAction(props.prog, props.action, next)}
            />
        </div>
    );
};


/** 權限 checkbox 共用元件。 */
const PermissionCheckboxComp = (props: PermissionCheckboxProps) =>
{
    return (
        <div className="custom-control custom-checkbox">
            <input
                type="checkbox"
                className="custom-check-input"
                id={props.id}
                checked={props.checked}
                onChange={e => props.onChange(e.target.checked)}
            />
            <label className="custom-check-label" htmlFor={props.id}>
                <span className="check-txt">{props.label}</span>
            </label>
        </div>
    );
};
// #endregion

// #region Protected
/** 建立返回角色權限列表路徑。 */
/** 建立模組 Accordion 使用的 id 與顯示文字。 */
const buildModuleIds = (rid: string, module: PermissionCatalogModuleDTO, moduleIndex: number) =>
{
    const moduleCode = String(module.ModuleCode ?? "").trim();
    const moduleTitle = String(module.ModuleTitle ?? moduleCode).trim();

    return {
        moduleCode,
        moduleTitle,
        headerId: `${rid}-mod-h-${moduleIndex}-${moduleCode}`,
        panelId: `${rid}-mod-p-${moduleIndex}-${moduleCode}`,
        moduleAllId: `${rid}-mod-all-${moduleIndex}-${moduleCode}`,
    };
};


/** 建立功能 Accordion 使用的 id 與顯示文字。 */
const buildProgramIds = (rid: string, module: PermissionCatalogModuleDTO, moduleIndex: number, prog: PermissionCatalogProgDTO, progIndex: number) =>
{
    const moduleCode = String(module.ModuleCode ?? "").trim();
    const progId = String(prog.ProgId ?? "").trim();
    const progTitle = String(prog.ProgTitle ?? progId).trim();

    return {
        moduleCode,
        progId,
        progTitle,
        progKey: `${moduleCode}::${progId}`,
        headerId: `${rid}-prog-h-${moduleIndex}-${progIndex}-${moduleCode}-${progId}`,
        panelId: `${rid}-prog-p-${moduleIndex}-${progIndex}-${moduleCode}-${progId}`,
    };
};
// #endregion
