import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];

// #region Public

export type SurveySubmissionFormRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    data: SurveySubmissionSet | null;
    list: SurveySubmissionSet[];
    count: number;
    param: QueryListParam;
};

export type SurveySubmissionFormAdapter = { SurveySubmission: ReturnType<typeof SurveySubmissionAdapter>; };

/** 後台問卷提交明細資料 */
export const useSurveySubmissionFormFetchData = (
    opt: { lang: Lang; surveySubmissionId: string; },
): UseFetchDataResult<SurveySubmissionFormRawData, SurveySubmissionFormAdapter> =>
{
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<SurveySubmissionFormAdapter>(() =>
    {
        return { SurveySubmission: SurveySubmissionAdapter() };
    }, []);

    const baseParam = useSurveySubmissionFormQueryParam({ surveySubmissionId: opt.surveySubmissionId });

    const grid = adapter.SurveySubmission.hooks.useQueryGridData({ baseParam, deps: [baseParam.Condition ?? ""], modelDeps: [opt.lang], onError });

    const rawData = useMemo<SurveySubmissionFormRawData>(() =>
    {
        const list = grid.list ?? [];

        return { modelDisplayName: grid.modelDisplayName, data: list[0] ?? null, list, count: grid.count ?? 0, param: grid.param };
    }, [grid.modelDisplayName, grid.list, grid.count, grid.param]);

    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.resolve();
    }, []);

    return { adapter, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData, refetchRefData };
};

// #endregion

// #region Protected

/** 建立問卷提交明細查詢條件 */
const useSurveySubmissionFormQueryParam = (p: { surveySubmissionId: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
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
    }, []);

    const condition = useMemo(() =>
    {
        const id = `${p.surveySubmissionId ?? ""}`.trim();
        return id ? `${SurveySubmissionsFields.SurveySubmissionId} = ${id}` : `${SurveySubmissionsFields.SurveySubmissionId} = __empty__`;
    }, [p.surveySubmissionId]);

    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [], PageNumber: 1, PageSize: 1 };
    }, [fields, condition]);
};

// #endregion
