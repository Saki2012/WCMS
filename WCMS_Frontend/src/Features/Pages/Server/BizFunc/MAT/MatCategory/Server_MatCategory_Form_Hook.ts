import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useMemo, useState } from "react";

type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];

// #region Public
export type MatCategoryFormRawData = { formData: UseFetchFormDataResult<MatCategorySet>; actions: ServerFormActions; };

export type MatCategoryFormActionsOpt = {
    /** 儲存成功後返回列表 */
    onBackToList: () => void;
};

export type MatCategoryFormAdapter = { MatCategory: ReturnType<typeof MatCategoryAdapter>; };

/** MatCategory Form 主入口 */
export const useMatCategoryFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: MatCategorySet; actionsOpt: MatCategoryFormActionsOpt; },
): UseFetchDataResult<MatCategoryFormRawData, MatCategoryFormAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<MatCategoryFormAdapter>(() =>
    {
        return { MatCategory: MatCategoryAdapter() };
    }, []);

    const formData = useMatCategoryFormDataByAdapter(adapter.MatCategory, opt.internalId, opt.emptyData, onError);

    const actions = useMatCategoryFormActionsByAdapter(adapter.MatCategory, opt.internalId, formData.data, opt.emptyData, opt.actionsOpt);

    const isLoading = useMemo(() => Boolean(formData.isLoading), [formData.isLoading]);
    const errors = useMemo(() =>
    {
        return [formData.error].filter((x): x is string => Boolean(x));
    }, [formData.error]);

    const rawData = useMemo<MatCategoryFormRawData>(() =>
    {
        return { formData, actions };
    }, [formData, actions]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.resolve();
    }, []);

    // return
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** FormData：useQueryFormData + editable state */
const useMatCategoryFormDataByAdapter = (
    adapter: ReturnType<typeof MatCategoryAdapter>,
    internalId: string,
    empty: MatCategorySet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<MatCategorySet> =>
{
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);

    const query = adapter.hooks.useQueryFormData({
        mode: isNew ? "new" : "edit",
        internalId: internalId || undefined,
        empty,
        deps: [internalId],
        modelDeps: [],
        onError,
    });

    const [data, setData] = useState<MatCategorySet>(empty);

    useEffect(() =>
    {
        // 執行 function：QueryFormData 回來後同步成可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() =>
    {
        void query.refetchData();
    }, [query]);

    // return
    return {
        data,
        setFormData: setData,
        isLoading: query.isLoading,
        error: query.errorText,
        refetch,
        displayName: (query.modelDisplayName ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

/** Form Actions：Save / Delete / Back */
const useMatCategoryFormActionsByAdapter = (
    adapter: ReturnType<typeof MatCategoryAdapter>,
    internalId: string,
    formData: MatCategorySet | null,
    empty: MatCategorySet,
    opt: MatCategoryFormActionsOpt,
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
            const dto = formData ?? empty;
            if (isNew) await actions.createAsync(dto);
            else await actions.updateAsync(internalId, dto);
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
