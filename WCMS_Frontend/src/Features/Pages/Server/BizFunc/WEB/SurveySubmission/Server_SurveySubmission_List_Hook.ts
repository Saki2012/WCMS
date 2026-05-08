import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];

// #region Public

export type SurveySubmissionListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SurveySubmissionSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};

export type SurveySubmissionListAdapter = { SurveySubmission: ReturnType<typeof SurveySubmissionAdapter>; };

/** 後台問卷提交清單資料 */
export const useSurveySubmissionListFetchData = (
    opt: { lang: Lang; kw: string; },
): UseFetchDataResult<SurveySubmissionListRawData, SurveySubmissionListAdapter> =>
{
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo(() =>
    {
        return { SurveySubmission: SurveySubmissionAdapter() };
    }, []);
    const baseParam = useSurveySubmissionListQueryParam({ lang: opt.lang, kw: opt.kw });
    const grid = adapter.SurveySubmission.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    const rawData = useMemo<SurveySubmissionListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);
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
/** 建立問卷提交清單查詢條件 */
const useSurveySubmissionListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
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
        const baseCondition = `${SurveySubmissionsFields.Lang} = ${p.lang}`;
        const keywordCondition = buildKeywordCondition(p.kw);
        return LibMerge(" And ", false, baseCondition, keywordCondition);
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [{ Col: SurveySubmissionsFields.SubmitTime, Desc: true }], PageNumber: 1, PageSize: 10 };
    }, [fields, condition]);
};
// #endregion

// #region Private
/** 建立關鍵字查詢條件 */
const buildKeywordCondition = (kw: string): string =>
{
    if (!kw) return "";
    const condition = LibMerge(
        " Or ",
        false,
        `${SurveySubmissionsFields.UserName} Like ${kw}`,
        `${SurveySubmissionsFields.Email} Like ${kw}`,
        `${SurveySubmissionsFields.ContactPhone} Like ${kw}`,
        `${SurveySubmissionsFields.SurveyId} Like ${kw}`,
    );
    return `(${condition})`;
};
// #endregion
