import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";

// #region Property
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];

type RolePermissionRow = { PermissionKey?: string | null; GrantMask?: number | string | null; RoleId?: string | null; };


type PermissionCatalogModule = components["schemas"]["PermissionCatalogModuleDTO"];

type PermissionCatalogProg = components["schemas"]["PermissionCatalogProgDTO"];


export interface PermissionCatalogProgDTO
{
    /** 功能代碼 */
    ProgId: string;

    /** 功能顯示名稱 */
    ProgTitle: string;

    /** 可設定權限遮罩 */
    SupportMask: number;
}


export interface PermissionCatalogModuleDTO
{
    /** 模組代碼 */
    ModuleCode: string;

    /** 模組顯示名稱 */
    ModuleTitle: string;

    /** 模組底下功能清單 */
    Progs: PermissionCatalogProgDTO[];
}


export interface RolePermissionFormRefs
{
    /** 權限模組目錄 */
    modules: PermissionCatalogModuleDTO[];

    /** 權限動作名稱對照 */
    actionNameMap: Record<string, string>;
}


export interface UseRolePermissionFormTemplateOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: RolePermissionSet;

    /** Form Template 標準動作設定 */
    actionsOpt: RolePermissionFormActionsOpt;
}


export type RolePermissionFormActionsOpt = {
    /** 儲存成功後返回角色權限列表 */
    onBackToList: () => void;
};


export type RolePermissionFormAdapter = ReturnType<typeof RolePermissionAdapter>;

export type RolePermissionFormRawData = ServerFormDefaultRawData<RolePermissionSet, RolePermissionFormRefs>;


export interface UseRolePermissionGrantBindingResult
{
    /** 權限勾選狀態 map */
    grantMap: Record<string, number>;

    /** 更新單一功能權限遮罩 */
    onGrantChange: (progId: string, nextGrantMask: number) => void;
}


export interface RolePermissionCatalogAccordionProps
{
    /** 權限模組目錄 */
    modules: PermissionCatalogModuleDTO[];

    /** 權限勾選狀態 map */
    grantMap: Record<string, number>;

    /** 更新單一功能權限遮罩 */
    onGrantChange: (progId: string, nextGrantMask: number) => void;

    /** 權限動作名稱對照 */
    actionNameMap?: Record<string, string>;
}


export type FuncAction = (typeof FuncAction)[keyof typeof FuncAction];


export interface PermissionActionOption
{
    /** 動作 key */
    key: string;

    /** 動作顯示名稱 */
    label: string;

    /** 動作遮罩值 */
    value: FuncAction;

    /** 是否顯示 */
    visible: boolean;
}


export interface UseRolePermissionPermissionUIResult
{
    rid: string;
    expanded: Record<string, boolean>;
    expandedProg: Record<string, boolean>;
    setAllExpanded: (next: boolean) => void;
    toggleModule: (moduleCode: string) => void;
    toggleProg: (moduleCode: string, progId: string) => void;
    getProgKey: (moduleCode: string, progId: string) => string;
    getCollapseStyle: (isOpen: boolean) => CSSProperties;
    getCollapseBodyStyle: (isOpen: boolean) => CSSProperties;
    getSupportedActions: (supportMask: number) => PermissionActionOption[];
    getGrantMask: (progId: string) => number;
    isAllSupportedChecked: (prog: PermissionCatalogProgDTO) => boolean;
    isModuleAllChecked: (module: PermissionCatalogModuleDTO) => boolean;
    onToggleAction: (prog: PermissionCatalogProgDTO, act: PermissionActionOption, checked: boolean) => void;
    onToggleAllAction: (prog: PermissionCatalogProgDTO, checked: boolean) => void;
    onToggleModuleAll: (module: PermissionCatalogModuleDTO, checked: boolean) => void;
}


const rolePermissionEmptyRoleData = {} as NonNullable<RolePermissionSet["RoleData"]>;


const actionBase: { key: string; value: FuncAction; fallbackLabel: string; }[] = [
    { key: "use", value: FuncAction.Use, fallbackLabel: "使用" },
    { key: "query", value: FuncAction.Query, fallbackLabel: "查詢" },
    { key: "view", value: FuncAction.View, fallbackLabel: "查詢" },
    { key: "create", value: FuncAction.Create, fallbackLabel: "新增" },
    { key: "update", value: FuncAction.Update, fallbackLabel: "修改" },
    { key: "delete", value: FuncAction.Delete, fallbackLabel: "刪除" },
    { key: "invalid", value: FuncAction.Invalid, fallbackLabel: "停用" },
];
// #endregion

// #region Public
export const FuncAction = {
    None: 0,
    Use: 1 << 0,
    Query: 1 << 1,
    View: 1 << 2,
    Create: 1 << 3,
    Update: 1 << 4,
    Delete: 1 << 5,
    Invalid: 1 << 6,
    All: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6),
} as const;

export const rolePermissionEmptyData: RolePermissionSet = { RoleData: rolePermissionEmptyRoleData, RolePermission: [] };


/** 建立 RolePermission Form Template，交給 Server_FormTemplate 統一處理查詢、CUD 與 toast。 */
export const useRolePermissionFormTemplate = (
    opt: UseRolePermissionFormTemplateOptions,
): ServerFormTemplate<RolePermissionSet, RolePermissionFormAdapter, RolePermissionFormRefs, RolePermissionFormRawData, RolePermissionFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "RolePermission",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildRolePermissionFormAdapter,
                buildTitle: buildRolePermissionFormTitle,
                buildInitialData: buildRolePermissionInitialData,
                useReferenceData: ctx => useRolePermissionReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};


/** 建立 RolePermission 權限資料 binding，將 checkbox map 同步回 Form DTO。 */
export const useRolePermissionGrantBinding = (binding: ServerFormBinding<RolePermissionSet>): UseRolePermissionGrantBindingResult =>
{
    const [grantMap, setGrantMap] = useState<Record<string, number>>({});

    useEffect(() =>
    {
        setGrantMap(buildGrantMapFromForm(binding.data));
    }, [binding.data]);

    const onGrantChange = useCallback((progId: string, nextGrantMask: number) =>
    {
        const key = progId.trim();
        setGrantMap(prev => buildNextGrantMap(prev, key, nextGrantMask));
        binding.setFormData(prev => applyGrantToForm(prev, key, nextGrantMask));
    }, [binding]);

    return { grantMap, onGrantChange };
};


/** RolePermission 權限 UI 行為 hook，處理 accordion、checkbox 與全選。 */
export const useRolePermissionPermissionUI = (props: RolePermissionCatalogAccordionProps): UseRolePermissionPermissionUIResult =>
{
    const modules = props.modules ?? [];
    const grantMap = props.grantMap ?? {};
    const onGrantChange = props.onGrantChange ?? (() => { /* noop */ });
    const actionNameMap = props.actionNameMap ?? {};
    const rid = useId();

    const allModuleCodes = useMemo(() => buildModuleCodes(modules), [modules]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [expandedProg, setExpandedProg] = useState<Record<string, boolean>>({});

    const collapse = useRolePermissionCollapse();
    const actions = useRolePermissionActionOptions(actionNameMap);
    const grant = useRolePermissionGrantActions({ grantMap, onGrantChange, actionOptions: actions.actionOptions });
    const module = useRolePermissionModuleActions({ allModuleCodes, setExpanded, setExpandedProg });
    const prog = useRolePermissionProgActions({ setExpandedProg });

    return {
        rid,
        expanded,
        expandedProg,
        setAllExpanded: module.setAllExpanded,
        toggleModule: module.toggleModule,
        toggleProg: prog.toggleProg,
        getProgKey: getRolePermissionProgKey,
        getCollapseStyle: collapse.getCollapseStyle,
        getCollapseBodyStyle: collapse.getCollapseBodyStyle,
        getSupportedActions: grant.getSupportedActions,
        getGrantMask: grant.getGrantMask,
        isAllSupportedChecked: grant.isAllSupportedChecked,
        isModuleAllChecked: grant.isModuleAllChecked,
        onToggleAction: grant.onToggleAction,
        onToggleAllAction: grant.onToggleAllAction,
        onToggleModuleAll: grant.onToggleModuleAll,
    };
};
// #endregion

// #region Private
/** 建立 RolePermission Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildRolePermissionFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getRolePermissionModelTitle(ctx.displayName, "角色權限");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};


/** 建立新增模式 initial data，避免保留舊 top-level initial 入口。 */
const buildRolePermissionInitialData = (ctx: { mode: "new" | "edit"; emptyData: RolePermissionSet; }): ApiFormInitial<RolePermissionSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};


/** 建立 RolePermission Form 主資料 Adapter。 */
const buildRolePermissionFormAdapter = (): RolePermissionFormAdapter =>
{
    return RolePermissionAdapter();
};


/** 取得 RolePermission 需要的權限目錄與動作 enum。 */
const useRolePermissionReferenceData = (ctx: { adapter: RolePermissionFormAdapter; lang: Lang; }) =>
{
    const catalog = ctx.adapter.hooks.usePermissionCatalog({ lang: ctx.lang, deps: [ctx.lang] });
    const funcAction = useFetchEnumOptions("FuncAction");

    return useMemo(() =>
    {
        return {
            refs: {
                modules: normalizePermissionModules(catalog.data),
                actionNameMap: funcAction.data ?? {},
            },
            isLoading: Boolean(catalog.isLoading || funcAction.isLoading),
            errors: [catalog.errorText, funcAction.error],
            refetchRefData: async () =>
            {
                await catalog.refetch();
                await funcAction.refetch();
            },
        };
    }, [catalog.data, catalog.errorText, catalog.isLoading, catalog.refetch, funcAction.data, funcAction.error, funcAction.isLoading, funcAction.refetch]);
};


/** 取得 RolePermission Model 顯示名稱，避免標題寫死。 */
const getRolePermissionModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};


/** 將權限目錄轉成畫面需要的乾淨 DTO。 */
const normalizePermissionModules = (modules: PermissionCatalogModule[] | undefined): PermissionCatalogModuleDTO[] =>
{
    return (modules ?? []).map(module => ({
        ModuleCode: String(module.ModuleCode ?? ""),
        ModuleTitle: String(module.ModuleTitle ?? module.ModuleCode ?? ""),
        Progs: normalizePermissionProgs(module.Progs),
    }));
};


/** 將模組底下功能清單轉成畫面需要的乾淨 DTO。 */
const normalizePermissionProgs = (progs: PermissionCatalogProg[] | undefined): PermissionCatalogProgDTO[] =>
{
    return (progs ?? []).map(prog => ({
        ProgId: String(prog.ProgId ?? ""),
        ProgTitle: String(prog.ProgTitle ?? prog.ProgId ?? ""),
        SupportMask: Number(prog.SupportMask ?? 0),
    }));
};


/** GrantMask 轉 number。 */
const toMaskNumber = (value: number | string | null | undefined): number =>
{
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};


/** 從表單資料建立 grantMap。 */
const buildGrantMapFromForm = (set?: RolePermissionSet | null): Record<string, number> =>
{
    const list = (set?.RolePermission ?? []) as RolePermissionRow[];
    const map: Record<string, number> = {};

    for (const row of list)
    {
        const key = String(row?.PermissionKey ?? "").trim();
        if (!key) continue;
        map[key] = toMaskNumber(row?.GrantMask);
    }

    return map;
};


/** 建立下一版 grantMap，供 checkbox 即時顯示。 */
const buildNextGrantMap = (prev: Record<string, number>, key: string, nextGrantMask: number): Record<string, number> =>
{
    const next = { ...prev };
    if (!nextGrantMask) delete next[key];
    else next[key] = nextGrantMask;
    return next;
};


/** 寫回單一 progId 對應的 GrantMask。 */
const applyGrantToForm = (prev: RolePermissionSet, progId: string, nextGrantMask: number): RolePermissionSet =>
{
    const next: RolePermissionSet = { ...(prev ?? {}) };
    const roleId = next?.RoleData?.RoleId ?? null;
    const list = Array.isArray(next?.RolePermission) ? ([...next.RolePermission] as RolePermissionRow[]) : [];
    const index = list.findIndex(item => String(item?.PermissionKey ?? "").trim() === progId);

    return nextGrantMask
        ? upsertGrantRow(next, list, index, roleId, progId, nextGrantMask)
        : removeGrantRow(next, list, index);
};


/** 新增或更新權限列。 */
const upsertGrantRow = (
    next: RolePermissionSet,
    list: RolePermissionRow[],
    index: number,
    roleId: string | null,
    progId: string,
    grantMask: number,
): RolePermissionSet =>
{
    const row: RolePermissionRow = index >= 0 ? { ...list[index] } : {};
    row.PermissionKey = progId;
    row.GrantMask = grantMask;
    if (!row.RoleId && roleId) row.RoleId = roleId;

    if (index >= 0) list[index] = row;
    else list.push(row);

    next.RolePermission = list as RolePermissionSet["RolePermission"];
    return next;
};


/** 移除權限列。 */
const removeGrantRow = (next: RolePermissionSet, list: RolePermissionRow[], index: number): RolePermissionSet =>
{
    if (index >= 0) list.splice(index, 1);
    next.RolePermission = list as RolePermissionSet["RolePermission"];
    return next;
};


/** 建立所有模組代碼。 */
const buildModuleCodes = (modules: PermissionCatalogModuleDTO[]): string[] =>
{
    return modules.map(module => module.ModuleCode).filter(Boolean);
};


/** 建立 RolePermission collapse 樣式 helper。 */
const useRolePermissionCollapse = () =>
{
    const getCollapseStyle = useCallback((isOpen: boolean): CSSProperties =>
    {
        return { display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease", overflow: "hidden" };
    }, []);

    const getCollapseBodyStyle = useCallback((isOpen: boolean): CSSProperties =>
    {
        return { overflow: "hidden", minHeight: 0, padding: isOpen ? undefined : 0 };
    }, []);

    return { getCollapseStyle, getCollapseBodyStyle };
};


/** 建立權限動作選項。 */
const useRolePermissionActionOptions = (actionNameMap: Record<string, string>) =>
{
    const actionOptions = useMemo<PermissionActionOption[]>(() =>
    {
        return actionBase.map(action => ({
            key: action.key,
            value: action.value,
            label: actionNameMap[String(action.value)] ?? action.fallbackLabel,
            visible: true,
        }));
    }, [actionNameMap]);

    return { actionOptions };
};


/** 建立模組展開 / 收合行為。 */
const useRolePermissionModuleActions = (opt: {
    allModuleCodes: string[];
    setExpanded: Dispatch<SetStateAction<Record<string, boolean>>>;
    setExpandedProg: Dispatch<SetStateAction<Record<string, boolean>>>;
}) =>
{
    const setAllExpanded = useCallback((next: boolean) =>
    {
        opt.setExpanded(buildExpandedMap(opt.allModuleCodes, next));
        if (!next) opt.setExpandedProg({});
    }, [opt]);

    const toggleModule = useCallback((moduleCode: string) =>
    {
        opt.setExpanded(prev => ({ ...prev, [moduleCode]: !prev[moduleCode] }));
    }, [opt]);

    return { setAllExpanded, toggleModule };
};


/** 建立功能展開 / 收合行為。 */
const useRolePermissionProgActions = (opt: { setExpandedProg: Dispatch<SetStateAction<Record<string, boolean>>>; }) =>
{
    const toggleProg = useCallback((moduleCode: string, progId: string) =>
    {
        const key = getRolePermissionProgKey(moduleCode, progId);
        opt.setExpandedProg(prev => ({ ...prev, [key]: !prev[key] }));
    }, [opt]);

    return { toggleProg };
};


/** 建立全部展開狀態 map。 */
const buildExpandedMap = (codes: string[], isOpen: boolean): Record<string, boolean> =>
{
    const state: Record<string, boolean> = {};
    codes.forEach(code => { state[code] = isOpen; });
    return state;
};


/** 建立功能展開 key。 */
const getRolePermissionProgKey = (moduleCode: string, progId: string): string =>
{
    return `${moduleCode}::${progId}`;
};


/** 建立權限勾選行為。 */
const useRolePermissionGrantActions = (opt: {
    grantMap: Record<string, number>;
    onGrantChange: (progId: string, nextGrantMask: number) => void;
    actionOptions: PermissionActionOption[];
}) =>
{
    const hasFlag = useCallback((mask: number, flag: FuncAction) => (mask & flag) === flag, []);
    const getSupportedActions = useCallback((mask: number) => opt.actionOptions.filter(action => action.visible && hasFlag(mask, action.value)), [hasFlag, opt.actionOptions]);
    const getGrantMask = useCallback((progId: string) => opt.grantMap[progId] ?? 0, [opt.grantMap]);
    const getSupportedActionMask = useCallback((mask: number) => buildSupportedActionMask(getSupportedActions(mask)), [getSupportedActions]);

    const isAllSupportedChecked = useCallback((prog: PermissionCatalogProgDTO) =>
    {
        const supportedActionMask = getSupportedActionMask(prog.SupportMask ?? 0);
        if (!supportedActionMask) return false;
        return (getGrantMask(prog.ProgId) & supportedActionMask) === supportedActionMask;
    }, [getGrantMask, getSupportedActionMask]);

    return useRolePermissionGrantActionResult({ ...opt, getGrantMask, getSupportedActions, getSupportedActionMask, isAllSupportedChecked, hasFlag });
};


/** 建立權限勾選回傳物件。 */
const useRolePermissionGrantActionResult = (opt: {
    onGrantChange: (progId: string, nextGrantMask: number) => void;
    getGrantMask: (progId: string) => number;
    getSupportedActions: (supportMask: number) => PermissionActionOption[];
    getSupportedActionMask: (supportMask: number) => number;
    isAllSupportedChecked: (prog: PermissionCatalogProgDTO) => boolean;
    hasFlag: (mask: number, flag: FuncAction) => boolean;
}) =>
{
    const onToggleAction = useCallback((prog: PermissionCatalogProgDTO, act: PermissionActionOption, checked: boolean) =>
    {
        if (!opt.hasFlag(prog.SupportMask ?? 0, act.value)) return;
        const current = opt.getGrantMask(prog.ProgId);
        opt.onGrantChange(prog.ProgId, checked ? (current | act.value) : (current & ~act.value));
    }, [opt]);

    const onToggleAllAction = useCallback((prog: PermissionCatalogProgDTO, checked: boolean) =>
    {
        const next = buildToggleAllGrantMask(opt.getGrantMask(prog.ProgId), opt.getSupportedActionMask(prog.SupportMask ?? 0), checked);
        opt.onGrantChange(prog.ProgId, next);
    }, [opt]);

    const onToggleModuleAll = useCallback((module: PermissionCatalogModuleDTO, checked: boolean) =>
    {
        module.Progs.forEach(prog => onToggleAllAction(prog, checked));
    }, [onToggleAllAction]);

    const isModuleAllChecked = useCallback((module: PermissionCatalogModuleDTO) =>
    {
        const validProgs = module.Progs.filter(prog => opt.getSupportedActionMask(prog.SupportMask ?? 0) > 0);
        return validProgs.length > 0 && validProgs.every(prog => opt.isAllSupportedChecked(prog));
    }, [opt]);

    return { getSupportedActions: opt.getSupportedActions, getGrantMask: opt.getGrantMask, isAllSupportedChecked: opt.isAllSupportedChecked, isModuleAllChecked, onToggleAction, onToggleAllAction, onToggleModuleAll };
};


/** 建立支援動作遮罩。 */
const buildSupportedActionMask = (actions: PermissionActionOption[]): number =>
{
    return actions.reduce((acc, action) => acc | action.value, 0);
};


/** 建立全選 / 取消全選後的 GrantMask。 */
const buildToggleAllGrantMask = (current: number, supportedMask: number, checked: boolean): number =>
{
    if (!supportedMask) return current;
    return checked ? (current | supportedMask) : (current & ~supportedMask);
};
// #endregion
