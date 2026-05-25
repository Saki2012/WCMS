import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SurveyFields, SurveyItemFields, SurveyItemLangFields } from "@/types/SchemaFields";

// #region Types
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
    dataRes: SurveySet | null;
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

export interface UseSurveyFormDataResult extends SurveyFormFetchDataResult {}
// #endregion

type SurveyFormSearchParams = {
    surveyId: string;
    lang: Lang;
};

type SurveyFormDataQueryTemplate = ClientDataQueryTemplate<
    SurveyFormSearchParams,
    SurveyFormRawData,
    SurveyFormRawData,
    SurveyFormAdapter,
    QueryListParam,
    SurveyFormLoaderData
>;

const defaultEmptyData: SurveySet = { Survey: {}, SurveyItem: [], SurveyItemLang: [] };

// #region Shared Builder
/** 統一整理安全 SurveyId；目前前台 option 傳入的是 Survey.InternalId */
const getSafeSurveyId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 轉義 QueryList 條件中的雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // 宣告變數
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};

/** 建立 Survey Form 查詢條件 */
const buildSurveyFormCondition = (surveyId: string): string =>
{
    // 宣告變數
    const safeSurveyId = escapeQueryValue(getSafeSurveyId(surveyId));
    if (!safeSurveyId) return "1=0";

    // return
    return LibMerge(" And ", false, `${SurveyFields.InternalId} = "${safeSurveyId}"`);
};

/** 建立 Survey Form QueryList 欄位清單 */
const buildSurveyFormFields = (): string[] =>
{
    // 宣告變數
    const itemPrefix = SurveyFields._SurveyItem;
    const itemLangPrefix = `${SurveyFields._SurveyItem}.${SurveyItemFields._SurveyItemLang}`;

    // return
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
const buildSurveyFormQueryParam = (p: { surveyId: string; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildSurveyFormCondition(p.surveyId);

    // return
    return { Fields: buildSurveyFormFields(), Condition: condition, PageNumber: 1, PageSize: 1 };
};

/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildSurveyFormLoaderArgs = (p: { lang: Lang; surveyId: string; queryParam?: QueryListParam; }): SurveyFormLoaderArgs =>
{
    // 宣告變數
    const safeSurveyId = getSafeSurveyId(p.surveyId);
    const queryParam = p.queryParam ?? buildSurveyFormQueryParam({ surveyId: safeSurveyId });

    // return
    return { surveyId: safeSurveyId, lang: p.lang, queryParam };
};

/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (
    p: { loaderData: SurveyFormLoaderData | null; queryParam: QueryListParam; fallbackData: SurveySet; },
): ApiLoaderData<QueryListParam, SurveySet[]> | null =>
{
    // 宣告變數
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;

    // return
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};

/** 建立 Survey Form 初始 ViewState */
const buildSurveyFormInitialViewState = (): IListViewState =>
{
    // return
    return { pageNumber: 1, pageSize: 1 } as IListViewState;
};

/** 建立 Survey Form Template 查詢參數 */
const buildSurveyFormSearchParams = (p: { lang: Lang; surveyId: string; }): SurveyFormSearchParams =>
{
    // return
    return { surveyId: getSafeSurveyId(p.surveyId), lang: p.lang };
};

/** 建立 Survey Form DataQueryTemplate */
const createSurveyFormDataQueryTemplate = (p: { lang: Lang; surveyId: string; emptyData: SurveySet; }): SurveyFormDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildSurveyFormInitialViewState();

    // return
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
            buildQueryParam: (ctx) => buildSurveyFormQueryParam({ surveyId: ctx.searchParams.surveyId }),
            useDataSource: (ctx) => useSurveyFormDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData, lang: p.lang, surveyId: ctx.searchParams.surveyId, emptyData: p.emptyData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildSurveyFormQueryState = (p: { lang: Lang; surveyId: string; emptyData: SurveySet; }) =>
{
    // 宣告變數
    const template = createSurveyFormDataQueryTemplate(p);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, buildSurveyFormInitialViewState());
};
// #endregion

// #region SSR Loader
/** SSR Loader：改以 QueryList 預載 Survey Form 單筆資料 */
export const Client_Survey_Form_Loader = (p: { lang: Lang; opts: ISurveyOptions; }) => async ({ request, params }: LoaderFunctionArgs): Promise<SurveyFormLoaderData> =>
{
    // 宣告變數
    const surveyId = getSafeSurveyId(p.opts.SurveyId);
    const ssrApi = getSsrApi(request);
    const adapter = SurveyAdapter(ssrApi);
    const queryState = buildSurveyFormQueryState({ lang: p.lang, surveyId, emptyData: defaultEmptyData });
    const args = buildSurveyFormLoaderArgs({ lang: p.lang, surveyId, queryParam: queryState.queryParam });

    // 執行 function
    if (!surveyId)
    {
        return { args, res: { listRes: [], dataRes: null } };
    }

    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const listLD = await listLoader({ request, params } as LoaderFunctionArgs);
    const listRes = listLD.apiRes.Data ?? [];

    // return
    return { args, res: { listRes, dataRes: listRes[0] ?? null } };
};
// #endregion

// #region CSR Hook
/** Survey Form DataSource：統一處理 QueryList 單筆資料與提交 actions */
const useSurveyFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: SurveyFormLoaderData | null; lang: Lang; surveyId: string; emptyData: SurveySet; },
): ClientDataQueryDataSourceResult<SurveyFormRawData, SurveyFormAdapter> =>
{
    // 宣告變數
    const adapter = useMemo<SurveyFormAdapter>(() =>
    {
        return { Survey: SurveyAdapter(), SurveySubmission: SurveySubmissionAdapter() };
    }, []);

    const currentArgs = useMemo(() =>
    {
        return buildSurveyFormLoaderArgs({ lang: p.lang, surveyId: p.surveyId, queryParam: p.queryParam });
    }, [p.lang, p.surveyId, p.queryParam]);

    const listInitial = useMemo(() =>
    {
        return buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData });
    }, [p.loaderData, p.queryParam, p.emptyData]);

    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);

    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Survey.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });

    /** 問卷提交 action：仍走 SurveySubmission Public_Submit */
    const submitActions = adapter.SurveySubmission.hooks.useSubmitActions();

    const data = useMemo<SurveySet>(() =>
    {
        return useData.data?.[0] ?? p.emptyData;
    }, [useData.data, p.emptyData]);

    const errors = useMemo(() =>
    {
        return [useData.errorText];
    }, [useData.errorText]);

    const rawData = useMemo<SurveyFormRawData>(() =>
    {
        return buildSurveyFormRawData({ args: currentArgs, data, submitActions });
    }, [currentArgs, data, submitActions]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () =>
    {
        // Survey Form 目前沒有額外參照資料。
        await Promise.resolve();
    }, []);

    // return
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors, paginator: null, refetchData, refetchRefData };
};

/** 建立 Survey Form RawData */
const buildSurveyFormRawData = (p: { args: SurveyFormLoaderArgs; data: SurveySet; submitActions: SurveySubmitActions; }): SurveyFormRawData =>
{
    // 宣告變數
    const survey = p.data.Survey ?? {};

    // return
    return {
        surveyId: p.args.surveyId,
        data: p.data,
        title: survey.SurveyName ?? "",
        contentHtml: survey.SurveyDescription ?? "",
        successContentHtml: survey.SurveySuccessContent ?? "",
        submitActions: p.submitActions,
        args: p.args,
    };
};

/** 內部共用：建立 Survey Form Template VM */
const useSurveyFormTemplate = (opt: { lang: Lang; surveyId: string; emptyData: SurveySet; }) =>
{
    // 宣告變數
    const template = useMemo(() =>
    {
        return createSurveyFormDataQueryTemplate({ lang: opt.lang, surveyId: opt.surveyId, emptyData: opt.emptyData });
    }, [opt.lang, opt.surveyId, opt.emptyData]);

    // return
    return useClientDataQueryTemplate(template);
};

/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useSurveyFormData = (opt: { lang: Lang; surveyId: string; emptyData?: SurveySet; }): UseSurveyFormDataResult =>
{
    // 宣告變數
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const templateVm = useSurveyFormTemplate({ lang: opt.lang, surveyId: opt.surveyId, emptyData: fallbackData });
    const errorList = templateVm.errorList;

    // return
    return {
        ...templateVm.viewModel,
        isLoading: templateVm.isLoading,
        errorText: errorList[0] ?? null,
        errorList,
        refetchData: templateVm.refetchData,
        refetchRefData: templateVm.refetchRefData,
    };
};

/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const useSurveyFormFetchData = (p: { lang: Lang; surveyId: string; emptyData?: SurveySet; }): SurveyFormFetchDataResult =>
{
    // return
    return useSurveyFormData({ lang: p.lang, surveyId: p.surveyId, emptyData: p.emptyData });
};
// #endregion
