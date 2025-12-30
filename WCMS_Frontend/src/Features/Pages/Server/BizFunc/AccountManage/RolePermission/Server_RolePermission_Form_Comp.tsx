import { useLocation, useParams } from 'react-router-dom';
import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from '@/SysCore/Utils/API/FetchFormData';
import { useActions } from '@/Features/Hooks/Common/useActions';
import { useEffect, useId, useMemo, useState } from 'react';
import { useFetchEnumOptions } from '@/SysCore/Utils/API/SystemAPI_Hook';
import RolePermissionProvider, { usePermissionCatalog } from '@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api';
import type { Lang } from '@/SysCore/i18n/lang';
import { LibTextBox } from '@/SysCore/Components/FormField/LibFormField';
import { useSetTableField } from '@/SysCore/Components/FormField/useSetTableField';
import { RoleDataModelFields, RolePermissionModelFields, RolePermissionSetFields } from '@/types/SchemaFields';

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
const emptyData: RolePermissionSet = {} as RolePermissionSet;

/** GrantMask 轉 number（避免 swagger enum/number 差異） */
const toMaskNumber = (v: unknown): number => {
    // 宣告變數
    const n = typeof v === "number" ? v : Number(v);

    // return
    return Number.isFinite(n) ? n : 0;
};

/** 從表單資料建立 grantMap（key=PermissionKey/ProgId, value=GrantMask） */
const buildGrantMapFromForm = (set?: RolePermissionSet | null): Record<string, number> => {
    // 宣告變數
    const list = (set as any)?.RolePermission ?? [];
    const map: Record<string, number> = {};

    // 執行 function
    for (const row of list) {
        const key = (row?.PermissionKey ?? "").trim();
        if (!key) continue;
        map[key] = toMaskNumber(row?.GrantMask);
    }

    // return
    return map;
};

/** 把單一 progId 的 grantMask 寫回 RolePermissionSet（確保儲存時會送到後端） */
const applyGrantToForm = (prev: RolePermissionSet, progId: string, nextGrantMask: number): RolePermissionSet => {
    // 宣告變數
    const next = { ...(prev as any) } as any;
    const roleId = next?.RoleData?.RoleId ?? null;
    const list = Array.isArray(next?.RolePermission) ? [...next.RolePermission] : [];

    // 執行 function
    const idx = list.findIndex((x: any) => (x?.PermissionKey ?? "").trim() === progId);

    // nextGrantMask=0 就移除（避免送一堆 0）
    if (!nextGrantMask) {
        if (idx >= 0) list.splice(idx, 1);
        next.RolePermission = list;
        return next;
    }

    const row = idx >= 0 ? { ...list[idx] } : {};
    row.PermissionKey = progId;
    row.GrantMask = nextGrantMask;

    // 有角色 id 的話補上（後端 Model 會需要 RoleId）
    if (!row.RoleId && roleId) row.RoleId = roleId;

    if (idx >= 0) list[idx] = row;
    else list.push(row);

    next.RolePermission = list;

    // return
    return next;
};

export const Server_RolePermission_Form_Comp = (props: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const isAddNew = !internalId

    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);

    const provider = useMemo(() => RolePermissionProvider(), []);

    // ✅ 1) 先拿 catalog（API）
    const catalog = usePermissionCatalog(provider, props.lang);

    // ✅ 2) 表單資料（RolePermissionSet）
    const formData = useFetchFormData<RolePermissionSet>(provider, internalId, emptyData);

    // 你原本的 scaffolding（先保留）
    const actions = useActions(dirUrl, provider, formData.data, internalId as string, undefined, undefined);
    const useGender = useFetchEnumOptions("Gender");
    const useFuncAction = useFetchEnumOptions("FuncAction");

    const isLoading: boolean[] = [formData.isLoading, useGender.isLoading, catalog.isLoading, useFuncAction.isLoading];
    const errors: (string | null | undefined)[] = [formData.error, useGender.error, (catalog.error as any)?.message ?? catalog.error, useFuncAction.error];

    const prop: FormCompProp = {
        Title: "角色權限修改",
        Theme: props.theme,
        LoadingList: isLoading,
        ErrorList: errors,
        Actions: actions,
    };

    // ✅ 3) grantMap 改成「從 formData 動態建立」
    const [grantMap, setGrantMap] = useState<Record<string, number>>({});

    useEffect(() => {
        // formData 讀到資料後，同步初始化 grantMap
        setGrantMap(buildGrantMapFromForm(formData.data));
    }, [formData.data]);

    const onGrantChange = (progId: string, nextGrantMask: number) => {

        const id = progId.trim();

        // 更新單一 prog 的 grant mask（UI）
        setGrantMap((prev) => ({ ...prev, [id]: nextGrantMask }));
        // 執行 function：同步寫回明細（新增或修改）
        if (!nextGrantMask) {
            removeGrantRow(id);
            return;
        }

        upsertGrantMask(id, nextGrantMask);



        // 同步寫回 formData（儲存時才會送到後端）
        formData.setFormData((prev) => applyGrantToForm(prev, progId, nextGrantMask));
    };

    // ✅ 4) modules 改用 API 回來的資料（List PermissionCatalogModuleDTO）
    const modules = (catalog.data ?? []) as PermissionCatalogModuleDTO[];
    const setField = useSetTableField<RolePermissionSet>(formData);

    const upsertGrantMask = (progId: string, nextGrantMask: number) => {
        // 宣告變數
        const roleId = (formData.data as any)?.RoleData?.RoleId ?? null;
        const rowKeys = { PermissionKey: progId, RoleId: roleId };

        // 執行 function：用 useSetTableField 的 upsert 行為更新/新增 GrantMask
        const bind = setField("RolePermission" as any, "GrantMask" as any, "number", rowKeys);
        bind.onChange(nextGrantMask);

        // return
    };
    const removeGrantRow = (progId: string) => {
        // 宣告變數
        const key = progId.trim();

        // 執行 function：把該 PermissionKey 的列移除
        formData.setFormData((prev: any) => {
            if (!prev) return prev;
            const list = Array.isArray(prev.RolePermission) ? prev.RolePermission : [];
            const nextList = list.filter((x: any) => (x?.PermissionKey ?? "").trim() !== key);
            return { ...prev, RolePermission: nextList };
        });

        // return
    };

    return (
        <FormComp prop={prop}>
            <Header_Comp theme={props.theme} formData={formData} isAddNew={isAddNew} />
            <PermissionSetting_Comp modules={modules} grantMap={grantMap} onGrantChange={onGrantChange} actionNameMap={useFuncAction.data} />
        </FormComp>
    );
};



const Header_Comp = (props: { formData: UseFetchFormDataResult<RolePermissionSet>; theme: IBETheme; isAddNew: boolean; }) => {
    const setField = useSetTableField<RolePermissionSet>(props.formData);
    return (<div className="row">
        <div className="col-sm-12">
            <div className="panel">
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <div className="px-0 mb-2">
                                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleId, "string")} disabled={!props.isAddNew} />
                                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName, "string")} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export const FuncAction = {
    None: 0,
    Use: 1 << 0,
    Query: 1 << 1,
    View: 1 << 2,
    Create: 1 << 3,
    Update: 1 << 4,
    Delete: 1 << 5,
    Invalid: 1 << 6,
    All: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6), // 127
} as const;

export type FuncAction = (typeof FuncAction)[keyof typeof FuncAction];

export interface PermissionCatalogProgDTO {
    ProgId: string;
    ProgTitle: string;
    SupportMask: number;
}

export interface PermissionCatalogModuleDTO {
    ModuleCode: string;
    ModuleTitle: string;
    Progs: PermissionCatalogProgDTO[];
}

export interface IRolePermissionCatalogAccordionProps {
    modules: PermissionCatalogModuleDTO[];
    /** key: ProgId, value: GrantMask */
    grantMap: Record<string, number>;
    /** 當使用者勾選某個 ProgId 的權限 */
    onGrantChange: (progId: string, nextGrantMask: number) => void;
    actionNameMap?: Record<string, string>;
}

type IActionOption = {
    key: string;
    label: string;
    value: FuncAction;
    visible: boolean;
};

type IActionBase = {
    key: string;
    value: FuncAction;
    fallbackLabel: string; // 後端沒回傳時才用（保底）
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
const PermissionSetting_Comp = (props: IRolePermissionCatalogAccordionProps) => {
    // 宣告變數（防呆）
    const modules = props.modules ?? [];
    const grantMap = props.grantMap ?? {};
    const onGrantChange = props.onGrantChange ?? (() => { /* noop */ });
    const actionNameMap = props.actionNameMap ?? {};


    const rid = useId();
    const allModuleCodes = useMemo(
        () => modules.map((m) => m.ModuleCode).filter(Boolean),
        [modules]
    );

    // 第一層：Module 展開狀態
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        allModuleCodes.forEach((c) => (init[c] = false));
        return init;
    });

    // 第二層：Prog 展開狀態（key: `${moduleCode}::${progId}`）
    const [expandedProg, setExpandedProg] = useState<Record<string, boolean>>({});

    // 執行 function
    const getCollapseStyle = (isOpen: boolean) => {
        return {
            display: "grid",
            gridTemplateRows: isOpen ? "1fr" : "0fr",
            transition: "grid-template-rows 220ms ease",
            overflow: "hidden",
        } as const;
    };

    const getCollapseBodyStyle = (isOpen: boolean) => {
        return {
            overflow: "hidden",
            minHeight: 0,
            padding: isOpen ? undefined : 0,
        } as const;
    };

    const setAllExpanded = (next: boolean) => {
        // 全展開/全收合（第一層）
        const nextState: Record<string, boolean> = {};
        allModuleCodes.forEach((c) => (nextState[c] = next));
        setExpanded(nextState);

        // 全收合時，把第二層也清空
        if (!next) setExpandedProg({});
    };

    const toggleModule = (moduleCode: string) => {
        // 單一模組展開/收合
        setExpanded((prev) => ({ ...prev, [moduleCode]: !prev[moduleCode] }));
    };

    const getProgKey = (moduleCode: string, progId: string) => {
        // 產生 Prog key
        return `${moduleCode}::${progId}`;
    };

    const toggleProg = (moduleCode: string, progId: string) => {
        // 單一 Prog 展開/收合
        const key = getProgKey(moduleCode, progId);
        setExpandedProg((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const hasFlag = (mask: number, flag: FuncAction) => {
        // 判斷 bitmask 是否包含旗標
        return (mask & flag) === flag;
    };
    const buildActionOptions = (): IActionOption[] => {
        // 由後端 enum dict 建立 actions（沒提供名稱就不顯示；fallback 只當除錯保底）
        const list: IActionOption[] = [];

        for (const a of ACTION_BASE) {
            const name = actionNameMap[String(a.value)];
            if (!name) continue;

            list.push({
                key: a.key,
                value: a.value,
                label: name ?? a.fallbackLabel,
                visible: true,
            });
        }

        return list;
    };

    const actionOptions = useMemo(() => buildActionOptions(), [actionNameMap]);

    const getSupportedActions = (supportMask: number): IActionOption[] => {
        // 只回傳：1) 後端有提供顯示名稱 2) prog 支援的 action
        return actionOptions.filter((a) => a.visible && hasFlag(supportMask, a.value));
    };

    const getGrantMask = (progId: string) => {
        // 取得當前 Prog 的 GrantMask（不存在視為 0）
        return grantMap[progId] ?? 0;
    };

    const onToggleAction = (prog: PermissionCatalogProgDTO, act: IActionOption, checked: boolean) => {
        // 勾選權限時更新該 prog 的 mask
        const support = prog.SupportMask ?? 0;
        if (!hasFlag(support, act.value)) return;

        const current = getGrantMask(prog.ProgId);
        const next = checked ? (current | act.value) : (current & ~act.value);
        onGrantChange(prog.ProgId, next);
    };

    // return
    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="panel">
                    <div className="panel-body">
                        <div className="form">
                            <div className="row mx-0">
                                <div className="px-0 mb-2">
                                    <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => setAllExpanded(true)} aria-label="展開所有模組">
                                        展開
                                    </button>
                                    <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => setAllExpanded(false)} aria-label="收合所有模組">
                                        收合
                                    </button>
                                </div>
                            </div>

                            <div className="row mx-0">
                                <div className="accordion">
                                    {modules?.map((m, mi) => {
                                        const moduleCode = (m.ModuleCode ?? "").trim();
                                        const moduleTitle = (m.ModuleTitle ?? moduleCode).trim();
                                        const isOpen = expanded[moduleCode] ?? false;
                                        const headerId = `${rid}-mod-h-${mi}-${moduleCode}`;
                                        const panelId = `${rid}-mod-p-${mi}-${moduleCode}`;

                                        return (
                                            <div className="accordion-item" key={`${moduleCode}-${mi}`}>
                                                <h4 className="accordion-header" id={headerId}>
                                                    <button type="button" className={`accordion-button ${isOpen ? "" : "collapsed"}`} aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleModule(moduleCode)} >
                                                        {moduleTitle}
                                                    </button>
                                                </h4>

                                                <div id={panelId} className="accordion-collapse" role="region" aria-labelledby={headerId} aria-hidden={!isOpen} style={getCollapseStyle(isOpen)}>
                                                    <div className="accordion-body" style={getCollapseBodyStyle(isOpen)}>
                                                        {(m.Progs ?? []).map((p, pi) => {
                                                            const progId = (p.ProgId ?? "").trim();
                                                            const progTitle = (p.ProgTitle ?? progId).trim();
                                                            const supportMask = p.SupportMask ?? 0;
                                                            const grantMask = getGrantMask(progId);

                                                            const progHeaderId = `${rid}-prog-h-${mi}-${pi}-${moduleCode}-${progId}`;
                                                            const progPanelId = `${rid}-prog-p-${mi}-${pi}-${moduleCode}-${progId}`;
                                                            const progKey = getProgKey(moduleCode, progId);
                                                            const isProgOpen = expandedProg[progKey] ?? false;

                                                            return (
                                                                <div className="accordion mb-2" key={`${progId}-${pi}`}>
                                                                    <div className="accordion-item">
                                                                        <h4 className="accordion-header" id={progHeaderId}>
                                                                            <button type="button" className={`accordion-button ${isProgOpen ? "" : "collapsed"}`} aria-expanded={isProgOpen} aria-controls={progPanelId} onClick={() => toggleProg(moduleCode, progId)}>
                                                                                {progTitle}
                                                                            </button>
                                                                        </h4>

                                                                        <div id={progPanelId} className="accordion-collapse" role="region" aria-labelledby={progHeaderId} aria-hidden={!isProgOpen} style={getCollapseStyle(isProgOpen)}>
                                                                            <div className="accordion-body" style={getCollapseBodyStyle(isProgOpen)}>
                                                                                <div className="row mx-0">
                                                                                    <div className="col form-group">
                                                                                        <label className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                                                                                            使用者權限
                                                                                        </label>

                                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                                            {(() => {
                                                                                                // 取得該 prog 支援的 actions（不支援就不顯示）
                                                                                                const supportedActions = getSupportedActions(supportMask);

                                                                                                // 若完全沒有可設定權限，給一個提示（不想顯示文字可刪掉這段）
                                                                                                if (supportedActions.length === 0) {
                                                                                                    return <div className="text-muted">（無可設定權限）</div>;
                                                                                                }

                                                                                                return supportedActions.map((act) => {
                                                                                                    const id = `${rid}-${moduleCode}-${progId}-${act.key}`;
                                                                                                    const checked = hasFlag(grantMask, act.value);

                                                                                                    return (
                                                                                                        <div className="col-sm-3 col-12 float-left p-0" key={id}>
                                                                                                            <div className="custom-control custom-checkbox">
                                                                                                                <input
                                                                                                                    type="checkbox"
                                                                                                                    className="custom-check-input"
                                                                                                                    id={id}
                                                                                                                    checked={checked}
                                                                                                                    onChange={(e) => onToggleAction(p, act, e.target.checked)}
                                                                                                                />
                                                                                                                <label className="custom-check-label" htmlFor={id}>
                                                                                                                    <span className="check-txt">{act.label}</span>
                                                                                                                </label>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                });
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
