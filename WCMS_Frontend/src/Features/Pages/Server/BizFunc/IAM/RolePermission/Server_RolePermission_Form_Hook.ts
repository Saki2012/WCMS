import { type CSSProperties, useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];

const emptyData: RolePermissionSet = {} as RolePermissionSet;

/** 權限項目 DTO */
export interface PermissionCatalogProgDTO
{
    ProgId: string;
    ProgTitle: string;
    SupportMask: number;
}

/** 模組 DTO */
export interface PermissionCatalogModuleDTO
{
    ModuleCode: string;
    ModuleTitle: string;
    Progs: PermissionCatalogProgDTO[];
}

/** 單列權限資料（避免 any） */
type RolePermissionRow = {
    PermissionKey?: string | null;
    GrantMask?: number | string | null;
    RoleId?: string | null;
};

/** Form Hook 回傳 */
export interface UseServerRolePermissionFormResult
{
    prop: FormCompProp;
    formData: UseFetchFormDataResult<RolePermissionSet>;
    isAddNew: boolean;
    modules: PermissionCatalogModuleDTO[];
    grantMap: Record<string, number>;
    actionNameMap: Record<string, string>;
    onGrantChange: (progId: string, nextGrantMask: number) => void;
}

/** GrantMask 轉 number */
const toMaskNumber = (value: number | string | null | undefined): number =>
{
    // 宣告變數
    const parsed = typeof value === "number" ? value : Number(value);

    // return
    return Number.isFinite(parsed) ? parsed : 0;
};

/** 從表單資料建立 grantMap */
const buildGrantMapFromForm = (set?: RolePermissionSet | null): Record<string, number> =>
{
    // 宣告變數
    const list = (set?.RolePermission ?? []) as RolePermissionRow[];
    const map: Record<string, number> = {};

    // 執行 function
    for (const row of list)
    {
        const key = String(row?.PermissionKey ?? "").trim();
        if (!key) continue;

        map[key] = toMaskNumber(row?.GrantMask);
    }

    // return
    return map;
};

/** 寫回單一 progId 對應的 GrantMask */
const applyGrantToForm = (
    prev: RolePermissionSet,
    progId: string,
    nextGrantMask: number,
): RolePermissionSet =>
{
    // 宣告變數
    const next: RolePermissionSet = { ...(prev as RolePermissionSet) };
    const roleId = next?.RoleData?.RoleId ?? null;
    const list = Array.isArray(next?.RolePermission)
        ? ([...next.RolePermission] as RolePermissionRow[])
        : [];

    const index = list.findIndex((item) => String(item?.PermissionKey ?? "").trim() === progId);

    // 執行 function：0 代表移除該權限列
    if (!nextGrantMask)
    {
        if (index >= 0) list.splice(index, 1);
        next.RolePermission = list as RolePermissionSet["RolePermission"];
        return next;
    }

    const row: RolePermissionRow = index >= 0 ? { ...list[index] } : {};
    row.PermissionKey = progId;
    row.GrantMask = nextGrantMask;

    if (!row.RoleId && roleId)
    {
        row.RoleId = roleId;
    }

    if (index >= 0)
    {
        list[index] = row;
    } else
    {
        list.push(row);
    }

    next.RolePermission = list as RolePermissionSet["RolePermission"];

    // return
    return next;
};

/** 取得表單資料 */
const useRolePermissionFormDataByAdapter = (
    adapter: ReturnType<typeof RolePermissionAdapter>,
    internalId: string,
    empty: RolePermissionSet,
): UseFetchFormDataResult<RolePermissionSet> =>
{
    // 宣告變數
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, RolePermissionSet> | null>(() =>
    {
        if (!isNew) return null;

        const ok: ApiResponse<RolePermissionSet> = {
            IsSuccess: true,
            Data: empty,
            SysMessage: [],
        };

        return {
            args: internalKey,
            apiRes: ok,
        };
    }, [isNew, empty, internalKey]);

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：顯示錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({
        deps: [],
        onError,
    });

    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<RolePermissionSet>(empty);

    useEffect(() =>
    {
        // 執行 function：同步 query data 到可編輯 state
        if (query.data)
        {
            setData(query.data);
            return;
        }

        if (isNew)
        {
            setData(empty);
        }
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() =>
    {
        // 執行 function
        void query.refetch();
    }, [query]);

    const isLoading = Boolean(!isNew && query.isLoading) || Boolean(model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;

    // return
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? {
            ModelId: "",
            ModelDisplayName: "",
            Tables: [],
        }) as ModelDisplaySchema,
    };
};

/** 建立表單 actions */
const useRolePermissionFormActionsFromAdapter = (
    adapter: ReturnType<typeof RolePermissionAdapter>,
    internalId: string,
    formData: RolePermissionSet,
    onBackToList: () => void,
): ServerFormActions =>
{
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);

    const actions = adapter.useServerActions({
        onSuccessByMode: {
            create: () => onBackToList(),
            update: () => onBackToList(),
            delete: () => onBackToList(),
        },
    });

    // return
    return {
        Save: async () =>
        {
            if (isNew)
            {
                await actions.createAsync(formData);
                return;
            }

            await actions.updateAsync(internalId, formData);
        },
        Delete: async () =>
        {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: onBackToList,
        Preview: undefined,
        IsSaving: actions.isSaving,
    };
};

/** RolePermission Form 主 Hook */
export const useServerRolePermissionForm = (props: {
    theme: IBETheme;
    lang: Lang;
}): UseServerRolePermissionFormResult =>
{
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const adapter = useMemo(() => RolePermissionAdapter(), []);
    const { publish } = useToast();

    const isAddNew = !internalId;

    const onCatalogError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：顯示 catalog 錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const catalog = adapter.hooks.usePermissionCatalog({
        lang: props.lang,
        deps: [props.lang],
        onError: onCatalogError,
    });

    const formData = useRolePermissionFormDataByAdapter(adapter, internalId ?? "", emptyData);

    const onBackToList = useCallback(() =>
    {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = useRolePermissionFormActionsFromAdapter(
        adapter,
        internalId ?? "",
        formData.data,
        onBackToList,
    );

    const funcAction = useFetchEnumOptions("FuncAction");

    const prop = useMemo<FormCompProp>(() =>
    {
        // return
        return {
            Title: "角色權限修改",
            Theme: props.theme,
            IsLoading: [formData.isLoading, catalog.isLoading, funcAction.isLoading].some(Boolean),
            ErrorList: [formData.error, catalog.errorText ?? undefined, funcAction.error],
            Actions: actions,
        };
    }, [
        props.theme,
        formData.isLoading,
        formData.error,
        catalog.isLoading,
        catalog.errorText,
        funcAction.isLoading,
        funcAction.error,
        actions,
    ]);

    const [grantMap, setGrantMap] = useState<Record<string, number>>({});

    useEffect(() =>
    {
        // 執行 function：表單資料載入後初始化 grantMap
        setGrantMap(buildGrantMapFromForm(formData.data));
    }, [formData.data]);

    const onGrantChange = useCallback((progId: string, nextGrantMask: number) =>
    {
        // 宣告變數
        const key = progId.trim();

        // 執行 function：同步更新 grantMap 與 formData
        setGrantMap((prev) =>
        {
            const next = { ...prev };

            if (!nextGrantMask) delete next[key];
            else next[key] = nextGrantMask;

            return next;
        });

        formData.setFormData((prev) => applyGrantToForm(prev, key, nextGrantMask));
    }, [formData]);

    const modules = useMemo<PermissionCatalogModuleDTO[]>(() =>
    {
        // return
        return (catalog.data ?? []) as PermissionCatalogModuleDTO[];
    }, [catalog.data]);

    const actionNameMap = useMemo<Record<string, string>>(() =>
    {
        // return
        return funcAction.data ?? {};
    }, [funcAction.data]);

    // return
    return {
        prop,
        formData,
        isAddNew,
        modules,
        grantMap,
        actionNameMap,
        onGrantChange,
    };
};

// UI相關:

export interface IRolePermissionCatalogAccordionProps
{
    modules: PermissionCatalogModuleDTO[];
    grantMap: Record<string, number>;
    onGrantChange: (progId: string, nextGrantMask: number) => void;
    actionNameMap?: Record<string, string>;
}

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

export type FuncAction = (typeof FuncAction)[keyof typeof FuncAction];

type IActionOption = {
    key: string;
    label: string;
    value: FuncAction;
    visible: boolean;
};

type IActionBase = {
    key: string;
    value: FuncAction;
    fallbackLabel: string;
};

const ACTION_BASE: IActionBase[] = [
    { key: "use", value: FuncAction.Use, fallbackLabel: "使用" },
    { key: "query", value: FuncAction.Query, fallbackLabel: "查詢" },
    { key: "view", value: FuncAction.View, fallbackLabel: "查詢" },
    { key: "create", value: FuncAction.Create, fallbackLabel: "新增" },
    { key: "update", value: FuncAction.Update, fallbackLabel: "修改" },
    { key: "delete", value: FuncAction.Delete, fallbackLabel: "刪除" },
    { key: "invalid", value: FuncAction.Invalid, fallbackLabel: "停用" },
];

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
    getSupportedActions: (supportMask: number) => IActionOption[];
    getGrantMask: (progId: string) => number;
    isAllSupportedChecked: (prog: PermissionCatalogProgDTO) => boolean;
    isModuleAllChecked: (module: PermissionCatalogModuleDTO) => boolean;
    onToggleAction: (prog: PermissionCatalogProgDTO, act: IActionOption, checked: boolean) => void;
    onToggleAllAction: (prog: PermissionCatalogProgDTO, checked: boolean) => void;
    onToggleModuleAll: (module: PermissionCatalogModuleDTO, checked: boolean) => void;
}

/** RolePermission Form：UI 行為 hook（accordion / checkbox / 全選） */
export const useRolePermissionPermissionUI = (
    props: IRolePermissionCatalogAccordionProps,
): UseRolePermissionPermissionUIResult =>
{
    // 宣告變數（防呆）
    const modules = props.modules ?? [];
    const grantMap = props.grantMap ?? {};
    const onGrantChange = props.onGrantChange ?? (() =>
    {/* noop */});
    const actionNameMap = props.actionNameMap ?? {};

    const rid = useId();

    const allModuleCodes = useMemo(() =>
    {
        // return
        return modules.map((m) => m.ModuleCode).filter(Boolean);
    }, [modules]);

    const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    {
        // 宣告變數
        const init: Record<string, boolean> = {};

        // 執行 function
        allModuleCodes.forEach((c) =>
        {
            init[c] = false;
        });

        // return
        return init;
    });

    const [expandedProg, setExpandedProg] = useState<Record<string, boolean>>({});

    const getCollapseStyle = useCallback((isOpen: boolean) =>
    {
        // return
        return {
            display: "grid" as const,
            gridTemplateRows: isOpen ? "1fr" : "0fr",
            transition: "grid-template-rows 220ms ease",
            overflow: "hidden" as const,
        };
    }, []);

    const getCollapseBodyStyle = useCallback((isOpen: boolean) =>
    {
        // return
        return {
            overflow: "hidden" as const,
            minHeight: 0,
            padding: isOpen ? undefined : 0,
        };
    }, []);

    const setAllExpanded = useCallback((next: boolean) =>
    {
        // 宣告變數
        const nextState: Record<string, boolean> = {};

        // 執行 function
        allModuleCodes.forEach((c) =>
        {
            nextState[c] = next;
        });

        setExpanded(nextState);

        if (!next)
        {
            setExpandedProg({});
        }
    }, [allModuleCodes]);

    const toggleModule = useCallback((moduleCode: string) =>
    {
        // 執行 function
        setExpanded((prev) => ({ ...prev, [moduleCode]: !prev[moduleCode] }));
    }, []);

    const getProgKey = useCallback((moduleCode: string, progId: string) =>
    {
        // return
        return `${moduleCode}::${progId}`;
    }, []);

    const toggleProg = useCallback((moduleCode: string, progId: string) =>
    {
        // 宣告變數
        const key = `${moduleCode}::${progId}`;

        // 執行 function
        setExpandedProg((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const hasFlag = useCallback((mask: number, flag: FuncAction) =>
    {
        // return
        return (mask & flag) === flag;
    }, []);

    const actionOptions = useMemo<IActionOption[]>(() =>
    {
        // 宣告變數
        const list: IActionOption[] = [];

        // 執行 function
        for (const a of ACTION_BASE)
        {
            list.push({
                key: a.key,
                value: a.value,
                label: actionNameMap[String(a.value)] ?? a.fallbackLabel,
                visible: true,
            });
        }

        // return
        return list;
    }, [actionNameMap]);

    const getSupportedActions = useCallback((supportMask: number): IActionOption[] =>
    {
        // return
        return actionOptions.filter((a) => a.visible && hasFlag(supportMask, a.value));
    }, [actionOptions, hasFlag]);

    const getGrantMask = useCallback((progId: string) =>
    {
        // return
        return grantMap[progId] ?? 0;
    }, [grantMap]);

    const getSupportedActionMask = useCallback((supportMask: number): number =>
    {
        // 宣告變數
        const supportedActions = getSupportedActions(supportMask);

        // return
        return supportedActions.reduce((acc, act) => acc | act.value, 0);
    }, [getSupportedActions]);

    const isAllSupportedChecked = useCallback((prog: PermissionCatalogProgDTO): boolean =>
    {
        // 宣告變數
        const supportMask = prog.SupportMask ?? 0;
        const supportedActionMask = getSupportedActionMask(supportMask);
        const currentGrantMask = getGrantMask(prog.ProgId);

        // return
        if (!supportedActionMask) return false;
        return (currentGrantMask & supportedActionMask) === supportedActionMask;
    }, [getGrantMask, getSupportedActionMask]);

    const isModuleAllChecked = useCallback((module: PermissionCatalogModuleDTO): boolean =>
    {
        // 宣告變數
        const progs = module.Progs ?? [];
        const validProgs = progs.filter((prog) => getSupportedActionMask(prog.SupportMask ?? 0) > 0);

        // return
        if (validProgs.length === 0) return false;
        return validProgs.every((prog) => isAllSupportedChecked(prog));
    }, [getSupportedActionMask, isAllSupportedChecked]);

    const onToggleAction = useCallback((
        prog: PermissionCatalogProgDTO,
        act: IActionOption,
        checked: boolean,
    ) =>
    {
        // 宣告變數
        const support = prog.SupportMask ?? 0;
        if (!hasFlag(support, act.value)) return;

        const current = getGrantMask(prog.ProgId);
        const next = checked ? (current | act.value) : (current & ~act.value);

        // 執行 function
        onGrantChange(prog.ProgId, next);
    }, [getGrantMask, hasFlag, onGrantChange]);

    const onToggleAllAction = useCallback((prog: PermissionCatalogProgDTO, checked: boolean) =>
    {
        // 宣告變數
        const supportMask = prog.SupportMask ?? 0;
        const supportedActionMask = getSupportedActionMask(supportMask);
        const currentGrantMask = getGrantMask(prog.ProgId);
        const nextGrantMask = checked
            ? (currentGrantMask | supportedActionMask)
            : (currentGrantMask & ~supportedActionMask);

        // 執行 function
        if (!supportedActionMask) return;
        onGrantChange(prog.ProgId, nextGrantMask);
    }, [getGrantMask, getSupportedActionMask, onGrantChange]);

    const onToggleModuleAll = useCallback((module: PermissionCatalogModuleDTO, checked: boolean) =>
    {
        // 宣告變數
        const progs = module.Progs ?? [];

        // 執行 function
        for (const prog of progs)
        {
            const supportMask = prog.SupportMask ?? 0;
            const supportedActionMask = getSupportedActionMask(supportMask);
            const currentGrantMask = getGrantMask(prog.ProgId);

            if (!supportedActionMask) continue;

            const nextGrantMask = checked
                ? (currentGrantMask | supportedActionMask)
                : (currentGrantMask & ~supportedActionMask);

            onGrantChange(prog.ProgId, nextGrantMask);
        }
    }, [getGrantMask, getSupportedActionMask, onGrantChange]);

    // return
    return {
        rid,
        expanded,
        expandedProg,
        setAllExpanded,
        toggleModule,
        toggleProg,
        getProgKey,
        getCollapseStyle,
        getCollapseBodyStyle,
        getSupportedActions,
        getGrantMask,
        isAllSupportedChecked,
        isModuleAllChecked,
        onToggleAction,
        onToggleAllAction,
        onToggleModuleAll,
    };
};
