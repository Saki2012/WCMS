import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useMemo, useState } from "react";
type SurveySet = components["schemas"]["SurveySet_DTO"];

// #region Public
export type SurveyFormRawData = { formData: UseFetchFormDataResult<SurveySet>; inputOpts: Record<string, string>; actions: ServerFormActions; };
export type SurveyFormActionsOpt = { onBackToList: () => void; };
export type SurveyFormAdapter = { Survey: ReturnType<typeof SurveyAdapter>; };
/** ✅ 主入口：Server Survey Form 的所有「讀取資料」都集中在這裡 */
export const useSurveyFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: SurveySet; actionsOpt: SurveyFormActionsOpt; },
): UseFetchDataResult<SurveyFormRawData, SurveyFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<SurveyFormAdapter>(() =>
    {
        return { Survey: SurveyAdapter() };
    }, []);
    const formData = useSurveyFormDataByAdapter(adapter.Survey, opt.internalId, opt.emptyData, onError);
    const actions = useSurveyFormActionsByAdapter(adapter.Survey, opt.internalId, formData.data, opt.actionsOpt);
    const libInputTypeMap = useFetchEnumOptions("LibInputType");
    const errorList = useMemo<(string | null | undefined)[]>(() =>
    {
        return [formData.error];
    }, [formData.error]);
    const isLoading = useMemo(() => formData.isLoading || libInputTypeMap.isLoading, [formData.isLoading, libInputTypeMap.isLoading]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<SurveyFormRawData>(() =>
    {
        return { formData, inputOpts: libInputTypeMap.data, actions };
    }, [formData, libInputTypeMap.data, actions]);
    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);
    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useSurveyFormDataByAdapter = (
    adapter: ReturnType<typeof SurveyAdapter>,
    internalId: string,
    empty: SurveySet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SurveySet> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, SurveySet> | null>(() =>
    {
        // 新建才提供 initial，避免 query "__new__"
        if (!isNew) return null;
        // 建立一個成功回應當作 loader 初始資料
        const apiRes: ApiResponse<SurveySet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        // ✅ 注意：ApiLoaderData 目前要求 apiRes
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<SurveySet>(empty);
    useEffect(() =>
    {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() =>
    {
        void query.refetch();
    }, [query]);
    const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;
    // return（displayName 不可為 null）
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

const useSurveyFormActionsByAdapter = (
    adapter: ReturnType<typeof SurveyAdapter>,
    internalId: string,
    formData: SurveySet,
    opt: SurveyFormActionsOpt,
): ServerFormActions =>
{
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);
    const actions = adapter.useServerActions({
        onSuccessByMode: { create: () => opt.onBackToList(), update: () => opt.onBackToList(), delete: () => opt.onBackToList() },
    });

    // return
    return {
        Save: async () =>
        {
            if (isNew) await actions.createAsync(formData);
            else await actions.updateAsync(internalId, formData);
        },
        Delete: async () =>
        {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: opt.onBackToList,
        IsSaving: actions.isSaving,
    };
};
// #endregion
