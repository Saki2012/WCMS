import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type SurveySet = components["schemas"]["SurveySet_DTO"];
type SurveySubmissionRequest = components["schemas"]["SurveySubmissionRequest_DTO"];
export interface ISurveyOptions
{
    SurveyId?: string;
}

export interface SurveyFormLoaderArgs
{
    SurveyId: string;
}

export interface SurveyFormLoaderRes
{
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

export interface SurveyFormFetchDataResult
{
    data: SurveySet;
    contentHtml: string;
    successContentHtml: string;
    isLoading: boolean;
    errorText: string | null;
    errorList: (string | null | undefined)[];
    submitActions: SurveySubmitActions;
}

// #region Public

/** SSR loader：預載指定 SurveyId 的單筆資料 */
export const Client_Survey_Form_Loader = (p: { lang: Lang; opts: ISurveyOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<SurveyFormLoaderData> =>
{
    const SurveyId = `${p.opts.SurveyId ?? ""}`.trim();
    const ssrApi = getSsrApi(request);

    if (!SurveyId) return { args: { SurveyId }, res: { dataRes: null } };

    const adapter = SurveyAdapter(ssrApi);
    const dataLoader = adapter.loader.createQueryDataLoader({ getInternalId: () => SurveyId, getApiInstance: () => ssrApi });
    const dataLD = await dataLoader({ request } as LoaderFunctionArgs);

    return { args: { SurveyId }, res: { dataRes: dataLD.apiRes.Data ?? null } };
};

/** 單一入口：Survey form 所有 data/action 都從這裡出去 */
export const useSurveyFormFetchData = (p: { lang: Lang; surveyId: string; emptyData?: SurveySet; }): SurveyFormFetchDataResult =>
{
    const loaderData = useLoaderData() as SurveyFormLoaderData | null;
    const surveyAdapter = useMemo(() => SurveyAdapter(), []);
    const submissionAdapter = useMemo(() => SurveySubmissionAdapter(), []);

    const fallbackData = p.emptyData ?? emptyData;
    const initialData = useMemo(() => buildInitialData({ loaderData, SurveyId: p.surveyId, fallbackData }), [loaderData, p.surveyId, fallbackData]);

    const SurveyData = surveyAdapter.hooks.useQueryData({ internalId: p.surveyId, initial: initialData, deps: [p.surveyId, p.lang] });
    const submitActions = submissionAdapter.hooks.useSubmitActions();

    const data = useMemo(() => SurveyData.data ?? fallbackData, [SurveyData.data, fallbackData]);
    const parsed = useResolveInternalIds(data.Survey?.SurveyDescription ?? "", { locale: p.lang });
    const successParsed = useResolveInternalIds(data.Survey?.SurveySuccessContent ?? "", { locale: p.lang });
    const errorList = useMemo(() => [SurveyData.errorText], [SurveyData.errorText]);

    return {
        data,
        contentHtml: parsed.html ?? "",
        successContentHtml: successParsed.html ?? "",
        isLoading: Boolean(SurveyData.isLoading),
        errorText: SurveyData.errorText ?? null,
        errorList,
        submitActions,
    };
};

// #endregion

// #region Protected

/** 預設空資料，避免 component 端一直判空 */
const emptyData: SurveySet = { Survey: {}, SurveyItem: [], SurveyItemLang: [] };

/** 建立 SSR initial，讓 hydration 不重抓第一筆資料 */
const buildInitialData = (
    p: { loaderData: SurveyFormLoaderData | null; SurveyId: string; fallbackData: SurveySet; },
): ApiLoaderData<string, SurveySet> | null =>
{
    if (!p.loaderData?.args?.SurveyId) return null;
    if (p.loaderData.args.SurveyId !== p.SurveyId) return null;
    return { args: p.SurveyId, apiRes: { IsSuccess: true, Data: p.loaderData.res.dataRes ?? p.fallbackData, SysMessage: [] } };
};

// #endregion
