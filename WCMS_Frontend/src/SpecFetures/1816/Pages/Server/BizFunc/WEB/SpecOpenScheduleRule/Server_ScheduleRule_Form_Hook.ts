import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useMemo, useState } from "react";

type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];

// #region Public
export type ScheduleRuleFormRawData = { formData: UseFetchFormDataResult<SpecOpenScheduleRuleSet>; actions: ServerFormActions; };

export type ScheduleRuleFormAdapter = { ScheduleRule: ReturnType<typeof SpecOpenScheduleRuleAdapter>; };

/** ✅ 主入口：Server ScheduleRule Form 的所有「讀取資料 / actions」集中出口 */
export const useScheduleRuleFormFetchData = (
    opt: { internalId: string; emptyData: SpecOpenScheduleRuleSet; onBackToList: () => void; },
): UseFetchDataResult<ScheduleRuleFormRawData, ScheduleRuleFormAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<ScheduleRuleFormAdapter>(() =>
    {
        return { ScheduleRule: SpecOpenScheduleRuleAdapter() };
    }, []);

    // 執行 function：主資料（ModelDisplayName + QueryData + 可編輯 state）
    const formData = useScheduleRuleFormDataByAdapter(adapter.ScheduleRule, opt.internalId, opt.emptyData, onError);

    // 執行 function：表單 Actions（Save / Back）
    const actions = useScheduleRuleFormActionsByAdapter(adapter.ScheduleRule, opt.internalId, formData.data, opt.onBackToList);

    // 宣告變數：Loading / Error 統一出口
    const isLoading = Boolean(formData.isLoading);
    const errors = useMemo<(string | null)[]>(() => [formData.error], [formData.error]);

    const rawData = useMemo<ScheduleRuleFormRawData>(() =>
    {
        return { formData, actions };
    }, [formData, actions]);

    const refetchData = useCallback(async () =>
    {
        formData.refetch();
    }, [formData]);

    // return
    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useScheduleRuleFormDataByAdapter = (
    adapter: ReturnType<typeof SpecOpenScheduleRuleAdapter>,
    internalId: string,
    empty: SpecOpenScheduleRuleSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecOpenScheduleRuleSet> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, SpecOpenScheduleRuleSet> | null>(() =>
    {
        // 新建才提供 initial，避免 query "__new__"
        if (!isNew) return null;

        const apiRes: ApiResponse<SpecOpenScheduleRuleSet> = { IsSuccess: true, Data: empty, SysMessage: [] };

        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });

    const [data, setData] = useState<SpecOpenScheduleRuleSet>(empty);

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

const useScheduleRuleFormActionsByAdapter = (
    adapter: ReturnType<typeof SpecOpenScheduleRuleAdapter>,
    internalId: string,
    formData: SpecOpenScheduleRuleSet,
    onBackToList: () => void,
): ServerFormActions =>
{
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);

    const actions = adapter.useServerActions({ onSuccessByMode: { create: () => onBackToList(), update: () => onBackToList(), delete: () => onBackToList() } });

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
        Back: onBackToList,
        Preview: () =>
        {/* ScheduleRule 無預覽 */},
        IsSaving: actions.isSaving,
    };
};
// #endregion
