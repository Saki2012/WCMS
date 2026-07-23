import type {
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type SpecOpenScheduleRuleFormModel = components["schemas"]["SpecOpenScheduleRule"];

type ScheduleRuleFormRefs = Record<string, never>;

type ScheduleRuleFormRawData = ServerFormDefaultRawData<SpecOpenScheduleRuleFormModel, ScheduleRuleFormRefs>;

type ScheduleRuleFormAdapter = ReturnType<typeof SpecOpenScheduleRuleAdapter>;

interface ScheduleRuleFormActionsOpt
{
    /** 儲存成功後返回列表。 */
    onBackToList: () => void;
}

interface UseScheduleRuleFormTemplateOptions
{
    /** 後台主題設定。 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增。 */
    internalId: string;

    /** 新增模式預設 FormModel。 */
    emptyData: SpecOpenScheduleRuleFormModel;

    /** Form Template 標準動作設定。 */
    actionsOpt: ScheduleRuleFormActionsOpt;
}
// #endregion

// #region Public
/** 建立 ScheduleRule Spec Form Template，統一使用 FormModel 資料流程。 */
export const useScheduleRuleFormTemplate = (
    opt: UseScheduleRuleFormTemplateOptions,
): ServerFormTemplate<SpecOpenScheduleRuleFormModel, ScheduleRuleFormAdapter, ScheduleRuleFormRefs, ScheduleRuleFormRawData, ScheduleRuleFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.SpecOpenScheduleRule,
            theme: opt.theme,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildScheduleRuleFormAdapter,
                buildTitle: buildScheduleRuleFormTitle,
                buildInitialData: buildScheduleRuleInitialData,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.theme]);
};
// #endregion

// #region Private
/** 建立 ScheduleRule FormModel Adapter。 */
const buildScheduleRuleFormAdapter = (): ScheduleRuleFormAdapter =>
{
    return SpecOpenScheduleRuleAdapter();
};

/** 建立 ScheduleRule Form 標題，ModelDisplayName 無資料時使用固定名稱。 */
const buildScheduleRuleFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const title = ctx.displayName.ModelDisplayName || "開館時間設定";
    return ctx.mode === "edit" ? `修改${title}` : title;
};

/** 建立新增模式 initial data，避免新增時查詢 __new__。 */
const buildScheduleRuleInitialData = (
    ctx: { mode: "new" | "edit"; emptyData: SpecOpenScheduleRuleFormModel; },
): ApiFormInitial<SpecOpenScheduleRuleFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};
// #endregion
