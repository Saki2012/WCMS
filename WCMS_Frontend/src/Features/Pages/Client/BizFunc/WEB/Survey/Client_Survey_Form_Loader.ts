import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    buildClientLoaderInitial,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SurveyFields, SurveyItemFields, SurveyItemLangFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySet = components["schemas"]["SurveySet_DTO"];
type SurveySubmissionRequest = components["schemas"]["SurveySubmissionRequest_DTO"];
export interface ISurveyOptions
{
    SurveyId?: string;
}
export interface SurveyFormLoaderArgs
{
    surveyId: string;
    lang: Lang;
    queryParam: QueryListParam;
}
export interface SurveyFormLoaderRes
{
    listRes: SurveySet[];
}
export interface SurveyFormLoaderData
{
    args: SurveyFormLoaderArgs;
    res: SurveyFormLoaderRes;
}
export interface SurveySubmitActions
{
    isSubmitting: boolean;
    publicSubmitAsync: (request: SurveySubmissionRequest) => Promise<ApiResponse<string | null>>;
}
export type SurveyFormRawData = {
    surveyId: string;
    data: SurveySet;
    title: string;
    contentHtml: string;
    successContentHtml: string;
    submitActions: SurveySubmitActions;
    args: SurveyFormLoaderArgs;
};
export type SurveyFormAdapter = {
    Survey: ReturnType<typeof SurveyAdapter>;
    SurveySubmission: ReturnType<typeof SurveySubmissionAdapter>;
};
export interface SurveyFormFetchDataResult extends SurveyFormRawData
{
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}
export type UseSurveyFormDataResult = SurveyFormFetchDataResult;
type SurveyFormSearchParams = { surveyId: string; lang: Lang; };
type SurveyFormDataQueryTemplate = ClientDataQueryTemplate<SurveyFormSearchParams, SurveyFormRawData, SurveyFormRawData, SurveyFormAdapter, QueryListParam, SurveyFormLoaderData>;
const defaultEmptyData: SurveySet = { Survey: {}, SurveyItem: [], SurveyItemLang: [] };
// #endregion

// #region Public
/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildSurveyFormLoaderArgs = (p: { lang: Lang; surveyId: string; queryParam?: QueryListParam; }): SurveyFormLoaderArgs =>
{
    const safeSurveyId = LibText.safeTrim(p.surveyId);
    const condition = buildSurveyFormCondition(safeSurveyId);
    const queryParam = p.queryParam ?? buildSurveyFormQueryParam({ condition });
    return { surveyId: safeSurveyId, lang: p.lang, queryParam };
};
/** SSR Loader：改以 QueryList 預載 Survey Form 單筆資料 */
export const Client_Survey_Form_Loader = (p: { lang: Lang; opts: ISurveyOptions; }) => async ({ request, params }: LoaderFunctionArgs): Promise<SurveyFormLoaderData> =>
{
    const surveyId = LibText.safeTrim(p.opts.SurveyId);
    const ssrApi = getSsrApi(request);
    const adapter = SurveyAdapter(ssrApi);
    const queryState = buildSurveyFormQueryState({ lang: p.lang, surveyId, emptyData: defaultEmptyData });
    const args = buildSurveyFormLoaderArgs({ lang: p.lang, surveyId, queryParam: queryState.queryParam });
    if (!surveyId)
    {
        return { args, res: { listRes: [] } };
    }
    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const listLD = await listLoader({ request, params } as LoaderFunctionArgs);
    const listRes = listLD.apiRes.Data ?? [];
    return { args, res: { listRes } };
};
/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useSurveyFormData = (opt: { lang: Lang; surveyId: string; emptyData?: SurveySet; }): UseSurveyFormDataResult =>
{
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const templateVm = useSurveyFormTemplate({ lang: opt.lang, surveyId: opt.surveyId, emptyData: fallbackData });
    const errorList = templateVm.errorList;
    return { ...templateVm.viewModel, isLoading: templateVm.isLoading, errorText: errorList[0] ?? null, errorList, refetchData: templateVm.refetchData, refetchRefData: templateVm.refetchRefData };
};
/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const useSurveyFormFetchData = (p: { lang: Lang; surveyId: string; emptyData?: SurveySet; }): SurveyFormFetchDataResult =>
{
    return useSurveyFormData({ lang: p.lang, surveyId: p.surveyId, emptyData: p.emptyData });
};
// #endregion

// #region Private
/** 組出給 hydration 用的 initial 格式 */
/** 建立 Survey Form 查詢條件 */
const buildSurveyFormCondition = (surveyId: string): string =>
{
    const condition = LibCondition.joinConditions([LibCondition.createCondition(SurveyFields.InternalId, Operator.Equal, LibText.safeTrim(surveyId))]);
    return condition || "1=0";
};
/** 建立 Survey Form QueryList 欄位清單 */
const buildSurveyFormFields = (): string[] =>
{
    const itemPrefix = SurveyFields._SurveyItem;
    const itemLangPrefix = `${SurveyFields._SurveyItem}.${SurveyItemFields._SurveyItemLang}`;
    return [
        SurveyFields.InternalId,
        SurveyFields.SurveyId,
        SurveyFields.SurveyName,
        SurveyFields.SurveyDescription,
        SurveyFields.SurveySuccessContent,
        `${itemPrefix}.${SurveyItemFields.SurveyId}`,
        `${itemPrefix}.${SurveyItemFields.RowId}`,
        `${itemPrefix}.${SurveyItemFields.FieldId}`,
        `${itemPrefix}.${SurveyItemFields.IsRequired}`,
        `${itemPrefix}.${SurveyItemFields.InputType}`,
        `${itemPrefix}.${SurveyItemFields.Options}`,
        `${itemLangPrefix}.${SurveyItemLangFields.SurveyId}`,
        `${itemLangPrefix}.${SurveyItemLangFields.ParentRowId}`,
        `${itemLangPrefix}.${SurveyItemLangFields.RowId}`,
        `${itemLangPrefix}.${SurveyItemLangFields.Lang}`,
        `${itemLangPrefix}.${SurveyItemLangFields.FieldName}`,
    ];
};
/** 建立 Survey Form QueryListParam，Form 固定只查單筆 */
const buildSurveyFormQueryParam = (p: { condition: string; }): QueryListParam =>
{
    return { Fields: buildSurveyFormFields(), Condition: p.condition, PageNumber: 1, PageSize: 1 };
};
/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (p: { loaderData: SurveyFormLoaderData | null; queryParam: QueryListParam; fallbackData: SurveySet; }): ApiLoaderData<QueryListParam, SurveySet[]> | null =>
{
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;
    return buildClientLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};
/** 建立 Survey Form 初始 ViewState */
const buildSurveyFormInitialViewState = (): IListViewState =>
{
    return { pageNumber: 1, pageSize: 1 };
};
/** 建立 Survey Form Template 查詢參數 */
const buildSurveyFormSearchParams = (p: { lang: Lang; surveyId: string; }): SurveyFormSearchParams =>
{
    return { surveyId: LibText.safeTrim(p.surveyId), lang: p.lang };
};
/** 建立 Survey Form DataQueryTemplate */
const createSurveyFormDataQueryTemplate = (p: { lang: Lang; surveyId: string; emptyData: SurveySet; }): SurveyFormDataQueryTemplate =>
{
    const initialViewState = buildSurveyFormInitialViewState();
    return {
        featureKey: "SurveyForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildSurveyFormSearchParams({ lang: p.lang, surveyId: p.surveyId }),
            buildSearchConditions: (ctx) => [buildSurveyFormCondition(ctx.searchParams.surveyId)],
            buildQueryParam: (ctx) => buildSurveyFormQueryParam({ condition: ctx.searchCondition }),
            useDataSource: (ctx) => useSurveyFormDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData, lang: p.lang, surveyId: ctx.searchParams.surveyId, emptyData: p.emptyData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};
/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildSurveyFormQueryState = (p: { lang: Lang; surveyId: string; emptyData: SurveySet; }) =>
{
    const template = createSurveyFormDataQueryTemplate(p);
    return buildClientDataQueryState(template, {} as SearchValues, buildSurveyFormInitialViewState());
};
/** Survey Form DataSource：統一處理 QueryList 單筆資料與提交 actions */
const useSurveyFormDataSource = (p: { queryParam: QueryListParam; loaderData: SurveyFormLoaderData | null; lang: Lang; surveyId: string; emptyData: SurveySet; }): ClientDataQueryDataSourceResult<SurveyFormRawData, SurveyFormAdapter> =>
{
    const adapter = useMemo<SurveyFormAdapter>(() => ({ Survey: SurveyAdapter(), SurveySubmission: SurveySubmissionAdapter() }), []);
    const currentArgs = useMemo(() => buildSurveyFormLoaderArgs({ lang: p.lang, surveyId: p.surveyId, queryParam: p.queryParam }), [p.lang, p.surveyId, p.queryParam]);
    const listInitial = useMemo(() => buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData }), [p.loaderData, p.queryParam, p.emptyData]);
    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);
    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Survey.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });
    /** 問卷提交 action：仍走 SurveySubmission Public_Submit */
    const submitActions = adapter.SurveySubmission.hooks.useSubmitActions();
    const data = useMemo<SurveySet>(() => useData.data?.[0] ?? p.emptyData, [useData.data, p.emptyData]);
    const errors = useMemo(() => [useData.errorText], [useData.errorText]);
    const rawData = useMemo<SurveyFormRawData>(() => buildSurveyFormRawData({ args: currentArgs, data, submitActions }), [currentArgs, data, submitActions]);
    const refetchData = useCallback(async (): Promise<void> => (await Promise.resolve(useData.refetch())), [useData.refetch]);
    const refetchRefData = useCallback(async (): Promise<void> => (await Promise.resolve()), []);
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors, paginator: null, refetchData, refetchRefData };
};
/** 建立 Survey Form RawData */
const buildSurveyFormRawData = (p: { args: SurveyFormLoaderArgs; data: SurveySet; submitActions: SurveySubmitActions; }): SurveyFormRawData =>
{
    const survey = p.data.Survey ?? {};
    return { surveyId: p.args.surveyId, data: p.data, title: survey.SurveyName ?? "", contentHtml: survey.SurveyDescription ?? "", successContentHtml: survey.SurveySuccessContent ?? "", submitActions: p.submitActions, args: p.args };
};
/** 內部共用：建立 Survey Form Template VM */
const useSurveyFormTemplate = (opt: { lang: Lang; surveyId: string; emptyData: SurveySet; }) =>
{
    const template = useMemo(() => createSurveyFormDataQueryTemplate({ lang: opt.lang, surveyId: opt.surveyId, emptyData: opt.emptyData }), [opt.lang, opt.surveyId, opt.emptyData]);
    return useClientDataQueryTemplate(template);
};
// #endregion
