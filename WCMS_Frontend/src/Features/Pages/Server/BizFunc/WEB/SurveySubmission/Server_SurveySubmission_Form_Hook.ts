import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type {
    ServerFormBinding,
    ServerFormDataAdapter,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiDataHookGroup, ApiFormInitial, ServerFormActions, UseServerActionsOptions, UseServerActionsResult } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];
type SurveySubmissionQueryFormOptions = Parameters<ApiDataHookGroup<SurveySubmissionSet>["useQueryFormData"]>[0];
type SurveySubmissionQueryFormResult = ReturnType<ApiDataHookGroup<SurveySubmissionSet>["useQueryFormData"]>;

export interface UseSurveySubmissionFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 問卷回應代碼，來源為 Route internalId */
    surveySubmissionId: string;

    /** 新版 Template 的外部動作設定 */
    actionsOpt: SurveySubmissionFormActionsOpt;
}

export interface SurveySubmissionFormRawData extends ServerFormDefaultRawData<SurveySubmissionSet, SurveySubmissionFormRefs>
{
    /** ModelDisplayName，給只讀畫面顯示欄位名稱 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 問卷回應資料，無資料時畫面顯示查無資料 */
    data: SurveySubmissionSet | null;
}

export type SurveySubmissionFormRefs = Record<string, never>;

export type SurveySubmissionFormActionsOpt = {
    /** 返回列表頁 */
    onBackToList: () => void;
};

export type SurveySubmissionFormAdapter = {
    /** 問卷回應原始 Adapter */
    SurveySubmission: ReturnType<typeof SurveySubmissionAdapter>;

    /** 只讀表單 Adapter，將 Grid Query 包成 Form Query */
    ReadonlySubmission: ServerFormDataAdapter<SurveySubmissionSet>;
};

export const surveySubmissionEmptyData: SurveySubmissionSet = { SurveySubmissions: {} };
// #endregion

// #region Public
/** 建立 SurveySubmission 只讀 Form Template，統一交給 Server_FormTemplate 處理 loading / error 外框。 */
export const useSurveySubmissionFormTemplate = (
    opt: UseSurveySubmissionFormTemplateOptions,
): ServerFormTemplate<
    SurveySubmissionSet,
    SurveySubmissionFormAdapter,
    SurveySubmissionFormRefs,
    SurveySubmissionFormRawData,
    SurveySubmissionFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.SurveySubmission,
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.surveySubmissionId,
            emptyData: surveySubmissionEmptyData,
            actionsOpt: opt.actionsOpt,
            deps: [opt.surveySubmissionId],
            modelDeps: [opt.lang],
            feature: {
                buildAdapter: buildSurveySubmissionFormAdapter,
                selectDataAdapter: adapter => adapter.ReadonlySubmission,
                resolveMode: () => "edit",
                buildTitle: buildSurveySubmissionFormTitle,
                buildInitialData: buildSurveySubmissionInitialData,
                buildRawData: buildSurveySubmissionRawData,
                buildFormProp: buildSurveySubmissionFormProp,
            },
        };
    }, [opt.actionsOpt, opt.lang, opt.surveySubmissionId, opt.theme]);
};
// #endregion

// #region Timing
/** 建立只讀表單標題，功能名稱優先讀 ModelDisplayName。 */
const buildSurveySubmissionFormTitle = (ctx: { displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = ctx.displayName.ModelDisplayName || "問卷回應";
    return `查看${modelTitle}`;
};

/** 只讀查詢不使用新增 initial，資料來源固定由 Readonly Adapter 查詢。 */
const buildSurveySubmissionInitialData = (): ApiFormInitial<SurveySubmissionSet> | undefined =>
{
    return undefined;
};

/** 建立 SurveySubmission Adapter，另外包一層只讀 DataAdapter 給 FormTemplate 使用。 */
const buildSurveySubmissionFormAdapter = (): SurveySubmissionFormAdapter =>
{
    const surveySubmission = SurveySubmissionAdapter();

    return { SurveySubmission: surveySubmission, ReadonlySubmission: buildReadonlySurveySubmissionDataAdapter(surveySubmission) };
};

/** 建立只讀 rawData，讓 Comp 不需要知道 Template 內部資料流。 */
const buildSurveySubmissionRawData = (
    ctx: { binding: ServerFormBinding<SurveySubmissionSet>; refs: SurveySubmissionFormRefs; actions: ServerFormActions; },
): SurveySubmissionFormRawData =>
{
    return {
        formData: ctx.binding,
        refs: ctx.refs,
        actions: ctx.actions,
        modelDisplayName: ctx.binding.displayName,
        data: hasSurveySubmissionData(ctx.binding.data) ? ctx.binding.data : null,
    };
};

/** 移除 Save / Delete Toolbar，並用問卷名稱補強只讀標題。 */
const buildSurveySubmissionFormProp = (ctx: { rawData: SurveySubmissionFormRawData; }, baseProp: FormCompProp): FormCompProp =>
{
    const surveyName = ctx.rawData.data?.SurveySubmissions?.Survey?.SurveyName;
    const title = surveyName ? `${baseProp.Title}：${surveyName}` : baseProp.Title;

    return { ...baseProp, Title: title, Actions: undefined };
};
// #endregion

// #region Private
/** 建立只讀 DataAdapter，把 QueryGridData 包成 QueryFormData。 */
const buildReadonlySurveySubmissionDataAdapter = (adapter: ReturnType<typeof SurveySubmissionAdapter>): ServerFormDataAdapter<SurveySubmissionSet> =>
{
    return { hooks: { useQueryFormData: opt => useReadonlySurveySubmissionFormData(adapter, opt) }, useServerActions: useReadonlySurveySubmissionActions };
};

/** 查詢單筆問卷回應，因後端以 SurveySubmissionId 篩選，所以使用 Grid Query 取第一筆。 */
const useReadonlySurveySubmissionFormData = (
    adapter: ReturnType<typeof SurveySubmissionAdapter>,
    opt: SurveySubmissionQueryFormOptions,
): SurveySubmissionQueryFormResult =>
{
    const baseParam = useSurveySubmissionFormQueryParam(opt.internalId ?? "");
    const grid = adapter.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? ""],
        modelDeps: opt.modelDeps ?? [],
        initial: undefined,
        onError: opt.onError,
        apiInstance: opt.apiInstance,
    });

    return useMemo(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            data: grid.list?.[0] ?? null,
            isLoading: grid.isLoading,
            errors: grid.errors ?? [],
            errorText: grid.errorText,
            refetchData: grid.refetchData,
        };
    }, [grid.errorText, grid.errors, grid.isLoading, grid.list, grid.modelDisplayName, grid.refetchData]);
};

/** 建立問卷提交明細查詢條件。 */
const useSurveySubmissionFormQueryParam = (surveySubmissionId: string): QueryListParam =>
{
    const fields = useMemo<string[]>(() => buildSurveySubmissionQueryFields(), []);
    const condition = useMemo(() => buildSurveySubmissionCondition(surveySubmissionId), [surveySubmissionId]);

    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [], PageNumber: 1, PageSize: 1 };
    }, [condition, fields]);
};

/** 建立查詢欄位清單，避免只讀畫面額外取得不需要的欄位。 */
const buildSurveySubmissionQueryFields = (): string[] =>
{
    return [
        SurveySubmissionsFields.SurveySubmissionId,
        SurveySubmissionsFields.SurveyId,
        SurveySubmissionsFields.UserName,
        SurveySubmissionsFields.ContactPhone,
        SurveySubmissionsFields.Email,
        SurveySubmissionsFields.FormDataJson,
        SurveySubmissionsFields.FieldSnapshotJson,
        SurveySubmissionsFields.Lang,
        SurveySubmissionsFields.SubmitTime,
        SurveySubmissionsFields.ReplyStatus,
        SurveySubmissionsFields.UserAgent,
        SurveySubmissionsFields.AcceptLanguage,
        SurveySubmissionsFields.ClientIpMasked,
        SurveySubmissionsFields.ClientIpHash,
        SurveySubmissionsFields.BrowserName,
        SurveySubmissionsFields.BrowserVersion,
        SurveySubmissionsFields.OsName,
        SurveySubmissionsFields.OsVersion,
        SurveySubmissionsFields.DeviceType,
        SurveySubmissionsFields.TimeZone,
        `${SurveySubmissionsFields.Survey}.${SurveyFields.SurveyName}`,
    ];
};

/** 建立單筆回應查詢條件，空值時刻意查不到資料。 */
const buildSurveySubmissionCondition = (surveySubmissionId: string): string =>
{
    const id = `${surveySubmissionId ?? ""}`.trim();
    return id ? `${SurveySubmissionsFields.SurveySubmissionId} = ${id}` : `${SurveySubmissionsFields.SurveySubmissionId} = __empty__`;
};

/** 判斷 binding 是否已取得有效回應資料。 */
const hasSurveySubmissionData = (data: SurveySubmissionSet | null | undefined): boolean =>
{
    return Boolean(data?.SurveySubmissions?.SurveySubmissionId);
};

/** 只讀頁不允許 CUD，保留 no-op action 只為滿足 FormTemplate 共用介面。 */
const useReadonlySurveySubmissionActions = (_opt?: UseServerActionsOptions): UseServerActionsResult<SurveySubmissionSet> =>
{
    const rejectAsync = useCallback(async (): Promise<ApiResponse<SurveySubmissionSet>> =>
    {
        return { IsSuccess: false, Data: null, SysMessage: [] } as ApiResponse<SurveySubmissionSet>;
    }, []);

    return { isSaving: false, createAsync: rejectAsync, updateAsync: rejectAsync, deleteAsync: rejectAsync, invalidAsync: rejectAsync };
};
// #endregion
