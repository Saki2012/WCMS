import type {
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useMemo } from "react";

// #region Property
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];


export type ScheduleRuleFormRefs = Record<string, never>;

export type ScheduleRuleFormRawData = ServerFormDefaultRawData<SpecOpenScheduleRuleSet, ScheduleRuleFormRefs>;

export type ScheduleRuleFormAdapter = { ScheduleRule: ReturnType<typeof SpecOpenScheduleRuleAdapter>; };

export type ScheduleRuleFormActionsOpt = {
    /** 儲存成功後回列表 */
    onBackToList: () => void;
};
// #endregion

// #region Public
/** 建立 ScheduleRule Spec Form Template，統一交給 Server_FormTemplate 處理資料流程 */
export const useScheduleRuleFormTemplate = (
    opt: { theme: IBETheme; internalId: string; emptyData: SpecOpenScheduleRuleSet; actionsOpt: ScheduleRuleFormActionsOpt; },
): ServerFormTemplate<SpecOpenScheduleRuleSet, ScheduleRuleFormAdapter, ScheduleRuleFormRefs, ScheduleRuleFormRawData, ScheduleRuleFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "SpecOpenScheduleRule",
            theme: opt.theme,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildScheduleRuleFormAdapter,
                selectDataAdapter: adapter => adapter.ScheduleRule,
                buildTitle: buildScheduleRuleFormTitle,
                buildInitialData: buildScheduleRuleInitialData,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.theme]);
};
// #endregion

// #region Private
/** 建立 ScheduleRule 使用的 Spec Adapter */
const buildScheduleRuleFormAdapter = (): ScheduleRuleFormAdapter =>
{
    return { ScheduleRule: SpecOpenScheduleRuleAdapter() };
};


/** 建立 ScheduleRule Form 標題，ModelDisplayName 無資料時使用固定名稱 */
const buildScheduleRuleFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const title = ctx.displayName.ModelDisplayName || "開館時間設定";
    return ctx.mode === "edit" ? `修改${title}` : title;
};


/** 建立新增模式的 initial data，避免新增時查詢 __new__ */
const buildScheduleRuleInitialData = (
    ctx: { mode: "new" | "edit"; emptyData: SpecOpenScheduleRuleSet; },
): ApiFormInitial<SpecOpenScheduleRuleSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};
// #endregion
