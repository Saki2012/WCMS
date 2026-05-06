import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, SurveyFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySet = components["schemas"]["SurveySet_DTO"];

// #region Public
export type SurveyListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SurveySet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};
export type SurveyListAdapter = { Survey: ReturnType<typeof SurveyAdapter>; };
export const useSurveyListFetchData = (opt: { lang: Lang; kw: string; }): UseFetchDataResult<SurveyListRawData, SurveyListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<SurveyListAdapter>(() =>
    {
        return { Survey: SurveyAdapter() };
    }, []);
    const baseParam = useSurveyListQueryParam({ lang: opt.lang, kw: opt.kw });
    const grid = adapter.Survey.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? [])];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<SurveyListRawData>(() =>
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

    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
const useSurveyListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [
            SurveyFields.InternalId,
            SurveyFields.SurveyId,
            SurveyFields.SurveyName,
            SurveyFields.ModifyUserId,
            SurveyFields.ModifyTime,
            `${SurveyFields.ModifyUser}.${AccountFields.AccountName}`,
        ];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt = ``;
        if (!!p.kw)
        {
            cdt = LibMerge(" And ", false, cdt, `${SurveyFields.SurveyName} Like ${p.kw}`);
        }
        return cdt;
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [{ Col: SurveyFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10 };
    }, [fields, condition]);
};
// #endregion
